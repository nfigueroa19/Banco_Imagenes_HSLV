// Edge Function "admin-users" — gestión de cuentas para administradores del banco de imágenes.
//
// Contrato (siempre Authorization: Bearer <token de sesión de Supabase Auth>; el caller debe
// tener role='admin' en profiles, igual criterio que el PATCH de la Edge Function catalogo):
//   GET  /admin-users                                   → lista todos los perfiles (id,email,role,created_at)
//   POST /admin-users  body {email,password,role}       → crea el usuario en Supabase Auth
//     (auth.admin.createUser, email_confirm:true — no hay flujo de invitación por correo
//     configurado en el proyecto, así que la cuenta queda lista para iniciar sesión de
//     inmediato con la contraseña que puso el admin) y su fila en profiles.
//   PATCH /admin-users?user_id=<id>  body {role?, password?}  → cambia el rol y/o la contraseña
//     de un usuario existente (al menos una de las dos claves debe venir en el body) — así el
//     mismo botón de "restablecer contraseña" del panel sirve si alguien la olvida, sin flujo de
//     correo de recuperación (no hay SMTP configurado en el proyecto).
//   DELETE /admin-users?user_id=<id>                     → borra el usuario de Supabase Auth;
//     profiles.id tiene "on delete cascade" contra auth.users (ver schema.sql), así que la fila
//     de profiles se borra sola.
//
// Roles: solo 'admin' y 'viewer' (el rol 'editor' que existía antes no se usaba en ninguna parte
// del código — el único chequeo real en toda la app es role==='admin', ver catalogo/index.ts y
// applyRoleUI en js/app.js — así que se eliminó en vez de mantener una tercera opción sin uso).
//
// Un admin no puede borrarse ni quitarse el rol de admin a sí mismo desde acá (evita que el
// último admin activo se bloquee el acceso por error) — para eso hay que hacerlo desde otra
// cuenta admin o directo en Supabase.

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const VALID_ROLES = ["admin", "viewer"];

async function requireAdmin(token: string): Promise<{ userId: string; email: string } | null> {
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile || profile.role !== "admin") return null;
  return { userId: data.user.id, email: data.user.email ?? "" };
}

async function handleList() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,role,created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return json({ users: data || [] });
}

async function handleCreate(body: any) {
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const role = typeof body?.role === "string" ? body.role : "";
  if (!email || !email.includes("@")) return json({ error: "Correo inválido." }, 400);
  if (password.length < 6) return json({ error: "La contraseña debe tener al menos 6 caracteres." }, 400);
  if (!VALID_ROLES.includes(role)) return json({ error: "Rol inválido." }, 400);

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr) {
    const msg = /already.*registered|already exists/i.test(createErr.message)
      ? "Ya existe una cuenta con ese correo."
      : createErr.message;
    return json({ error: msg }, 400);
  }

  const { error: profileErr } = await supabase
    .from("profiles")
    .insert({ id: created.user.id, email, role });
  if (profileErr) {
    // Si falla la fila de perfil, no queda un usuario de Auth huérfano sin acceso real (sin
    // profiles, la Edge Function catalogo lo rechaza igual que un token inválido — ver
    // NoProfileError), pero mejor deshacer la creación para no dejar cuentas fantasma.
    await supabase.auth.admin.deleteUser(created.user.id);
    throw profileErr;
  }

  return json({ id: created.user.id, email, role, created_at: new Date().toISOString() }, 201);
}

async function handleUpdateUser(userId: string, callerId: string, body: any) {
  const hasRole = typeof body?.role === "string" && body.role;
  const hasPassword = typeof body?.password === "string" && body.password;
  if (!hasRole && !hasPassword) {
    return json({ error: "Falta role o password en el cuerpo de la solicitud." }, 400);
  }

  if (hasRole) {
    if (!VALID_ROLES.includes(body.role)) return json({ error: "Rol inválido." }, 400);
    if (userId === callerId && body.role !== "admin") {
      return json({ error: "No puedes quitarte el rol de administrador a ti mismo." }, 400);
    }
  }
  if (hasPassword && body.password.length < 6) {
    return json({ error: "La contraseña debe tener al menos 6 caracteres." }, 400);
  }

  if (hasPassword) {
    const { error: pwErr } = await supabase.auth.admin.updateUserById(userId, { password: body.password });
    if (pwErr) return json({ error: pwErr.message }, 400);
  }

  if (hasRole) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ role: body.role })
      .eq("id", userId)
      .select("id,email,role,created_at")
      .maybeSingle();
    if (error) throw error;
    if (!data) return json({ error: "Usuario no encontrado." }, 404);
    return json(data);
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,role,created_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return json({ error: "Usuario no encontrado." }, 404);
  return json(data);
}

async function handleDelete(userId: string, callerId: string) {
  if (userId === callerId) return json({ error: "No puedes eliminar tu propia cuenta." }, 400);
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) return json({ error: error.message }, 400);
  return json({ ok: true });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Falta el token de autorización." }, 401);

    const caller = await requireAdmin(token);
    if (!caller) return json({ error: "Solo un administrador puede gestionar usuarios." }, 403);

    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id");

    if (req.method === "GET") return await handleList();

    if (req.method === "POST") {
      const body = await req.json().catch(() => null);
      return await handleCreate(body);
    }

    if (req.method === "PATCH") {
      if (!userId) return json({ error: "Falta user_id." }, 400);
      const body = await req.json().catch(() => null);
      return await handleUpdateUser(userId, caller.userId, body);
    }

    if (req.method === "DELETE") {
      if (!userId) return json({ error: "Falta user_id." }, 400);
      return await handleDelete(userId, caller.userId);
    }

    return json({ error: "Método no permitido." }, 405);
  } catch (e) {
    console.error(e);
    return json({ error: "Error interno." }, 500);
  }
});
