import { describe, it, expect } from "vitest";
import { inferRequiredExistingId, isStepNotApplicable } from "./journey-record-update-gate";
import type { JourneyStep } from "./types";

const updateStep: JourneyStep = {
  step_number: 1,
  agency_name: "Social Security System",
  agency_code: "SSS",
  step_title: "Update civil status & beneficiaries",
  step_type: "record_update",
  reason: "Ensures your spouse is recognized as a beneficiary.",
  documents_required: ["PSA marriage certificate"],
  estimated_time: "Same day",
  important_note: null,
  egov_service_name: "SSS Member Update",
  egov_search_term: "SSS update civil status",
};

const obtainStep: JourneyStep = {
  ...updateStep,
  step_title: "Register for your SSS number",
  fulfills_id: "sss",
};

const benefitClaimStep: JourneyStep = {
  ...updateStep,
  step_type: "benefit_claim",
};

const unmappedAgencyStep: JourneyStep = {
  ...updateStep,
  agency_name: "Philippine Statistics Authority",
  agency_code: "PSA",
};

describe("inferRequiredExistingId", () => {
  it("resolves the ID an update step requires", () => {
    expect(inferRequiredExistingId(updateStep)).toBe("sss");
  });

  it("returns undefined for a step that obtains a new ID (fulfills_id set)", () => {
    expect(inferRequiredExistingId(obtainStep)).toBeUndefined();
  });

  it("returns undefined for a benefit_claim step", () => {
    expect(inferRequiredExistingId(benefitClaimStep)).toBeUndefined();
  });

  it("returns undefined when the agency has no wallet ID type", () => {
    expect(inferRequiredExistingId(unmappedAgencyStep)).toBeUndefined();
  });
});

describe("isStepNotApplicable", () => {
  it("is true when the citizen doesn't hold the ID an update step needs", () => {
    expect(isStepNotApplicable(updateStep, [])).toBe(true);
  });

  it("is false once the citizen holds that ID", () => {
    expect(isStepNotApplicable(updateStep, ["sss"])).toBe(false);
  });

  it("is false for an obtain step regardless of held IDs", () => {
    expect(isStepNotApplicable(obtainStep, [])).toBe(false);
  });

  it("is false for a benefit_claim step", () => {
    expect(isStepNotApplicable(benefitClaimStep, [])).toBe(false);
  });
});
