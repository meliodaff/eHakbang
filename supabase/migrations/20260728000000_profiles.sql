-- Profile data for Supabase Auth users. Password hashing is handled by
-- Supabase Auth (auth.users) -- this table only holds full_name/phone.
--
-- SECURITY -- DELIBERATE, TEMPORARY TRADEOFF (do not "fix" without asking):
-- RLS is intentionally NOT enabled yet, per explicit product instruction.
-- Supabase's Data API exposes public-schema tables by default, so this
-- table is fully readable AND writable by anyone holding the project's
-- anon/publishable key until RLS + auth.uid()-scoped policies are added:
--   alter table public.profiles enable row level security;
--   create policy "profiles_select_own" on public.profiles
--     for select using (auth.uid() = id);
--   create policy "profiles_insert_own" on public.profiles
--     for insert with check (auth.uid() = id);
--   create policy "profiles_update_own" on public.profiles
--     for update using (auth.uid() = id) with check (auth.uid() = id);
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  phone       text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'Extra profile fields for auth.users. RLS deliberately NOT enabled yet -- see policies commented above; add before production.';
