import { describe, it, expect } from "vitest";
import { EVENT_JOURNEYS, getJourneyByEventId, getEventJourneyById } from "./event-journeys";
import { LIFE_EVENTS } from "./events";
import type { StepType } from "./types";

describe("event journeys", () => {
  it("has a journey for every predefined life event", () => {
    for (const event of LIFE_EVENTS) {
      expect(getJourneyByEventId(event.id)).toBeDefined();
    }
  });

  it("keeps each journey self-consistent (counts, numbering, steps)", () => {
    for (const journey of Object.values(EVENT_JOURNEYS)) {
      expect(journey.steps.length).toBeGreaterThan(0);
      expect(journey.total_steps).toBe(journey.steps.length);

      const count = (t: StepType) =>
        journey.steps.filter((s) => s.step_type === t).length;
      expect(journey.record_updates).toBe(count("record_update"));
      expect(journey.benefit_claims).toBe(count("benefit_claim"));
      expect(journey.record_updates + journey.benefit_claims).toBe(
        journey.total_steps,
      );

      journey.steps.forEach((step, i) => {
        expect(step.step_number).toBe(i + 1);
        expect(step.agency_name).not.toBe("");
        expect(step.documents_required.length).toBeGreaterThan(0);
      });

      // Fresh journeys start uncompleted.
      expect(journey.completed_step_numbers).toEqual([]);
      expect(journey.status).toBe("active");
    }
  });

  it("resolves an event journey by its full id", () => {
    const married = getJourneyByEventId("got-married");
    expect(married).toBeDefined();
    expect(getEventJourneyById(married!.id)?.id).toBe(married!.id);
  });

  it("returns undefined for an unknown event id", () => {
    expect(getJourneyByEventId("no-such-event")).toBeUndefined();
  });

  it("gives the Had a Baby PhilHealth & SSS claims their enroll-first prerequisites", () => {
    const baby = getJourneyByEventId("had-a-baby")!;

    const philhealthClaim = baby.steps.find(
      (s) => s.agency_code === "PHILHEALTH" && s.step_type === "benefit_claim",
    );
    expect(philhealthClaim?.prerequisite).toMatchObject({
      required_id: "philhealth",
      prerequisite_type: "membership",
    });

    const sssClaim = baby.steps.find(
      (s) => s.agency_code === "SSS" && s.step_type === "benefit_claim",
    );
    expect(sssClaim?.prerequisite).toMatchObject({
      required_id: "sss",
      prerequisite_type: "contribution",
    });
    expect(sssClaim?.eligibility).toMatchObject({ filing_window_days: 3650 });

    const philhealthEligibility = baby.steps.find(
      (s) => s.agency_code === "PHILHEALTH" && s.step_type === "benefit_claim",
    )?.eligibility;
    expect(philhealthEligibility).toMatchObject({ filing_window_days: 60 });
  });
});
