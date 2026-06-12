-- Store Blip notes with an Instagram-style 24 hour expiry.

alter table public.profiles
add column if not exists note text;

alter table public.profiles
add column if not exists note_expires_at timestamptz;

update public.profiles
set note = null,
    note_expires_at = null
where note_expires_at is not null
  and note_expires_at <= now();

create index if not exists profiles_note_expires_idx
on public.profiles (note_expires_at)
where note_expires_at is not null;

create or replace function public.clear_expired_profile_notes()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
  set note = null,
      note_expires_at = null
  where note_expires_at is not null
    and note_expires_at <= now();
$$;

grant execute on function public.clear_expired_profile_notes() to anon, authenticated;
