import type { Journey, JourneyStep, Language } from "./types";
import {
  MOCK_JOURNEYS,
  getActiveJourney,
  getArchivedJourneys,
  getJourneyById,
} from "./mock-data";

/**
 * Data-access layer — the SINGLE swap point between the UI and its data source.
 *
 * In the UI-only phase every function returns mock data. When the real
 * integrations land (see `/api/README.md`), reimplement these to call the
 * server route `/api/journey` (Claude) and the eGov catalog — the UI components
 * that consume these functions do not change.
 */

export interface GenerateJourneyInput {
  /** Free-text life-event description, or a predefined event's description. */
  lifeEvent: string;
  language?: Language;
  /** Optional predefined life-event id, when a card was tapped. */
  eventId?: string;
}

/**
 * Generate a journey for a life event. Predefined events (`eventId` set) are
 * normally prefetched server-side by `app/journey/page.tsx`; this POSTs to
 * the same `/api/journey` route and is used for manual/on-demand refresh.
 * Free-text life events (no `eventId`) fall back to the mock journey.
 */
export async function generateJourney(
  input: GenerateJourneyInput,
): Promise<Journey> {
  if (!input.eventId) {
    return getActiveJourney() ?? MOCK_JOURNEYS[0];
  }
  const res = await fetch("/api/journey", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventId: input.eventId,
      language: input.language ?? "en",
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to generate journey");
  }
  const data: { journey: Journey; regenerated: boolean } = await res.json();
  return data.journey;
}

/** Fetch a single journey by id (mock-backed for now). */
export async function fetchJourney(id: string): Promise<Journey | undefined> {
  return getJourneyById(id);
}

/** List all journeys — active first (mock-backed for now). */
export async function listJourneys(): Promise<Journey[]> {
  const active = getActiveJourney();
  return active ? [active, ...getArchivedJourneys()] : getArchivedJourneys();
}

/**
 * Submit evidence for a civil-status/life-event change (e.g. marriage
 * certificate) for review.
 * TODO(api): POST the file to a real document-upload endpoint.
 */
export async function uploadEvidenceDocument(
  file: File,
): Promise<{ fileName: string }> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return { fileName: file.name };
}

/**
 * Create a liveness session and return the verification URL to redirect to.
 * Uses the server-side proxy at /api/liveness/session.
 */
export async function verifyFace(
  callbackUrl: string,
): Promise<{ token: string; url: string }> {
  const res = await fetch("/api/liveness/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_url: callbackUrl }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to create liveness session");
  }
  return res.json();
}

/**
 * Fetch the liveness verification result for a completed session.
 * Uses the server-side proxy at /api/liveness/result/[token].
 */
export async function fetchLivenessResult(
  token: string,
): Promise<{ status: string; confidence_score: number; verified: boolean }> {
  const res = await fetch(`/api/liveness/result/${encodeURIComponent(token)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to fetch liveness result");
  }
  return res.json();
}

/**
 * Auto-apply a single record-update step on the citizen's behalf (e.g.
 * submitting a civil-status update to an agency using their uploaded
 * marriage certificate, plus any of the step's `required_fields` answers).
 * TODO(api): POST this step's update -- fieldValues included -- to the real
 * agency-submission endpoint.
 */
export async function applyMarriageTransaction(
  step: JourneyStep,
  _fieldValues?: Record<string, string>,
): Promise<{ stepNumber: number; submitted: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  return { stepNumber: step.step_number, submitted: true };
}

export interface CreateFeePaymentInput {
  eventId: string;
  language?: Language;
  stepNumbers: number[];
  /** Verified eGov Face Liveness session token; required by /api/payment. */
  livenessToken: string;
}

export interface CreateFeePaymentResult {
  uuid: string;
  url: string;
  txnid: string;
  amount: number;
  currency: string;
  stepNumbers: number[];
}

/**
 * Start an eGovPay transaction for a bundle of fee-bearing steps.
 * Uses the server-side proxy at /api/payment, which re-derives and validates
 * the fee amounts itself rather than trusting the caller's numbers.
 */
export async function createFeePayment(
  input: CreateFeePaymentInput,
): Promise<CreateFeePaymentResult> {
  const res = await fetch("/api/payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventId: input.eventId,
      language: input.language ?? "en",
      stepNumbers: input.stepNumbers,
      livenessToken: input.livenessToken,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to start payment");
  }
  return res.json();
}

export interface PaymentStatus {
  uuid: string;
  paid: boolean;
  paidAt: string | null;
  refno: string | null;
  amount: string;
  currency: string;
  paymentStatus: string;
}

/** Check an in-flight eGovPay transaction's status via /api/payment/[uuid]. */
export async function fetchPaymentStatus(uuid: string): Promise<PaymentStatus> {
  const res = await fetch(`/api/payment/${encodeURIComponent(uuid)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to fetch payment status");
  }
  return res.json();
}

export interface SubmitAutoApplyInput {
  journeyId: string;
  stepNumber: number;
  eventId?: string;
  agencyName: string;
  stepTitle: string;
  fieldAnswers?: Record<string, string>;
}

export interface AutoApplyQueueState {
  journeyId: string;
  stepNumber: number;
  status: "pending" | "accepted";
  createdAt: string;
  acceptedAt: string | null;
}

/**
 * Submit a single step's application to its agency. There is no real agency
 * backend and no server-side queue -- the submission is recorded locally (see
 * the journey store's `submitted_step_numbers`) and immediately resolves to a
 * "pending" state, i.e. awaiting the agency's response. The submitted state
 * is persisted by the caller via the journey store, not here, so it survives
 * navigation and shows on the tracking dashboard.
 */
export async function submitAutoApply(
  input: SubmitAutoApplyInput,
): Promise<AutoApplyQueueState> {
  // Brief delay so the UI's "Submitting…" transition is visible.
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    journeyId: input.journeyId,
    stepNumber: input.stepNumber,
    status: "pending",
    createdAt: new Date().toISOString(),
    acceptedAt: null,
  };
}

/**
 * Local stand-in for the old queue-status poll. With no backend queue there
 * is nothing to poll: a submitted step simply stays "pending" (awaiting the
 * agency) until an agency reacts, so this always resolves to null (idle) and
 * never reports "accepted" on its own.
 */
export async function fetchAutoApplyStatus(
  _input: { journeyId: string; stepNumber: number },
): Promise<AutoApplyQueueState | null> {
  return null;
}

/**
 * Demo-only control that locally simulates every agency responding to and
 * approving the submitted applications for one journey. Resolves immediately;
 * the caller marks the affected steps complete.
 */
export async function simulateAgencyApproval(
  _input: { journeyId: string },
): Promise<{ acceptedStepNumbers: number[] }> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return { acceptedStepNumbers: [] };
}

export interface AskStepContext {
  step_title: string;
  agency_name: string;
  reason: string;
  documents_required: string[];
  estimated_time: string;
  important_note: string | null;
  fee?: { amount: string; how_to_pay: string } | null;
  required_fields?: Array<{ label: string; hint?: string | null }>;
}

export interface AskAboutStepInput {
  question: string;
  language?: Language;
  step: AskStepContext;
}

/**
 * Ask a concise, step-scoped question via /api/ask-step (OpenAI-backed).
 */
export async function askAboutStep(
  input: AskAboutStepInput,
): Promise<{ answer: string }> {
  const res = await fetch("/api/ask-step", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to answer question");
  }
  return res.json();
}

/**
 * Notify the citizen (via SMS, see /api/notifications/auto-apply) that their
 * auto-apply submission finished successfully. Best-effort -- a notification
 * failure must never surface as an error to the auto-apply flow itself.
 */
export async function notifyAutoApplySuccess(eventId: string): Promise<void> {
  // eslint-disable-next-line no-console
  console.log("[DEBUG][notifyAutoApplySuccess] POSTing to /api/notifications/auto-apply", { eventId });
  try {
    const res = await fetch("/api/notifications/auto-apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });
    // NOTE: the route always responds with HTTP 200 even when the SMS send
    // failed (it encodes success/failure in the JSON body's `sent` field
    // instead), so `res.ok` alone can't tell us whether it actually worked --
    // read the body every time while debugging.
    const bodyText = await res.text();
    // eslint-disable-next-line no-console
    console.log("[DEBUG][notifyAutoApplySuccess] response", { status: res.status, body: bodyText });
    if (!res.ok) {
      console.error("[notifyAutoApplySuccess] request failed:", bodyText);
    }
  } catch (err) {
    console.error("[notifyAutoApplySuccess] request failed:", err);
  }
}
