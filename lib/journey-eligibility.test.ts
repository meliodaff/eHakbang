import { describe, it, expect } from "vitest";
import {
  getEligibilityRequirements,
  checkEligibility,
  inferEligibility,
  type EligibilityRequirements,
} from "./journey-eligibility";
import type { JourneyStep } from "./types";

const benefit = (overrides: Partial<JourneyStep> = {}): JourneyStep => ({
  step_number: 1,
  agency_name: "Social Security System",
  agency_code: "SSS",
  step_title: "Claim your SSS maternity benefit",
  step_type: "benefit_claim",
  reason: "Cash maternity benefit.",
  documents_required: ["SSS Maternity Notification"],
  estimated_time: "2–4 weeks",
  important_note: null,
  egov_service_name: "SSS Maternity Benefit",
  egov_search_term: "SSS maternity benefit",
  ...overrides,
});

describe("getEligibilityRequirements", () => {
  it("returns null for a record_update step", () => {
    expect(
      getEligibilityRequirements(benefit({ step_type: "record_update" })),
    ).toBeNull();
  });

  it("returns null for a benefit with no eligibility config and no contribution prerequisite", () => {
    expect(getEligibilityRequirements(benefit())).toBeNull();
  });

  it("derives requiresContributions from a contribution-type prerequisite", () => {
    const reqs = getEligibilityRequirements(
      benefit({ prerequisite: { required_id: "sss", prerequisite_type: "contribution" } }),
    );
    expect(reqs?.requiresContributions).toBe(true);
  });

  it("reads the filing window from eligibility config", () => {
    const reqs = getEligibilityRequirements(
      benefit({
        eligibility: {
          filing_window_days: 3650,
          filing_window_label: "10 years",
          contingency_label: "Date of delivery",
        },
      }),
    );
    expect(reqs).toMatchObject({
      filingWindowDays: 3650,
      filingWindowLabel: "10 years",
      contingencyLabel: "Date of delivery",
    });
  });
});

const windowReqs: EligibilityRequirements = {
  contingencyLabel: "Date of delivery",
  filingWindowDays: 3650,
  filingWindowLabel: "10 years",
  requiresContributions: true,
};

const now = new Date("2026-07-28T00:00:00.000Z");

describe("checkEligibility", () => {
  it("needs the contingency date before it can check a filing window", () => {
    const r = checkEligibility(windowReqs, {}, now);
    expect(r.status).toBe("needs-info");
  });

  it("flags a claim past its filing window as lapsed", () => {
    const r = checkEligibility(
      windowReqs,
      { contingencyDate: "2000-01-01", contributionsPosted: true },
      now,
    );
    expect(r.status).toBe("lapsed");
  });

  it("blocks with not-yet when required contributions aren't posted", () => {
    const r = checkEligibility(
      windowReqs,
      { contingencyDate: "2026-06-01", contributionsPosted: false },
      now,
    );
    expect(r.status).toBe("not-yet");
  });

  it("returns eligible within the window with contributions posted", () => {
    const r = checkEligibility(
      windowReqs,
      { contingencyDate: "2026-06-01", contributionsPosted: true },
      now,
    );
    expect(r.status).toBe("eligible");
  });

  it("treats a future contingency date as within the window (not lapsed)", () => {
    const r = checkEligibility(
      { ...windowReqs, requiresContributions: false },
      { contingencyDate: "2027-01-01" },
      now,
    );
    expect(r.status).toBe("eligible");
  });

  it("checks contributions only when no filing window is configured", () => {
    const reqs: EligibilityRequirements = {
      contingencyLabel: "Date of the event",
      filingWindowDays: null,
      filingWindowLabel: null,
      requiresContributions: true,
    };
    expect(checkEligibility(reqs, { contributionsPosted: false }, now).status).toBe(
      "not-yet",
    );
    expect(checkEligibility(reqs, { contributionsPosted: true }, now).status).toBe(
      "eligible",
    );
  });
});

describe("inferEligibility", () => {
  it("infers a 10-year filing window for SSS benefit claims", () => {
    expect(inferEligibility(benefit({ agency_code: "SSS" }))).toMatchObject({
      filing_window_days: 3650,
      filing_window_label: "10 years",
    });
  });

  it("infers a 60-day filing window for PhilHealth benefit claims", () => {
    expect(
      inferEligibility(benefit({ agency_code: "PHILHEALTH" })),
    ).toMatchObject({ filing_window_days: 60, filing_window_label: "60 days" });
  });

  it("returns null for record updates and agencies with no known window", () => {
    expect(inferEligibility(benefit({ step_type: "record_update", agency_code: "SSS" }))).toBeNull();
    expect(inferEligibility(benefit({ agency_code: "PAGIBIG" }))).toBeNull();
    expect(inferEligibility(benefit({ agency_code: "DSWD" }))).toBeNull();
  });
});
