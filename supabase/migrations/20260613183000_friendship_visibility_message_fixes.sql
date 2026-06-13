insert into public.friendships (user_low, user_high)
select
  least(from_user_id, to_user_id),
  greatest(from_user_id, to_user_id)
from public.friend_requests
where status = 'accepted'
on conflict (user_low, user_high) do nothing;

update public.friend_requests fr
set status = 'accepted',
    responded_at = coalesce(fr.responded_at, now())
where fr.status = 'pending'
  and exists (
    select 1
    from public.friendships f
    where f.user_low = least(fr.from_user_id, fr.to_user_id)
      and f.user_high = greatest(fr.from_user_id, fr.to_user_id)
  );

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
  where is_private = false
    and view_audience = 'everyone'
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

create or replace function public.create_direct_thread(other_user uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  existing_thread_id uuid;
  next_thread_id uuid;
begin
  if current_user_id is null then
    raise exception 'not authenticated';
  end if;

  if other_user is null or other_user = current_user_id then
    raise exception 'choose another Blip user';
  end if;

  if not exists (select 1 from public.profiles p where p.id = other_user) then
    raise exception 'profile not found';
  end if;

  select mt.id
  into existing_thread_id
  from public.message_threads mt
  join public.thread_members mine
    on mine.thread_id = mt.id
    and mine.user_id = current_user_id
  join public.thread_members theirs
    on theirs.thread_id = mt.id
    and theirs.user_id = other_user
  where mt.is_group = false
  limit 1;

  if existing_thread_id is not null then
    return existing_thread_id;
  end if;

  insert into public.message_threads (created_by, is_group, title)
  values (current_user_id, false, null)
  returning id into next_thread_id;

  insert into public.thread_members (thread_id, user_id, role)
  values
    (next_thread_id, current_user_id, 'owner'),
    (next_thread_id, other_user, 'member')
  on conflict (thread_id, user_id) do nothing;

  return next_thread_id;
end;
$$;

revoke all on function public.create_direct_thread(uuid) from public;
grant execute on function public.create_direct_thread(uuid) to authenticated;
