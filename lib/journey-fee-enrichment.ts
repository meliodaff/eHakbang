import type { Journey, JourneyStep, StepFee } from "./types";

/** Official DFA source stating PHP950 regular and PHP1,200 expedited processing. */
export const DFA_PASSPORT_FEE_SOURCE =
  "https://dfa.gov.ph/dfa-news/dfa-releasesupdate/15255-initial-batch-of-ten-year-valid-passports-bares-more-reforms";

/** PSA-authorized channel source stating PHP365 per delivered birth certificate. */
export const PSA_BIRTH_CERTIFICATE_FEE_SOURCE =
  "https://psahelpline.ph/blogs/how-to-save-on-shipping-costs-when-ordering-your-psa-birth-certificate-online";

function isDfaPassportStep(step: JourneyStep): boolean {
  const agency = `${step.agency_code} ${step.agency_name}`;
  const service = `${step.step_title} ${step.egov_service_name} ${step.egov_search_term}`;
  return /\bDFA\b|Department of Foreign Affairs/i.test(agency) && /passport/i.test(service);
}

function isPsaBirthCertificateStep(step: JourneyStep): boolean {
  const agency = `${step.agency_code} ${step.agency_name}`;
  const service = `${step.step_title} ${step.egov_service_name} ${step.egov_search_term}`;
  const isCopyOrder = /\b(request|order|obtain|get|secure|acquire|copy)\b/i.test(service);
  const isDifferentService =
    /\b(correct|correction|amend|amendment|annotate|annotation|register|registration|delayed)\b/i.test(
      service,
    );
  return (
    /\bPSA\b|Philippine Statistics Authority/i.test(agency) &&
    /birth certificate|certificate of live birth/i.test(service) &&
    isCopyOrder &&
    !isDifferentService
  );
}

function officialFeeForStep(step: JourneyStep): StepFee | null {
  if (isDfaPassportStep(step)) {
    return {
      amount: "₱950",
      currency: "PHP",
      how_to_pay:
        "Regular passport processing fee. Pay through an authorized payment channel during DFA appointment booking. Expedited processing costs ₱1,200.",
      official_source_url: DFA_PASSPORT_FEE_SOURCE,
    };
  }

  if (isPsaBirthCertificateStep(step)) {
    return {
      amount: "₱365",
      currency: "PHP",
      how_to_pay:
        "One delivered PSA birth certificate ordered through PSAHelpline, including document, service, and courier fees.",
      official_source_url: PSA_BIRTH_CERTIFICATE_FEE_SOURCE,
    };
  }

  return null;
}

/**
 * Adds deterministic official fees to recognized government-service steps
 * that do not already have a fee. Existing model-supplied fees are preserved
 * for display; sensitive server routes clear those values before calling this
 * function so only this registry can determine the amount sent to eGovPay.
 */
export function enrichOfficialFees(steps: JourneyStep[]): JourneyStep[] {
  return steps.map((step) => {
    if (step.fee) return step;
    const fee = officialFeeForStep(step);
    return fee ? { ...step, fee } : step;
  });
}

export function enrichJourneyOfficialFees<T extends Journey>(journey: T): T {
  return { ...journey, steps: enrichOfficialFees(journey.steps) };
}
