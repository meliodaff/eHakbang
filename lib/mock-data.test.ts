import { describe, it, expect } from "vitest";
import { MOCK_JOURNEYS, getActiveJourney, getArchivedJourneys } from "./mock-data";
import { LIFE_EVENTS, COMMON_LIFE_EVENTS } from "./events";
import type { StepType } from "./types";

describe("life events", () => {
  it("provides at least 8 common predefined cards (PRD FR-02)", () => {
    expect(COMMON_LIFE_EVENTS.length).toBeGreaterThanOrEqual(8);
  });

  it("gives every event an emoji, Filipino label, and English sublabel", () => {
    for (const event of LIFE_EVENTS) {
      expect(event.emoji).not.toBe("");
      expect(event.label).not.toBe("");
      expect(event.sublabel).not.toBe("");
      expect(event.description.length).toBeGreaterThan(0);
    }
  });

  it("uses unique event ids", () => {
    const ids = LIFE_EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("mock journeys", () => {
  it("keeps total_steps in sync with the steps array", () => {
    for (const journey of MOCK_JOURNEYS) {
      expect(journey.total_steps).toBe(journey.steps.length);
    }
  });

  it("keeps record_updates and benefit_claims counts accurate", () => {
    for (const journey of MOCK_JOURNEYS) {
      const count = (type: StepType) =>
        journey.steps.filter((s) => s.step_type === type).length;
      expect(journey.record_updates).toBe(count("record_update"));
      expect(journey.benefit_claims).toBe(count("benefit_claim"));
      expect(journey.record_updates + journey.benefit_claims).toBe(
        journey.total_steps,
      );
    }
  });

  it("numbers steps sequentially from 1", () => {
    for (const journey of MOCK_JOURNEYS) {
      journey.steps.forEach((step, i) => {
        expect(step.step_number).toBe(i + 1);
      });
    }
  });

  it("only references completed steps that exist", () => {
    for (const journey of MOCK_JOURNEYS) {
      const validNumbers = new Set(journey.steps.map((s) => s.step_number));
      for (const n of journey.completed_step_numbers) {
        expect(validNumbers.has(n)).toBe(true);
      }
    }
  });

  it("includes at least one journey with benefit-claim steps", () => {
    expect(MOCK_JOURNEYS.some((j) => j.benefit_claims > 0)).toBe(true);
  });

  it("exposes an active journey and archived journeys", () => {
    expect(getActiveJourney()).toBeDefined();
    expect(getArchivedJourneys().length).toBeGreaterThan(0);
  });
});
