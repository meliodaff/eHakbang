import type { Journey, JourneyStep } from "./types";

/**
 * Mock journeys for the UI-only phase. These stand in for the Claude-generated
 * output and are swapped for real API results later (single swap point in
 * lib/api-client.ts). Step content is illustrative — the UI always directs
 * users to the official page for exact amounts and requirements (PRD FR-10).
 */

const hadABabySteps: JourneyStep[] = [
  {
    step_number: 1,
    agency_name: "Philippine Statistics Authority",
    agency_code: "PSA",
    step_title: "Register your baby's birth",
    step_type: "record_update",
    reason:
      "Your child needs an official birth certificate before you can claim most other benefits or enroll them in services.",
    documents_required: [
      "Certificate of Live Birth from the hospital",
      "Valid IDs of both parents",
      "Marriage certificate (if married)",
    ],
    estimated_time: "1–2 weeks processing",
    important_note:
      "Register within 30 days of birth to avoid late-registration requirements.",
    egov_service_name: "PSA Birth Registration",
    egov_search_term: "PSA birth registration",
  },
  {
    step_number: 2,
    agency_name: "Philippine Health Insurance Corporation",
    agency_code: "PHILHEALTH",
    step_title: "Claim your maternity and newborn benefits",
    step_type: "benefit_claim",
    reason:
      "PhilHealth helps cover the cost of your delivery and your newborn's initial care.",
    documents_required: [
      "PhilHealth Member Data Record (MDR)",
      "Baby's birth certificate or hospital record",
      "Hospital billing statement",
    ],
    estimated_time: "Applied at discharge or within 60 days",
    important_note:
      "Coverage amounts vary by case rate — check your exact eligibility and current benefit amount on the official page.",
    egov_service_name: "PhilHealth Benefit Claim",
    egov_search_term: "PhilHealth maternity benefit claim",
  },
  {
    step_number: 3,
    agency_name: "Social Security System",
    agency_code: "SSS",
    step_title: "Claim your SSS maternity benefit",
    step_type: "benefit_claim",
    reason:
      "As a contributing member, you may be entitled to a cash maternity benefit from the SSS.",
    documents_required: [
      "SSS Maternity Notification",
      "Baby's birth certificate",
      "UMID or SSS ID",
    ],
    estimated_time: "2–4 weeks after filing",
    important_note:
      "The benefit amount depends on your contributions — verify the current amount on the official page.",
    egov_service_name: "SSS Maternity Benefit",
    egov_search_term: "SSS maternity benefit",
  },
  {
    step_number: 4,
    agency_name: "Philippine Health Insurance Corporation",
    agency_code: "PHILHEALTH",
    step_title: "Add your newborn as a dependent",
    step_type: "record_update",
    reason:
      "Registering your baby as a dependent extends your PhilHealth coverage to them.",
    documents_required: [
      "Baby's birth certificate",
      "PhilHealth Member Registration / update form",
    ],
    estimated_time: "Same day",
    important_note: null,
    egov_service_name: "PhilHealth Dependent Update",
    egov_search_term: "PhilHealth add dependent",
  },
  {
    step_number: 5,
    agency_name: "Home Development Mutual Fund",
    agency_code: "PAGIBIG",
    step_title: "Update your Pag-IBIG beneficiaries",
    step_type: "record_update",
    reason:
      "Keeping your beneficiary record current ensures your savings and benefits go to your family.",
    documents_required: [
      "Baby's birth certificate",
      "Pag-IBIG Member's Data Form (MDF)",
    ],
    estimated_time: "Same day",
    important_note: null,
    egov_service_name: "Pag-IBIG Member Update",
    egov_search_term: "Pag-IBIG update beneficiaries",
  },
];

const gotMarriedSteps: JourneyStep[] = [
  {
    step_number: 1,
    agency_name: "Philippine Statistics Authority",
    agency_code: "PSA",
    step_title: "Get your PSA marriage certificate",
    step_type: "record_update",
    reason:
      "A PSA-issued marriage certificate is required to update your civil status with other agencies.",
    documents_required: ["Valid government-issued ID"],
    estimated_time: "3–5 days",
    important_note: null,
    egov_service_name: "PSA Marriage Certificate",
    egov_search_term: "PSA marriage certificate",
  },
  {
    step_number: 2,
    agency_name: "Social Security System",
    agency_code: "SSS",
    step_title: "Update your civil status and beneficiaries",
    step_type: "record_update",
    reason:
      "Updating your SSS record ensures your spouse is recognized as a beneficiary.",
    documents_required: ["PSA marriage certificate", "UMID or SSS ID"],
    estimated_time: "Same day",
    important_note: null,
    egov_service_name: "SSS Member Update",
    egov_search_term: "SSS update civil status",
  },
  {
    step_number: 3,
    agency_name: "Philippine Health Insurance Corporation",
    agency_code: "PHILHEALTH",
    step_title: "Add your spouse as a dependent",
    step_type: "record_update",
    reason:
      "Your spouse can be covered as your dependent, sharing your PhilHealth benefits.",
    documents_required: ["PSA marriage certificate", "PhilHealth MDR"],
    estimated_time: "Same day",
    important_note:
      "A non-working spouse can become your qualified dependent for free.",
    egov_service_name: "PhilHealth Dependent Update",
    egov_search_term: "PhilHealth add spouse dependent",
  },
  {
    step_number: 4,
    agency_name: "Home Development Mutual Fund",
    agency_code: "PAGIBIG",
    step_title: "Update your Pag-IBIG member information",
    step_type: "record_update",
    reason: "Keep your Pag-IBIG civil status and beneficiaries up to date.",
    documents_required: ["PSA marriage certificate", "Pag-IBIG MDF"],
    estimated_time: "Same day",
    important_note: null,
    egov_service_name: "Pag-IBIG Member Update",
    egov_search_term: "Pag-IBIG update civil status",
  },
  {
    step_number: 5,
    agency_name: "Bureau of Internal Revenue",
    agency_code: "BIR",
    step_title: "Update your civil status (BIR Form 2305)",
    step_type: "record_update",
    reason:
      "Your tax record should reflect your new civil status for correct withholding.",
    documents_required: ["PSA marriage certificate", "TIN"],
    estimated_time: "1–2 days",
    important_note: null,
    egov_service_name: "BIR Taxpayer Update",
    egov_search_term: "BIR form 2305 civil status",
  },
];

function countByType(steps: JourneyStep[], type: JourneyStep["step_type"]): number {
  return steps.filter((s) => s.step_type === type).length;
}

export const MOCK_JOURNEYS: Journey[] = [
  {
    id: "ehakbang:journey:1721530000000",
    emoji: "👶",
    life_event: "Had a Baby",
    summary:
      "Register your newborn and claim the maternity and health benefits you're entitled to, in the right order.",
    total_steps: hadABabySteps.length,
    record_updates: countByType(hadABabySteps, "record_update"),
    benefit_claims: countByType(hadABabySteps, "benefit_claim"),
    steps: hadABabySteps,
    status: "active",
    language: "en",
    created_at: "2026-07-18T09:00:00.000Z",
    completed_at: null,
    completed_step_numbers: [1, 2],
    paid_step_numbers: [],
    field_answers: {},
  },
  {
    id: "ehakbang:journey:1719500000000",
    emoji: "💍",
    life_event: "Got Married",
    summary:
      "Update your civil status across all government agencies so your spouse is recognized and your records stay accurate.",
    total_steps: gotMarriedSteps.length,
    record_updates: countByType(gotMarriedSteps, "record_update"),
    benefit_claims: countByType(gotMarriedSteps, "benefit_claim"),
    steps: gotMarriedSteps,
    status: "archived",
    language: "en",
    created_at: "2026-06-27T04:00:00.000Z",
    completed_at: "2026-07-05T07:30:00.000Z",
    completed_step_numbers: [1, 2, 3, 4, 5],
    paid_step_numbers: [],
    field_answers: {},
  },
];

export function getJourneyById(id: string): Journey | undefined {
  return MOCK_JOURNEYS.find((j) => j.id === id);
}

/** The most recent active journey — used as the default for Screen 2. */
export function getActiveJourney(): Journey | undefined {
  return MOCK_JOURNEYS.find((j) => j.status === "active");
}

export function getArchivedJourneys(): Journey[] {
  return MOCK_JOURNEYS.filter((j) => j.status !== "active");
}
