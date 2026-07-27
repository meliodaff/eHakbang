-- Cosmetic follow-up: journey requirements generation reverted from the eGov
-- AI Assistant API back to OpenAI's Responses API. No schema/behavior change.
comment on table public.journey_requirements is
  'Cached AI-generated (OpenAI Responses API) requirements per life-event id + language. One row per (event_id, language); staleness checked by the app against updated_at (24h) -- no cron.';
