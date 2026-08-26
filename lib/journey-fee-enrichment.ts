import type { Journey, JourneyStep } from "./types";

/** Official DFA source stating PHP950 regular and PHP1,200 expedited processing. */
export const DFA_PASSPORT_FEE_SOURCE =
  "https://dfa.gov.ph/dfa-news/dfa-releasesupdate/15255-initial-batch-of-ten-year-valid-passports-bares-more-reforms";

function isDfaPassportStep(step: JourneyStep): boolean {
  const agency = `${step.agency_code} ${step.agency_name}`;
  const service = `${step.step_title} ${step.egov_service_name} ${step.egov_search_term}`;
  return /\bDFA\b|Department of Foreign Affairs/i.test(agency) && /passport/i.test(service);
}

/**
 * Adds the official regular-processing passport fee only when a DFA passport
 * step has no fee. Existing model-supplied fees are preserved; no other
 * agency/service is modified.
 */
export function enrichOfficialFees(steps: JourneyStep[]): JourneyStep[] {
  return steps.map((step) => {
    if (step.fee || !isDfaPassportStep(step)) return step;
    return {
      ...step,
      fee: {
        amount: "₱950",
        currency: "PHP",
        how_to_pay:
          "Regular passport processing fee. Pay through an authorized payment channel during DFA appointment booking. Expedited processing costs ₱1,200.",
        official_source_url: DFA_PASSPORT_FEE_SOURCE,
      },
    };
  });
}

export function enrichJourneyOfficialFees<T extends Journey>(journey: T): T {
  return { ...journey, steps: enrichOfficialFees(journey.steps) };
}
