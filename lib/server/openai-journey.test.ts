import { describe, it, expect, vi } from "vitest";

// The module under test imports "server-only" (throws under jsdom) and the
// "openai" SDK; stub both so the pure inferPrerequisite export can be tested.
vi.mock("server-only", () => ({}));
vi.mock("openai", () => ({ default: class {} }));

import { inferPrerequisite, inferFulfillsId } from "./openai-journey";
import type { JourneyStep } from "@/lib/types";

type StepInput = Pick<JourneyStep, "step_type" | "agency_code" | "step_title">;

const benefit = (agency_code: string, step_title = "Claim a benefit"): StepInput => ({
  step_type: "benefit_claim",
  agency_code,
  step_title,
});

describe("inferPrerequisite", () => {
  it("maps a PhilHealth benefit claim to a membership prerequisite", () => {
    expect(inferPrerequisite(benefit("PHILHEALTH"))).toEqual({
      required_id: "philhealth",
      prerequisite_type: "membership",
    });
  });

  it("maps an SSS benefit claim to a contribution prerequisite", () => {
    expect(inferPrerequisite(benefit("SSS", "Claim your SSS maternity benefit"))).toEqual(
      { required_id: "sss", prerequisite_type: "contribution" },
    );
  });

  it("maps a Pag-IBIG benefit claim to a membership prerequisite", () => {
    expect(inferPrerequisite(benefit("PAGIBIG"))).toEqual({
      required_id: "pagibig",
      prerequisite_type: "membership",
    });
  });

  it("is case-insensitive on the agency code", () => {
    expect(inferPrerequisite(benefit("philhealth"))?.required_id).toBe("philhealth");
  });

  it("returns null for a record_update step (never blocked)", () => {
    expect(
      inferPrerequisite({
        step_type: "record_update",
        agency_code: "PHILHEALTH",
        step_title: "Add newborn as dependent",
      }),
    ).toBeNull();
  });

  it("returns null for an agency with no known membership prerequisite", () => {
    expect(inferPrerequisite(benefit("PSA", "Register birth"))).toBeNull();
    expect(inferPrerequisite(benefit("DSWD"))).toBeNull();
  });
});

describe("inferFulfillsId", () => {
  it("tags a record-update that obtains an ID", () => {
    expect(
      inferFulfillsId({
        step_type: "record_update",
        agency_code: "SSS",
        step_title: "Get your SSS number",
      }),
    ).toBe("sss");
  });

  it("never tags a benefit claim, even when the title names the agency", () => {
    expect(
      inferFulfillsId({
        step_type: "benefit_claim",
        agency_code: "SSS",
        step_title: "File for SSS Maternity Benefit",
      }),
    ).toBeUndefined();
    expect(
      inferFulfillsId({
        step_type: "benefit_claim",
        agency_code: "PAGIBIG",
        step_title: "File for Pag-IBIG Maternity (MP2) Claim",
      }),
    ).toBeUndefined();
  });
});
