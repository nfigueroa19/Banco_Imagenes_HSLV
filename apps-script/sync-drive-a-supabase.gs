/* ══════════════════════════════════════════════════
   SYNC DRIVE → SUPABASE — Banco de Imágenes HSLV
   ══════════════════════════════════════════════════
   Corre dentro del Drive del hospital (proyecto de Apps Script en script.google.com).
   Recorre el árbol completo desde CONFIG.FOLDER_ID y hace upsert de carpetas/imágenes
   a las tablas drive_folders/drive_images de Supabase. Al final borra las filas que
   quedaron con synced_at viejo (archivo/carpeta borrado o movido en Drive).

   Usa el servicio avanzado "Drive API" (no el servicio básico DriveApp): DriveApp no expone
   el campo thumbnailLink real de la API v3, solo un link de la UI de Drive que requiere sesión
   iniciada — inválido para pedirlo desde un proxy anónimo como images.weserv.nl (daba 404).
   Con el servicio avanzado se trae por carpeta (no por archivo), igual de rápido que antes.

   Setup:
   1. Pegar este archivo en un proyecto nuevo de script.google.com.
   2. Habilitar el servicio avanzado: panel izquierdo → "Servicios" (ícono +) → buscar
      "Drive API" → Añadir. (Debe quedar como identificador "Drive" en el código, ya
      referenciado abajo como Drive.Files.*)
   3. Ejecutar setup() una vez (o "sync" manualmente) para autorizar los permisos.
   4. En Configuración del proyecto → Propiedades del script, agregar:
        SUPABASE_URL              = https://<project-ref>.supabase.co
        SUPABASE_SERVICE_ROLE_KEY = <service_role key, NUNCA la publishable/anon>
   5. Correr sync() una vez manualmente y confirmar en el Table Editor de Supabase
      que aparecen filas en drive_folders/drive_images con thumbnail_link tipo
      https://lh3.googleusercontent.com/... (no drive.google.com/thumbnail).
   6. Crear el trigger de tiempo (una sola vez, manual): Triggers (ícono de reloj en el
      panel izquierdo) → Add Trigger → función "sync" → Time-driven → Minutes timer →
      Every 5 minutes.
   ══════════════════════════════════════════════════ */

var CONFIG = {
  FOLDER_ID: '14dBvsP4SU8qNdIJvjYrzx_FR_oWVyYb7', // misma carpeta raíz que CONFIG.FOLDER_ID en js/app.js
};

var FOLDER_MIME = 'application/vnd.google-apps.folder';
var IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff'];
var LIST_FIELDS = 'nextPageToken,files(id,name,mimeType,thumbnailLink,webViewLink,webContentLink,size,modifiedTime,owners(displayName))';
var UPSERT_BATCH_SIZE = 200;

function getProps_() {
  var props = PropertiesService.getScriptProperties();
  var url = props.getProperty('SUPABASE_URL');
  var key = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    throw new Error('Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en Propiedades del script.');
  }
  return { url: url, key: key };
}

/* Upsert genérico vía REST de Supabase (PostgREST). on_conflict=id + Prefer merge-duplicates
   hace que una fila existente se actualice en vez de fallar por PK duplicada. */
function upsertRows_(table, rows) {
  if (!rows.length) return;
  var props = getProps_();
  for (var i = 0; i < rows.length; i += UPSERT_BATCH_SIZE) {
    var batch = rows.slice(i, i + UPSERT_BATCH_SIZE);
    var res = UrlFetchApp.fetch(props.url + '/rest/v1/' + table + '?on_conflict=id', {
      method: 'post',
      contentType: 'application/json',
      headers: {
        apikey: props.key,
        Authorization: 'Bearer ' + props.key,
        Prefer: 'resolution=merge-duplicates',
      },
      payload: JSON.stringify(batch),
      muteHttpExceptions: true,
    });
    var code = res.getResponseCode();
    if (code >= 300) {
      throw new Error('Upsert a ' + table + ' falló (HTTP ' + code + '): ' + res.getContentText());
    }
  }
}

/* Borra de Supabase las filas que no se tocaron en esta corrida (synced_at distinto al
   de "ahora") — son carpetas/archivos que ya no existen o se movieron fuera del árbol. */
function deleteStale_(table, syncedAtIso) {
  var props = getProps_();
  var url = props.url + '/rest/v1/' + table + '?synced_at=neq.' + encodeURIComponent(syncedAtIso);
  var res = UrlFetchApp.fetch(url, {
    method: 'delete',
    headers: {
      apikey: props.key,
      Authorization: 'Bearer ' + props.key,
    },
    muteHttpExceptions: true,
  });
  var code = res.getResponseCode();
  if (code >= 300) {
    throw new Error('Borrado de filas viejas en ' + table + ' falló (HTTP ' + code + '): ' + res.getContentText());
  }
}

/* Una sola llamada Drive.Files.list por carpeta (paginada) — igual patrón que listChildren()
   usaba antes en el navegador, pero corriendo del lado del servidor sin límite de 600. */
function listChildren_(parentId) {
  var q = "'" + parentId + "' in parents and trashed=false";
  var out = [], pageToken = null;
  do {
    var res = Drive.Files.list({ q: q, fields: LIST_FIELDS, pageSize: 1000, pageToken: pageToken });
    out = out.concat(res.files || []);
    pageToken = res.nextPageToken || null;
  } while (pageToken);
  return out;
}

/* Punto de entrada del trigger de tiempo. */
function sync() {
  var syncedAt = new Date().toISOString();
  var root = Drive.Files.get(CONFIG.FOLDER_ID, { fields: 'id,name,owners(displayName),modifiedTime' });

  var folderRows = [{
    id: CONFIG.FOLDER_ID,
    parent_id: null,
    name: root.name,
    owner_name: (root.owners && root.owners[0] && root.owners[0].displayName) || null,
    modified_time: root.modifiedTime,
    path: [],
    synced_at: syncedAt,
  }];
  var imageRows = [];

  walkFolder_(CONFIG.FOLDER_ID, CONFIG.FOLDER_ID, [], syncedAt, folderRows, imageRows);

  upsertRows_('drive_folders', folderRows);
  upsertRows_('drive_images', imageRows);
  deleteStale_('drive_images', syncedAt);
  deleteStale_('drive_folders', syncedAt);

  Logger.log('Sync OK: ' + folderRows.length + ' carpetas, ' + imageRows.length + ' imágenes.');
}

/* Recorrido recursivo: por cada carpeta, una llamada a listChildren_ trae subcarpetas +
   imágenes con su thumbnailLink real de la API v3. */
function walkFolder_(folderId, parentId, path, syncedAt, folderRows, imageRows) {
  var children = listChildren_(folderId);
  children.forEach(function (f) {
    if (f.mimeType === FOLDER_MIME) {
      var subPath = path.concat([f.name]);
      folderRows.push({
        id: f.id,
        parent_id: parentId,
        name: f.name,
        owner_name: (f.owners && f.owners[0] && f.owners[0].displayName) || null,
        modified_time: f.modifiedTime,
        path: path,
        synced_at: syncedAt,
      });
      walkFolder_(f.id, f.id, subPath, syncedAt, folderRows, imageRows);
    } else if (IMAGE_MIMES.indexOf(f.mimeType) > -1) {
      imageRows.push({
        id: f.id,
        folder_id: parentId,
        name: f.name,
        mime_type: f.mimeType,
        thumbnail_link: f.thumbnailLink || null,
        web_view_link: f.webViewLink || null,
        web_content_link: f.webContentLink || ('https://drive.google.com/uc?export=download&id=' + f.id),
        size: f.size || null,
        modified_time: f.modifiedTime,
        path: path,
        synced_at: syncedAt,
      });
    }
  });
}

/* Corré esto una vez a mano para forzar la pantalla de autorización de permisos de Drive
   antes de crear el trigger de tiempo. */
function setup() {
  sync();
}
