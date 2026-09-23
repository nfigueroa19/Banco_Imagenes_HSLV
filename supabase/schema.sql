-- Banco de Imágenes HSLV — catálogo espejo de Drive en Supabase.
-- Aplicado vía MCP (apply_migration). Referencia local para consulta/versión.

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

create table if not exists drive_folders (
  id text primary key,
  parent_id text,
  name text not null,
  owner_name text,
  modified_time timestamptz,
  path text[] not null default '{}',
  synced_at timestamptz not null default now()
);

create table if not exists drive_images (
  id text primary key,
  folder_id text not null,
  name text not null,
  mime_type text,
  thumbnail_link text,
  web_view_link text,
  web_content_link text,
  size bigint,
  modified_time timestamptz,
  path text[] not null default '{}',
  synced_at timestamptz not null default now(),
  -- description/desc_cats: NO los toca el sync de Drive (apps-script solo hace upsert de las
  -- columnas espejadas de Drive) — los escribe únicamente la Edge Function catalogo vía
  -- PATCH ?image_id=, al presionar "Guardar cambios" en el modal (ver openModal/
  -- saveModalChanges en js/app.js). desc_cats sale de matchear la descripción contra CAT_KW,
  -- igual que detectCatsFromPath pero sobre texto libre en vez de la ruta de carpetas.
  description text,
  desc_cats text[] not null default '{}',
  -- excluded_cats/manual_cats: pensadas para editar categorías a mano desde el modal (quitar con
  -- una 'x', añadir con un selector), pero esa edición manual se descartó en favor de las
  -- etiquetas de vocabulario libre (tags, abajo) — las categorías hoy son solo exhibición (ver
  -- renderModalTags en js/app.js). Se dejan las columnas por si se reactiva esa edición más
  -- adelante; hoy ninguna parte de la UI las llena, así que siempre están en '{}'.
  excluded_cats text[] not null default '{}',
  manual_cats text[] not null default '{}',
  -- Etiquetas de vocabulario libre escritas a mano por comunicaciones (borrador en modalDraft,
  -- se envían recién al presionar "Guardar cambios" — ver saveModalChanges en js/app.js) — a
  -- diferencia de las categorías (CATS, lista cerrada de 8 áreas) no hay lista fija: cualquier
  -- palabra sirve (lugar, evento, personas...) y la nube "Etiquetas" del sidebar
  -- (ver buildTags) se arma contando lo que ya se usó. tags_text existe solo para poder buscar
  -- substrings dentro del array con ilike (ver handleSearch en catalogo) — no puede ser una
  -- columna GENERATED porque array_to_string es STABLE, no IMMUTABLE, en Postgres (depende del
  -- locale), así que se mantiene sincronizada con un trigger BEFORE INSERT/UPDATE en vez de
  -- una expresión de generación.
  tags text[] not null default '{}',
  tags_text text not null default '',
  -- path_text/date_text: mismo motivo que tags_text — PostgREST no puede hacer ilike de
  -- substring sobre un array (path) ni sobre una fecha (modified_time), así que se mantienen
  -- espejadas en texto plano por el mismo trigger. date_text usa nombres de mes en español
  -- fijos (hslv_spanish_month), no el locale de la sesión, para no depender de la configuración
  -- regional del servidor. Ver handleSearch en la Edge Function catalogo.
  path_text text not null default '',
  date_text text not null default ''
);

create or replace function hslv_spanish_month(mm int) returns text as $$
  select (array['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'])[mm];
$$ language sql immutable;

create or replace function drive_images_set_search_text() returns trigger as $$
begin
  new.tags_text := array_to_string(new.tags, ' ');
  new.path_text := array_to_string(new.path, ' ');
  new.date_text := case when new.modified_time is null then ''
    else to_char(new.modified_time, 'DD') || ' ' || hslv_spanish_month(extract(month from new.modified_time)::int) || ' ' || to_char(new.modified_time, 'YYYY') || ' ' || to_char(new.modified_time, 'YYYY-MM-DD')
  end;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_drive_images_search_text on drive_images;
create trigger trg_drive_images_search_text
before insert or update on drive_images
for each row execute function drive_images_set_search_text();

create index if not exists idx_drive_images_folder_id on drive_images (folder_id);
create index if not exists idx_drive_folders_parent_id on drive_folders (parent_id);
create index if not exists idx_drive_images_name_trgm on drive_images using gin (name extensions.gin_trgm_ops);
create index if not exists idx_drive_folders_name_trgm on drive_folders using gin (name extensions.gin_trgm_ops);
-- Búsqueda global por descripción/etiquetas/carpeta/fecha (ver handleSearch en la Edge
-- Function catalogo).
create index if not exists idx_drive_images_description_trgm on drive_images using gin (description extensions.gin_trgm_ops);
create index if not exists idx_drive_images_tags_text_trgm on drive_images using gin (tags_text extensions.gin_trgm_ops);
create index if not exists idx_drive_images_path_text_trgm on drive_images using gin (path_text extensions.gin_trgm_ops);
create index if not exists idx_drive_images_date_text_trgm on drive_images using gin (date_text extensions.gin_trgm_ops);

-- Sin RLS: estas tablas solo las lee la Edge Function con la service_role key
-- (nunca se exponen directo al navegador), que es quien controla el acceso
-- verificando el token OAuth de Google contra la whitelist de correos/dominio.
alter table drive_folders enable row level security;
alter table drive_images enable row level security;
