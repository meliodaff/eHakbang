create table if not exists public.application_queue (
  id             uuid primary key default gen_random_uuid(),
  journey_id     text not null,
  step_number    int not null,
  event_id       text,
  agency_name    text not null,
  step_title     text not null,
  field_answers  jsonb not null default '{}'::jsonb,
  status         text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at     timestamptz not null default now(),
  accepted_at    timestamptz,
  constraint application_queue_journey_step_uq unique (journey_id, step_number)
);

comment on table public.application_queue is
  'Per-step Auto Apply submission queue. One row per (journey_id, step_number); pending applications await an agency result before they can be accepted.';
comment on column public.application_queue.field_answers is
  'Citizen-supplied RequiredField answers (lib/types.ts) for this step at submission time. Snapshot only, not synced back to journey_requirements or localStorage.';

alter table public.application_queue enable row level security;
-- No policies: only the server-side service-role client reads/writes this table
-- (service role bypasses RLS by design, matching journey_requirements' convention).
