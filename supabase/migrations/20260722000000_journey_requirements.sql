-- Cached AI-generated (OpenAI Responses API + web_search) journey requirements,
-- one row per (event_id, language). Staleness is checked by the app against
-- updated_at (24h) on read -- there is no cron job.
create table if not exists public.journey_requirements (
  id               uuid primary key default gen_random_uuid(),
  event_id         text not null,
  language         text not null check (language in ('en', 'fil')),
  emoji            text not null,
  life_event       text not null,
  summary          text not null,
  steps            jsonb not null default '[]'::jsonb,
  total_steps      int not null default 0,
  record_updates   int not null default 0,
  benefit_claims   int not null default 0,
  model            text not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint journey_requirements_event_lang_uq unique (event_id, language)
);

comment on table public.journey_requirements is
  'Cached AI-generated (OpenAI Responses API + web_search) requirements per life-event id + language. One row per (event_id, language); staleness checked by the app against updated_at (24h) -- no cron.';
comment on column public.journey_requirements.steps is
  'JourneyStep[] (lib/types.ts), including the optional fee field. Whole array replaced on each regeneration.';

alter table public.journey_requirements enable row level security;
-- No policies: only the server-side service-role client (app/api/journey and
-- Server Components) reads/writes this table; service role bypasses RLS by
-- design. No anon/authenticated access.
