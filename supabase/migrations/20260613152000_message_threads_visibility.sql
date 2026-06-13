create or replace function public.is_thread_member(thread uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.thread_members tm
    where tm.thread_id = thread
      and tm.user_id = auth.uid()
  );
$$;

revoke all on function public.is_thread_member(uuid) from public;
grant execute on function public.is_thread_member(uuid) to authenticated;

drop policy if exists "thread members see threads" on public.message_threads;
create policy "thread members see threads"
on public.message_threads for select
using (public.is_thread_member(message_threads.id));

drop policy if exists "thread members see members" on public.thread_members;
create policy "thread members see members"
on public.thread_members for select
using (public.is_thread_member(thread_members.thread_id));

drop policy if exists "creators add thread members" on public.thread_members;
create policy "creators add thread members"
on public.thread_members for insert
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.message_threads mt
    where mt.id = thread_members.thread_id
      and mt.created_by = auth.uid()
  )
);

drop policy if exists "members read messages" on public.messages;
create policy "members read messages"
on public.messages for select
using (public.is_thread_member(messages.thread_id));

drop policy if exists "members send messages" on public.messages;
create policy "members send messages"
on public.messages for insert
with check (
  sender_id = auth.uid()
  and public.is_thread_member(messages.thread_id)
);

create or replace function public.touch_message_thread()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.message_threads
  set updated_at = now()
  where id = new.thread_id;

  return new;
end;
$$;

drop trigger if exists messages_touch_thread on public.messages;
create trigger messages_touch_thread
after insert on public.messages
for each row
execute function public.touch_message_thread();
