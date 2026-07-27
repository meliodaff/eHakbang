import "server-only";

/**
 * In-memory client for the mocked per-step Auto Apply queue. There is no real
 * agency-submission backend, so a queued entry is simply flipped from
 * "pending" to "accepted" once enough time has elapsed since it was created --
 * checked lazily on read, the same staleness-on-read approach
 * `journey-requirements.ts` uses for its 24h cache, rather than a cron/worker.
 *
 * State lives only in this module-level Map, not a database -- it resets
 * whenever the server process restarts, which is fine for a mocked queue with
 * no real submission behind it.
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

function queueKey(journeyId: string, stepNumber: number): string {
  return `${journeyId}:${stepNumber}`;
}

const queue = new Map<string, ApplicationQueueState>();

/**
 * Queue (or re-queue) a step for auto-apply. Always resets an existing entry
 * for the same (journeyId, stepNumber) back to "pending" with a fresh
 * `createdAt` -- a second tap restarts the mock submission rather than
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
  const state: ApplicationQueueState = {
    journeyId: input.journeyId,
    stepNumber: input.stepNumber,
    eventId: input.eventId ?? null,
    agencyName: input.agencyName,
    stepTitle: input.stepTitle,
    fieldAnswers: input.fieldAnswers ?? {},
    status: "pending",
    createdAt: new Date().toISOString(),
    acceptedAt: null,
  };
  queue.set(queueKey(input.journeyId, input.stepNumber), state);
  return state;
}

/**
 * Read a step's current queue state, lazily flipping "pending" to "accepted"
 * if the mock delay has elapsed. Returns null when no entry exists yet (the
 * step has never been auto-applied).
 */
export async function getQueueState(input: {
  journeyId: string;
  stepNumber: number;
}): Promise<ApplicationQueueState | null> {
  const state = queue.get(queueKey(input.journeyId, input.stepNumber));
  if (!state) return null;

  if (state.status === "pending") {
    const elapsed = Date.now() - new Date(state.createdAt).getTime();
    if (elapsed >= ACCEPT_AFTER_MS) {
      state.status = "accepted";
      state.acceptedAt = new Date().toISOString();
    }
  }

  return state;
}
