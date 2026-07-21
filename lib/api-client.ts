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
 * marriage certificate).
 * TODO(api): POST this step's update to the real agency-submission endpoint.
 */
export async function applyMarriageTransaction(
  step: JourneyStep,
): Promise<{ stepNumber: number; submitted: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  return { stepNumber: step.step_number, submitted: true };
}

export interface CreateFeePaymentInput {
  eventId: string;
  language?: Language;
  stepNumbers: number[];
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
