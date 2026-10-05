-- NIC images (replaces storage.rules; CONTRACTS C5).
-- Private bucket `nic`, objects at `{uid}/{side}.{ext}`. The owner may
-- upload and read their own; admins may read all. Images only, under 5 MB
-- (enforced by the bucket itself).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('nic', 'nic', false, 5 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy nic_read on storage.objects for select to authenticated
  using (
    bucket_id = 'nic'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or private.is_admin())
  );

create policy nic_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'nic' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Re-uploading a side replaces it (upsert needs update as well as insert).
create policy nic_update on storage.objects for update to authenticated
  using (bucket_id = 'nic' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'nic' and (storage.foldername(name))[1] = (select auth.uid())::text);
