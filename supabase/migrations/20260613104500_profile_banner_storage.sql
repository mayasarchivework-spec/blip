-- Store profile banners as Supabase Storage objects, then keep their public URL
-- in public.profiles.banner_url.

alter table public.profiles
add column if not exists banner_url text;

insert into storage.buckets (id, name, public)
values ('profile-banners', 'profile-banners', true)
on conflict (id) do nothing;

drop policy if exists "public avatars are readable" on storage.objects;
create policy "public avatars are readable"
on storage.objects for select
using (bucket_id in ('avatars', 'profile-banners', 'album-art'));

drop policy if exists "users upload own profile banners" on storage.objects;
create policy "users upload own profile banners"
on storage.objects for insert
with check (
  bucket_id = 'profile-banners'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "users update own profile banners" on storage.objects;
create policy "users update own profile banners"
on storage.objects for update
using (
  bucket_id = 'profile-banners'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'profile-banners'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "users delete own profile banners" on storage.objects;
create policy "users delete own profile banners"
on storage.objects for delete
using (
  bucket_id = 'profile-banners'
  and auth.uid()::text = (storage.foldername(name))[1]
);
