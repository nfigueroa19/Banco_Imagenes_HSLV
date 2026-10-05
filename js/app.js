/* ══════════════════════════════════════════════════
   CONFIGURACIÓN — EDITA ESTOS VALORES
   ══════════════════════════════════════════════════
   El acceso a la app (quién puede entrar) lo controla Supabase Auth — ver login.html.
   El CLIENT_ID de Google de abajo ya NO se usa para iniciar sesión en la app: sirve solo
   para pedir, bajo demanda, un token de Drive de solo lectura cuando alguien abre una imagen
   completa o la descarga (ver ensureDriveToken/openModal). Es la misma restricción de siempre:
   Drive exige un token de una cuenta autorizada para entregar el archivo, sin importar cómo
   entraste a la app. Pero esto se pide UNA sola vez por usuario, no en cada sesión: el popup
   usa el flujo de "código" (no el de token directo), y la Edge Function drive-auth lo canjea
   por un refresh_token que guarda en Supabase (tabla drive_grants) — de ahí en adelante pide
   tokens nuevos en silencio, sin popup, mientras la persona no revoque el acceso desde su
   cuenta de Google.

   CLIENT_ID: proyecto "Banco de Imagenes" de la organización hosusana.gov.co,
   pantalla de consentimiento tipo "Interno" (solo cuentas del dominio, sin verificación).
   ══════════════════════════════════════════════════ */
var CONFIG = {
  CLIENT_ID: '780037425031-ae7aolob458curcn41p3acmatva54k4t.apps.googleusercontent.com', // ← proyecto institucional hosusana.gov.co, pantalla de consentimiento Interno
  FOLDER_ID: '14dBvsP4SU8qNdIJvjYrzx_FR_oWVyYb7', // ← carpeta real del banco de imágenes en Drive
  SUPABASE_FUNCTION_URL: 'https://jxndazzqsxevlohpfjge.supabase.co/functions/v1/catalogo', // ← Edge Function "catalogo"
  DRIVE_AUTH_FUNCTION_URL: 'https://jxndazzqsxevlohpfjge.supabase.co/functions/v1/drive-auth', // ← Edge Function "drive-auth"
  ADMIN_USERS_FUNCTION_URL: 'https://jxndazzqsxevlohpfjge.supabase.co/functions/v1/admin-users', // ← Edge Function "admin-users"
  SUPABASE_URL: 'https://jxndazzqsxevlohpfjge.supabase.co',
  SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_8d5hFI6V80Qgi5lmw8xfvg_bgtGSHoh',
};
/* Mientras la pantalla de consentimiento OAuth esté en modo "Pruebas", solo pueden pedir un
   token de Drive las cuentas agregadas como "Usuarios de prueba" en Google Cloud Console — sin
   importar que ya tengan acceso a la carpeta de Drive. El acceso real a la carpeta no es solo
   por dominio: hay 2 cuentas @gmail.com con acceso individual además de las del dominio del
   hospital. Hay que agregar TODAS esas cuentas (dominio + las 2 @gmail) a la lista de testers. */
var DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
/* ══════════════════════════════════════════════════ */

/* Íconos de línea (Lucide, ISC License) — mismo lenguaje visual que el resto de la UI.
   Fuente de cada uno en Assets/Icons/*.svg. No mezclar con emoji. */
var ICONS = {
  images:'<svg viewBox="0 0 24 24"><path d="m22 11-1.296-1.296a2.4 2.4 0 0 0-3.408 0L11 16"/><path d="M4 8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2"/><circle cx="13" cy="7" r="1" fill="currentColor"/><rect x="8" y="2" width="14" height="14" rx="2"/></svg>',
  users:'<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>',
  stethoscope:'<svg viewBox="0 0 24 24"><path d="M11 2v2"/><path d="M5 2v2"/><path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/></svg>',
  building:'<svg viewBox="0 0 24 24"><path d="M10 12h4"/><path d="M10 8h4"/><path d="M14 21v-3a2 2 0 0 0-4 0v3"/><path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/></svg>',
  calendar:'<svg viewBox="0 0 24 24"><path d="M8 2v3"/><path d="M16 2v3"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M8 13h.01"/><path d="M12 13h.01"/><path d="M16 13h.01"/><path d="M8 17h.01"/><path d="M12 17h.01"/><path d="M16 17h.01"/></svg>',
  handshake:'<svg viewBox="0 0 24 24"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></svg>',
  leaf:'<svg viewBox="0 0 24 24"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>',
  briefcase:'<svg viewBox="0 0 24 24"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>',
  sparkles:'<svg viewBox="0 0 24 24"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/></svg>',
  plug:'<svg viewBox="0 0 24 24"><path d="M12 22v-5"/><path d="M15 8V2"/><path d="M17 8a1 1 0 0 1 1 1v4a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1z"/><path d="M9 8V2"/></svg>',
  eye:'<svg viewBox="0 0 24 24"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>',
  triangleAlert:'<svg viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  folderOpen:'<svg viewBox="0 0 24 24"><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/></svg>',
  search:'<svg viewBox="0 0 24 24"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>',
  link:'<svg viewBox="0 0 24 24"><path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 1 1 0 10h-2"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
  /* Set ampliado para íconos específicos de tarjeta de carpeta (ICON_RULES) — más variedad que
     el ícono genérico por categoría. Mismo origen (Lucide, ISC), fuente en Assets/Icons/*.svg. */
  camera:'<svg viewBox="0 0 24 24"><path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/><circle cx="12" cy="13" r="3"/></svg>',
  baby:'<svg viewBox="0 0 24 24"><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M15 12h.01"/><path d="M19.38 6.813A9 9 0 0 1 20.8 10.2a2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/><path d="M9 12h.01"/></svg>',
  syringe:'<svg viewBox="0 0 24 24"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/></svg>',
  microscope:'<svg viewBox="0 0 24 24"><path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/></svg>',
  scan:'<svg viewBox="0 0 24 24"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>',
  scissors:'<svg viewBox="0 0 24 24"><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/></svg>',
  heartPulse:'<svg viewBox="0 0 24 24"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/><path d="M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/></svg>',
  graduationCap:'<svg viewBox="0 0 24 24"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>',
  gift:'<svg viewBox="0 0 24 24"><path d="M12 7v14"/><path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5"/><rect x="3" y="7" width="18" height="4" rx="1"/></svg>',
  flag:'<svg viewBox="0 0 24 24"><path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"/></svg>',
  megaphone:'<svg viewBox="0 0 24 24"><path d="M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/><path d="M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14"/><path d="M8 6v8"/></svg>',
  shield:'<svg viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>',
  receipt:'<svg viewBox="0 0 24 24"><path d="M12 17V7"/><path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8"/><path d="M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z"/></svg>',
  siren:'<svg viewBox="0 0 24 24"><path d="M7 18v-6a5 5 0 1 1 10 0v6"/><path d="M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z"/><path d="M21 12h1"/><path d="M18.5 4.5 18 5"/><path d="M2 12h1"/><path d="M12 2v1"/><path d="m4.929 4.929.707.707"/><path d="M12 12v6"/></svg>',
  ear:'<svg viewBox="0 0 24 24"><path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0"/><path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4"/></svg>',
  /* Set ampliado (2026-10-01): íconos de ICON_RULES para carpetas nuevas + pool de AUTO_ICONS. Lucide, ISC. */
  plane:'<svg viewBox="0 0 24 24"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>',
  droplets:'<svg viewBox="0 0 24 24"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/></svg>',
  ribbon:'<svg viewBox="0 0 24 24"><path d="M12 11.22C11 9.997 10 9 10 8a2 2 0 0 1 4 0c0 1-.998 2.002-2.01 3.22"/><path d="m12 18 2.57-3.5"/><path d="M6.243 9.016a7 7 0 0 1 11.507-.009"/><path d="M9.35 14.53 12 11.22"/><path d="M9.35 14.53C7.728 12.246 6 10.221 6 7a6 5 0 0 1 12 0c-.005 3.22-1.778 5.235-3.43 7.5l3.557 4.527a1 1 0 0 1-.203 1.43l-1.894 1.36a1 1 0 0 1-1.384-.215L12 18l-2.679 3.593a1 1 0 0 1-1.39.213l-1.865-1.353a1 1 0 0 1-.203-1.422z"/></svg>',
  badgeCheck:'<svg viewBox="0 0 24 24"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m16 9-5.5 5.5L8 12"/></svg>',
  landmark:'<svg viewBox="0 0 24 24"><path d="M10 18v-7"/><path d="M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M3 22h18"/><path d="M6 18v-7"/></svg>',
  clipboardCheck:'<svg viewBox="0 0 24 24"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>',
  lightbulb:'<svg viewBox="0 0 24 24"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
  globe:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
  messagesSquare:'<svg viewBox="0 0 24 24"><path d="M16 10a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 14.286V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/><path d="M20 9a2 2 0 0 1 2 2v10.286a.71.71 0 0 1-1.212.502l-2.202-2.202A2 2 0 0 0 17.172 19H10a2 2 0 0 1-2-2v-1"/></svg>',
  presentation:'<svg viewBox="0 0 24 24"><path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/></svg>',
  star:'<svg viewBox="0 0 24 24"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>',
  cake:'<svg viewBox="0 0 24 24"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3"/><path d="M12 8v3"/><path d="M17 8v3"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/></svg>',
  palette:'<svg viewBox="0 0 24 24"><path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/></svg>',
  house:'<svg viewBox="0 0 24 24"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  accessibility:'<svg viewBox="0 0 24 24"><circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6"/><path d="M13.76 17.5a5 5 0 0 0-6.88-6"/></svg>',
  rainbow:'<svg viewBox="0 0 24 24"><path d="M22 17a10 10 0 0 0-20 0"/><path d="M6 17a6 6 0 0 1 12 0"/><path d="M10 17a2 2 0 0 1 4 0"/></svg>',
  handHeart:'<svg viewBox="0 0 24 24"><path d="M11 14h2a2 2 0 0 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16"/><path d="m14.45 13.39 5.05-4.694C20.196 8 21 6.85 21 5.75a2.75 2.75 0 0 0-4.797-1.837.276.276 0 0 1-.406 0A2.75 2.75 0 0 0 11 5.75c0 1.2.802 2.248 1.5 2.946L16 11.95"/><path d="m2 15 6 6"/><path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a1 1 0 0 0-2.75-2.91"/></svg>',
  pill:'<svg viewBox="0 0 24 24"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>',
  flaskConical:'<svg viewBox="0 0 24 24"><path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2"/><path d="M6.453 15h11.094"/><path d="M8.5 2h7"/></svg>',
  wind:'<svg viewBox="0 0 24 24"><path d="M12.8 19.6A2 2 0 1 0 14 16H2"/><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/><path d="M9.8 4.4A2 2 0 1 1 11 8H2"/></svg>',
  activity:'<svg viewBox="0 0 24 24"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>',
  dumbbell:'<svg viewBox="0 0 24 24"><path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z"/><path d="m2.5 21.5 1.4-1.4"/><path d="m20.1 3.9 1.4-1.4"/><path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z"/><path d="m9.6 14.4 4.8-4.8"/></svg>',
  bone:'<svg viewBox="0 0 24 24"><path d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z"/></svg>',
  ambulance:'<svg viewBox="0 0 24 24"><path d="M10 10H6"/><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 8H14"/><path d="M8 8v4"/><path d="M9 18h6"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>',
  headset:'<svg viewBox="0 0 24 24"><path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z"/><path d="M21 16v2a4 4 0 0 1-4 4h-5"/></svg>',
  store:'<svg viewBox="0 0 24 24"><path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"/><path d="M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"/><path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"/></svg>',
  heart:'<svg viewBox="0 0 24 24"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>',
  hardHat:'<svg viewBox="0 0 24 24"><path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/><path d="M14 6a6 6 0 0 1 6 6v3"/><path d="M4 15v-3a6 6 0 0 1 6-6"/><rect x="2" y="15" width="20" height="4" rx="1"/></svg>',
  cpu:'<svg viewBox="0 0 24 24"><path d="M12 20v2"/><path d="M12 2v2"/><path d="M17 20v2"/><path d="M17 2v2"/><path d="M2 12h2"/><path d="M2 17h2"/><path d="M2 7h2"/><path d="M20 12h2"/><path d="M20 17h2"/><path d="M20 7h2"/><path d="M7 20v2"/><path d="M7 2v2"/><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="8" y="8" width="8" height="8" rx="1"/></svg>',
  layers:'<svg viewBox="0 0 24 24"><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/></svg>',
  bookmark:'<svg viewBox="0 0 24 24"><path d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z"/></svg>',
  tag:'<svg viewBox="0 0 24 24"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>',
  shapes:'<svg viewBox="0 0 24 24"><path d="M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z"/><rect x="3" y="14" width="7" height="7" rx="1"/><circle cx="17.5" cy="17.5" r="3.5"/></svg>',
};

/* Ícono + color de respaldo para tarjetas de carpeta que no matchean un ICON_RULE específico
   (ver styleForFolder) — paleta decorativa fija por palabra clave de carpeta, ya no representa
   una categoría de imagen filtrable (esa noción se eliminó de la app). */
var FOLDER_STYLES = [
  {id:'talento',icon:ICONS.users},
  {id:'servicios',icon:ICONS.stethoscope},
  {id:'infra',  icon:ICONS.building},
  {id:'eventos',icon:ICONS.calendar},
  {id:'comunidad',icon:ICONS.handshake},
  {id:'rse',    icon:ICONS.leaf},
  {id:'gestion',icon:ICONS.briefcase},
  {id:'especial',icon:ICONS.sparkles},
];
var TYPES=[{id:'all',label:'Todos los formatos'},{id:'jpg',label:'JPG / JPEG'},{id:'png',label:'PNG'},{id:'webp',label:'WEBP'}];
/* Palabras clave sin tildes (comparadas contra texto ya normalizado por normalizeText, ver
   catForFolderName) — así "Capacitación"/"capacitacion" matchean igual. */
var CAT_KW={
  talento:['talento','personal medico','personal','enfermera','bienestar','capacitacion','induccion','reinduccion','formacion','auxiliar','profesional','colaborador','deportiv','recreacion','sustentacion','clima laboral','pausa activa','empleado','funcionario','residente','practicante','estudiante','pasante'],
  servicios:['urgencias','laboratorio','farmacia','cirugia','hospitaliz','consulta','triage','medicamento','seguridad del paciente','pediatria','ginecologia','gastroenterologia','fisioterapia','quirofano','infeccion','tamizaje','camillero','simulacro','rayos x','radiologia','uci','infante','obstetric','neonat','trauma','ortoped','respirator','paliativ','fonoaudiolog','nutricion','psicolog','oncolog','cardiolog','imagenolog','ecograf','mamograf','endoscop','dialisis','esterilizacion','banco de sangre','cuidados intensivos','emergencia','parto','lactancia'],
  infra:['fachada','edificio','sala','instalacion','señalizacion','infraestructura','remodelacion','sede','equipo medico','equipos medicos','obra','construccion','ampliacion','pasillo','recepcion','parqueadero','zona verde','aerea','aereo','dron','cubierta','lavanderia','cocina'],
  eventos:['evento','ceremonia','lanzamiento','celebracion','dia del','conmemorativo','graduacion','acto','reconocimiento','feria','marcha','encuentro','navidad','novena','posada','cumple','aniversario','festival','exposicion','foro','simposio','congreso','taller','seminario','visita'],
  comunidad:['comunidad','paciente','jornada','vacunacion','barrio','usuario','extramural','adulto mayor','madre','violencia de genero','campaña de salud','campañas de salud','institucion educativa','colegio','escuela','familia','cuidador','gestante','lactante','discapacidad','inclusion','lgbt','indigena','victima','habitante'],
  rse:['ambiental','social','voluntariado','sostenib','arbol','reciclaje','responsabilidad','medio ambiente','residuos','huerta','donacion','solidari','humaniz'],
  gestion:['reunion','comite','directiva','gestion','rendicion','mipg','calidad','acreditacion','facturacion','campaña interna','campañas internas','auditoria','autoevaluacion','plan de mejora','indicador','informe','estadistic','politica','planeacion','estrategic','mesa de','consejo','secretaria','minsalud','supersalud','contratacion'],
  especial:['redes','prensa','banner','diseño','portada','publicidad','institucional','fotografia','susanita','mascota','video','audiovisual','entrevista','radio','boletin','pagina web','digital','arte','pintura','galeria'],
};

var allFiles=[], activeType='all', activeTag=null, viewMode='g', currentFile=null;
var folderId=CONFIG.FOLDER_ID;
/* supabaseToken: sesión de Supabase Auth (login.html), gate de entrada a la app y a la Edge
   Function "catalogo". driveToken: token de Google, solo para pedirle bytes de imagen a Drive
   directamente (ver openModal) — se consigue bajo demanda, no al iniciar sesión. */
var supabase=null, supabaseToken=null, userEmail=null, authInitialized=false;
/* userRole/isAdmin: vienen de GET ?whoami=1 en la Edge Function catalogo (ver loadUserRole),
   nunca del cliente — la Edge Function vuelve a exigir role==='admin' en el PATCH, así que
   esconder los controles para no-admins es solo UX, no el control de acceso real. */
var userRole=null, isAdmin=false;
var driveToken=null, driveCodeClient=null;
var currentFolders=[], breadcrumb=[], searchMode=false, searchDebounceTimer=null;
/* Posición de la entrada actual dentro del historial propio de la app (history.state.n) y la más
   lejana alcanzada: el navegador no dice si hay "adelante", así que se lleva la cuenta aquí para
   habilitar/deshabilitar los botones ← → de la banda de navegación (ver buildBreadcrumb). */
var navPos=(history.state&&typeof history.state.n==='number')?history.state.n:0, navMax=navPos;

/* Normaliza un nombre para compararlo con palabras clave: minúsculas, sin tildes y con todo lo que
   no sea letra o dígito convertido en espacio ("01_ENERO", "UCI-A" → "01 enero", "uci a"), así
   "Capacitación"/"capacitacion" y "LAVADO_MANOS"/"lavado manos" se tratan igual. */
function normalizeText(s){
  return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
}

/* ¿a y b difieren como máximo en una letra (sustitución, inserción o borrado)? */
function editDistanceLe1(a,b){
  if(a===b) return true;
  var la=a.length, lb=b.length;
  if(Math.abs(la-lb)>1) return false;
  var i=0;
  while(i<la&&i<lb&&a.charAt(i)===b.charAt(i)) i++;
  if(la===lb) return a.slice(i+1)===b.slice(i+1);
  return la>lb ? a.slice(i+1)===b.slice(i) : a.slice(i)===b.slice(i+1);
}

/* ¿La palabra clave coincide con el nombre ya normalizado (text) / partido en palabras (words)?
   - Frase de varias palabras ("rayos x"): debe aparecer empezando en el límite de una palabra.
   - Palabra suelta: coincide si alguna palabra del nombre EMPIEZA con ella — es una raíz ligera
     ("vacun" → vacunación/vacunas; "hospitaliz" → hospitalización) y evita los falsos positivos de
     la búsqueda por substring ("uci" dentro de "producir", "acto" dentro de "factores").
   - Raíces de 8+ letras toleran UNA errata contra el inicio de la palabra: los nombres reales de
     Drive las tienen ("SEGURIDAAD", "CUMPLEÑAOS"). Las cortas no: con 6 letras "quimic" confundiría "quimioterapia" o "cumple" con "cumplimiento". */
function kwMatches(text,words,kw){
  if(kw.indexOf(' ')>-1) return (' '+text).indexOf(' '+kw)>-1;
  for(var i=0;i<words.length;i++){
    var w=words[i];
    if(w.indexOf(kw)===0) return true;
    if(kw.length>=8 && w.length>=kw.length-1 && editDistanceLe1(w.slice(0,kw.length),kw)) return true;
  }
  return false;
}
function anyKw(text,words,list){
  for(var i=0;i<list.length;i++){ if(kwMatches(text,words,normalizeText(list[i]))) return true; }
  return false;
}

/* Estilo (ícono+color) de una tarjeta de carpeta según su nombre, por palabra clave (CAT_KW) —
   ej. "Jornada de vacunación" cae en Comunidad, "Bienestar laboral" en Talento Humano, etc.
   Devuelve null si el nombre no coincide con ninguna. */
function catForText(text,words){
  for(var i=0;i<FOLDER_STYLES.length;i++){
    var kws=CAT_KW[FOLDER_STYLES[i].id];
    if(kws && anyKw(text,words,kws)) return FOLDER_STYLES[i].id;
  }
  return null;
}

/* Ícono (y color, ver --ic-* en css/styles.css) específico de una tarjeta de carpeta, más
   concreto que el genérico de su categoría (ej. cámara+sepia para "Fotografías", jeringa+azul
   médico para "Vacunación" en vez del apretón de manos genérico de Comunidad). Se evalúa en orden,
   la primera coincidencia gana (lo más específico primero); agregar una fila nueva aquí es la
   forma de sumar variedad a futuro sin tocar CAT_KW — y si el ícono es nuevo, también hace falta
   su SVG en ICONS y su --ic-<nombre> en css/styles.css. Las palabras clave son RAÍCES sin tildes
   (ver kwMatches). Si nada coincide, la tarjeta cae al ícono + color de respaldo por palabra clave
   (catForText / FOLDER_STYLES) y, si tampoco, a autoFolderStyle. */
var ICON_RULES=[
  {icon:'camera',        kw:['foto']},
  {icon:'plane',         kw:['aere','dron','panoram']},
  {icon:'gift',          kw:['regalo','obsequio']},
  {icon:'ear',          kw:['auditiv','fonoaudiolog','audiolog']},
  {icon:'baby',          kw:['pediatr','infan','madre','nino','nina','lactancia','neonat','prematur','recien nacido','parto','obstetric','ginecolog','materno','gestante','embarazo','bebe','iamii','camii']},
  {icon:'syringe',       kw:['vacun','inmuniz']},
  {icon:'microscope',    kw:['laboratorio','gastroenterolog','infeccion','patolog','microbiolog','citolog']},
  {icon:'scan',          kw:['rayos x','radiolog','imagenolog','ecograf','tomograf','resonancia','mamograf']},
  {icon:'scissors',      kw:['quirofano','cirugia','cirujan','quirurg']},
  {icon:'pill',          kw:['farmac','medicament','droguer']},
  {icon:'flaskConical',  kw:['quimic']},
  {icon:'wind',          kw:['respirator','neumolog','oxigeno']},
  {icon:'bone',          kw:['trauma','ortoped','fractur']},
  {icon:'ambulance',     kw:['camiller','ambulancia','traslado']},
  {icon:'activity',      kw:['fisioterap','terapeuta','rehabilit','terapia']},
  {icon:'dumbbell',      kw:['deport','recreacion','gimnasia','pausa']},
  {icon:'heartPulse',    kw:['uci','urgencias','hospitaliz','cardiolog','cuidados intensivos']},
  {icon:'graduationCap', kw:['capacitacion','induccion','reinduccion','formacion','educacion','universidad','estudiante','pasantia']},
  {icon:'handHeart',     kw:['humaniz','paliativ','adulto mayor','geriatr','solidari','donacion','cuidado']},
  {icon:'ribbon',        kw:['cancer','oncolog','quimioterap','radioterap','mama']},
  {icon:'droplets',      kw:['lavado','higiene','manos']},
  {icon:'badgeCheck',    kw:['acreditacion','certificacion','habilitacion']},
  {icon:'landmark',      kw:['consejo','minsalud','ministerio','secretaria','alcaldia','gobernacion','supersalud','territorial']},
  {icon:'clipboardCheck',kw:['autoevaluacion','evaluacion','auditoria','inspeccion','visita','verificacion','seguimiento']},
  {icon:'shield',        kw:['segurida','violencia','bioseguridad','riesgo']},
  {icon:'lightbulb',     kw:['ideacion','innovacion','desafio','creativ','idea']},
  {icon:'globe',         kw:['web','pagina','redes sociales','digital','internet']},
  {icon:'messagesSquare',kw:['charla','foro','conversatorio','socializacion','conferencia','simposio','congreso','mesa de']},
  {icon:'presentation',  kw:['taller','curso','seminario','diplomado','sustentacion']},
  {icon:'cake',          kw:['cumple','aniversario']},
  {icon:'star',          kw:['novena','navidad','navideno','pesebre','posada','aguinaldo']},
  {icon:'palette',       kw:['arte','expo','pintur','artistic','diseno','grafic','galeria']},
  {icon:'house',         kw:['vivienda','hogar','domicili']},
  {icon:'accessibility', kw:['discapacidad','inclusion','accesibilidad']},
  {icon:'rainbow',       kw:['lgbt','diversidad']},
  {icon:'heart',         kw:['salud sexual','sexual','mujer','planificacion familiar']},
  {icon:'cpu',           kw:['biomedic','equipo','mantenimiento','tecnologia','sistemas','informatica']},
  {icon:'hardHat',       kw:['ingenier','obra','construccion','remodelacion','arquitect']},
  {icon:'headset',       kw:['atencion al','pqrs','servicio al']},
  {icon:'stethoscope',   kw:['enfermer','auxiliar','medico','medica','doctor','consulta']},
  {icon:'store',         kw:['mercado','bazar','tienda','pulgas']},
  {icon:'handshake',     kw:['trabajador social','trabajo social','voluntari','alianza','convenio']},
  {icon:'sparkles',      kw:['limpieza','aseo','servicios generales']},
  {icon:'gift',          kw:['celebracion','conmemorativo','feria','fiesta','festiv']},
  {icon:'flag',          kw:['marcha']},
  {icon:'megaphone',     kw:['campana','comunicado','divulgacion','promocion']},
  {icon:'receipt',       kw:['facturacion','glosa','cartera']},
  {icon:'siren',         kw:['simulacro','emergencia','desastre','evacuacion','accidente','alarma']},
  {icon:'ear',           kw:['tamizaje']},
  {icon:'calendar',      kw:['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','setiembre','octubre','noviembre','diciembre','semestre','trimestre','cronograma','agenda']},
];

/* Respaldo B para carpetas que no coinciden con NINGUNA regla ni categoría: en vez de dejar el
   ícono genérico de carpeta, se les asigna un ícono neutro + un color de la paleta --cat-*
   derivados de un hash del nombre (FNV-1a). Es la misma idea de los "identicons"/hash
   visualization (Perrig & Song, 1999): determinista — la misma carpeta siempre se ve igual, sin
   importar el orden o el usuario — y variada entre carpetas distintas. El color se limita a la
   paleta de 8 tonos ya existente porque la discriminación de color por sí sola se degrada pasadas
   ~7 categorías (Healey, 1996); la forma del ícono es la que aporta la variedad. */
var AUTO_ICONS=['images','layers','bookmark','tag','shapes'];
function hashText(s){
  var h=2166136261;
  for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619)>>>0; }
  return h>>>0;
}
function autoFolderStyle(text){
  var h=hashText(text);
  return {icon:ICONS[AUTO_ICONS[h%AUTO_ICONS.length]], cls:'cat-'+FOLDER_STYLES[(h>>>8)%FOLDER_STYLES.length].id};
}

/* Devuelve {icon, cls} para una tarjeta de carpeta, en este orden de prioridad:
   1) nombre sin letras (solo fechas/números, ej. "2022/05/11") → calendario;
   2) ICON_RULES (ícono propio, clase .icon-<nombre>);
   3) categoría por palabra clave CAT_KW (ícono + color de FOLDER_STYLES, clase .cat-<id>);
   4) autoFolderStyle (hash del nombre). Resultado memorizado por nombre: se llama en cada render. */
var folderStyleCache={};
function styleForFolder(name){
  if(folderStyleCache.hasOwnProperty(name)) return folderStyleCache[name];
  var text=normalizeText(name), words=text?text.split(' '):[], res=null;
  if(text && !/[a-z]/.test(text)) res={icon:ICONS.calendar, cls:'icon-calendar'};
  for(var i=0;!res&&i<ICON_RULES.length;i++){
    if(anyKw(text,words,ICON_RULES[i].kw)) res={icon:ICONS[ICON_RULES[i].icon], cls:'icon-'+ICON_RULES[i].icon};
  }
  if(!res){
    var styleId=catForText(text,words);
    var styleObj=styleId&&FOLDER_STYLES.find(function(c){return c.id===styleId;});
    res=styleObj ? {icon:styleObj.icon, cls:'cat-'+styleId} : autoFolderStyle(text);
  }
  return (folderStyleCache[name]=res);
}

function buildSidebar(){
  var tl=document.getElementById('typeList'); tl.innerHTML='';
  TYPES.forEach(function(t){
    var d=document.createElement('div');
    d.className='cat-item'+(activeType===t.id?' active':'');
    d.innerHTML='<span style="font-size:11px;flex:1">'+t.label+'</span>';
    d.onclick=(function(tid){return function(){activeType=tid;buildSidebar();filterImages();};})(t.id);
    tl.appendChild(d);
  });
}

/* En la portada (raíz, sin carpeta abierta) allFiles siempre está vacío — ahí no hay archivos
   propios, solo subcarpetas — así que antes la nube de etiquetas quedaba en "Sin etiquetas
   todavía" aunque la etiqueta existiera en miles de imágenes repartidas en el banco. Se pide
   una sola vez el resumen global (tags_summary, ver handleTagsSummary en la Edge Function) y se
   cachea; se invalida (ver saveModalChanges) cuando se edita una etiqueta, para que la próxima
   visita a la portada refleje el cambio. */
var globalTagsCache=null, globalTagsFetching=false;

async function loadGlobalTags(){
  if(globalTagsCache||globalTagsFetching) return;
  globalTagsFetching=true;
  try{
    var data=await fetchCatalogo('tags_summary=1');
    globalTagsCache=data.tags||[];
  }catch(e){
    /* No cachear el fallo como si fuera "confirmado sin etiquetas": buildSidebar()/buildTags()
       se llaman una vez al final del archivo, antes de que bootstrapAuth() termine de dejar
       supabaseToken listo (ver el arranque más abajo), así que este primer intento siempre
       falla con 401. Si acá se guardara [], ese [] (a diferencia de null) hace que
       "!globalTagsCache" ya no dispare un reintento — la nube se quedaría en "Sin etiquetas
       todavía" para siempre aunque sí existan etiquetas. Dejarlo en null permite que la
       próxima vez que se construya la nube (ya con sesión lista) se vuelva a intentar. */
    globalTagsCache=null;
  }
  globalTagsFetching=false;
  if(!searchMode&&folderId===CONFIG.FOLDER_ID) buildTags();
}

/* Fuera de la portada, la nube sigue contando lo que de verdad escribió comunicaciones en las
   imágenes ya cargadas (allFiles) — alcance de la carpeta o búsqueda actual, no global. */
function buildTags(){
  var tc=document.getElementById('tagCloud'); tc.innerHTML='';
  var isRoot=!searchMode&&folderId===CONFIG.FOLDER_ID;
  var tags, counts={};
  if(isRoot){
    if(!globalTagsCache){
      loadGlobalTags();
      tc.innerHTML='<span class="tag-empty">Cargando etiquetas...</span>';
      return;
    }
    globalTagsCache.forEach(function(t){ counts[t.tag]=t.count; });
    tags=globalTagsCache.map(function(t){return t.tag;});
  } else {
    allFiles.forEach(function(f){ (f.tags||[]).forEach(function(t){ counts[t]=(counts[t]||0)+1; }); });
    tags=Object.keys(counts).sort(function(a,b){return counts[b]-counts[a]||a.localeCompare(b);});
  }
  if(!tags.length){
    tc.innerHTML='<span class="tag-empty">Sin etiquetas todavía</span>';
    return;
  }
  tags.forEach(function(t){
    var s=document.createElement('span');
    s.className='tag'+(activeTag===t?' active':'');
    s.textContent=t+' ('+counts[t]+')';
    s.onclick=(function(tag){return function(){activeTag=activeTag===tag?null:tag;buildSidebar();buildTags();runSearch();};})(t);
    tc.appendChild(s);
  });
}

/* Usa filteredAll (lo que de verdad se ve en la grilla), no allFiles: en modo búsqueda, allFiles
   trae todo lo que matcheó el ilike del servidor (nombre/descripción/etiquetas/ruta/fecha —
   ver handleSearch), que es más amplio que el filtro exacto de etiqueta/tipo aplicado en el
   cliente (matchesFilters). Contar allFiles mostraba, por ejemplo, "117 imágenes" al filtrar por
   una etiqueta que en realidad solo tenía 1 coincidencia real. */
function buildStats(){
  var sb=document.getElementById('statsBar'); sb.style.display='grid';
  var total=filteredAll.length;
  var bytes=filteredAll.reduce(function(a,f){return a+(parseInt(f.size)||0);},0);
  var folders=currentFolders.length;
  sb.innerHTML='<div class="stat"><div class="stat-num">'+total+'</div><div class="stat-lbl">Imágenes</div></div>'+
    '<div class="stat"><div class="stat-num">'+folders+'</div><div class="stat-lbl">Carpetas</div></div>'+
    '<div class="stat"><div class="stat-num">'+formatBytes(bytes)+'</div><div class="stat-lbl">Almacenamiento</div></div>';
}

function formatBytes(n){
  if(!n) return '0 KB';
  var units=['B','KB','MB','GB','TB'];
  var i=0;
  while(n>=1024 && i<units.length-1){ n/=1024; i++; }
  return (i===0?n:n.toFixed(1))+' '+units[i];
}

/* ── GRID CON SCROLL INFINITO + MINIATURAS DIFERIDAS ─
   Con miles de imágenes no se pueden renderizar todas las tarjetas ni pedir todas las
   miniaturas de una vez. filteredAll guarda el resultado del filtro actual; solo se
   renderiza de a PAGE_SIZE tarjetas, y las miniaturas (que requieren el token OAuth, no
   pueden ir en un <img src> normal) se piden de a poco según entran en pantalla. */
var PAGE_SIZE=60, filteredAll=[], visibleCount=0;
/* Selección múltiple para descarga en lote — ver toggleSelect/downloadSelection. Solo guarda
   ids; el archivo completo se busca en allFiles al momento de descargar. */
var selectedIds=new Set();

/* Orden compartido entre tarjetas de carpeta e imágenes — ambas traen name y modifiedTime,
   así que un mismo criterio les aplica parejo. */
function sortEntries(list, sort){
  switch(sort){
    case 'name': list.sort(function(a,b){return a.name.localeCompare(b.name);}); break;
    case 'name-desc': list.sort(function(a,b){return b.name.localeCompare(a.name);}); break;
    case 'date-asc': list.sort(function(a,b){return (a.modifiedTime||'').localeCompare(b.modifiedTime||'');}); break;
    default: list.sort(function(a,b){return (b.modifiedTime||'').localeCompare(a.modifiedTime||'');}); break; // 'date'
  }
  return list;
}

/* Predicado de filtro compartido entre el rebuild completo (filterImages) y el crecimiento
   incremental durante scroll infinito en modo búsqueda (ver growSearchResults), para que un
   ítem recién llegado del servidor se evalúe exactamente igual que uno ya cargado. */
function matchesFilters(f, q){
  var ext=(f.name.split('.').pop()||'').toLowerCase();
  var matchType=activeType==='all'||(activeType==='jpg'&&(ext==='jpg'||ext==='jpeg'))||(activeType===ext);
  /* En modo búsqueda (searchMode) allFiles ya viene filtrado server-side por la Edge Function
     catalogo, que además de nombre/descripción/etiqueta busca en la ruta de carpetas y la fecha
     (ver handleSearch) — campos que este predicado no tiene forma de reproducir en el navegador
     (path/fecha no viajan a f). Reaplicar acá una comparación más estricta (solo nombre/
     descripción/etiqueta) descartaba resultados válidos que el servidor encontró por esas otras
     vías. Así que en searchMode se confía en el filtro del servidor y acá solo se aplican
     tipo/etiqueta; fuera de searchMode (navegando una carpeta) sí se sigue filtrando localmente. */
  var matchQ=searchMode||!q||f.name.toLowerCase().indexOf(q)>-1||
    (f.description||'').toLowerCase().indexOf(q)>-1||
    (f.tags||[]).some(function(t){return t.toLowerCase().indexOf(q)>-1;});
  var matchTag=!activeTag||f.tags.indexOf(activeTag)>-1;
  return matchType&&matchQ&&matchTag;
}

/* Lista de carpetas: columnas redimensionables como en el Explorador de Windows (arrastrar el borde
   del encabezado; doble clic lo devuelve al ancho original). Anchos en px CSS guardados en localStorage. */
var LIST_COLS_KEY='bancoColsLista', LIST_COLS_DEF={cw1:420,cw2:150,cw3:200}, LIST_COLS_MIN={cw1:140,cw2:80,cw3:80};
var listCols=(function(){ var c=Object.assign({},LIST_COLS_DEF); try{ var s=JSON.parse(localStorage.getItem(LIST_COLS_KEY)||'null'); if(s) ['cw1','cw2','cw3'].forEach(function(k){ if(typeof s[k]==='number'&&s[k]>=LIST_COLS_MIN[k]&&s[k]<4000) c[k]=s[k]; }); }catch(e){} return c; })();
function applyListCols(){
  var g=document.querySelector('#folderList .folder-grid.lv'); if(!g) return;
  ['cw1','cw2','cw3'].forEach(function(k){ g.style.setProperty('--'+k, listCols[k]+'px'); });
}
(function(){
  var fl=document.getElementById('folderList');
  fl.addEventListener('dblclick',function(ev){
    var h=ev.target.closest('.rz'); if(!h) return;
    var k='cw'+h.getAttribute('data-c'); listCols[k]=LIST_COLS_DEF[k]; applyListCols();
    try{localStorage.setItem(LIST_COLS_KEY,JSON.stringify(listCols));}catch(e){}
  });
  fl.addEventListener('pointerdown',function(ev){
    var h=ev.target.closest('.rz'); if(!h||ev.button>0) return;
    ev.preventDefault(); ev.stopPropagation();
    var k='cw'+h.getAttribute('data-c'), span=h.parentNode;
    var scale=(span.getBoundingClientRect().width/span.offsetWidth)||1; // px de pantalla por px CSS (el zoom de la app)
    var x0=ev.clientX, w0=listCols[k];
    h.classList.add('drag'); document.body.classList.add('col-resizing');
    try{h.setPointerCapture(ev.pointerId);}catch(e){}
    function mv(e){ listCols[k]=Math.max(LIST_COLS_MIN[k],Math.min(3000,Math.round(w0+(e.clientX-x0)/scale))); applyListCols(); }
    function up(){
      h.removeEventListener('pointermove',mv); h.removeEventListener('pointerup',up); h.removeEventListener('pointercancel',up);
      h.classList.remove('drag'); document.body.classList.remove('col-resizing');
      try{localStorage.setItem(LIST_COLS_KEY,JSON.stringify(listCols));}catch(e){}
    }
    h.addEventListener('pointermove',mv); h.addEventListener('pointerup',up); h.addEventListener('pointercancel',up);
  });
})();

function filterImages(){
  /* La grilla se reconstruye entera (loadMoreCards) — una selección de otra carpeta/búsqueda
     dejaría de tener tarjetas visibles que la reflejen, así que se limpia acá. */
  if(selectedIds.size){ selectedIds.clear(); renderSelectionBar(); }
  var q=document.getElementById('searchInput').value.toLowerCase();
  var sort=document.getElementById('sortSel').value;
  var filtered=allFiles.filter(function(f){ return matchesFilters(f, q); });
  sortEntries(filtered, sort);

  filteredAll=filtered;
  visibleCount=0;
  var grid=document.getElementById('imageGrid');
  grid.className='grid'+(viewMode==='l'?' lv':'');
  grid.innerHTML='';

  var foldersToShow=searchMode?[]:currentFolders.filter(function(fo){
    return !q||fo.name.toLowerCase().indexOf(q)>-1;
  });
  sortEntries(foldersToShow, sort);
  var folderList=document.getElementById('folderList');
  var isFolderLi=viewMode==='l';
  if(!foldersToShow.length){
    folderList.innerHTML='';
  } else {
    var rows=foldersToShow.map(function(fo){
      var title=escHtml(fo.name)+' — Creado por '+escHtml(fo.owner||'—');
      var st=styleForFolder(fo.name);
      var cls=st.cls?' '+st.cls:'';
      if(isFolderLi){
        return '<div class="folder-card'+cls+' li" onclick="enterFolder(\''+fo.id+'\')" tabindex="0" role="button" aria-label="Carpeta '+escHtml(fo.name)+'" title="'+title+'">'+
          '<span class="folder-card-namecell"><span class="folder-card-icon">'+st.icon+'</span><span class="folder-card-name">'+escHtml(fo.name)+'</span></span>'+
          '<span class="folder-card-meta">'+formatDate(fo.modifiedTime)+'</span>'+
          '<span class="folder-card-owner">'+escHtml(fo.owner||'—')+'</span>'+
        '</div>';
      }
      return '<div class="folder-card'+cls+'" onclick="enterFolder(\''+fo.id+'\')" tabindex="0" role="button" aria-label="Carpeta '+escHtml(fo.name)+'" title="'+title+'">'+
        '<span class="folder-card-icon">'+st.icon+'</span>'+
        '<span class="folder-card-name">'+escHtml(fo.name)+'</span>'+
        '<span class="folder-card-meta">'+formatDate(fo.modifiedTime)+'</span>'+
      '</div>';
    }).join('');
    var head=isFolderLi?'<div class="folder-list-head"><span>Nombre<i class="rz" data-c="1"></i></span><span>Modificado<i class="rz" data-c="2"></i></span><span>Propietario<i class="rz" data-c="3"></i></span></div>':'';
    folderList.innerHTML='<div class="folder-grid'+(isFolderLi?' lv':'')+'">'+head+rows+'</div>';
    if(isFolderLi) applyListCols();
  }

  if(!filteredAll.length){
    if(!foldersToShow.length){
      grid.innerHTML='<div class="empty"><span class="empty-icon">'+ICONS.search+'</span><p>'+(searchMode?'No se encontraron imágenes con ese criterio.':'Esta carpeta está vacía.')+'</p></div>';
    }
    return;
  }
  loadMoreCards();
}

/* En resultados de búsqueda (que mezclan todo el banco) cada tarjeta indica su carpeta. f.path ya
   viaja en la respuesta de la Edge Function (nombres de carpetas desde la raíz hasta la que
   contiene la imagen), así que no cuesta ninguna consulta extra. En la tarjeta se muestran solo
   los últimos 2 niveles; la ruta completa queda en el tooltip. */
function folderLabel(f){
  var p=f.path||[];
  var full=p.length?p.join(' / '):'Carpeta principal';
  var short=p.length>2?'… / '+p.slice(-2).join(' / '):full;
  var icon='<svg viewBox="0 0 24 24"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>';
  /* Con folderId (Edge Function actualizada) la etiqueta es un enlace a esa carpeta; sin él
     (backend viejo) queda como texto informativo. */
  if(f.folderId) return '<button type="button" class="img-folder link" title="Ir a la carpeta: '+escHtml(full)+'" onclick="goToFolderOf(event,\''+escHtml(f.folderId)+'\')">'+icon+'<span>'+escHtml(short)+'</span></button>';
  return '<div class="img-folder" title="'+escHtml(full)+'">'+icon+'<span>'+escHtml(short)+'</span></div>';
}

/* Salta desde un resultado de búsqueda a la carpeta que contiene la imagen. Entrada nueva en el
   historial: Atrás vuelve a los resultados. */
async function goToFolderOf(ev, fid){
  ev.stopPropagation();
  clearTimeout(searchDebounceTimer);
  document.getElementById('searchInput').value=''; activeTag=null;
  searchMode=false; updateSearchClear();
  showLoader('Abriendo carpeta...');
  try{
    var chain=await resolveBreadcrumbForFolder(fid);
    breadcrumb=chain||[{id:CONFIG.FOLDER_ID,name:'Banco de Imágenes'}];
  }catch(e){
    if(e.code===401){ if(supabase) supabase.auth.signOut(); window.location.replace('login.html?expired=1'); return; }
    breadcrumb=[{id:CONFIG.FOLDER_ID,name:'Banco de Imágenes'}];
  }
  openFolder(breadcrumb[breadcrumb.length-1].id, true);
}

/* Indicador de carga con los puntos de colores del splash (ver .splash-dots), para que cada
   clic en una carpeta / Atrás muestre respuesta inmediata aunque Drive tarde un poco. */
function loaderHtml(msg){
  return '<div class="loader" role="status" aria-live="polite"><div class="splash-dots" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div><p>'+msg+'</p></div>';
}
function showLoader(msg){
  var grid=document.getElementById('imageGrid');
  /* Se vacía TODO el contenido anterior (tarjetas de carpetas y estadísticas), no solo la grilla
     de imágenes: si no, las carpetas viejas quedaban en pantalla y el indicador, más abajo,
     fuera de la vista — parecía que el clic no había hecho nada. */
  document.getElementById('folderList').innerHTML='';
  document.getElementById('statsBar').style.display='none';
  /* Se descarta también la lista ya filtrada: al achicarse la grilla a solo el loader, el sentinel de
     scroll infinito entra en pantalla y handleScrollBottom() seguía pintando las tarjetas de la
     carpeta anterior (de a 60) debajo del "Cargando…". */
  filteredAll=[]; visibleCount=0;
  grid.className='grid';
  grid.innerHTML=loaderHtml(msg);
  var nb=document.getElementById('navBand');
  if(nb&&nb.getBoundingClientRect().top<0) nb.scrollIntoView({block:'start'});
}

function loadMoreCards(){
  if(visibleCount>=filteredAll.length) return;
  var next=filteredAll.slice(visibleCount, visibleCount+PAGE_SIZE);
  visibleCount+=next.length;
  var grid=document.getElementById('imageGrid');
  var isLi=viewMode==='l';
  grid.insertAdjacentHTML('beforeend', next.map(function(f){
    var fullUrl='https://www.googleapis.com/drive/v3/files/'+f.id+'?alt=media';
    var thumb='<span class="ph">'+ICONS.images+'</span><img data-full="'+fullUrl+'"'+(f.thumbnailLink?' data-thumb-id="'+escHtml(f.id)+'"':'')+' alt="'+escHtml(f.name)+'" class="lazy-img" onerror="this.style.display=\'none\'">';
    /* Etiquetas (ver refreshCardTags para el mismo patrón) — texto libre que escribió
       comunicaciones, pasa por escHtml. */
    var tagPills='<span class="card-tags">'+
      (f.tags||[]).map(function(t){
        return '<span class="tag-pill">'+escHtml(t)+'</span>';
      }).join('')+
    '</span>';
    var checked=selectedIds.has(f.id);
    var selChk='<button type="button" class="sel-chk'+(checked?' checked':'')+'" onclick="toggleSelect(event,\''+f.id+'\')" aria-label="Seleccionar imagen" aria-pressed="'+checked+'">'+
      '<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg></button>';
    return '<div class="img-card'+(isLi?' li':'')+(checked?' selected':'')+'" onclick="openModal(\''+f.id+'\')" tabindex="0" role="button" aria-label="'+escHtml(f.name)+'">'+
      selChk+
      '<div class="img-thumb">'+thumb+
      '</div>'+
      '<div class="img-info">'+
        '<div class="img-name">'+escHtml(f.name)+'</div>'+
        (searchMode?folderLabel(f):'')+
        '<div class="img-meta">'+
          '<span class="img-date">'+formatDate(f.modifiedTime)+'</span>'+
          tagPills+
        '</div>'+
      '</div></div>';
  }).join(''));
  observeLazyThumbs();
}

/* Carga miniaturas solo cuando la tarjeta entra en pantalla, con un límite de solicitudes
   simultáneas para no saturar el navegador ni la cuota de la API. Se prioriza thumbnailLink
   (miniatura liviana que Drive ya genera) y solo tras agotar sus reintentos se recurre al
   archivo completo vía fetch autenticado.
   Google devuelve 429 en lh3.googleusercontent.com si se piden demasiadas miniaturas seguidas
   (típico al scrollear rápido con miles de imágenes). Sin manejo de esto, cada 429 disparaba
   antes una descarga del archivo completo como fallback, lo que multiplicaba el tráfico y
   agravaba el bloqueo — el banco de imágenes se quedaba sin poder mostrar nada y sin ningún
   error en consola (loadThumb tragaba la excepción en silencio). Ahora: concurrencia más baja,
   backoff global cuando se detecta un 429 (pausa y reintenta más lento en vez de seguir
   golpeando la cuota), reintentos con espera exponencial por miniatura, y logging del fallo
   final para que sea diagnosticable. */
var THUMB_CONCURRENCY=6, THUMB_TRY_LIMIT=2, THUMB_MAX_ATTEMPTS=5;
var thumbQueue=[], thumbActive=0;
var thumbBackoffMs=800, thumbBackoffUntil=0, thumbBackoffTimer=null;
var thumbObserver=new IntersectionObserver(function(entries){
  entries.forEach(function(entry){
    if(entry.isIntersecting){
      thumbObserver.unobserve(entry.target);
      thumbQueue.push({img:entry.target, attempt:0});
      pumpThumbQueue();
    }
  });
},{rootMargin:'400px'});

function observeLazyThumbs(){
  document.querySelectorAll('#imageGrid img.lazy-img').forEach(function(img){
    thumbObserver.observe(img);
  });
}

function pumpThumbQueue(){
  var wait=thumbBackoffUntil-Date.now();
  if(wait>0){
    if(!thumbBackoffTimer) thumbBackoffTimer=setTimeout(function(){thumbBackoffTimer=null;pumpThumbQueue();}, wait+30);
    return;
  }
  while(thumbActive<THUMB_CONCURRENCY && thumbQueue.length){
    var item=thumbQueue.shift();
    thumbActive++;
    loadThumb(item).finally(function(){thumbActive--;pumpThumbQueue();});
  }
}

/* Un 429 en cualquier miniatura frena TODA la cola un rato (backoff exponencial, tope 20s) en
   vez de seguir mandando peticiones; un éxito reinicia el backoff a su valor base. */
function onThumbRateLimited(){
  thumbBackoffMs=Math.min(thumbBackoffMs*2, 20000);
  thumbBackoffUntil=Date.now()+thumbBackoffMs;
}
function onThumbSuccess(){ thumbBackoffMs=800; }

function scheduleThumbRetry(item){
  item.attempt++;
  var delay=Math.min(700*Math.pow(2,item.attempt), 15000);
  setTimeout(function(){
    if(item.img.isConnected){ thumbQueue.push(item); pumpThumbQueue(); }
  }, delay);
}

/* Las miniaturas pasan por la Edge Function (?thumb_for=<id>) en vez de pedirse directo a
   lh3.googleusercontent.com. Se probó primero con el proxy gratuito images.weserv.nl, pero
   Google bloquea (400) las requests que le llegan desde ese proxy compartido para este tipo
   de URL — así que la Edge Function pide la miniatura ella misma y la devuelve; Google solo ve
   la IP de la función, no la de cada visitante, sin depender de un tercero. */
function thumbProxyUrl(imageId){
  return CONFIG.SUPABASE_FUNCTION_URL+'?thumb_for='+encodeURIComponent(imageId);
}

/* Apaga el parpadeo de "cargando" del contenedor (.img-thumb) una vez que la miniatura llegó,
   o una vez que quedó claro que no va a llegar (fallback sin token / error final) — en ambos
   casos seguir pulsando sería engañoso, ya no hay nada en camino. */
function markThumbDone(img){
  var wrap=img.closest('.img-thumb');
  if(wrap) wrap.classList.add('thumb-done');
}

async function loadThumb(item){
  var img=item.img;
  if(!img.isConnected) return; // la tarjeta ya no está en pantalla (cambió de carpeta/vista)
  var thumbId=img.getAttribute('data-thumb-id');
  var useThumb=!!thumbId && item.attempt<THUMB_TRY_LIMIT;
  if(!useThumb && !driveToken){
    // Fallback al archivo completo — solo si ya se conectó Drive antes (ver openModal). No
    // forzamos el popup de Google por una miniatura de fondo.
    img.style.display='none';
    markThumbDone(img);
    return;
  }
  var url=useThumb?thumbProxyUrl(thumbId):img.getAttribute('data-full');
  var opts={headers:{Authorization:'Bearer '+(useThumb?supabaseToken:driveToken)}};
  try{
    var res=await fetch(url, opts);
    if(res.status===429){
      onThumbRateLimited();
      return scheduleThumbRetry(item);
    }
    if(!res.ok) throw new Error('HTTP '+res.status);
    var blob=await res.blob();
    img.src=URL.createObjectURL(blob);
    img.classList.add('loaded');
    markThumbDone(img);
    onThumbSuccess();
  }catch(e){
    if(item.attempt<THUMB_MAX_ATTEMPTS) return scheduleThumbRetry(item);
    console.warn('[banco-imagenes] No se pudo cargar la miniatura tras '+(item.attempt+1)+' intentos:', img.getAttribute('data-full'), e);
    img.style.display='none';
    markThumbDone(img);
  }
}

/* Sentinela de scroll infinito: cuando entra en pantalla, pide la siguiente página.
   En modo carpeta, filteredAll ya tiene todo (una carpeta trae pocos cientos de ítems como
   mucho) así que alcanza con loadMoreCards(). En modo búsqueda, cuando se acaba el buffer
   local hay que pedir la próxima página real a la Edge Function (ver growSearchResults). */
var gridSentinelObserver=new IntersectionObserver(function(entries){
  if(entries[0].isIntersecting) handleScrollBottom();
},{rootMargin:'600px'});

function handleScrollBottom(){
  if(visibleCount<filteredAll.length){ loadMoreCards(); return; }
  if(searchMode) growSearchResults();
}

function escHtml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

function formatDate(d){
  if(!d) return '—';
  var dt=new Date(d);
  var m=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return dt.getDate()+' '+m[dt.getMonth()]+' '+dt.getFullYear();
}

function formatSize(b){
  if(!b) return '—';
  var n=parseInt(b);
  return n>1048576?(n/1048576).toFixed(1)+' MB':Math.round(n/1024)+' KB';
}

/* Repinta los pills de etiqueta de la tarjeta de la grilla que corresponde a f, sin reconstruir
   el grid entero (eso perdería miniaturas ya cargadas y el scroll — ver growSearchResults).
   Mismo patrón que loadMoreCards al armar .card-tags por primera vez. */
function refreshCardTags(f){
  var card=document.querySelector('[onclick="openModal(\''+f.id+'\')"]');
  var pillsWrap=card&&card.querySelector('.card-tags');
  if(!pillsWrap) return;
  pillsWrap.innerHTML=(f.tags||[]).map(function(t){
    return '<span class="tag-pill">'+escHtml(t)+'</span>';
  }).join('');
}

/* ── SELECCIÓN MÚLTIPLE Y DESCARGA EN LOTE ────────────────────────────────
   Cada tarjeta tiene un checkbox (.sel-chk, ver loadMoreCards) que no abre el modal —
   toggleSelect corta la propagación antes de que el onclick de la tarjeta la reciba. */
function toggleSelect(ev,id){
  ev.stopPropagation();
  if(selectedIds.has(id)) selectedIds.delete(id); else selectedIds.add(id);
  var card=document.querySelector('[onclick="openModal(\''+id+'\')"]');
  if(card){
    var checked=selectedIds.has(id);
    card.classList.toggle('selected',checked);
    var chk=card.querySelector('.sel-chk');
    if(chk){ chk.classList.toggle('checked',checked); chk.setAttribute('aria-pressed',checked); }
  }
  renderSelectionBar();
}

function clearSelection(){
  selectedIds.clear();
  document.querySelectorAll('.img-card.selected').forEach(function(card){
    card.classList.remove('selected');
    var chk=card.querySelector('.sel-chk');
    if(chk){ chk.classList.remove('checked'); chk.setAttribute('aria-pressed','false'); }
  });
  renderSelectionBar();
}

function renderSelectionBar(){
  var bar=document.getElementById('selectionBar');
  var n=selectedIds.size;
  bar.style.display=n?'flex':'none';
  document.getElementById('sbCount').textContent=n+(n===1?' imagen seleccionada':' imágenes seleccionadas');
}

/* Google Drive/Photos siempre arman un .zip aunque sean 2 archivos — pero acá el zip se genera
   en el navegador (no hay backend propio que lo haga del lado del servidor, ver comentario en
   banco_imagenes_hslv.html), y para 1-3 imágenes ese costo (pedir todo, comprimir, generar el
   blob) es más lento e incómodo que simplemente bajarlas sueltas. Por eso: selección chica →
   descargas individuales normales; selección grande → un solo .zip. */
var ZIP_THRESHOLD=6;

async function downloadSelection(){
  var ids=Array.from(selectedIds);
  if(!ids.length) return;
  var files=ids.map(function(id){
    return allFiles.find(function(f){ return f.id===id; });
  }).filter(Boolean);
  if(!files.length) return;

  var btn=document.getElementById('sbDownloadBtn');
  var originalLabel=btn.innerHTML;
  btn.disabled=true;
  try{
    var token=await ensureDriveToken();
    if(files.length<ZIP_THRESHOLD){
      for(var i=0;i<files.length;i++){
        btn.textContent=files.length>1?('Descargando '+(i+1)+'/'+files.length+'...'):'Descargando...';
        await downloadOneFile(files[i],token);
      }
    } else {
      await downloadAsZip(files,token,btn);
    }
    clearSelection();
  }catch(e){
    alert('No se pudo completar la descarga: '+e.message);
  }finally{
    btn.disabled=false;
    btn.innerHTML=originalLabel;
  }
}

async function downloadOneFile(file,token){
  var res=await fetch('https://www.googleapis.com/drive/v3/files/'+file.id+'?alt=media',{headers:{Authorization:'Bearer '+token}});
  if(!res.ok) throw new Error('No se pudo descargar '+file.name);
  var blob=await res.blob();
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

async function downloadAsZip(files,token,btn){
  var zip=new JSZip();
  var usedNames={};
  for(var i=0;i<files.length;i++){
    btn.textContent='Preparando zip '+(i+1)+'/'+files.length+'...';
    var f=files[i];
    var res=await fetch('https://www.googleapis.com/drive/v3/files/'+f.id+'?alt=media',{headers:{Authorization:'Bearer '+token}});
    if(!res.ok) throw new Error('No se pudo descargar '+f.name);
    var blob=await res.blob();
    zip.file(uniqueZipName(f.name,usedNames),blob);
  }
  btn.textContent='Comprimiendo...';
  var content=await zip.generateAsync({type:'blob'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(content);
  a.download='imagenes-hslv.zip';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

/* Dos imágenes con el mismo nombre (frecuente si vienen de carpetas distintas) pisarían la
   misma entrada del zip — se numeran para no perder ninguna. */
function uniqueZipName(name,usedNames){
  if(!usedNames[name]){ usedNames[name]=1; return name; }
  var count=usedNames[name]++;
  var dot=name.lastIndexOf('.');
  return dot>0?(name.slice(0,dot)+' ('+count+')'+name.slice(dot)):(name+' ('+count+')');
}

/* Borrador de edición del modal abierto (ver openModal) — descripción y etiquetas se acumulan
   aquí sin tocar el servidor hasta que se presiona "Guardar cambios" (ver saveModalChanges). Se
   descarta si el modal se cierra sin guardar: la próxima vez que se abra, openModal lo vuelve a
   armar desde currentFile (el último estado confirmado por el servidor). */
var modalDraft=null;

/* Vocabulario conocido de etiquetas: todas las que YA existen en el banco (globalTagsCache,
   alimentado por tags_summary — ver loadGlobalTags) más las de allFiles (carpeta/búsqueda
   actual) por si el resumen global todavía no cargó — alimenta el selector "+ Agregar etiqueta"
   y la sugerencia automática desde la descripción. Antes arrancaba de una lista fija (TAG_SEED)
   escrita a mano en el código; se quitó para no ofrecer etiquetas que nadie ha usado nunca. */
function knownTagsSet(){
  var set={};
  (globalTagsCache||[]).forEach(function(t){set[t.tag]=true;});
  allFiles.forEach(function(f){(f.tags||[]).forEach(function(t){set[t]=true;});});
  return set;
}

/* Píldoras de etiquetas del borrador (m-tag-pills) — se construyen con el DOM en vez de innerHTML
   con texto interpolado porque el texto de una etiqueta lo escribe comunicaciones libremente y
   no debe tratarse como HTML. */
function renderTagPills(){
  var wrap=document.getElementById('mTagPills'); wrap.innerHTML='';
  modalDraft.tags.forEach(function(t){
    var pill=document.createElement('span'); pill.className='tag-pill';
    var label=document.createElement('span'); label.textContent=t;
    pill.appendChild(label);
    if(isAdmin){
      var btn=document.createElement('button'); btn.type='button'; btn.className='tag-pill-x';
      btn.setAttribute('aria-label','Quitar etiqueta '+t);
      btn.innerHTML='<svg viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
      btn.onclick=function(){removeDraftTag(t);};
      pill.appendChild(btn);
    }
    wrap.appendChild(pill);
  });
}

/* Selector "+ Agregar etiqueta" (mTagSelect) — solo ofrece etiquetas que ya existen en otra
   imagen y que todavía no están en el borrador actual. */
function renderTagSelect(){
  var sel=document.getElementById('mTagSelect');
  var current=modalDraft.tags.map(function(t){return t.toLowerCase();});
  var known=Object.keys(knownTagsSet()).filter(function(t){return current.indexOf(t.toLowerCase())<0;}).sort();
  sel.innerHTML='<option value="">+ Agregar etiqueta</option>'+
    known.map(function(t){return '<option value="'+escHtml(t)+'">'+escHtml(t)+'</option>';}).join('');
}

/* Sugerencias automáticas: si el texto de la descripción menciona una etiqueta ya usada en otra
   imagen (vocabulario conocido, ver knownTagsSet) y todavía no está en el borrador, aparece como
   píldora sugerida — un clic la agrega al borrador, nunca se agrega sola. Además pinta las
   sugerencias de IA acumuladas en modalDraft.aiTags (ver generateTagSuggestions), con el ícono
   de chispa para distinguirlas — mismo comportamiento de "un clic agrega, nunca solas". */
function renderTagSuggestions(){
  var row=document.getElementById('mTagSuggestRow'); row.innerHTML='';
  var current=modalDraft.tags.map(function(t){return t.toLowerCase();});
  var text=(modalDraft.description||'').toLowerCase();
  if(text){
    Object.keys(knownTagsSet()).forEach(function(t){
      if(current.indexOf(t.toLowerCase())>-1) return;
      if(text.indexOf(t.toLowerCase())<0) return;
      var chip=document.createElement('button');
      chip.type='button'; chip.className='tag-pill-add';
      chip.textContent='+ '+t;
      chip.onclick=function(){addDraftTag(t);};
      row.appendChild(chip);
    });
  }
  (modalDraft.aiTags||[]).forEach(function(t){
    if(current.indexOf(t.toLowerCase())>-1) return;
    var chip=document.createElement('button');
    chip.type='button'; chip.className='tag-pill-add ai';
    chip.innerHTML=ICONS.sparkles+'<span></span>';
    chip.querySelector('span').textContent='+ '+t;
    chip.onclick=function(){addDraftTag(t);};
    row.appendChild(chip);
  });
}

/* Muestra/oculta el botón "Generar etiquetas" (sin tocar isAdmin/viewer-role, que ya lo oculta
   aparte para perfiles no admin — ver CSS). Solo tiene sentido mostrarlo si hay descripción para
   generar a partir de ella. Se esconde justo después de generar con éxito para no invitar a
   regenerar sobre el mismo texto, y vuelve a aparecer en cuanto la descripción cambia (ver
   handleDescInput), porque ahí las sugerencias ya no corresponden al texto actual. */
function updateGenTagsBtnVisibility(){
  var btn=document.getElementById('mGenTagsBtn');
  if(btn) btn.style.display=(modalDraft.description||'').trim()?'':'none';
}

function handleDescInput(){
  if(!isAdmin) return;
  modalDraft.description=document.getElementById('mDescInput').value;
  // Las píldoras de IA generadas antes se dejan visibles a propósito (por si el usuario las
  // quiere igual, aunque ya no correspondan palabra por palabra al texto nuevo) — nunca se
  // guardan solas, así que no hay riesgo en mantenerlas a la vista. Lo único que cambia es que
  // el botón vuelve a aparecer para poder regenerar sobre la descripción ya editada.
  updateGenTagsBtnVisibility();
  // Limpia el mensaje de la generación anterior ("Etiquetas generadas correctamente.", etc.) —
  // ya no corresponde a la descripción que se está escribiendo ahora.
  var genStatus=document.getElementById('mGenTagsStatus');
  genStatus.className='m-desc-status';
  genStatus.textContent='';
  renderTagSuggestions();
}

/* Llama a Gemini vía la Edge Function catalogo (POST ?suggest_tags=1) con el texto actual de la
   descripción — dispara solo con este botón, nunca automático al guardar (pedido explícito del
   usuario). El resultado se acumula en modalDraft.aiTags y se pinta como píldoras sugeridas
   (ver renderTagSuggestions); un clic las agrega al borrador, "Guardar cambios" es lo único que
   las persiste de verdad. Mientras genera, el botón queda bloqueado; si termina bien, se oculta
   hasta que se vuelva a tocar la descripción (ver handleDescInput) — si falla, se deja visible
   para reintentar. El botón ya no puede dispararse sin descripción (ver
   updateGenTagsBtnVisibility, que lo oculta si el campo está vacío), así que acá ya no hace
   falta ese chequeo. */
/* Cada generación toma un número; cerrar el modal o abrir otra imagen (cancelTagGeneration) lo
   invalida, y la respuesta tardía de Gemini se descarta en vez de pintarse sobre otra imagen. La
   petición a Gemini no se puede abortar en el servidor, solo se ignora su resultado. */
var genSeq=0;
var genBusy=false;
function setGenLock(on){
  genBusy=on;
  var dm=document.getElementById('detailModal'); if(dm) dm.classList.toggle('gen-busy',on);
  ['mGenTagsBtn','mDescInput','mSaveBtn'].forEach(function(id){ var el=document.getElementById(id); if(el) el.disabled=on; });
}
function cancelTagGeneration(){
  genSeq++; setGenLock(false);
  var st=document.getElementById('mGenTagsStatus');
  if(st){ st.className='m-desc-status'; st.textContent=''; }
}
async function generateTagSuggestions(){
  if(!isAdmin) return;
  var desc=(modalDraft.description||'').trim();
  if(!desc) return;
  // file/draft: se capturan ahora porque el modal se reutiliza para todas las imágenes — si el
  // usuario cierra este modal y abre otra imagen antes de que responda Gemini, la respuesta
  // tardía no debe pisar el borrador de la imagen nueva (mismo criterio que saveModalChanges).
  var file=currentFile;
  var draft=modalDraft;
  // Estado propio (mGenTagsStatus), separado del de "Guardar cambios" (mDescStatus) — antes
  // compartían el mismo texto en el footer y un mensaje pisaba al otro.
  var status=document.getElementById('mGenTagsStatus');
  var btn=document.getElementById('mGenTagsBtn');
  // Mientras Gemini responde se bloquean también la descripción y "Guardar cambios": si se editara
  // o guardara en ese lapso, las etiquetas sugeridas ya no corresponderían al texto guardado.
  var mySeq=++genSeq;
  setGenLock(true);
  status.className='m-desc-status';
  status.textContent='Generando etiquetas...';
  try{
    var res=await fetch(CONFIG.SUPABASE_FUNCTION_URL+'?suggest_tags=1',{
      method:'POST',
      headers:{Authorization:'Bearer '+supabaseToken,'Content-Type':'application/json'},
      body:JSON.stringify({description:desc}),
    });
    var data=await res.json();
    if(!res.ok) throw new Error(data.error||'No se pudo generar etiquetas.');
    if(mySeq!==genSeq) return;
    draft.aiTags=data.tags||[];
    renderTagSuggestions();
    status.className='m-desc-status';
    status.textContent=draft.aiTags.length?'Etiquetas generadas correctamente.':'No se encontraron etiquetas nuevas para sugerir';
    btn.style.display='none';
  }catch(e){
    if(mySeq!==genSeq) return;
    status.className='m-desc-status err';
    status.textContent=e.message;
  }finally{
    if(mySeq===genSeq) setGenLock(false);
  }
}

/* Botón "+ Agregar" junto al input de etiqueta nueva — aparece solo mientras hay texto sin
   confirmar (ver handleTagInputTyping), para que no haya que adivinar que Enter también agrega.
   Mismo destino final que presionar Enter (ver handleTagInputKey): addDraftTag(). */
function handleTagInputTyping(){
  var input=document.getElementById('mTagInput');
  var btn=document.getElementById('mTagAddBtn');
  btn.style.display=input.value.trim()?'':'none';
}

function addTagFromInput(){
  if(!isAdmin) return;
  var input=document.getElementById('mTagInput');
  var val=input.value.trim();
  if(!val) return;
  input.value='';
  document.getElementById('mTagAddBtn').style.display='none';
  addDraftTag(val);
}

function handleTagInputKey(e){
  if(!isAdmin) return;
  if(e.key!=='Enter') return;
  e.preventDefault();
  addTagFromInput();
}

/* Agrega una etiqueta al borrador local (desde el selector, el texto libre o una sugerencia) —
   no toca el servidor, eso ocurre recién al presionar "Guardar cambios" (ver saveModalChanges). */
function addDraftTag(tag){
  if(!isAdmin) return;
  if(modalDraft.tags.some(function(t){return t.toLowerCase()===tag.toLowerCase();})) return;
  modalDraft.tags.push(tag);
  renderTagPills();
  renderTagSelect();
  renderTagSuggestions();
}

function removeDraftTag(tag){
  if(!isAdmin) return;
  modalDraft.tags=modalDraft.tags.filter(function(t){return t!==tag;});
  renderTagPills();
  renderTagSelect();
  renderTagSuggestions();
}

async function openModal(id){
  cancelTagGeneration();
  currentFile=allFiles.find(function(f){return f.id===id;});
  if(!currentFile) return;
  var wrap=document.getElementById('modalImgInner');
  wrap.innerHTML='<div class="loader"><div class="spinner"></div></div>';
  document.getElementById('mTitle').textContent=currentFile.name;
  modalDraft={description:currentFile.description||'', tags:(currentFile.tags||[]).slice(), aiTags:[]};
  updateGenTagsBtnVisibility();
  renderTagPills();
  renderTagSelect();
  renderTagSuggestions();
  document.getElementById('mType').textContent=(currentFile.mimeType||'').replace('image/','').toUpperCase();
  document.getElementById('mSize').textContent=formatSize(currentFile.size);
  document.getElementById('mDate').textContent=formatDate(currentFile.modifiedTime);
  var lnk=document.getElementById('mLink');
  lnk.href=currentFile.webViewLink||'#';
  document.getElementById('mDescInput').value=currentFile.description||'';
  document.getElementById('mDescInput').readOnly=!isAdmin;
  document.getElementById('mTagInput').value='';
  document.getElementById('mTagAddBtn').style.display='none';
  var descStatus=document.getElementById('mDescStatus');
  descStatus.className='m-desc-status';
  descStatus.textContent='';
  var genStatus=document.getElementById('mGenTagsStatus');
  genStatus.className='m-desc-status';
  genStatus.textContent='';
  document.getElementById('detailModal').classList.add('open');

  try{
    var token=await ensureDriveToken();
    var res=await fetch('https://www.googleapis.com/drive/v3/files/'+currentFile.id+'?alt=media',{headers:{Authorization:'Bearer '+token}});
    if(!res.ok) throw new Error();
    var blob=await res.blob();
    wrap.innerHTML='<img src="'+URL.createObjectURL(blob)+'" alt="'+escHtml(currentFile.name)+'" style="width:100%;height:100%;object-fit:contain">';
  }catch(e){
    wrap.innerHTML='<span class="ph-lg">'+ICONS.images+'</span>';
  }
}

/* Mientras Gemini genera etiquetas no se puede cerrar el modal (✕, Escape ni clic fuera): la petición
   ya está en curso y cerrar desperdiciaría su costo. Se desbloquea sola al terminar. */
function closeModal(){
  if(genBusy) return;
  cancelTagGeneration();
  document.getElementById('detailModal').classList.remove('open');
}
function closeModalBg(e){if(e.target.id==='detailModal') closeModal();}

/* Guarda descripción + etiquetas del borrador en un solo PATCH a la Edge Function catalogo.
   Repinta el modal y la tarjeta de la grilla sin recargar imagen ni reconstruir el grid. */
async function saveModalChanges(){
  if(!isAdmin) return;
  if(!currentFile||!modalDraft) return;
  var file=currentFile;
  var draft=modalDraft;
  var btn=document.getElementById('mSaveBtn');
  var status=document.getElementById('mDescStatus');
  btn.disabled=true;
  status.className='m-desc-status';
  status.textContent='Guardando...';
  try{
    var res=await fetch(CONFIG.SUPABASE_FUNCTION_URL+'?image_id='+encodeURIComponent(file.id),{
      method:'PATCH',
      headers:{Authorization:'Bearer '+supabaseToken,'Content-Type':'application/json'},
      body:JSON.stringify({description:draft.description,tags:draft.tags}),
    });
    var data=await res.json();
    if(!res.ok) throw new Error(data.error||('HTTP '+res.status));

    file.description=data.description||'';
    file.tags=data.tags||draft.tags;

    if(currentFile===file){
      modalDraft={description:file.description, tags:file.tags.slice(), aiTags:[]};
      renderTagPills();
      renderTagSelect();
      renderTagSuggestions();
    }
    refreshCardTags(file);
    globalTagsCache=null; // se recalcula la próxima vez que se vea la nube global (ver loadGlobalTags)
    buildStats(); buildSidebar(); buildTags();

    status.className='m-desc-status';
    status.textContent='Cambios guardados';
  }catch(e){
    status.className='m-desc-status err';
    status.textContent='No se pudo guardar: '+e.message;
  }finally{
    btn.disabled=false;
  }
}

function openInDrive(){if(currentFile&&currentFile.webViewLink) window.open(currentFile.webViewLink,'_blank');}
function downloadFile(){
  if(!currentFile) return;
  var url=currentFile.webContentLink||'https://drive.google.com/uc?export=download&id='+currentFile.id;
  window.open(url,'_blank');
}
/* Modos de vista tipo explorador: iconos pequeños/medianos/grandes (s|m|xl) o lista (l).
   viewMode sigue siendo 'g' (cuadrícula) o 'l' (lista); el tamaño vive en una clase del body
   (sz-s/sz-m/sz-xl) que css/styles.css traduce a --tile-min, escalada con el ancho de la
   ventana para que en pantallas ultra anchas no queden miniaturas diminutas. Se recuerda
   en localStorage. */
var VIEW_KEY='bancoVista';
function applyView(v){
  if(['xxl','xl','m','s','l'].indexOf(v)<0) v='m';
  viewMode=v==='l'?'l':'g';
  document.body.classList.remove('sz-s','sz-m','sz-xl','sz-xxl');
  if(v!=='l') document.body.classList.add('sz-'+v);
  document.querySelectorAll('#viewPop .vitem[data-v]').forEach(function(el){
    var on=el.getAttribute('data-v')===v;
    el.setAttribute('aria-checked',on?'true':'false');
    el.classList.toggle('active',on);
  });
}
function toggleViewMenu(ev,force){
  if(ev) ev.stopPropagation();
  var pop=document.getElementById('viewPop'), btn=document.getElementById('viewBtn');
  var open=force!==undefined?force:pop.style.display==='none';
  pop.style.display=open?'block':'none';
  btn.setAttribute('aria-expanded',open?'true':'false');
}
document.addEventListener('click',function(e){
  if(!e.target.closest('#viewMenu')) toggleViewMenu(null,false);
});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape') toggleViewMenu(null,false);
});
function setView(v){
  applyView(v);
  try{ localStorage.setItem(VIEW_KEY,v); }catch(e){}
  toggleViewMenu(null,false);
  filterImages();
}
/* Escala proporcional a la pantalla: TODA la interfaz (cabecera, buscador, barra lateral,
   botones, tarjetas, login) se agranda con CSS zoom según el tamaño de la ventana respecto a
   una pantalla de referencia de 1440x810 — el mismo % de pantalla en cualquier monitor, así
   nada se ve pequeño en pantallas grandes. Nunca achica (mínimo 100%), tope 250%; en móvil
   (<=600px) no aplica. Se recalcula al redimensionar. login.html usa la misma fórmula. */
function applyAutoFit(){
  var z=1;
  if(window.innerWidth>600){
    z=Math.min(window.innerWidth/1440,window.innerHeight/810);
    z=Math.round(Math.max(1,Math.min(z,2.5))*20)/20;
  }
  document.documentElement.style.zoom=z===1?'':String(z);
  document.documentElement.style.setProperty('--ui-zoom',String(z));
}
(function(){
  applyAutoFit();
  var t=null;
  window.addEventListener('resize',function(){ clearTimeout(t); t=setTimeout(applyAutoFit,120); });
})();
(function(){
  var v='m';
  try{ v=localStorage.getItem(VIEW_KEY)||'m'; }catch(e){}
  applyView(v);
})();

/* ── SESIÓN DE LA APP (Supabase Auth, login.html) ────
   La app entera vive detrás de una sesión de Supabase — si no hay una, se redirige a
   login.html. onAuthStateChange mantiene supabaseToken al día cuando Supabase renueva el
   token en segundo plano, y saca a la persona a login.html si la sesión termina (logout o
   expiración sin renovación posible). authInitialized evita desbloquear/cargar la app dos
   veces (getSession() inicial + el primer evento de onAuthStateChange). */
function handleSession(session){
  if(!session){
    window.location.replace('login.html');
    return;
  }
  supabaseToken=session.access_token;
  userEmail=session.user.email;
  if(!authInitialized){
    authInitialized=true;
    unlockApp();
    loadUserRole();
    loadFromDrive();
  }
}

/* Consulta una sola vez, al iniciar sesión, si la cuenta es admin — decide si el modal muestra
   los controles de edición de descripción/etiquetas o solo los deja en modo lectura (ver
   applyRoleUI y openModal). Si algo falla, se asume el perfil más restrictivo (viewer). */
async function loadUserRole(){
  try{
    var data=await fetchCatalogo('whoami=1');
    userRole=data.role||'viewer';
  }catch(e){
    userRole='viewer';
  }
  isAdmin=userRole==='admin';
  applyRoleUI();
}

function applyRoleUI(){
  document.body.classList.toggle('viewer-role', !isAdmin);
  var descInput=document.getElementById('mDescInput');
  if(descInput) descInput.readOnly=!isAdmin;
  var uaBtn=document.getElementById('btnUserAdmin');
  if(uaBtn) uaBtn.style.display=isAdmin?'flex':'none';
}

/* ── ADMINISTRAR USUARIOS (solo admin) ── Edge Function admin-users, ver su comentario de
   contrato en supabase/functions/admin-users/index.ts. userRoleLabel/currentUsers se mantienen
   acá porque la lista se re-renderiza entera tras cada cambio (crear/editar rol/borrar), mismo
   patrón simple que el resto del modal de detalle. */
var currentUsers=[];
var ROLE_LABELS={admin:'Administrador',viewer:'Usuario'};

/* Mismo par de íconos que login.html (ojo abierto/tachado) para mostrar/ocultar la contraseña
   que el admin escribe al crear un usuario — el campo es type="password" por defecto (se ve en
   '*') para que no quede a la vista de quien pase detrás. */
function toggleUaPwdVisibility(){
  var input=document.getElementById('uaPassword');
  var btn=document.getElementById('uaPwdToggle');
  var showing=input.type==='text';
  input.type=showing?'password':'text';
  btn.innerHTML=showing
    ?'<svg viewBox="0 0 24 24"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>'
    :'<svg viewBox="0 0 24 24"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>';
  btn.setAttribute('aria-label',showing?'Mostrar contraseña':'Ocultar contraseña');
}

function openUserAdmin(){
  if(!isAdmin) return;
  document.getElementById('userAdminModal').classList.add('open');
  document.getElementById('uaAlert').innerHTML='';
  document.getElementById('uaEmail').value='';
  var pwdInput=document.getElementById('uaPassword');
  pwdInput.value='';
  if(pwdInput.type==='text') toggleUaPwdVisibility(); // vuelve a '*' si había quedado visible de una vez anterior
  document.getElementById('uaRole').value='viewer';
  loadUserAdminList();
}
function closeUserAdmin(){document.getElementById('userAdminModal').classList.remove('open');}
function closeUserAdminBg(e){if(e.target.id==='userAdminModal') closeUserAdmin();}

function uaShowAlert(msg){
  document.getElementById('uaAlert').innerHTML='<div class="error-box">'+escHtml(msg)+'</div>';
}

async function loadUserAdminList(){
  var list=document.getElementById('uaList');
  list.innerHTML='<div class="ua-empty">Cargando...</div>';
  try{
    var res=await fetch(CONFIG.ADMIN_USERS_FUNCTION_URL,{headers:{Authorization:'Bearer '+supabaseToken}});
    var data=await res.json();
    if(!res.ok) throw new Error(data.error||'No se pudo cargar la lista de usuarios.');
    currentUsers=data.users||[];
    renderUserAdminList();
  }catch(e){
    list.innerHTML='';
    uaShowAlert(e.message);
  }
}

function renderUserAdminList(){
  var list=document.getElementById('uaList');
  if(!currentUsers.length){ list.innerHTML='<div class="ua-empty">No hay usuarios todavía.</div>'; return; }
  list.innerHTML='';
  currentUsers.forEach(function(u){
    var row=document.createElement('div'); row.className='ua-row';

    var email=document.createElement('span'); email.className='ua-email';
    email.textContent=u.email; email.title=u.email;
    row.appendChild(email);

    var sel=document.createElement('select');
    sel.setAttribute('aria-label','Rol de '+u.email);
    Object.keys(ROLE_LABELS).forEach(function(r){
      var opt=document.createElement('option'); opt.value=r; opt.textContent=ROLE_LABELS[r];
      if(r===u.role) opt.selected=true;
      sel.appendChild(opt);
    });
    sel.onchange=function(){ changeUserRole(u.id,sel.value,sel); };
    row.appendChild(sel);

    var reset=document.createElement('button');
    reset.type='button'; reset.className='ua-reset'; reset.setAttribute('aria-label','Restablecer contraseña de '+u.email);
    reset.title='Restablecer contraseña';
    reset.innerHTML='<svg viewBox="0 0 24 24"><circle cx="12" cy="16" r="1"/><rect x="3" y="10" width="18" height="12" rx="2"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/></svg>';
    reset.onclick=function(){ resetUserPassword(u.id,u.email); };
    row.appendChild(reset);

    var del=document.createElement('button');
    del.type='button'; del.className='ua-del'; del.setAttribute('aria-label','Eliminar '+u.email);
    del.innerHTML='<svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
    del.onclick=function(){ deleteUserAdmin(u.id,u.email); };
    row.appendChild(del);

    list.appendChild(row);
  });
}

async function changeUserRole(userId,role,selEl){
  document.getElementById('uaAlert').innerHTML='';
  selEl.disabled=true;
  try{
    var res=await fetch(CONFIG.ADMIN_USERS_FUNCTION_URL+'?user_id='+encodeURIComponent(userId),{
      method:'PATCH',
      headers:{Authorization:'Bearer '+supabaseToken,'Content-Type':'application/json'},
      body:JSON.stringify({role:role}),
    });
    var data=await res.json();
    if(!res.ok) throw new Error(data.error||'No se pudo cambiar el rol.');
    var u=currentUsers.find(function(x){return x.id===userId;});
    if(u) u.role=role;
  }catch(e){
    uaShowAlert(e.message);
    loadUserAdminList(); // revierte el <select> a lo que de verdad quedó guardado
  }finally{
    selEl.disabled=false;
  }
}

/* No hay flujo de "olvidé mi contraseña" (sin SMTP configurado en el proyecto, ver comentario
   de contrato en admin-users/index.ts) — este botón es el reemplazo: un admin pone una
   contraseña nueva a mano y se la pasa a la persona. prompt() nativo (sin máscara), mismo nivel
   de simplicidad que el confirm() de deleteUserAdmin, ya que solo lo usa un admin. */
async function resetUserPassword(userId,email){
  var pwd=prompt('Nueva contraseña para '+email+' (mínimo 6 caracteres):');
  if(pwd===null) return;
  if(pwd.length<6){ uaShowAlert('La contraseña debe tener al menos 6 caracteres.'); return; }
  document.getElementById('uaAlert').innerHTML='';
  try{
    var res=await fetch(CONFIG.ADMIN_USERS_FUNCTION_URL+'?user_id='+encodeURIComponent(userId),{
      method:'PATCH',
      headers:{Authorization:'Bearer '+supabaseToken,'Content-Type':'application/json'},
      body:JSON.stringify({password:pwd}),
    });
    var data=await res.json();
    if(!res.ok) throw new Error(data.error||'No se pudo restablecer la contraseña.');
    alert('Contraseña actualizada para '+email+'.');
  }catch(e){
    uaShowAlert(e.message);
  }
}

async function deleteUserAdmin(userId,email){
  if(!confirm('¿Eliminar la cuenta de '+email+'? Esta acción no se puede deshacer.')) return;
  document.getElementById('uaAlert').innerHTML='';
  try{
    var res=await fetch(CONFIG.ADMIN_USERS_FUNCTION_URL+'?user_id='+encodeURIComponent(userId),{
      method:'DELETE',
      headers:{Authorization:'Bearer '+supabaseToken},
    });
    var data=await res.json().catch(function(){return{};});
    if(!res.ok) throw new Error(data.error||'No se pudo eliminar el usuario.');
    currentUsers=currentUsers.filter(function(x){return x.id!==userId;});
    renderUserAdminList();
  }catch(e){
    uaShowAlert(e.message);
  }
}

async function createUserAdmin(){
  var email=document.getElementById('uaEmail').value.trim();
  var password=document.getElementById('uaPassword').value;
  var role=document.getElementById('uaRole').value;
  var status=document.getElementById('uaCreateStatus');
  var btn=document.getElementById('uaCreateBtn');
  document.getElementById('uaAlert').innerHTML='';

  if(!email||!email.includes('@')){ uaShowAlert('Ingresa un correo válido.'); return; }
  if(password.length<6){ uaShowAlert('La contraseña debe tener al menos 6 caracteres.'); return; }

  btn.disabled=true;
  status.className='m-desc-status'; status.textContent='Creando...';
  try{
    var res=await fetch(CONFIG.ADMIN_USERS_FUNCTION_URL,{
      method:'POST',
      headers:{Authorization:'Bearer '+supabaseToken,'Content-Type':'application/json'},
      body:JSON.stringify({email:email,password:password,role:role}),
    });
    var data=await res.json();
    if(!res.ok) throw new Error(data.error||'No se pudo crear el usuario.');
    currentUsers.push(data);
    renderUserAdminList();
    document.getElementById('uaEmail').value='';
    document.getElementById('uaPassword').value='';
    document.getElementById('uaRole').value='viewer';
    status.className='m-desc-status';
    status.textContent='Usuario creado.';
  }catch(e){
    status.textContent='';
    uaShowAlert(e.message);
  }finally{
    btn.disabled=false;
  }
}

async function bootstrapAuth(){
  var mod=await import('https://esm.sh/@supabase/supabase-js@2');
  supabase=mod.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_PUBLISHABLE_KEY);
  supabase.auth.onAuthStateChange(function(_event, session){ handleSession(session); });
  var res=await supabase.auth.getSession();
  handleSession(res.data.session);
}

/* Confirmación antes de cerrar sesión (evita cierres por clic accidental). Escape también cancela. */
function openLogoutConfirm(){
  document.getElementById('logoutModal').classList.add('open');
  document.getElementById('logoutConfirmBtn').focus();
}
function closeLogoutConfirm(){
  document.getElementById('logoutModal').classList.remove('open');
}
document.addEventListener('keydown',function(e){
  if(e.key!=='Escape') return;
  /* Cierra solo el modal de más arriba: confirmación de cierre > administrar usuarios > detalle de imagen. */
  if(document.getElementById('logoutModal').classList.contains('open')) closeLogoutConfirm();
  else if(document.getElementById('userAdminModal').classList.contains('open')) closeUserAdmin();
  else if(document.getElementById('detailModal').classList.contains('open')) closeModal();
});

async function signOut(){
  // OJO: no se llama a google.accounts.oauth2.revoke() aquí a propósito — revocaría el grant
  // completo en Google (incluido el refresh_token guardado en drive_grants), obligando a
  // repetir el popup de consentimiento en el próximo login. Cerrar sesión de la app y revocar
  // el acceso a Drive son cosas distintas; esta última solo debería pasar si la persona la
  // revoca ella misma desde su cuenta de Google.
  driveToken=null;
  driveTokenExpiresAt=0;
  if(supabase) await supabase.auth.signOut();
  window.location.replace('login.html');
}

function unlockApp(){
  document.getElementById('appShell').style.display='flex';
}

/* ── TOKEN DE DRIVE (Google, anclado por usuario) ────
   Solo se pide cuando openModal()/etc. realmente necesitan bytes de una imagen desde Drive —
   no al iniciar sesión. A diferencia de un token de acceso normal de Google (~1h de vida y sin
   forma de renovarlo sin el usuario), aquí se usa el flujo de "código de autorización"
   (initCodeClient) para que la Edge Function drive-auth pueda canjearlo por un refresh_token y
   guardarlo por usuario en Supabase (tabla drive_grants) — así, en visitas futuras (aunque se
   borre caché/sessionStorage o se cierre el navegador), la app le pide a drive-auth un
   access_token nuevo EN SILENCIO, sin mostrar ningún popup, mientras la persona no revoque el
   acceso desde su cuenta de Google. driveTokenExpiresAt solo evita pedir uno nuevo en cada
   clic dentro de la misma pestaña mientras el actual siga vigente. */
var driveTokenExpiresAt=0;

async function driveAuthCall(body){
  var res=await fetch(CONFIG.DRIVE_AUTH_FUNCTION_URL,{
    method:'POST',
    headers:{Authorization:'Bearer '+supabaseToken,'Content-Type':'application/json'},
    body:JSON.stringify(body),
  });
  var data=await res.json();
  if(!res.ok){ var err=new Error(data.error||('HTTP '+res.status)); err.status=res.status; throw err; }
  return data;
}

function applyDriveTokens(data){
  driveToken=data.access_token;
  driveTokenExpiresAt=Date.now()+((data.expires_in||3500)*1000)-60000;
  return driveToken;
}

function initDriveCodeClient(){
  if(!window.google||!google.accounts||!google.accounts.oauth2||driveCodeClient) return;
  driveCodeClient=google.accounts.oauth2.initCodeClient({
    client_id:CONFIG.CLIENT_ID,
    scope:DRIVE_SCOPE,
    ux_mode:'popup',
    callback:function(){}, // se reemplaza en cada llamada, ver requestDriveGrant
  });
}

/* Flujo interactivo (popup de Google) — solo se llega aquí si todavía no hay ningún
   refresh_token guardado para este usuario, o si Google lo rechazó (revocado). */
function requestDriveGrant(){
  return new Promise(function(resolve, reject){
    if(!driveCodeClient) initDriveCodeClient();
    if(!driveCodeClient){
      reject(new Error('La librería de Google no cargó. Revisa tu conexión e intenta de nuevo.'));
      return;
    }
    // Si el navegador bloquea el popup (p.ej. no detecta el clic como gesto directo del
    // usuario), GIS nunca llama al callback y la promesa quedaría esperando para siempre —
    // este timeout garantiza que el error se muestre en vez de dejar un spinner infinito.
    var settled=false;
    var timeout=setTimeout(function(){
      if(settled) return;
      settled=true;
      reject(new Error('No se pudo abrir la ventana de acceso a Google. Revisa que tu navegador no esté bloqueando ventanas emergentes e inténtalo de nuevo.'));
    }, 20000);
    driveCodeClient.callback=function(resp){
      if(settled) return;
      settled=true;
      clearTimeout(timeout);
      if(resp.error){ reject(new Error(resp.error)); return; }
      driveAuthCall({action:'exchange', code:resp.code}).then(function(data){
        resolve(applyDriveTokens(data));
      }).catch(reject);
    };
    driveCodeClient.requestCode();
  });
}

function ensureDriveToken(){
  if(driveToken && Date.now()<driveTokenExpiresAt) return Promise.resolve(driveToken);
  return driveAuthCall({action:'refresh'})
    .then(applyDriveTokens)
    .catch(function(e){
      // 404 = todavía no hay refresh_token guardado (o se revocó) → toca el popup, una vez.
      // Cualquier otro error (red, Supabase caído) se deja subir tal cual.
      if(e.status===404) return requestDriveGrant();
      throw e;
    });
}

/* ── CATÁLOGO (Edge Function "catalogo" de Supabase) ─
   El navegador ya no llama a googleapis.com/drive para navegar/buscar — todo pasa por la
   Edge Function, que lee el catálogo espejado en Supabase (sincronizado en segundo plano por
   apps-script/sync-drive-a-supabase.gs) y valida la sesión de Supabase Auth de quien pregunta
   (y su perfil en la tabla profiles). Ver supabase/functions/catalogo/index.ts para el
   contrato exacto. openModal() sigue yendo directo a Drive con un token de Google aparte
   (ver ensureDriveToken) — eso no cambia. */
/* Cada navegación (abrir carpeta o lanzar una búsqueda) toma un número nuevo; las respuestas
   que llegan tarde de una navegación anterior se descartan en vez de pintar tarjetas viejas
   encima de la vista actual (p. ej. al volver a Inicio quedaban imágenes de una búsqueda). */
var navToken=0;
async function fetchCatalogo(params){
  var url=CONFIG.SUPABASE_FUNCTION_URL+'?'+params;
  var res=await fetch(url,{headers:{Authorization:'Bearer '+supabaseToken}});
  var data=await res.json();
  if(!res.ok){
    var err=new Error(data.error||('HTTP '+res.status));
    if(res.status===401) err.code=401;
    throw err;
  }
  return data;
}

function toFileEntry(f){
  return Object.assign({},f,{tags:f.tags||[],description:f.description||''});
}

/* Navegación tipo explorador de archivos: cada carpeta se carga solo al entrar en ella
   (una sola llamada a la Edge Function), no se recorre todo el árbol por adelantado. */
async function openFolder(fid, pushHistory){
  searchMode=false;
  var myTok=++navToken;
  /* activeTag es un filtro de la búsqueda global (ver runSearch) — si sigue activo al entrar a
     una carpeta, esa carpeta se muestra ya filtrada por una etiqueta que el usuario nunca pidió
     ahí, y sigue "pegada" al volver más tarde a esa misma carpeta. Cada carpeta debe abrirse sin
     filtros heredados de una búsqueda anterior. */
  activeTag=null;
  folderId=fid;
  syncUrl(fid, pushHistory);
  var grid=document.getElementById('imageGrid');
  document.getElementById('toolbar').style.display='flex';
  document.getElementById('searchInput').disabled=false;
  showLoader('Cargando carpeta...');
  buildBreadcrumb(); updateSearchClear();
  try{
    var data=await fetchCatalogo('folder_id='+encodeURIComponent(fid));
    if(myTok!==navToken) return;
    currentFolders=(data.folders||[])
      .map(function(f){return {id:f.id,name:f.name,owner:f.owner,modifiedTime:f.modifiedTime};})
      .sort(function(a,b){return a.name.localeCompare(b.name);});
    allFiles=(data.files||[]).map(function(f){return toFileEntry(f);});
    filterImages(); buildStats(); buildSidebar(); buildTags();
    document.getElementById('alertBox').innerHTML='';
  } catch(e){
    if(myTok!==navToken) return;
    handleDriveError(e, grid);
  }
}

function enterFolder(fid){
  var fo=currentFolders.find(function(x){return x.id===fid;});
  breadcrumb.push({id:fid,name:fo?fo.name:'Carpeta'});
  openFolder(fid, true);
}

/* Banda de navegación: ← Atrás / → Adelante (historial real, como el navegador) + ruta de
   carpetas (jerarquía) con Inicio. Son dos cosas distintas a propósito: las flechas vuelven a
   donde estabas (incluida una búsqueda), la ruta salta a una carpeta ancestro. En pantallas
   angostas los tramos intermedios se abrevian a "…" (clases .mid / .ell en styles.css). */
var NAV_HOME_ICON='<svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/></svg>';
function navBack(){ if(navPos>0) history.back(); }
function navForward(){ if(navPos<navMax) history.forward(); }
function buildBreadcrumb(){
  var bar=document.getElementById('breadcrumbBar');
  var n=breadcrumb.length;
  var sm=searchMode, total=n+(sm?1:0);
  bar.innerHTML=breadcrumb.map(function(b,i){
    var isLast=!sm&&i===n-1;
    var mid=(i>0&&!isLast)?' mid':'';
    var label=i===0?NAV_HOME_ICON+'<span>Inicio</span>':escHtml(b.name);
    var out=(i>0?'<span class="sep'+mid+'">/</span>':'')+
      '<span class="crumb'+(isLast?' current':'')+mid+'"'+(isLast?' aria-current="page"':' onclick="goToBreadcrumb('+i+')"')+'>'+label+'</span>';
    if(i===0&&total>2) out+='<span class="sep ell">/</span><span class="crumb ell" title="Carpetas intermedias">…</span>';
    return out;
  }).join('')+(sm?'<span class="sep">/</span><span class="crumb current" aria-current="page">Resultados de «'+escHtml(searchQuery)+'» en todo el banco</span>':'');
  document.getElementById('navBack').disabled=navPos<=0;
  document.getElementById('navFwd').disabled=navPos>=navMax;
  document.getElementById('navBand').style.display='flex';
}

/* URL compartible: refleja la carpeta actual en ?folder= para poder copiar el enlace y para
   que, si alguien lo abre directo, loadFromDrive() pueda reconstruir el breadcrumb hasta ahí. */
/* pushHistory=true crea una entrada nueva en el historial (navegación "hacia adelante": entrar
   a una carpeta o saltar por el breadcrumb) para que el botón Atrás del navegador la deshaga
   paso a paso en vez de sacar a la persona de la app entera (ver popstate más abajo). Los demás
   casos (carga inicial, restaurar tras Atrás) solo reemplazan la URL actual. */
function syncUrl(fid, pushHistory){
  var url=new URL(location.href);
  if(fid && fid!==CONFIG.FOLDER_ID) url.searchParams.set('folder', fid);
  else url.searchParams.delete('folder');
  url.searchParams.delete('q'); url.searchParams.delete('tag');
  if(pushHistory){ navPos++; navMax=navPos; history.pushState({n:navPos}, '', url.toString()); }
  else history.replaceState({n:navPos}, '', url.toString());
}

/* Reacciona al botón Atrás/Adelante del navegador restaurando la carpeta que corresponde a la
   URL a la que se volvió, en vez de dejar que el navegador simplemente abandone la app (que es
   lo que pasaba antes: solo se usaba replaceState, así que no había entradas de historial propias
   de la app y Atrás caía directo a la página previa a haberla abierto). */
window.addEventListener('popstate', function(){
  navPos=(history.state&&typeof history.state.n==='number')?history.state.n:0;
  if(!authInitialized) return;
  var sp=new URLSearchParams(location.search);
  document.getElementById('searchInput').value=sp.get('q')||'';
  activeTag=sp.get('tag')||null;
  updateSearchClear();
  handlePopState();
});

/* Tras resolver la carpeta de la URL: si la entrada de historial era una búsqueda (?q= / ?tag=),
   se vuelve a ejecutar sin crear otra entrada; si no, se abre la carpeta normal. */
async function openFolderOrSearch(target){
  if(document.getElementById('searchInput').value.trim()||activeTag){
    folderId=target; buildBreadcrumb();
    document.getElementById('toolbar').style.display='flex';
    await runSearch(true);
  } else await openFolder(target);
}

async function handlePopState(){
  var target=new URLSearchParams(location.search).get('folder')||CONFIG.FOLDER_ID;
  if(target===CONFIG.FOLDER_ID){
    breadcrumb=[{id:CONFIG.FOLDER_ID,name:'Banco de Imágenes'}];
    await openFolderOrSearch(target);
    return;
  }
  try{
    var chain=await resolveBreadcrumbForFolder(target);
    breadcrumb=chain||[{id:CONFIG.FOLDER_ID,name:'Banco de Imágenes'}];
  }catch(e){
    if(e.code===401){
      if(supabase) supabase.auth.signOut();
      window.location.replace('login.html?expired=1');
      return;
    }
    breadcrumb=[{id:CONFIG.FOLDER_ID,name:'Banco de Imágenes'}];
  }
  await openFolderOrSearch(target);
}

function goToBreadcrumb(idx){
  breadcrumb=breadcrumb.slice(0, idx+1);
  document.getElementById('searchInput').value='';
  updateSearchClear();
  openFolder(breadcrumb[idx].id, true);
}

function handleDriveError(e, grid){
  if(e.code===401){
    if(supabase) supabase.auth.signOut();
    window.location.replace('login.html?expired=1');
    return;
  }
  grid.innerHTML='';
  document.getElementById('toolbar').style.display='none';
  document.getElementById('statsBar').style.display='none';
  document.getElementById('alertBox').innerHTML='<div class="error-box"><span class="ib-icon">'+ICONS.triangleAlert+'</span><div><strong>Error al conectar:</strong> '+e.message+'</div></div>';
}

/* ── BÚSQUEDA GLOBAL ──────────────────────────────────
   La Edge Function busca por nombre en drive_images (ilike) con paginación real (.range()) —
   ya no hace falta recorrer el árbol de carpetas en el navegador. Se dispara con un pequeño
   debounce para no lanzar una consulta en cada tecla. */
var searchQuery='', searchOffset=0, searchTotal=0, searchFetching=false;

function scheduleSearch(){
  updateSearchClear();
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer=setTimeout(function(){runSearch();}, 500);
}

function updateSearchClear(){
  var has=!!document.getElementById('searchInput').value||searchMode;
  document.getElementById('searchClear').style.display=has?'flex':'none';
}

/* Una búsqueda es una entrada propia del historial (state.s): la primera búsqueda hace push,
   las siguientes teclas solo reemplazan ?q=. Así Atrás / ✕ / Esc salen de la búsqueda y vuelven
   exactamente a la carpeta donde estabas (antes solo se podía borrando el texto). */
function syncSearchUrl(q){
  var url=new URL(location.href);
  if(q) url.searchParams.set('q', q); else url.searchParams.delete('q');
  if(activeTag) url.searchParams.set('tag', activeTag); else url.searchParams.delete('tag');
  if(history.state&&history.state.s) history.replaceState({n:navPos,s:1}, '', url.toString());
  else { navPos++; navMax=navPos; history.pushState({n:navPos,s:1}, '', url.toString()); }
}

/* Salir de la búsqueda: si la entrada actual la creamos nosotros, Atrás real (restaura carpeta
   y deja el Adelante disponible); si no, se reabre la carpeta actual. */
function clearSearch(focus){
  clearTimeout(searchDebounceTimer);
  var inp=document.getElementById('searchInput');
  inp.value=''; activeTag=null;
  if(history.state&&history.state.s) history.back();
  else if(searchMode) openFolder(breadcrumb[breadcrumb.length-1].id);
  updateSearchClear();
  if(focus) inp.focus();
}

document.getElementById('searchInput').addEventListener('keydown', function(e){
  if(e.key==='Escape'&&(this.value||searchMode)){ e.preventDefault(); clearSearch(); }
});

async function fetchSearchPage(tok){
  var data=await fetchCatalogo('q='+encodeURIComponent(searchQuery)+'&offset='+searchOffset+'&limit='+PAGE_SIZE);
  if(tok!==navToken) return false;
  var newFiles=(data.files||[]).map(function(f){return toFileEntry(f);});
  allFiles=allFiles.concat(newFiles);
  searchOffset+=newFiles.length;
  searchTotal=data.total||0;
  return true;
}

/* Una píldora de etiqueta activa cuenta como criterio de búsqueda global igual que el texto:
   sin esto, tocar una píldora solo filtraba dentro de la carpeta abierta en vez de buscar en
   todo el banco (ver buildTags, que llama a runSearch en vez de filterImages al hacer clic). */
function pillFiltersActive(){
  return !!activeTag;
}

async function runSearch(fromHistory){
  var q=document.getElementById('searchInput').value.trim();
  if(!q && !pillFiltersActive()){
    if(searchMode) clearSearch();
    else filterImages();
    return;
  }
  if(fromHistory!==true) syncSearchUrl(q);
  searchMode=true;
  var myTok=++navToken;
  /* Si no hay texto escrito pero sí una etiqueta activa, esa etiqueta ES el término que se manda
     al servidor (matchea contra tags_text vía ilike en handleSearch) — antes se mandaba q=''
     (ilike '%%', trae los últimos 60 de TODO el banco sin importar la etiqueta) y una imagen
     etiquetada que no estuviera entre esas 60 más recientes nunca aparecía. matchTag en
     matchesFilters sigue aplicándose después para descartar coincidencias sueltas del ilike
     (p.ej. la etiqueta apareciendo en una descripción en vez de en tags). */
  searchQuery=q||activeTag||''; searchOffset=0; searchTotal=0; allFiles=[]; currentFolders=[];
  buildBreadcrumb(); updateSearchClear();
  var grid=document.getElementById('imageGrid');
  showLoader('Buscando...');
  try{
    searchFetching=true;
    var ok=await fetchSearchPage(myTok);
    searchFetching=false;
    if(!ok) return;
    filterImages();
    /* El ilike de tags_text es más permisivo que la etiqueta exacta (puede traer coincidencias
       en descripción/ruta que matchTag descarta después), así que la página ordenada por fecha
       más reciente puede no traer ningún resultado real aunque sí existan más adelante. Sin este
       bucle había que esperar a que el usuario scrolleara hasta el fondo para que
       gridSentinelObserver pidiera la próxima página — y si la carpeta/búsqueda entera cabía en
       una sola pantalla, el sentinel nunca dejaba de estar visible, así que ese scroll jamás
       disparaba un nuevo evento de intersección y la búsqueda se quedaba en "no encontrado" para
       siempre. Acá se seguen pidiendo páginas de una vez hasta encontrar alguna coincidencia real
       o agotar el total que ya reportó el servidor. */
    while(activeTag && filteredAll.length===0 && allFiles.length<searchTotal){
      searchFetching=true;
      ok=await fetchSearchPage(myTok);
      searchFetching=false;
      if(!ok) return;
      filterImages();
    }
    buildStats(); buildSidebar(); buildTags();
  } catch(e){
    searchFetching=false;
    if(myTok!==navToken) return;
    handleDriveError(e, grid);
  }
}

/* Scroll infinito en modo búsqueda: cuando se agota el buffer ya cargado (filteredAll) y
   todavía hay más coincidencias en el servidor (allFiles.length<searchTotal), pide la
   siguiente página y agrega solo los ítems nuevos que pasan el filtro activo — sin
   reconstruir el grid entero (eso perdería las miniaturas ya cargadas y saltaría el scroll). */
async function growSearchResults(){
  if(searchFetching||allFiles.length>=searchTotal) return;
  searchFetching=true;
  var q=document.getElementById('searchInput').value.toLowerCase();
  var prevLen=allFiles.length;
  var myTok=navToken;
  try{
    var ok=await fetchSearchPage(myTok);
  }catch(e){
    searchFetching=false;
    return; // error de red al paginar: el usuario puede reintentar scrolleando de nuevo
  }
  searchFetching=false;
  if(!ok||!searchMode) return; // la persona ya salió de la búsqueda: no pintar resultados viejos
  var newMatches=allFiles.slice(prevLen).filter(function(f){return matchesFilters(f,q);});
  if(newMatches.length){ filteredAll=filteredAll.concat(newMatches); loadMoreCards(); }
  buildStats(); buildSidebar();
}

/* Sube por parent_id en drive_folders (vía la Edge Function) hasta la raíz del banco y arma
   el breadcrumb completo en el camino — reemplaza el recorrido por "parents" de Drive. Si
   nunca llega a la raíz (la carpeta del link está fuera del banco) devuelve null y quien llama
   decide el fallback. */
async function resolveBreadcrumbForFolder(targetId){
  var data=await fetchCatalogo('breadcrumb_for='+encodeURIComponent(targetId));
  var chain=data.chain||[];
  if(!chain.length||chain[0].id!==CONFIG.FOLDER_ID) return null;
  chain[0].name='Banco de Imágenes';
  return chain;
}

/* Oculta el splash de index (si estaba visible); tope de seguridad de 15 s por si la carga se cuelga. */
function hideSplash(){
  var sp=document.getElementById('splash');
  if(sp) sp.classList.remove('show');
}
setTimeout(hideSplash,15000);

async function loadFromDrive(){
  try{ await loadFromDriveInner(); }finally{ hideSplash(); }
}

async function loadFromDriveInner(){
  var target=new URLSearchParams(location.search).get('folder');
  if(target&&target!==CONFIG.FOLDER_ID){
    try{
      var chain=await resolveBreadcrumbForFolder(target);
      if(chain){
        breadcrumb=chain;
        await openFolder(target);
        return;
      }
      document.getElementById('alertBox').innerHTML='<div class="error-box"><span class="ib-icon">'+ICONS.triangleAlert+'</span> El enlace apunta a una carpeta fuera del banco de imágenes. Se cargó la carpeta raíz.</div>';
    }catch(e){
      if(e.code===401){
        if(supabase) supabase.auth.signOut();
        window.location.replace('login.html?expired=1');
        return;
      }
      document.getElementById('alertBox').innerHTML='<div class="error-box"><span class="ib-icon">'+ICONS.triangleAlert+'</span> No se pudo abrir la carpeta del enlace ('+e.message+'). Se cargó la carpeta raíz.</div>';
    }
  }
  breadcrumb=[{id:CONFIG.FOLDER_ID,name:'Banco de Imágenes'}];
  await openFolder(CONFIG.FOLDER_ID);
}

/* ── INICIO ───────────────────────────────────────── */
buildSidebar(); buildTags();
gridSentinelObserver.observe(document.getElementById('gridSentinel'));
bootstrapAuth();
