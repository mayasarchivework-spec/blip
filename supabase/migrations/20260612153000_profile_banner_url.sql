-- Persist portrait profile banners in Supabase profiles.

alter table public.profiles
add column if not exists banner_url text;
