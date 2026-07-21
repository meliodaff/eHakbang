/**
 * Life events that go through the confirm → document upload → face verify
 * onboarding flow (PRD marriage flow), rather than straight to the journey
 * checklist or the separate verification gate (see `verification.ts`).
 */
export const CIVIL_STATUS_EVENT_IDS = [
  "got-married",
  "annulment",
  "retired",
  "lost-a-job",
  "had-a-baby",
  "started-a-business",
  "became-senior",
  "became-pwd",
  "death-in-family",
  "just-graduated",
  "first-job",
  "moved-residence",
] as const;

/** True when the given life event uses the confirm/document/face-verify flow. */
export function isCivilStatusEvent(eventId: string | undefined): boolean {
  if (!eventId) return false;
  return (CIVIL_STATUS_EVENT_IDS as readonly string[]).includes(eventId);
}

/** The civil status this event results in once every step is applied. */
export const CIVIL_STATUS_RESULT: Record<string, string> = {
  "got-married": "Married",
  annulment: "Single",
  retired: "Retired",
  "lost-a-job": "Unemployed",
  "had-a-baby": "Parent",
  "started-a-business": "Business Owner",
  "became-senior": "Senior Citizen",
  "became-pwd": "PWD",
  "death-in-family": "Bereaved",
  "just-graduated": "Graduate",
  "first-job": "Employed",
  "moved-residence": "Relocated",
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
  retired: {
    from: "Employed",
    to: "Retired",
    surnameExample: "Juan Dela Cruz",
  },
  "lost-a-job": {
    from: "Employed",
    to: "Unemployed",
    surnameExample: "Juan Dela Cruz",
  },
  "had-a-baby": {
    from: "Married",
    to: "Parent",
    surnameExample: "Juana Dela Cruz-Santos",
  },
  "started-a-business": {
    from: "Employee",
    to: "Business Owner",
    surnameExample: "Juan Dela Cruz",
  },
  "became-senior": {
    from: "Adult",
    to: "Senior Citizen",
    surnameExample: "Juan Dela Cruz",
  },
  "became-pwd": {
    from: "Abled",
    to: "PWD",
    surnameExample: "Juan Dela Cruz",
  },
  "death-in-family": {
    from: "Family Intact",
    to: "Bereaved",
    surnameExample: "Juan Dela Cruz",
  },
  "just-graduated": {
    from: "Student",
    to: "Graduate",
    surnameExample: "Juan Dela Cruz",
  },
  "first-job": {
    from: "Unemployed",
    to: "Employed",
    surnameExample: "Juan Dela Cruz",
  },
  "moved-residence": {
    from: "Previous Address",
    to: "New Address",
    surnameExample: "Juan Dela Cruz",
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
  retired: {
    confirmQuestion: "Have you recently retired?",
    confirmDescription:
      "We'll help you claim your pension and update your memberships across government agencies.",
    declinedMessage: "This flow is for people who have recently retired.",
    documentTitle: "Attach proof of retirement",
    documentDescription:
      "Upload a copy of your certificate of retirement, last payslip, or employer certification, so we can verify your claim.",
  },
  "lost-a-job": {
    confirmQuestion: "Did you recently lose your job?",
    confirmDescription:
      "We'll help you claim unemployment benefits and keep your memberships active.",
    declinedMessage: "This flow is for people who recently lost their job.",
    documentTitle: "Attach proof of separation",
    documentDescription:
      "Upload a copy of your DOLE certificate of involuntary separation, termination letter, or employer certification, so we can verify your claim.",
  },
  "had-a-baby": {
    confirmQuestion: "Did you recently have a baby?",
    confirmDescription:
      "We'll help you register your newborn and claim your maternity and health benefits.",
    declinedMessage: "This flow is for people who recently had a baby.",
    documentTitle: "Attach proof of birth",
    documentDescription:
      "Upload a copy of your baby's Certificate of Live Birth or hospital birth record, so we can verify your claim.",
  },
  "started-a-business": {
    confirmQuestion: "Are you starting a business?",
    confirmDescription:
      "We'll help you register your business with the right government agencies.",
    declinedMessage: "This flow is for people who are starting a business.",
    documentTitle: "Attach proof of business registration",
    documentDescription:
      "Upload a copy of your DTI business name registration, SEC registration, or business permit application, so we can verify your claim.",
  },
  "became-senior": {
    confirmQuestion: "Have you recently turned 60?",
    confirmDescription:
      "We'll help you claim your senior citizen ID and benefits.",
    declinedMessage: "This flow is for people who have recently turned 60.",
    documentTitle: "Attach proof of age",
    documentDescription:
      "Upload a copy of your PSA birth certificate or any valid government ID showing your date of birth, so we can verify your eligibility.",
  },
  "became-pwd": {
    confirmQuestion: "Have you recently become a PWD?",
    confirmDescription:
      "We'll help you register as a PWD and claim your benefits and discounts.",
    declinedMessage: "This flow is for people who have recently become a PWD.",
    documentTitle: "Attach medical certificate",
    documentDescription:
      "Upload a copy of your medical certificate or clinical abstract from your doctor confirming your disability, so we can verify your eligibility.",
  },
  "death-in-family": {
    confirmQuestion: "Has a family member recently passed away?",
    confirmDescription:
      "We'll help you process the death certificate and claim survivor and funeral benefits.",
    declinedMessage: "This flow is for people who recently lost a family member.",
    documentTitle: "Attach proof of death",
    documentDescription:
      "Upload a copy of the death certificate or medical certificate of death, so we can verify your claim.",
  },
  "just-graduated": {
    confirmQuestion: "Did you recently graduate?",
    confirmDescription:
      "We'll help you set up your government IDs and memberships as you prepare for your career.",
    declinedMessage: "This flow is for people who recently graduated.",
    documentTitle: "Attach proof of graduation",
    documentDescription:
      "Upload a copy of your diploma, transcript of records, or certificate of graduation, so we can verify your claim.",
  },
  "first-job": {
    confirmQuestion: "Are you starting your first job?",
    confirmDescription:
      "We'll help you complete the government registrations your employer will require.",
    declinedMessage: "This flow is for people who are starting their first job.",
    documentTitle: "Attach proof of employment",
    documentDescription:
      "Upload a copy of your job offer letter, contract, or certificate of employment, so we can verify your claim.",
  },
  "moved-residence": {
    confirmQuestion: "Did you recently move to a new address?",
    confirmDescription:
      "We'll help you update your address and records across government agencies.",
    declinedMessage: "This flow is for people who recently moved residence.",
    documentTitle: "Attach proof of new address",
    documentDescription:
      "Upload a copy of a billing statement, lease contract, or barangay certificate at your new address, so we can verify your claim.",
  },
};

const DEFAULT_COPY: CivilStatusCopy = CIVIL_STATUS_COPY["got-married"];

/** Returns the confirm/document copy for an event, falling back to the marriage copy. */
export function getCivilStatusCopy(eventId: string | undefined): CivilStatusCopy {
  if (!eventId) return DEFAULT_COPY;
  return CIVIL_STATUS_COPY[eventId] ?? DEFAULT_COPY;
}
