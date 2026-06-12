-- Add account roles for owner/admin verified badges.

alter table public.profiles
add column if not exists account_role text not null default 'user';

alter table public.profiles
drop constraint if exists profiles_account_role_check;

alter table public.profiles
add constraint profiles_account_role_check
check (account_role in ('user', 'admin', 'owner'));
