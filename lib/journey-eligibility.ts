import type { JourneyStep } from "./types";

/**
 * Indicative eligibility pre-check for a benefit claim — the gate that sits
 * *between* "the citizen has the agency membership/number" and "the citizen
 * can file the claim". Holding a number only unlocks the ability to file;
 * whether they actually qualify depends on agency rules the agency ultimately
 * adjudicates. Because there's no live agency integration, this checks only
 * the two rules we can defend honestly and labels the outcome as indicative:
 *
 *  1. Filing window / deadline — the claim must be filed within a number of
 *     days of a contingency date (e.g. SSS maternity: 10 years from delivery;
 *     PhilHealth: 60 days). Past that, the right to claim has lapsed.
 *  2. Contributions self-check — for `contribution`-type benefits (e.g. SSS
 *     cash benefits), the citizen must confirm posted contributions.
 *
 * Pure and React-free so it's trivially testable and reusable server-side.
 */

/** The eligibility inputs a given step actually needs. */
export interface EligibilityRequirements {
  /** Label for the contingency date input, e.g. "Date of delivery". */
  contingencyLabel: string;
  /** File within this many days of the contingency date; null = no deadline. */
  filingWindowDays: number | null;
  /** Human phrasing of the window, e.g. "10 years"; null when none. */
  filingWindowLabel: string | null;
  /** True when the citizen must confirm posted contributions. */
  requiresContributions: boolean;
}

/** Citizen-supplied answers to the eligibility pre-check. */
export interface EligibilityAnswers {
  /** ISO date (yyyy-mm-dd) of the contingency, e.g. the delivery date. */
  contingencyDate?: string;
  /** Self-declared: contributions are posted/up to date. */
  contributionsPosted?: boolean;
}

export type EligibilityResult =
  | { status: "eligible" }
  | { status: "not-yet"; reason: string }
  | { status: "lapsed"; reason: string }
  | { status: "needs-info"; reason: string };

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Resolve which eligibility inputs a step needs, or null when it has no
 * eligibility gate. Only `benefit_claim` steps ever gate. `requiresContributions`
 * is derived from a `contribution`-type prerequisite so it isn't duplicated.
 */
export function getEligibilityRequirements(
  step: Pick<JourneyStep, "step_type" | "prerequisite" | "eligibility">,
): EligibilityRequirements | null {
  if (step.step_type !== "benefit_claim") return null;
  const requiresContributions =
    step.prerequisite?.prerequisite_type === "contribution";
  const e = step.eligibility;
  const hasWindow = !!e && e.filing_window_days != null;
  if (!hasWindow && !requiresContributions) return null;
  return {
    contingencyLabel: e?.contingency_label ?? "Date of the event",
    filingWindowDays: e?.filing_window_days ?? null,
    filingWindowLabel: e?.filing_window_label ?? null,
    requiresContributions,
  };
}

/**
 * Run the indicative eligibility check. Order: missing-date → lapsed →
 * contributions. A future contingency date is treated as within the window.
 */
export function checkEligibility(
  reqs: EligibilityRequirements,
  answers: EligibilityAnswers,
  now: Date = new Date(),
): EligibilityResult {
  const eventLabel = reqs.contingencyLabel.toLowerCase();

  if (reqs.filingWindowDays != null) {
    if (!answers.contingencyDate) {
      return {
        status: "needs-info",
        reason: `Enter the ${eventLabel} to check the filing deadline.`,
      };
    }
    const contingency = new Date(answers.contingencyDate);
    const diffDays = (now.getTime() - contingency.getTime()) / MS_PER_DAY;
    if (diffDays > reqs.filingWindowDays) {
      return {
        status: "lapsed",
        reason: `The ${reqs.filingWindowLabel ?? "filing"} window from your ${eventLabel} has passed, so this claim can no longer be filed.`,
      };
    }
  }

  if (reqs.requiresContributions && !answers.contributionsPosted) {
    return {
      status: "not-yet",
      reason:
        "This benefit needs posted contributions first. Keep contributing, then file once your record qualifies — the agency confirms your contributions when you file.",
    };
  }

  return { status: "eligible" };
}

/**
 * Infer an indicative filing window for a benefit claim from its agency, so
 * AI-generated / cached journeys (which don't carry hand-authored eligibility)
 * still surface the eligibility gate. Windows are the well-known statutory
 * defaults (SSS benefit claims prescribe in 10 years; PhilHealth claims are
 * filed within 60 days); the UI always frames them as indicative and routes to
 * the official source. Returns null when there's no defensible default, so we
 * never invent a deadline for arbitrary benefits.
 */
export function inferEligibility(
  step: Pick<JourneyStep, "step_type" | "agency_code">,
): NonNullable<JourneyStep["eligibility"]> | null {
  if (step.step_type !== "benefit_claim") return null;
  const agency = step.agency_code.toUpperCase();
  if (agency === "SSS") {
    return {
      filing_window_days: 3650,
      filing_window_label: "10 years",
      contingency_label: "Date of the event",
    };
  }
  if (agency === "PHILHEALTH") {
    return {
      filing_window_days: 60,
      filing_window_label: "60 days",
      contingency_label: "Date of the event",
    };
  }
  return null;
}
