/**
 * Life events that go through the confirm → document upload → face verify
 * onboarding flow (PRD marriage flow), rather than straight to the journey
 * checklist or the separate verification gate (see `verification.ts`).
 */
export const CIVIL_STATUS_EVENT_IDS = ["got-married", "annulment"] as const;

/** True when the given life event uses the confirm/document/face-verify flow. */
export function isCivilStatusEvent(eventId: string | undefined): boolean {
  if (!eventId) return false;
  return (CIVIL_STATUS_EVENT_IDS as readonly string[]).includes(eventId);
}

/** The civil status this event results in once every step is applied. */
export const CIVIL_STATUS_RESULT: Record<string, string> = {
  "got-married": "Married",
  annulment: "Single",
};

/** The civil status change (from → to) each event's steps apply. */
export interface CivilStatusTransition {
  from: string;
  to: string;
  /** Example surname change shown for the PhilSys National ID step. */
  surnameExample: string;
}

const CIVIL_STATUS_TRANSITIONS: Record<string, CivilStatusTransition> = {
  "got-married": {
    from: "Single",
    to: "Married",
    surnameExample: "Juana Dela Cruz → Juana Dela Cruz-Santos",
  },
  annulment: {
    from: "Married",
    to: "Single",
    surnameExample: "Juana Dela Cruz-Santos → Juana Dela Cruz",
  },
};

/** Returns the civil-status transition for an event, falling back to the marriage transition. */
export function getCivilStatusTransition(
  eventId: string | undefined,
): CivilStatusTransition {
  if (!eventId) return CIVIL_STATUS_TRANSITIONS["got-married"];
  return CIVIL_STATUS_TRANSITIONS[eventId] ?? CIVIL_STATUS_TRANSITIONS["got-married"];
}

/** Copy for the "confirm" and "document upload" steps, tailored per event. */
export interface CivilStatusCopy {
  confirmQuestion: string;
  confirmDescription: string;
  declinedMessage: string;
  documentTitle: string;
  documentDescription: string;
}

const CIVIL_STATUS_COPY: Record<string, CivilStatusCopy> = {
  "got-married": {
    confirmQuestion: "Did you just get married?",
    confirmDescription:
      "We'll help you update your civil status across government agencies.",
    declinedMessage: "This flow is for people who recently got married.",
    documentTitle: "Attach proof of marriage",
    documentDescription:
      "Upload a copy of your PSA marriage certificate or another document showing your marriage, so we can verify your update.",
  },
  annulment: {
    confirmQuestion: "Was your marriage recently annulled?",
    confirmDescription:
      "We'll help you update your civil status across government agencies.",
    declinedMessage: "This flow is for people whose marriage was recently annulled.",
    documentTitle: "Attach proof of annulment",
    documentDescription:
      "Upload a copy of your court decree of annulment or PSA-annotated marriage certificate, so we can verify your update.",
  },
};

const DEFAULT_COPY: CivilStatusCopy = CIVIL_STATUS_COPY["got-married"];

/** Returns the confirm/document copy for an event, falling back to the marriage copy. */
export function getCivilStatusCopy(eventId: string | undefined): CivilStatusCopy {
  if (!eventId) return DEFAULT_COPY;
  return CIVIL_STATUS_COPY[eventId] ?? DEFAULT_COPY;
}
