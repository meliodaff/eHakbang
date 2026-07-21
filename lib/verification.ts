/**
 * Verification gate configuration.
 *
 * Some life events route through an identity/eligibility verification flow
 * (document upload → liveness check) before the journey checklist is shown.
 *
 * IMPORTANT: This is a FLOW PROTOTYPE only. The document upload is auto-accepted
 * and the liveness check is mocked — there are no real API calls, no camera
 * capture, and no data is stored or transmitted. When these stubs are replaced
 * with real checks, they will introduce document/biometric (PII) processing
 * that the current privacy-first design (PRD §11 "Zero Personal Data") does not
 * account for. Revisit the data-privacy posture before shipping real verification.
 */

/** Life event ids that must pass verification before their journey is shown. */
export const VERIFICATION_REQUIRED_EVENT_IDS = [
  "just-graduated",
  "moved-residence",
  "first-job",
  "became-senior",
  "became-pwd",
] as const;

/** True when the given life event must go through the verification gate. */
export function eventRequiresVerification(eventId: string | undefined): boolean {
  if (!eventId) return false;
  return (VERIFICATION_REQUIRED_EVENT_IDS as readonly string[]).includes(eventId);
}

/** Copy for the document-upload step, tailored to each gated event. */
export interface VerificationCopy {
  /** Heading on the document step. */
  documentTitle: string;
  /** Instruction describing which document to upload. */
  documentDescription: string;
  /** Accepted file-type hint shown on the upload control. */
  uploadHint: string;
}

const DEFAULT_COPY: VerificationCopy = {
  documentTitle: "Verify your document",
  documentDescription: "Upload a supporting document before continuing.",
  uploadHint: "JPG, PNG, or PDF",
};

const VERIFICATION_COPY: Record<string, VerificationCopy> = {
  "just-graduated": {
    documentTitle: "Verify your graduation",
    documentDescription:
      "Upload a document proving you graduated (e.g. diploma or transcript) before continuing.",
    uploadHint: "JPG, PNG, or PDF",
  },
  "moved-residence": {
    documentTitle: "Verify your new residence",
    documentDescription:
      "Upload proof of your new address (e.g. billing statement or barangay certificate) before continuing.",
    uploadHint: "JPG, PNG, or PDF",
  },
  "first-job": {
    documentTitle: "Verify your employment",
    documentDescription:
      "Upload proof of employment (e.g. job offer or certificate of employment) before continuing.",
    uploadHint: "JPG, PNG, or PDF",
  },
  "became-senior": {
    documentTitle: "Verify your age",
    documentDescription:
      "Upload a document proving you are 60 or older (e.g. PSA birth certificate or a valid ID showing your birth date) before continuing.",
    uploadHint: "JPG, PNG, or PDF",
  },
  "became-pwd": {
    documentTitle: "Verify your disability",
    documentDescription:
      "Upload a document proving your disability (e.g. a medical certificate or PWD assessment) before continuing.",
    uploadHint: "JPG, PNG, or PDF",
  },
};

/** Returns the document-step copy for an event, falling back to generic text. */
export function getVerificationCopy(eventId: string | undefined): VerificationCopy {
  if (!eventId) return DEFAULT_COPY;
  return VERIFICATION_COPY[eventId] ?? DEFAULT_COPY;
}
