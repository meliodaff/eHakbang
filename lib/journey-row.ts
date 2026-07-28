import type { Journey } from "./types";

/**
 * Shape of a row in the Supabase `journeys` table (per-user journey
 * instances) and the Journey<->row mapping, shared between the browser sync
 * layer (`lib/journey-sync.ts`) and server-side lookups
 * (`lib/server/stored-journeys.ts`) so both stay in lockstep with the schema.
 * Deliberately has no "use client"/"server-only" pragma -- these are pure
 * functions safe to import from either environment.
 */
export interface JourneyRow {
  id: string;
  user_id: string;
  event_id: string | null;
  emoji: string;
  life_event: string;
  summary: string;
  language: string;
  status: string;
  total_steps: number;
  record_updates: number;
  benefit_claims: number;
  steps: Journey["steps"];
  completed_step_numbers: number[];
  paid_step_numbers: number[];
  field_answers: Journey["field_answers"];
  auto_applied_step_numbers: number[];
  claimed_step_numbers: number[];
  submitted_step_numbers: number[];
  created_at: string;
  completed_at: string | null;
  updated_at: string;
}

export function journeyToRow(journey: Journey, userId: string): JourneyRow {
  return {
    id: journey.id,
    user_id: userId,
    event_id: journey.event_id ?? null,
    emoji: journey.emoji,
    life_event: journey.life_event,
    summary: journey.summary,
    language: journey.language,
    status: journey.status,
    total_steps: journey.total_steps,
    record_updates: journey.record_updates,
    benefit_claims: journey.benefit_claims,
    steps: journey.steps,
    completed_step_numbers: journey.completed_step_numbers,
    paid_step_numbers: journey.paid_step_numbers,
    field_answers: journey.field_answers,
    auto_applied_step_numbers: journey.auto_applied_step_numbers,
    claimed_step_numbers: journey.claimed_step_numbers,
    submitted_step_numbers: journey.submitted_step_numbers ?? [],
    created_at: journey.created_at,
    completed_at: journey.completed_at,
    updated_at: new Date().toISOString(),
  };
}

export function rowToJourney(row: JourneyRow): Journey {
  return {
    id: row.id,
    event_id: row.event_id ?? undefined,
    emoji: row.emoji,
    life_event: row.life_event,
    summary: row.summary,
    total_steps: row.total_steps,
    record_updates: row.record_updates,
    benefit_claims: row.benefit_claims,
    steps: row.steps,
    status: row.status as Journey["status"],
    language: row.language as Journey["language"],
    created_at: row.created_at,
    completed_at: row.completed_at,
    completed_step_numbers: row.completed_step_numbers,
    paid_step_numbers: row.paid_step_numbers,
    field_answers: row.field_answers,
    auto_applied_step_numbers: row.auto_applied_step_numbers,
    claimed_step_numbers: row.claimed_step_numbers,
    submitted_step_numbers: row.submitted_step_numbers,
  };
}
