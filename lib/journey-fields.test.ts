import { describe, it, expect } from "vitest";
import { getMissingRequiredFields, hasMissingRequiredFields } from "./journey-fields";
import type { JourneyStep } from "./types";

function step(overrides: Partial<JourneyStep>): JourneyStep {
  return {
    step_number: 1,
    agency_name: "Test Agency",
    agency_code: "TEST",
    step_title: "Test step",
    step_type: "record_update",
    reason: "Because.",
    documents_required: [],
    estimated_time: "1 day",
    important_note: null,
    egov_service_name: "Test Service",
    egov_search_term: "test",
    ...overrides,
  };
}

describe("getMissingRequiredFields", () => {
  it("returns nothing for a step with no required_fields", () => {
    const steps = [step({})];
    expect(getMissingRequiredFields(steps, {})).toEqual([]);
  });

  it("flags a required field with no answer yet", () => {
    const steps = [
      step({
        step_number: 1,
        agency_name: "DTI",
        step_title: "Register your business name",
        required_fields: [
          { field_key: "proposed_business_name", label: "Proposed business name", field_type: "text", required: true },
        ],
      }),
    ];
    const missing = getMissingRequiredFields(steps, {});
    expect(missing).toEqual([
      {
        stepNumber: 1,
        agencyName: "DTI",
        stepTitle: "Register your business name",
        field: { field_key: "proposed_business_name", label: "Proposed business name", field_type: "text", required: true },
      },
    ]);
  });

  it("doesn't flag a field once it's been answered", () => {
    const steps = [
      step({
        step_number: 1,
        required_fields: [
          { field_key: "proposed_business_name", label: "Proposed business name", field_type: "text", required: true },
        ],
      }),
    ];
    const answers = { 1: { proposed_business_name: "Juana's Sari-Sari Store" } };
    expect(getMissingRequiredFields(steps, answers)).toEqual([]);
  });

  it("treats a whitespace-only answer as unanswered", () => {
    const steps = [
      step({
        step_number: 1,
        required_fields: [
          { field_key: "proposed_business_name", label: "Proposed business name", field_type: "text", required: true },
        ],
      }),
    ];
    const answers = { 1: { proposed_business_name: "   " } };
    expect(getMissingRequiredFields(steps, answers)).toHaveLength(1);
  });

  it("ignores optional (required: false) fields left blank", () => {
    const steps = [
      step({
        step_number: 1,
        required_fields: [
          { field_key: "middle_name", label: "Middle name", field_type: "text", required: false },
        ],
      }),
    ];
    expect(getMissingRequiredFields(steps, {})).toEqual([]);
  });
});

describe("hasMissingRequiredFields", () => {
  it("is false when nothing is missing", () => {
    expect(hasMissingRequiredFields([step({})], {})).toBe(false);
  });

  it("is true when a required field is unanswered", () => {
    const steps = [
      step({
        step_number: 1,
        required_fields: [
          { field_key: "bank_account", label: "Bank account number", field_type: "text", required: true },
        ],
      }),
    ];
    expect(hasMissingRequiredFields(steps, {})).toBe(true);
  });
});
