-- CardPDF: almacenamiento privado de fotos.
-- Cada usuario solo ve y toca lo que esta bajo su propia carpeta `${uid}/`.

-- Bucket privado. `public = false` es lo que obliga a usar URLs firmadas.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cardpdf-photos',
  'cardpdf-photos',
  false,
  20971520, -- 20 MB
  array['image/jpeg','image/png','image/webp','image/avif','image/heic','image/heif']
)
on conflict (id) do nothing;

-- Las policies se apoyan en que la ruta sea `${auth.uid()}/nombre`.
-- storage.foldername(name) devuelve el arreglo de carpetas; [1] es la primera.

create policy "cardpdf: leer lo propio"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'cardpdf-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "cardpdf: subir a lo propio"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'cardpdf-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "cardpdf: actualizar lo propio"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'cardpdf-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'cardpdf-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "cardpdf: borrar lo propio"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'cardpdf-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
