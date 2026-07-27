import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Server-only client for the mocked per-step Auto Apply queue (see
 * supabase/migrations/20260727020000_application_queue.sql). There is no real
 * agency-submission backend, so a queued row is simply flipped from "pending"
 * to "accepted" once enough time has elapsed since it was created -- checked
 * lazily on read, the same staleness-on-read approach `journey-requirements.ts`
 * uses for its 24h cache, rather than a cron/worker.
 */

const ACCEPT_AFTER_MS = 15_000;

export type ApplicationQueueStatus = "pending" | "accepted";

export interface ApplicationQueueState {
  journeyId: string;
  stepNumber: number;
  eventId: string | null;
  agencyName: string;
  stepTitle: string;
  fieldAnswers: Record<string, string>;
  status: ApplicationQueueStatus;
  createdAt: string;
  acceptedAt: string | null;
}

interface ApplicationQueueRow {
  journey_id: string;
  step_number: number;
  event_id: string | null;
  agency_name: string;
  step_title: string;
  field_answers: Record<string, string>;
  status: ApplicationQueueStatus;
  created_at: string;
  accepted_at: string | null;
}

function rowToState(row: ApplicationQueueRow): ApplicationQueueState {
  return {
    journeyId: row.journey_id,
    stepNumber: row.step_number,
    eventId: row.event_id,
    agencyName: row.agency_name,
    stepTitle: row.step_title,
    fieldAnswers: row.field_answers ?? {},
    status: row.status,
    createdAt: row.created_at,
    acceptedAt: row.accepted_at,
  };
}

/**
 * Queue (or re-queue) a step for auto-apply. Always resets an existing row
 * for the same (journeyId, stepNumber) back to "pending" with a fresh
 * `created_at` -- a second tap restarts the mock submission rather than
 * erroring, matching the low-ceremony feel of the "Mark as Done" flow it
 * replaces.
 */
export async function upsertQueueSubmission(input: {
  journeyId: string;
  stepNumber: number;
  eventId?: string;
  agencyName: string;
  stepTitle: string;
  fieldAnswers?: Record<string, string>;
}): Promise<ApplicationQueueState> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("application_queue")
    .upsert(
      {
        journey_id: input.journeyId,
        step_number: input.stepNumber,
        event_id: input.eventId ?? null,
        agency_name: input.agencyName,
        step_title: input.stepTitle,
        field_answers: input.fieldAnswers ?? {},
        status: "pending",
        created_at: new Date().toISOString(),
        accepted_at: null,
      },
      { onConflict: "journey_id,step_number" },
    )
    .select(
      "journey_id, step_number, event_id, agency_name, step_title, field_answers, status, created_at, accepted_at",
    )
    .single<ApplicationQueueRow>();

  if (error || !data) throw error ?? new Error("Upsert returned no row");
  return rowToState(data);
}

/**
 * Read a step's current queue state, lazily flipping "pending" to "accepted"
 * if the mock delay has elapsed. Returns null when no row exists yet (the
 * step has never been auto-applied).
 */
export async function getQueueState(input: {
  journeyId: string;
  stepNumber: number;
}): Promise<ApplicationQueueState | null> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("application_queue")
    .select(
      "journey_id, step_number, event_id, agency_name, step_title, field_answers, status, created_at, accepted_at",
    )
    .eq("journey_id", input.journeyId)
    .eq("step_number", input.stepNumber)
    .maybeSingle<ApplicationQueueRow>();

  if (error) throw error;
  if (!data) return null;

  if (data.status === "pending") {
    const elapsed = Date.now() - new Date(data.created_at).getTime();
    if (elapsed >= ACCEPT_AFTER_MS) {
      const acceptedAt = new Date().toISOString();
      const { data: updated, error: updateError } = await supabase
        .from("application_queue")
        .update({ status: "accepted", accepted_at: acceptedAt })
        .eq("journey_id", input.journeyId)
        .eq("step_number", input.stepNumber)
        .eq("status", "pending")
        .select(
          "journey_id, step_number, event_id, agency_name, step_title, field_answers, status, created_at, accepted_at",
        )
        .maybeSingle<ApplicationQueueRow>();

      if (updateError) throw updateError;
      // A concurrent poll may have already flipped it -- either way, the
      // step is accepted, so fall back to the pre-update row with the
      // status corrected rather than erroring.
      return rowToState(updated ?? { ...data, status: "accepted", accepted_at: acceptedAt });
    }
  }

  return rowToState(data);
}
