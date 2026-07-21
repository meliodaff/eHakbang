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
  documentTitle: "I-verify ang iyong dokumento",
  documentDescription:
    "Mag-upload ng sumusuportang dokumento bago magpatuloy.",
  uploadHint: "JPG, PNG, o PDF",
};

const VERIFICATION_COPY: Record<string, VerificationCopy> = {
  "just-graduated": {
    documentTitle: "I-verify ang iyong graduation",
    documentDescription:
      "Mag-upload ng dokumento na nagpapatunay na ikaw ay nakapagtapos (hal. diploma o transcript) bago magpatuloy.",
    uploadHint: "JPG, PNG, o PDF",
  },
  "moved-residence": {
    documentTitle: "I-verify ang iyong bagong tirahan",
    documentDescription:
      "Mag-upload ng patunay ng bagong address (hal. billing statement o barangay certificate) bago magpatuloy.",
    uploadHint: "JPG, PNG, o PDF",
  },
  "first-job": {
    documentTitle: "I-verify ang iyong trabaho",
    documentDescription:
      "Mag-upload ng patunay ng trabaho (hal. job offer o certificate of employment) bago magpatuloy.",
    uploadHint: "JPG, PNG, o PDF",
  },
};

/** Returns the document-step copy for an event, falling back to generic text. */
export function getVerificationCopy(eventId: string | undefined): VerificationCopy {
  if (!eventId) return DEFAULT_COPY;
  return VERIFICATION_COPY[eventId] ?? DEFAULT_COPY;
}
