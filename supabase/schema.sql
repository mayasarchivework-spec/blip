-- Blip backend schema for Supabase.
-- Run this in the Supabase SQL editor.

create extension if not exists "pgcrypto";

do $$
begin
  create type public.accent_color as enum ('blue', 'pink', 'purple', 'teal', 'green', 'orange', 'red');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.post_type as enum ('photo', 'video', 'text', 'song');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.post_aspect_ratio as enum ('square', 'portrait', 'landscape', 'free');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.post_visibility as enum ('friends', 'public');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.friend_request_status as enum ('pending', 'accepted', 'ignored');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.message_type as enum ('text', 'image', 'song', 'note');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9._]{2,30}$'),
  display_name text not null,
  account_role text not null default 'user' check (account_role in ('user', 'admin', 'owner')),
  bio text default '',
  avatar_url text,
  banner_url text,
  accent_color public.accent_color not null default 'blue',
  is_private boolean not null default false,
  allow_explore boolean not null default true,
  profile_line text,
  note text,
  note_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  status public.friend_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (from_user_id <> to_user_id)
);

create unique index if not exists friend_requests_pending_unique
  on public.friend_requests (from_user_id, to_user_id)
  where status = 'pending';

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_low uuid not null references public.profiles(id) on delete cascade,
  user_high uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (user_low < user_high),
  unique (user_low, user_high)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.post_type not null,
  content text not null default '',
  image_url text,
  image_urls jsonb not null default '[]'::jsonb,
  video_url text,
  song_title text,
  artist_name text,
  album_art_url text,
  caption text,
  aspect_ratio public.post_aspect_ratio default 'free',
  is_pinned boolean not null default false,
  visibility public.post_visibility not null default 'friends',
  blips_count integer not null default 0,
  comments_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_have_renderable_payload check (
    case type
      when 'text'::public.post_type then
        nullif(btrim(content), '') is not null
        and lower(btrim(content)) <> 'null'
      when 'photo'::public.post_type then
        nullif(btrim(coalesce(image_url, '')), '') is not null
      when 'video'::public.post_type then
        coalesce(
          nullif(btrim(coalesce(video_url, '')), ''),
          nullif(btrim(coalesce(image_url, '')), '')
        ) is not null
      when 'song'::public.post_type then
        coalesce(
          nullif(btrim(coalesce(song_title, '')), ''),
          nullif(btrim(coalesce(album_art_url, '')), ''),
          nullif(btrim(content), '')
        ) is not null
        and lower(btrim(content)) <> 'null'
      else false
    end
  )
);

create table if not exists public.post_blips (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.instants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.post_type not null,
  content text not null default '',
  media_url text,
  thumbnail_url text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.message_threads (
  id uuid primary key default gen_random_uuid(),
  title text,
  is_group boolean not null default false,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.thread_members (
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  last_read_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  type public.message_type not null default 'text',
  body text not null default '',
  media_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- If these tables were created manually before migrations existed, make sure
-- they have the columns the rest of this schema expects.
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists account_role text not null default 'user';
alter table public.profiles add column if not exists bio text default '';
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists banner_url text;
alter table public.profiles add column if not exists accent_color public.accent_color not null default 'blue';
alter table public.profiles add column if not exists is_private boolean not null default false;
alter table public.profiles add column if not exists allow_explore boolean not null default true;
alter table public.profiles add column if not exists profile_line text;
alter table public.profiles add column if not exists note text;
alter table public.profiles add column if not exists note_expires_at timestamptz;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.profiles drop constraint if exists profiles_account_role_check;
alter table public.profiles
  add constraint profiles_account_role_check
  check (account_role in ('user', 'admin', 'owner'));

alter table public.friend_requests add column if not exists from_user_id uuid references public.profiles(id) on delete cascade;
alter table public.friend_requests add column if not exists to_user_id uuid references public.profiles(id) on delete cascade;
alter table public.friend_requests add column if not exists status public.friend_request_status not null default 'pending';
alter table public.friend_requests add column if not exists created_at timestamptz not null default now();
alter table public.friend_requests add column if not exists responded_at timestamptz;

alter table public.friendships add column if not exists user_low uuid references public.profiles(id) on delete cascade;
alter table public.friendships add column if not exists user_high uuid references public.profiles(id) on delete cascade;
alter table public.friendships add column if not exists created_at timestamptz not null default now();

alter table public.posts add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table public.posts add column if not exists type public.post_type not null default 'text';
alter table public.posts add column if not exists content text not null default '';
alter table public.posts add column if not exists image_url text;
alter table public.posts add column if not exists image_urls jsonb not null default '[]'::jsonb;
alter table public.posts add column if not exists video_url text;
alter table public.posts add column if not exists song_title text;
alter table public.posts add column if not exists artist_name text;
alter table public.posts add column if not exists album_art_url text;
alter table public.posts add column if not exists caption text;
alter table public.posts add column if not exists aspect_ratio public.post_aspect_ratio default 'free';
alter table public.posts add column if not exists is_pinned boolean not null default false;
alter table public.posts add column if not exists visibility public.post_visibility not null default 'friends';
alter table public.posts add column if not exists blips_count integer not null default 0;
alter table public.posts add column if not exists comments_count integer not null default 0;
alter table public.posts add column if not exists created_at timestamptz not null default now();
alter table public.posts add column if not exists updated_at timestamptz not null default now();

alter table public.posts drop constraint if exists posts_image_urls_array_check;
alter table public.posts
  add constraint posts_image_urls_array_check
  check (
    jsonb_typeof(image_urls) = 'array'
    and jsonb_array_length(image_urls) <= 20
  );

alter table public.post_blips add column if not exists post_id uuid references public.posts(id) on delete cascade;
alter table public.post_blips add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table public.post_blips add column if not exists created_at timestamptz not null default now();

alter table public.post_comments add column if not exists post_id uuid references public.posts(id) on delete cascade;
alter table public.post_comments add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table public.post_comments add column if not exists body text not null default '';
alter table public.post_comments add column if not exists created_at timestamptz not null default now();

alter table public.instants add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table public.instants add column if not exists type public.post_type not null default 'text';
alter table public.instants add column if not exists content text not null default '';
alter table public.instants add column if not exists media_url text;
alter table public.instants add column if not exists thumbnail_url text;
alter table public.instants add column if not exists expires_at timestamptz not null default (now() + interval '24 hours');
alter table public.instants add column if not exists created_at timestamptz not null default now();

alter table public.message_threads add column if not exists title text;
alter table public.message_threads add column if not exists is_group boolean not null default false;
alter table public.message_threads add column if not exists created_by uuid references public.profiles(id) on delete cascade;
alter table public.message_threads add column if not exists created_at timestamptz not null default now();
alter table public.message_threads add column if not exists updated_at timestamptz not null default now();

alter table public.thread_members add column if not exists thread_id uuid references public.message_threads(id) on delete cascade;
alter table public.thread_members add column if not exists user_id uuid references public.profiles(id) on delete cascade;
alter table public.thread_members add column if not exists role text not null default 'member';
alter table public.thread_members add column if not exists last_read_at timestamptz;
alter table public.thread_members add column if not exists joined_at timestamptz not null default now();

alter table public.messages add column if not exists thread_id uuid references public.message_threads(id) on delete cascade;
alter table public.messages add column if not exists sender_id uuid references public.profiles(id) on delete cascade;
alter table public.messages add column if not exists type public.message_type not null default 'text';
alter table public.messages add column if not exists body text not null default '';
alter table public.messages add column if not exists media_url text;
alter table public.messages add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.messages add column if not exists created_at timestamptz not null default now();

create index if not exists posts_user_created_idx on public.posts (user_id, created_at desc);
create index if not exists posts_public_created_idx on public.posts (visibility, created_at desc);
create index if not exists comments_post_created_idx on public.post_comments (post_id, created_at);
create index if not exists instants_user_expires_idx on public.instants (user_id, expires_at desc);
create index if not exists thread_members_user_idx on public.thread_members (user_id);
create index if not exists messages_thread_created_idx on public.messages (thread_id, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

drop trigger if exists threads_set_updated_at on public.message_threads;
create trigger threads_set_updated_at
before update on public.message_threads
for each row execute function public.set_updated_at();

create or replace function public.are_friends(left_user uuid, right_user uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.friendships f
    where f.user_low = least(left_user, right_user)
      and f.user_high = greatest(left_user, right_user)
  );
$$;

create or replace function public.can_view_user_posts(owner_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select owner_id = auth.uid()
    or public.are_friends(auth.uid(), owner_id)
    or exists (
      select 1
      from public.profiles p
      where p.id = owner_id
        and p.is_private = false
        and p.allow_explore = true
    );
$$;

create or replace function public.can_interact_with(owner_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select owner_id = auth.uid()
    or public.are_friends(auth.uid(), owner_id);
$$;

create or replace function public.can_view_post(post_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.posts p
    where p.id = post_id
      and (
        p.user_id = auth.uid()
        or public.are_friends(auth.uid(), p.user_id)
        or (
          p.visibility = 'public'
          and exists (
            select 1
            from public.profiles owner
            where owner.id = p.user_id
              and owner.is_private = false
              and owner.allow_explore = true
          )
        )
      )
  );
$$;

create or replace function public.accept_friend_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepted' and old.status <> 'accepted' then
    insert into public.friendships (user_low, user_high)
    values (least(new.from_user_id, new.to_user_id), greatest(new.from_user_id, new.to_user_id))
    on conflict (user_low, user_high) do nothing;
    new.responded_at = coalesce(new.responded_at, now());
  elsif new.status in ('ignored', 'accepted') and old.status <> new.status then
    new.responded_at = coalesce(new.responded_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists friend_request_acceptance on public.friend_requests;
create trigger friend_request_acceptance
before update on public.friend_requests
for each row execute function public.accept_friend_request();

create or replace function public.update_post_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'post_blips' then
    if tg_op = 'INSERT' then
      update public.posts set blips_count = blips_count + 1 where id = new.post_id;
      return new;
    elsif tg_op = 'DELETE' then
      update public.posts set blips_count = greatest(0, blips_count - 1) where id = old.post_id;
      return old;
    end if;
  elsif tg_table_name = 'post_comments' then
    if tg_op = 'INSERT' then
      update public.posts set comments_count = comments_count + 1 where id = new.post_id;
      return new;
    elsif tg_op = 'DELETE' then
      update public.posts set comments_count = greatest(0, comments_count - 1) where id = old.post_id;
      return old;
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists post_blips_count_insert on public.post_blips;
create trigger post_blips_count_insert
after insert on public.post_blips
for each row execute function public.update_post_counts();

drop trigger if exists post_blips_count_delete on public.post_blips;
create trigger post_blips_count_delete
after delete on public.post_blips
for each row execute function public.update_post_counts();

drop trigger if exists post_comments_count_insert on public.post_comments;
create trigger post_comments_count_insert
after insert on public.post_comments
for each row execute function public.update_post_counts();

drop trigger if exists post_comments_count_delete on public.post_comments;
create trigger post_comments_count_delete
after delete on public.post_comments
for each row execute function public.update_post_counts();

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

alter table public.profiles enable row level security;
alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;
alter table public.posts enable row level security;
alter table public.post_blips enable row level security;
alter table public.post_comments enable row level security;
alter table public.instants enable row level security;
alter table public.message_threads enable row level security;
alter table public.thread_members enable row level security;
alter table public.messages enable row level security;

drop policy if exists "profiles are visible" on public.profiles;
create policy "profiles are visible"
on public.profiles for select
using (true);

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile"
on public.profiles for insert
with check (id = auth.uid());

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "requests visible to participants" on public.friend_requests;
create policy "requests visible to participants"
on public.friend_requests for select
using (auth.uid() in (from_user_id, to_user_id));

drop policy if exists "users send requests" on public.friend_requests;
create policy "users send requests"
on public.friend_requests for insert
with check (from_user_id = auth.uid() and from_user_id <> to_user_id);

drop policy if exists "recipients answer requests" on public.friend_requests;
create policy "recipients answer requests"
on public.friend_requests for update
using (to_user_id = auth.uid())
with check (to_user_id = auth.uid());

drop policy if exists "friends see friendships" on public.friendships;
create policy "friends see friendships"
on public.friendships for select
using (auth.uid() in (user_low, user_high));

drop policy if exists "posts visible by relationship" on public.posts;
create policy "posts visible by relationship"
on public.posts for select
using (public.can_view_post(id));

drop policy if exists "users create own posts" on public.posts;
create policy "users create own posts"
on public.posts for insert
with check (user_id = auth.uid());

drop policy if exists "users edit own posts" on public.posts;
create policy "users edit own posts"
on public.posts for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "users delete own posts" on public.posts;
create policy "users delete own posts"
on public.posts for delete
using (user_id = auth.uid());

drop policy if exists "visible blips can be read" on public.post_blips;
create policy "visible blips can be read"
on public.post_blips for select
using (public.can_view_post(post_id));

drop policy if exists "friends can blip" on public.post_blips;
create policy "friends can blip"
on public.post_blips for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.posts p
    where p.id = post_id
      and public.can_interact_with(p.user_id)
  )
);

drop policy if exists "users remove own blips" on public.post_blips;
create policy "users remove own blips"
on public.post_blips for delete
using (user_id = auth.uid());

drop policy if exists "visible comments can be read" on public.post_comments;
create policy "visible comments can be read"
on public.post_comments for select
using (public.can_view_post(post_id));

drop policy if exists "friends can comment" on public.post_comments;
create policy "friends can comment"
on public.post_comments for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.posts p
    where p.id = post_id
      and public.can_interact_with(p.user_id)
  )
);

drop policy if exists "users delete own comments" on public.post_comments;
create policy "users delete own comments"
on public.post_comments for delete
using (user_id = auth.uid());

drop policy if exists "instants visible to owner and friends" on public.instants;
create policy "instants visible to owner and friends"
on public.instants for select
using (
  expires_at > now()
  and (user_id = auth.uid() or public.are_friends(auth.uid(), user_id))
);

drop policy if exists "users create own instants" on public.instants;
create policy "users create own instants"
on public.instants for insert
with check (user_id = auth.uid());

drop policy if exists "users manage own instants" on public.instants;
create policy "users manage own instants"
on public.instants for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "users delete own instants" on public.instants;
create policy "users delete own instants"
on public.instants for delete
using (user_id = auth.uid());

drop policy if exists "thread members see threads" on public.message_threads;
create policy "thread members see threads"
on public.message_threads for select
using (
  exists (
    select 1 from public.thread_members tm
    where tm.thread_id = id and tm.user_id = auth.uid()
  )
);

drop policy if exists "users create threads" on public.message_threads;
create policy "users create threads"
on public.message_threads for insert
with check (created_by = auth.uid());

drop policy if exists "thread creators update threads" on public.message_threads;
create policy "thread creators update threads"
on public.message_threads for update
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists "thread members see members" on public.thread_members;
create policy "thread members see members"
on public.thread_members for select
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.thread_members mine
    where mine.thread_id = thread_id and mine.user_id = auth.uid()
  )
);

drop policy if exists "creators add thread members" on public.thread_members;
create policy "creators add thread members"
on public.thread_members for insert
with check (
  user_id = auth.uid()
  or exists (
    select 1 from public.message_threads mt
    where mt.id = thread_id and mt.created_by = auth.uid()
  )
);

drop policy if exists "members leave threads" on public.thread_members;
create policy "members leave threads"
on public.thread_members for delete
using (user_id = auth.uid());

drop policy if exists "members read messages" on public.messages;
create policy "members read messages"
on public.messages for select
using (
  exists (
    select 1 from public.thread_members tm
    where tm.thread_id = messages.thread_id and tm.user_id = auth.uid()
  )
);

drop policy if exists "members send messages" on public.messages;
create policy "members send messages"
on public.messages for insert
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.thread_members tm
    where tm.thread_id = messages.thread_id and tm.user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('posts', 'posts', false),
  ('videos', 'videos', false),
  ('album-art', 'album-art', true)
on conflict (id) do nothing;

drop policy if exists "public avatars are readable" on storage.objects;
create policy "public avatars are readable"
on storage.objects for select
using (bucket_id in ('avatars', 'album-art'));

drop policy if exists "users upload own avatars" on storage.objects;
create policy "users upload own avatars"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "users manage own media" on storage.objects;
create policy "users manage own media"
on storage.objects for all
using (
  bucket_id in ('posts', 'videos', 'album-art')
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id in ('posts', 'videos', 'album-art')
  and auth.uid()::text = (storage.foldername(name))[1]
);
