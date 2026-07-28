-- Enables RLS on public.profiles and scopes it to the owning user, per
-- explicit request -- closes the gap flagged (but deliberately deferred) in
-- 20260728000000_profiles.sql. Client reads already filter by the signed-in
-- user's own id (app/(app)/account, /login, /register), and every write
-- goes through a service-role client that bypasses RLS, so this only closes
-- off the previously-open anon/authenticated access -- no app code changes
-- needed.
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

comment on table public.profiles is
  'Extra profile fields for auth.users. RLS enabled -- select/insert/update scoped to auth.uid() = id.';
