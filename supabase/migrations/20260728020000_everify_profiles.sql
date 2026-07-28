-- Citizen profile returned by NIDAS eVerify (/api/query), used for the
-- "Verify with National ID" sign-in method. Demographics + a live face
-- match are checked against PhilSys; a matched profile is stored here.
--
-- SECURITY -- DELIBERATE, TEMPORARY TRADEOFF (do not "fix" without asking):
-- RLS is intentionally NOT enabled yet, matching public.profiles and
-- public.egov_profiles. Add before production:
--   alter table public.everify_profiles enable row level security;
--   create policy "everify_profiles_select_own" on public.everify_profiles
--     for select using (auth.uid() = id);
--   create policy "everify_profiles_insert_own" on public.everify_profiles
--     for insert with check (auth.uid() = id);
--   create policy "everify_profiles_update_own" on public.everify_profiles
--     for update using (auth.uid() = id) with check (auth.uid() = id);
create table if not exists public.everify_profiles (
  id                       uuid primary key references auth.users(id) on delete cascade,
  -- eVerify's /api/query response has no stable per-citizen identifier
  -- (only a per-call reference/token) -- mobile_number is used as the
  -- durable identity key instead, since it's present on every match.
  mobile_number            text unique not null,

  full_name                text,
  first_name               text,
  middle_name              text,
  last_name                text,
  suffix                   text,
  gender                   text,
  marital_status           text,
  blood_type               text,
  email                    text,
  birth_date               date,

  full_address             text,
  address_line_1           text,
  address_line_2           text,
  barangay                 text,
  municipality             text,
  province                 text,
  country                  text,
  postal_code              text,

  present_full_address     text,
  present_address_line_1   text,
  present_address_line_2   text,
  present_barangay         text,
  present_municipality     text,
  present_province         text,
  present_country          text,
  present_postal_code      text,

  residency_status         text,
  place_of_birth           text,
  pob_municipality         text,
  pob_province             text,
  pob_country              text,

  face_url                 text,
  last_reference           text,
  tier_level               text,
  result_grade             integer,

  created_at               timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

comment on table public.everify_profiles is
  'Citizen profile from NIDAS eVerify (National ID) matches. RLS deliberately NOT enabled yet -- see policies commented above; add before production.';
