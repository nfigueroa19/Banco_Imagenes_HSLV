// Edge Function "drive-auth" — ancla el acceso a Drive por usuario, para que el popup de
// consentimiento de Google se muestre una sola vez (o hasta que la persona lo revoque en su
// cuenta de Google), en vez de cada vez que expira el access_token (~1h) o se borra el
// almacenamiento del navegador.
//
// Contrato — requiere siempre Authorization: Bearer <token de sesión de Supabase Auth>:
//   POST /drive-auth  body {"action":"exchange","code":"<código de initCodeClient>"}
//     → primera vez: canjea el código por access_token + refresh_token en Google, guarda el
//       refresh_token en drive_grants (upsert) y devuelve {access_token, expires_in}.
//   POST /drive-auth  body {"action":"refresh"}
//     → intentos siguientes: usa el refresh_token ya guardado para pedir un access_token
//       nuevo sin mostrar ningún popup. 404 si el usuario todavía no tiene un grant guardado
//       (primera vez que usa la app, o lo revocó) — el frontend entonces cae al flujo
//       interactivo (exchange).
//
// El código en el navegador (js/app.js) se obtiene con initCodeClient en modo popup —
// Google Identity Services no expone un redirect_uri real en ese modo (la doc dice que usa el
// origin de la página como valor por defecto), pero el canje del código en el backend debe
// usar el valor especial 'postmessage' como redirect_uri (así lo documentan las librerías
// oficiales de Google para este flujo) — usar el origin real produce redirect_uri_mismatch.

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_CLIENT_ID = "1020267220447-rebduv63t3qntjruv6lbmh29vhnualsf.apps.googleusercontent.com"; // mismo CLIENT_ID de CONFIG en js/app.js, no es secreto
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!; // secreto — configurar con `supabase secrets set` o desde el dashboard, nunca en el código

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function getUserId(token: string): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

async function exchangeCodeForTokens(code: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: "postmessage",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error("google_token_exchange_failed: " + JSON.stringify(data));
  return data as { access_token: string; refresh_token?: string; expires_in: number };
}

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error("google_refresh_failed: " + JSON.stringify(data));
  return data as { access_token: string; expires_in: number };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Falta el token de autorización." }, 401);

    const userId = await getUserId(token);
    if (!userId) return json({ error: "Sesión inválida o expirada." }, 401);

    const body = await req.json().catch(() => ({}));

    if (body.action === "exchange") {
      if (!body.code) return json({ error: "Falta code." }, 400);
      const tokens = await exchangeCodeForTokens(body.code);
      if (tokens.refresh_token) {
        const { error } = await supabase
          .from("drive_grants")
          .upsert({ user_id: userId, refresh_token: tokens.refresh_token, updated_at: new Date().toISOString() });
        if (error) throw error;
      }
      // Si Google no mandó refresh_token (ya se había concedido antes sin revocar), seguimos
      // usando el que ya teníamos guardado — el access_token nuevo sirve igual.
      return json({ access_token: tokens.access_token, expires_in: tokens.expires_in });
    }

    if (body.action === "refresh") {
      const { data: grant, error: grantErr } = await supabase
        .from("drive_grants")
        .select("refresh_token")
        .eq("user_id", userId)
        .maybeSingle();
      if (grantErr) throw grantErr;
      if (!grant) return json({ error: "Sin acceso a Drive concedido todavía." }, 404);

      try {
        const tokens = await refreshAccessToken(grant.refresh_token);
        return json({ access_token: tokens.access_token, expires_in: tokens.expires_in });
      } catch (e) {
        // El refresh_token fue revocado (p.ej. desde la cuenta de Google) — se borra para que
        // el frontend vuelva al flujo interactivo en vez de reintentar contra un token muerto.
        await supabase.from("drive_grants").delete().eq("user_id", userId);
        return json({ error: "El acceso a Drive fue revocado, hay que concederlo de nuevo." }, 404);
      }
    }

    return json({ error: "action debe ser 'exchange' o 'refresh'." }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: "Error interno." }, 500);
  }
});
