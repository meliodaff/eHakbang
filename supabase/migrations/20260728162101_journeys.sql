create table if not exists public.journeys (
  id                         text primary key,
  user_id                    uuid not null references auth.users(id) on delete cascade,
  event_id                   text,
  emoji                      text not null,
  life_event                 text not null,
  summary                    text not null,
  language                   text not null default 'en' check (language in ('en', 'fil')),
  status                     text not null default 'active' check (status in ('active', 'completed', 'archived')),
  total_steps                int not null default 0,
  record_updates             int not null default 0,
  benefit_claims             int not null default 0,
  steps                      jsonb not null default '[]'::jsonb,
  completed_step_numbers     jsonb not null default '[]'::jsonb,
  paid_step_numbers          jsonb not null default '[]'::jsonb,
  field_answers              jsonb not null default '{}'::jsonb,
  auto_applied_step_numbers  jsonb not null default '[]'::jsonb,
  claimed_step_numbers       jsonb not null default '[]'::jsonb,
  submitted_step_numbers     jsonb not null default '[]'::jsonb,
  created_at                 timestamptz not null default now(),
  completed_at               timestamptz,
  updated_at                 timestamptz not null default now()
);

comment on table public.journeys is 'Per-user journey instances (progress on a started life event) -- distinct from journey_requirements, which is a shared cross-user AI-generation cache. Created client-side via lib/journey-store.ts the moment a citizen starts a journey (preset card or flexible AI text), synced best-effort from the browser using the signed-in session (RLS-scoped).';

create index if not exists journeys_user_id_idx on public.journeys(user_id);

alter table public.journeys enable row level security;

create policy "Users can view their own journeys"
  on public.journeys for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own journeys"
  on public.journeys for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own journeys"
  on public.journeys for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own journeys"
  on public.journeys for delete
  to authenticated
  using (auth.uid() = user_id);
