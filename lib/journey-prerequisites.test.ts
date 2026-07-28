import { describe, it, expect } from "vitest";
import { getPrerequisiteState, isStepBlocked } from "./journey-prerequisites";
import type { IdType, JourneyStep } from "./types";

const baseBenefit: JourneyStep = {
  step_number: 1,
  agency_name: "Philippine Health Insurance Corporation",
  agency_code: "PHILHEALTH",
  step_title: "Claim maternity & newborn benefits",
  step_type: "benefit_claim",
  reason: "Helps cover delivery.",
  documents_required: ["PhilHealth MDR"],
  estimated_time: "At discharge",
  important_note: null,
  egov_service_name: "PhilHealth Benefit Claim",
  egov_search_term: "PhilHealth maternity benefit claim",
};

const membershipBenefit: JourneyStep = {
  ...baseBenefit,
  prerequisite: { required_id: "philhealth", prerequisite_type: "membership" },
};

const contributionBenefit: JourneyStep = {
  ...baseBenefit,
  step_title: "Claim your SSS maternity benefit",
  agency_code: "SSS",
  prerequisite: { required_id: "sss", prerequisite_type: "contribution" },
};

const recordStep: JourneyStep = {
  ...baseBenefit,
  step_type: "record_update",
  // Even with a stray prerequisite, a non-benefit step is never blocked.
  prerequisite: { required_id: "philhealth", prerequisite_type: "membership" },
};

describe("getPrerequisiteState", () => {
  it("returns 'none' when the step has no prerequisite", () => {
    expect(getPrerequisiteState(baseBenefit, [])).toBe("none");
  });

  it("returns 'none' for a non-benefit step even if a prerequisite is set", () => {
    expect(getPrerequisiteState(recordStep, [])).toBe("none");
  });

  it("returns 'met' when the required ID is already held", () => {
    const held: IdType[] = ["philhealth"];
    expect(getPrerequisiteState(membershipBenefit, held)).toBe("met");
  });

  it("returns 'blocked-membership' when a membership ID is missing", () => {
    expect(getPrerequisiteState(membershipBenefit, [])).toBe("blocked-membership");
  });

  it("returns 'blocked-contribution' when a contribution ID is missing", () => {
    expect(getPrerequisiteState(contributionBenefit, [])).toBe(
      "blocked-contribution",
    );
  });

  it("returns 'met' for a contribution prerequisite once the ID is held", () => {
    expect(getPrerequisiteState(contributionBenefit, ["sss"])).toBe("met");
  });
});

describe("isStepBlocked", () => {
  it("is true only for a blocked prerequisite", () => {
    expect(isStepBlocked(membershipBenefit, [])).toBe(true);
    expect(isStepBlocked(contributionBenefit, [])).toBe(true);
  });

  it("is false when met, absent, or on a non-benefit step", () => {
    expect(isStepBlocked(membershipBenefit, ["philhealth"])).toBe(false);
    expect(isStepBlocked(baseBenefit, [])).toBe(false);
    expect(isStepBlocked(recordStep, [])).toBe(false);
  });
});
