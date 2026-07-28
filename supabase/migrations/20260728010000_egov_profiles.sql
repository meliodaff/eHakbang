-- Full citizen profile returned by eGov SSO (/api/partner/sso_authentication),
-- stored in full per product decision. This is SENSITIVE PERSONAL
-- INFORMATION under RA 10173 (national ID, passport, signature, health and
-- family data) -- disclosed in the Terms & Conditions page.
--
-- SECURITY -- DELIBERATE, TEMPORARY TRADEOFF (do not "fix" without asking):
-- RLS is intentionally NOT enabled yet, matching public.profiles. Add before
-- production:
--   alter table public.egov_profiles enable row level security;
--   create policy "egov_profiles_select_own" on public.egov_profiles
--     for select using (auth.uid() = id);
--   create policy "egov_profiles_insert_own" on public.egov_profiles
--     for insert with check (auth.uid() = id);
--   create policy "egov_profiles_update_own" on public.egov_profiles
--     for update using (auth.uid() = id) with check (auth.uid() = id);
create table if not exists public.egov_profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  egov_uniqid           text unique not null,

  first_name            text,
  middle_name           text,
  last_name             text,
  suffix                text,
  gender                text,
  birth_date            date,
  nationality           text,
  mobile                text,
  photo_url             text,

  address               text,
  street                text,
  barangay              text,
  municipality          text,
  region                text,
  province              text,
  country                text,
  country_alpha_2_code  text,
  country_alpha_3_code  text,
  postal                text,
  address_line_2        text,
  barangay_code         text,
  province_code         text,
  municipality_code     text,
  region_code           text,
  country_id            integer,

  signature             text,
  signature_url         text,

  -- Nested sections kept as JSONB rather than enumerated columns: their
  -- internal shape (health data, family details, education, etc.) is
  -- provider-defined and may evolve independently of this schema.
  additional_information jsonb,
  passport                jsonb,
  national_id             jsonb,
  tin_id                  text,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.egov_profiles is
  'Full eGov SSO citizen profile (sensitive personal information under RA 10173). RLS deliberately NOT enabled yet -- see policies commented above; add before production.';
