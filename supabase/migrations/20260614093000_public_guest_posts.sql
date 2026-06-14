update public.profiles
set is_private = false,
    allow_explore = true,
    view_audience = 'everyone'
where account_role in ('admin', 'owner')
   or lower(username) = 'admin';

update public.posts p
set visibility = 'public'
from public.profiles owner
where owner.id = p.user_id
  and owner.is_private = false
  and (
    owner.allow_explore = true
    or owner.view_audience = 'everyone'
    or owner.account_role in ('admin', 'owner')
    or lower(owner.username) = 'admin'
  );

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
          and (
            owner.view_audience = 'everyone'
            or p.visibility = 'public'
          )
        )
      )
  );
$$;
