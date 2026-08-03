-- Allow admins to deactivate users without deleting accounts.

alter table public.profiles
  add column if not exists is_active boolean not null default true;

comment on column public.profiles.is_active is 'When false, the user cannot sign in or use the app';

create index if not exists profiles_is_active_idx
  on public.profiles (is_active);
