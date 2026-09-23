// Edge Function "catalogo" — puerta de acceso al catálogo de Drive espejado en Supabase.
// Reemplaza las llamadas directas del navegador a googleapis.com/drive por consultas a
// drive_folders/drive_images, sin exponer nunca la service_role key al cliente.
//
// Contrato (ver plan en supabase/schema.sql y CLAUDE.md del proyecto):
//   GET /catalogo?folder_id=<id>                      → carpetas hijas + imágenes de esa carpeta
//   GET /catalogo?q=<texto>&offset=0&limit=60          → búsqueda global paginada por nombre,
//     descripción, etiquetas, carpeta contenedora y fecha (ver handleSearch)
//   GET /catalogo?breadcrumb_for=<folder_id>           → cadena de carpetas desde la raíz
//   GET /catalogo?thumb_for=<image_id>                 → bytes de la miniatura (proxy)
//   GET /catalogo?tags_summary=1                        → etiquetas de TODO el banco con su
//     conteo de imágenes, ordenadas de más a menos usadas (ver handleTagsSummary) — alimenta la
//     nube de etiquetas de la portada (buildTags en js/app.js), donde no hay archivos cargados
//     localmente de los que sacar etiquetas.
//   GET /catalogo?whoami=1                              → {email, role} del usuario autenticado,
//     lo consulta el frontend una vez al iniciar sesión (ver loadUserRole en js/app.js) para
//     decidir si muestra los controles de edición de descripción/etiquetas (solo admin).
//   PATCH /catalogo?image_id=<id>  body:{description?, tags?}  →
//     guarda, en un solo request al presionar "Guardar cambios" en el modal (ver
//     saveModalChanges en js/app.js), la descripción manual y/o la lista de etiquetas de
//     vocabulario libre (tags). Al menos una de las dos claves debe venir en el body.
//     Solo perfiles con role='admin' pueden hacer este PATCH (ver check más abajo) — el resto
//     de perfiles (editor/viewer) puede ver descripciones y etiquetas pero no modificarlas.
//   POST /catalogo?suggest_tags=1  body:{description}  →
//     sugiere etiquetas nuevas a partir del texto libre de la descripción, llamando a Gemini
//     server-side (ver handleSuggestTags) — dispara solo cuando el admin presiona "Generar
//     etiquetas" en el modal (ver generateTagSuggestions en js/app.js), nunca automático al
//     guardar. Solo admin, mismo criterio que el PATCH. Nunca agrega etiquetas solo: devuelve
//     una lista para que el admin las revise y agregue a mano una por una (mismo patrón que las
//     sugerencias por palabra clave que ya existían).
// Requiere header Authorization: Bearer <token de sesión de Supabase Auth del usuario>
// (obtenido en login.html, no el token OAuth de Google — ese ahora solo lo usa el navegador
// para pedirle bytes de imagen completa a Drive directamente, ver openModal en js/app.js).
// Acceso: el usuario debe existir en la tabla profiles (creada solo a mano/por invitación
// de un admin) — si el token es válido pero no tiene perfil, se rechaza igual que un token
// inválido.
//
// thumb_for existe porque el proxy público images.weserv.nl (usado en una primera versión)
// resultó bloqueado por Google para las URLs lh3.googleusercontent.com/drive-storage/... que
// devuelve thumbnailLink (Google responde 400 a weserv, 200 a un fetch normal) — probablemente
// porque ese proxy compartido ya está en alguna lista de abuso de Google. La Edge Function pide
// la miniatura ella misma y la devuelve, así Google solo ve la IP de la función (no la de cada
// visitante) sin depender de un tercero.

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// Secreto cargado a mano por el usuario en Project Settings → Edge Functions → Secrets (nunca
// en el código ni en el frontend). Si falta, handleSuggestTags devuelve un 500 explícito en vez
// de fallar con un error genérico.
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
// Modelo elegido en la sesión de investigación (Flash: gratis, rápido, buen español, JSON
// estructurado). "gemini-2.5-flash" (el nombre investigado originalmente) dejó de estar
// disponible para cuentas nuevas — Google devuelve 404 y recomienda este reemplazo. Cambiar
// acá si Google vuelve a retirar el nombre de modelo más adelante.
const GEMINI_MODEL = "gemini-3.6-flash";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, PATCH, POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

/* Caché en memoria del usuario ya verificado (vive mientras la instancia de la función esté
   caliente) — con thumb_for cada miniatura de la carpeta dispara un request, y sin esto cada
   una repetiría el round-trip a Supabase Auth + la consulta a profiles para el mismo token. */
type AuthedUser = { userId: string; email: string; role: string; exp: number };
const tokenCache = new Map<string, AuthedUser>();
const TOKEN_CACHE_TTL_MS = 5 * 60 * 1000;

/* Distingue "token inválido/expirado" (401 → el frontend cierra sesión y manda a login.html)
   de "sesión válida pero sin perfil" (403 → NO se cierra sesión ni se redirige, porque volver
   a login.html encontraría la misma sesión válida y rebotaría de vuelta en bucle). */
class NoProfileError extends Error {}

async function verifySupabaseUser(token: string): Promise<AuthedUser | null> {
  const cached = tokenCache.get(token);
  const now = Date.now();
  if (cached && cached.exp > now) return cached;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile) throw new NoProfileError();

  const user: AuthedUser = {
    userId: data.user.id,
    email: data.user.email ?? "",
    role: profile.role,
    exp: now + TOKEN_CACHE_TTL_MS,
  };
  tokenCache.set(token, user);
  return user;
}

function mapFolder(row: any) {
  return {
    id: row.id,
    name: row.name,
    owner: row.owner_name || "—",
    modifiedTime: row.modified_time,
  };
}

function mapImage(row: any) {
  return {
    id: row.id,
    name: row.name,
    mimeType: row.mime_type,
    thumbnailLink: row.thumbnail_link,
    webViewLink: row.web_view_link,
    webContentLink: row.web_content_link,
    size: row.size,
    modifiedTime: row.modified_time,
    path: row.path || [],
    description: row.description || "",
    tags: row.tags || [],
  };
}

async function handleFolder(folderId: string) {
  const [foldersRes, imagesRes] = await Promise.all([
    supabase
      .from("drive_folders")
      .select("id,name,owner_name,modified_time")
      .eq("parent_id", folderId)
      .order("name"),
    supabase
      .from("drive_images")
      .select("id,name,mime_type,thumbnail_link,web_view_link,web_content_link,size,modified_time,path,description,tags")
      .eq("folder_id", folderId)
      .order("modified_time", { ascending: false }),
  ]);
  if (foldersRes.error) throw foldersRes.error;
  if (imagesRes.error) throw imagesRes.error;
  return json({
    folders: foldersRes.data.map(mapFolder),
    files: imagesRes.data.map(mapImage),
  });
}

/* Busca coincidencias en nombre, descripción, etiquetas, ruta de carpetas y fecha — no solo
   nombre, así "buscar por lugar" o "buscar por mes" encuentra la foto aunque ese dato solo
   esté en la carpeta contenedora o en modified_time, no en el nombre de archivo (que en Drive
   suele ser algo como IMG_20260815.jpg). tags_text/path_text/date_text son columnas de
   drive_images mantenidas por trigger (ver schema.sql) que permiten un ilike de substring
   sobre datos que de otro modo no serían texto plano (un array o una fecha). Se quitan ','
   y paréntesis de cada término porque son caracteres reservados en la sintaxis de filtros
   .or() de PostgREST. */
async function handleSearch(q: string, offset: number, limit: number) {
  const term = q.replace(/[,()]/g, " ").trim();
  const orParts = ["name", "description", "tags_text", "path_text", "date_text"].map(
    (field) => `${field}.ilike.%${term}%`,
  );
  const { data, error, count } = await supabase
    .from("drive_images")
    .select("id,name,mime_type,thumbnail_link,web_view_link,web_content_link,size,modified_time,path,description,tags", { count: "exact" })
    .or(orParts.join(","))
    .order("modified_time", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return json({
    files: (data || []).map(mapImage),
    total: count ?? 0,
    offset,
    limit,
  });
}

async function handleThumb(imageId: string) {
  const { data, error } = await supabase
    .from("drive_images")
    .select("thumbnail_link")
    .eq("id", imageId)
    .maybeSingle();
  if (error) throw error;
  if (!data || !data.thumbnail_link) return json({ error: "Miniatura no encontrada." }, 404);

  // Un reintento corto absorbe blips transitorios de red hacia Google, para no hacerle pagar
  // al navegador el costo de un reintento completo por algo que se resuelve solo.
  let upstream = await fetch(data.thumbnail_link);
  if (!upstream.ok) upstream = await fetch(data.thumbnail_link);
  if (!upstream.ok || !upstream.body) return json({ error: "No se pudo obtener la miniatura." }, 502);

  return new Response(upstream.body, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": upstream.headers.get("Content-Type") || "image/jpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

/* Guarda la descripción libre y/o las etiquetas (ver comentario del contrato PATCH arriba).
   tags_text se recalcula solo con el trigger de la tabla (ver schema.sql), esta función nunca
   la toca directamente. Solo se llama si el caller ya pasó el check de role==='admin' (ver
   Deno.serve). */
async function handleUpdateImage(imageId: string, patch: { description?: string; tags?: string[] }) {
  const update: Record<string, unknown> = {};
  if (typeof patch.description === "string") {
    update.description = patch.description;
  }
  if (Array.isArray(patch.tags)) {
    update.tags = patch.tags;
  }
  const { data, error } = await supabase
    .from("drive_images")
    .update(update)
    .eq("id", imageId)
    .select("id,description,tags")
    .maybeSingle();
  if (error) throw error;
  if (!data) return json({ error: "Imagen no encontrada." }, 404);
  return json({
    id: data.id,
    description: data.description || "",
    tags: data.tags || [],
  });
}

/* Trae solo la columna tags de las imágenes que de verdad tienen alguna (liviano: ni miniaturas
   ni descripciones) — la reusan handleTagsSummary (conteo para la nube de la portada) y
   handleSuggestTags (vocabulario completo para Gemini y para normalizar su respuesta). Filtrar
   por tags<>'{}' (no solo "is not null") importa: la columna viene con default '{}' en vez de
   null, así que un simple "is not null" trae las ~6mil filas de la tabla completa — y select()
   sin .range() en supabase-js corta en 1000 filas por defecto, así que la única imagen
   etiquetada podía quedar fuera de esas primeras 1000. Filtrando por "no vacío" el resultado son
   solo las filas que interesan, sin toparse con ese límite. */
async function getAllTags(): Promise<string[][]> {
  const { data, error } = await supabase
    .from("drive_images")
    .select("tags")
    .not("tags", "eq", "{}");
  if (error) throw error;
  return (data || []).map((row) => row.tags || []);
}

// TAGS_SUMMARY_LIMIT corta la lista final a las más usadas: con miles de etiquetas distintas la
// nube de la portada dejaría de ser útil (ver charla con comunicaciones sobre "a largo plazo
// puede ser contraproducente").
const TAGS_SUMMARY_LIMIT = 40;

async function handleTagsSummary() {
  const rows = await getAllTags();

  const counts = new Map<string, number>();
  for (const tags of rows) {
    for (const tag of tags) {
      if (!tag) continue;
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  const tags = Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, TAGS_SUMMARY_LIMIT);

  return json({ tags });
}

// Mismo criterio que normalizeText en js/app.js (minúsculas + sin tildes) — se usa acá para
// que "Urgencias" (ya guardada) y "urgencias"/"urgéncias" (lo que proponga Gemini o escriba un
// admin) se reconozcan como la misma etiqueta en vez de crear una variante duplicada.
function normalizeTag(s: string): string {
  return s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

const SUGGEST_TAGS_MAX = 8;

/* Sugerencia de etiquetas por IA a partir del texto libre de la descripción — dispara solo
   cuando el admin presiona "Generar etiquetas" en el modal (ver generateTagSuggestions en
   js/app.js), nunca automático al guardar. Se le pasa a Gemini el vocabulario ya usado en el
   banco (misma fuente que tags_summary) para que prefiera reutilizar etiquetas existentes en
   vez de inventar variantes, y de vuelta esta función normaliza mayúsculas/acentos contra ese
   mismo vocabulario antes de devolver la lista, para no crear duplicados. La respuesta es solo
   una lista de strings para revisar y agregar a mano, una por una — igual que las sugerencias
   por palabra clave que ya existían (renderTagSuggestions en js/app.js), nunca se agregan solas.
   La API key nunca sale de acá: el navegador solo ve el resultado final. */
async function handleSuggestTags(description: string) {
  // Mensaje genérico a propósito — el usuario pidió no exponer detalle técnico (nombre del
  // secreto, proveedor, etc.) en los mensajes que ve el admin en el modal.
  if (!GEMINI_API_KEY) {
    console.error("suggest_tags: falta el secreto GEMINI_API_KEY");
    return json({ error: "No se pudo generar etiquetas." }, 500);
  }

  const rows = await getAllTags();
  const knownByNorm = new Map<string, string>(); // texto normalizado → casing ya usado en el banco
  for (const tags of rows) {
    for (const tag of tags) {
      if (!tag) continue;
      const norm = normalizeTag(tag);
      if (!knownByNorm.has(norm)) knownByNorm.set(norm, tag);
    }
  }
  const vocabulary = Array.from(knownByNorm.values()).sort();

  const prompt = [
    "Sos un asistente que sugiere etiquetas cortas en español para catalogar fotos institucionales de un hospital.",
    "Te doy la descripción de una foto y la lista de etiquetas que YA existen en el banco de imágenes.",
    "Reglas:",
    "- Preferí reutilizar una etiqueta ya existente si aplica, en vez de crear una variante por mayúsculas, tildes o singular/plural.",
    "- Solo proponé una etiqueta nueva si de verdad no hay ninguna existente que aplique.",
    "- Cada etiqueta: 1-3 palabras, sin punto final, español neutro, sin repetir la misma idea con dos etiquetas distintas.",
    "- No incluyas nombres propios de pacientes ni de personal — solo cargos/áreas/eventos si ya vienen así en la descripción.",
    `- Máximo ${SUGGEST_TAGS_MAX} etiquetas.`,
    "- Devolvé únicamente el array JSON de strings, sin texto adicional.",
    "",
    `Etiquetas existentes en el banco: ${vocabulary.length ? vocabulary.join(", ") : "(todavía no hay ninguna guardada)"}`,
    "",
    `Descripción de la foto: """${description}"""`,
  ].join("\n");

  const callGemini = () =>
    fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: { type: "ARRAY", items: { type: "STRING" } },
            temperature: 0.2,
          },
        }),
      },
    );

  let res: Response;
  try {
    res = await callGemini();
    // 503 = "modelo con alta demanda, reintentá" (tier gratuito de AI Studio) — un blip
    // transitorio que suele resolverse solo en un par de segundos, mismo criterio que el
    // reintento corto de handleThumb ante blips de red hacia Google.
    if (res.status === 503) {
      await new Promise((r) => setTimeout(r, 1200));
      res = await callGemini();
    }
  } catch (e) {
    console.error("Gemini fetch error", e);
    return json({ error: "No se pudo contactar al servicio de sugerencias." }, 502);
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("Gemini error", res.status, detail);
    const msg = res.status === 503
      ? "El servicio está saturado en este momento, prueba de nuevo en unos momentos."
      : "No se pudo generar etiquetas.";
    return json({ error: msg }, 502);
  }

  const payload = await res.json().catch(() => null);
  const raw = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  let proposed: unknown;
  try {
    proposed = JSON.parse(raw ?? "[]");
  } catch {
    proposed = [];
  }
  if (!Array.isArray(proposed)) proposed = [];

  const seen = new Set<string>();
  const tags: string[] = [];
  for (const item of proposed as unknown[]) {
    if (typeof item !== "string") continue;
    const clean = item.trim();
    if (!clean) continue;
    const norm = normalizeTag(clean);
    if (seen.has(norm)) continue;
    seen.add(norm);
    // Si ya existe una etiqueta con ese mismo texto (sin importar mayúsculas/acentos), se usa la
    // forma ya guardada en el banco en vez de la que devolvió Gemini, para no crear un duplicado
    // visual de la misma etiqueta.
    tags.push(knownByNorm.get(norm) || clean);
    if (tags.length >= SUGGEST_TAGS_MAX) break;
  }

  return json({ tags });
}

async function handleBreadcrumb(folderId: string) {
  const chain: { id: string; name: string }[] = [];
  let currentId: string | null = folderId;
  let hops = 0;
  while (currentId && hops < 30) {
    hops++;
    const { data, error } = await supabase
      .from("drive_folders")
      .select("id,name,parent_id")
      .eq("id", currentId)
      .maybeSingle();
    if (error) throw error;
    if (!data) break;
    chain.unshift({ id: data.id, name: data.name });
    currentId = data.parent_id;
  }
  return json({ chain });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Falta el token de autorización." }, 401);

    let user: AuthedUser | null;
    try {
      user = await verifySupabaseUser(token);
    } catch (e) {
      if (e instanceof NoProfileError) {
        return json({ error: "Tu cuenta no tiene acceso al banco de imágenes." }, 403);
      }
      throw e;
    }
    if (!user) return json({ error: "Sesión inválida o expirada." }, 401);

    const url = new URL(req.url);
    const folderId = url.searchParams.get("folder_id");
    const q = url.searchParams.get("q");
    const breadcrumbFor = url.searchParams.get("breadcrumb_for");
    const thumbFor = url.searchParams.get("thumb_for");
    const imageId = url.searchParams.get("image_id");
    const tagsSummary = url.searchParams.get("tags_summary");
    const whoami = url.searchParams.get("whoami");
    const suggestTags = url.searchParams.get("suggest_tags");

    if (whoami) return json({ email: user.email, role: user.role });

    if (req.method === "PATCH") {
      if (user.role !== "admin") {
        return json({ error: "Solo un administrador puede editar descripciones o etiquetas." }, 403);
      }
      if (!imageId) return json({ error: "Falta image_id." }, 400);
      const body = await req.json().catch(() => null);
      const hasDescription = body && typeof body.description === "string";
      const hasTags = body && Array.isArray(body.tags);
      if (!hasDescription && !hasTags) {
        return json({ error: "Falta description o tags en el cuerpo de la solicitud." }, 400);
      }
      return await handleUpdateImage(imageId, body);
    }

    if (req.method === "POST" && suggestTags) {
      // Mensajes genéricos a propósito acá también — el botón que dispara esto ya está oculto
      // para no-admin y para descripción vacía (ver applyRoleUI/updateGenTagsBtnVisibility en
      // js/app.js), así que en la práctica el usuario nunca debería ver estos dos casos.
      if (user.role !== "admin") return json({ error: "No se pudo generar etiquetas." }, 403);
      const body = await req.json().catch(() => null);
      const description = body && typeof body.description === "string" ? body.description.trim() : "";
      if (!description) return json({ error: "No se pudo generar etiquetas." }, 400);
      return await handleSuggestTags(description);
    }

    if (thumbFor) return await handleThumb(thumbFor);
    if (breadcrumbFor) return await handleBreadcrumb(breadcrumbFor);
    if (tagsSummary) return await handleTagsSummary();
    // q="" (present but empty) es "traer todo el banco paginado" — lo usa el frontend cuando
    // se activa un filtro de etiqueta sin texto de búsqueda (ver runSearch en app.js).
    if (q !== null) {
      const offset = parseInt(url.searchParams.get("offset") || "0", 10) || 0;
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "60", 10) || 60, 200);
      return await handleSearch(q, offset, limit);
    }
    if (folderId) return await handleFolder(folderId);

    return json({ error: "Falta folder_id, q o breadcrumb_for." }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: "Error interno." }, 500);
  }
});
