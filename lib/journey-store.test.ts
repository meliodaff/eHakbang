import { describe, it, expect, afterEach } from "vitest";
import {
  completeStep,
  getStoredJourney,
  resetJourney,
} from "./journey-store";
import { getJourneyByEventId } from "./event-journeys";

afterEach(() => {
  localStorage.clear();
});

describe("journey-store", () => {
  it("persists a journey once a step is completed", () => {
    const catalog = getJourneyByEventId("got-married")!;
    completeStep(catalog, 1);
    expect(getStoredJourney(catalog.id)?.completed_step_numbers).toEqual([1]);
  });

  it("resetJourney removes only the matching event's stored journey", () => {
    const married = getJourneyByEventId("got-married")!;
    const baby = getJourneyByEventId("had-a-baby")!;
    completeStep(married, 1);
    completeStep(baby, 1);

    resetJourney("got-married");

    expect(getStoredJourney(married.id)).toBeUndefined();
    expect(getStoredJourney(baby.id)?.completed_step_numbers).toEqual([1]);
  });
});
