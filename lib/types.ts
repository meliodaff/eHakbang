/**
 * eHakbang data model.
 *
 * The `JourneyStep` and generated journey fields mirror the Claude API
 * response schema defined in the PRD (§9.1.2). App-level fields (id, status,
 * dates, completion) are layered on top for the UI and localStorage later.
 */

/** A step is either a legal record update or a benefit the citizen can claim. */
export type StepType = "record_update" | "benefit_claim";

/** Lifecycle of a journey within the app. */
export type JourneyStatus = "active" | "completed" | "archived";

/** UI + Claude prompt language preference. */
export type Language = "fil" | "en";

/**
 * Government-issued IDs / memberships a citizen can hold in their ID wallet.
 * Used to auto-satisfy journey steps whose purpose is to obtain that ID.
 */
export type IdType =
  | "tin"
  | "sss"
  | "philhealth"
  | "pagibig"
  | "umid"
  | "philsys"
  | "passport"
  | "drivers-license"
  | "voters-id"
  | "prc";

/** One ordered government action. Mirrors PRD §9.1.2 `steps[]`. */
export interface JourneyStep {
  step_number: number;
  agency_name: string;
  /** Short agency code, e.g. SSS, PHILHEALTH, PSA, PAGIBIG, BIR, DOLE, GSIS, DSWD. */
  agency_code: string;
  step_title: string;
  step_type: StepType;
  /** Plain-language explanation of why this step is needed. */
  reason: string;
  documents_required: string[];
  /** e.g. "1-2 weeks processing". */
  estimated_time: string;
  /** Warnings, deadlines, or conditions. Null when none. */
  important_note: string | null;
  egov_service_name: string;
  /** Term used to look up the official URL in the eGov catalog. */
  egov_search_term: string;
  /**
   * Resolved official service URL (from the eGov catalog API later).
   * Optional in the UI-only phase — falls back to the agency homepage.
   */
  egov_url?: string;
  /**
   * When set, completing this step obtains/updates the given government ID.
   * If the citizen already holds that ID in their ID wallet, the step is
   * auto-satisfied (marked done dynamically without manual action).
   */
  fulfills_id?: IdType;
}

/**
 * A complete journey. The `life_event`..`steps` fields match the generated
 * Claude schema (PRD §9.1.2); the rest is app state.
 */
export interface Journey {
  /** Stable id, e.g. `ehakbang:journey:{timestamp}` in localStorage later. */
  id: string;
  /** Source life-event id, when the journey came from a predefined event. */
  event_id?: string;
  /** Emoji shown in the archive list and headers (UI convenience). */
  emoji: string;
  /** Normalized life event label. */
  life_event: string;
  /** 1–2 sentence plain-language summary of the journey. */
  summary: string;
  total_steps: number;
  record_updates: number;
  benefit_claims: number;
  steps: JourneyStep[];
  status: JourneyStatus;
  language: Language;
  /** ISO date string of creation. */
  created_at: string;
  /** ISO date string of completion, or null while active. */
  completed_at: string | null;
  /** Step numbers the user has marked as done. */
  completed_step_numbers: number[];
}

/** A predefined life-event shortcut card shown on the landing screen. */
export interface LifeEvent {
  id: string;
  emoji: string;
  /** Short Filipino label. */
  label: string;
  /** English sub-label. */
  sublabel: string;
  /** Very short caption for compact tiles (e.g., "Baby", "Married"). */
  short: string;
  /** Natural-language text used to populate the input / journey generation. */
  description: string;
  /** True for the primary 8 cards; false for "More events". */
  common: boolean;
}
