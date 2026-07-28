-- Profile data for Supabase Auth users. Password hashing is handled by
-- Supabase Auth (auth.users) -- this table only holds full_name/phone.
--
-- RLS is enabled (scoped to auth.uid() = id) by the later
-- 20260728190724_profiles_rls.sql migration.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  phone       text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'Extra profile fields for auth.users.';
