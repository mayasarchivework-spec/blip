alter table public.profiles
  add column if not exists view_audience text not null default 'friends',
  add column if not exists comment_audience text not null default 'friends';

alter table public.profiles drop constraint if exists profiles_view_audience_check;
alter table public.profiles
  add constraint profiles_view_audience_check
  check (view_audience in ('friends', 'everyone'));

alter table public.profiles drop constraint if exists profiles_comment_audience_check;
alter table public.profiles
  add constraint profiles_comment_audience_check
  check (comment_audience in ('friends', 'everyone', 'none'));

update public.profiles
set view_audience = 'everyone'
where is_private = false
  and allow_explore = true
  and view_audience = 'friends';

update public.posts
set visibility = 'public'
where user_id in (
  select id
  from public.profiles
  where view_audience = 'everyone'
);

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
        and p.view_audience = 'everyone'
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
    or exists (
      select 1
      from public.profiles p
      where p.id = owner_id
        and p.comment_audience <> 'none'
        and (
          public.are_friends(auth.uid(), owner_id)
          or (p.is_private = false and p.comment_audience = 'everyone')
        )
    );
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
    join public.profiles owner on owner.id = p.user_id
    where p.id = post_id
      and (
        p.user_id = auth.uid()
        or public.are_friends(auth.uid(), p.user_id)
        or (
          owner.is_private = false
          and owner.view_audience = 'everyone'
        )
      )
  );
$$;
