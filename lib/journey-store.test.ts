import { beforeEach, describe, expect, it } from "vitest";
import { EVENT_JOURNEYS } from "./event-journeys";
import { completeStep, getAllJourneys, getStoredJourney } from "./journey-store";

const KEY = "ehakbang:journeys";

describe("journey-store persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts with an empty store (clean slate)", () => {
    expect(getAllJourneys()).toEqual([]);
  });

  it("saves the journey to localStorage when one step is marked done", () => {
    const catalog = EVENT_JOURNEYS["got-married"];
    expect(getStoredJourney(catalog.id)).toBeUndefined();

    // Simulate the user clicking "Mark as Done" on the first step.
    completeStep({ ...catalog }, 1);

    const saved = getStoredJourney(catalog.id);
    expect(saved).toBeDefined();
    expect(saved?.status).toBe("active");
    expect(saved?.completed_step_numbers).toContain(1);

    // Verify it is actually persisted in localStorage, not just in memory.
    const raw = window.localStorage.getItem(KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string)[0].id).toBe(catalog.id);
  });

  it("resumes saved progress instead of duplicating the journey", () => {
    const catalog = EVENT_JOURNEYS["got-married"];
    completeStep({ ...catalog }, 1);
    completeStep(getStoredJourney(catalog.id)!, 2);

    const all = getAllJourneys();
    expect(all).toHaveLength(1);
    expect(all[0].completed_step_numbers).toEqual([1, 2]);
  });

  it("marks the journey completed once every step is done", () => {
    const catalog = EVENT_JOURNEYS["got-married"];
    let current = { ...catalog };
    for (let n = 1; n <= catalog.total_steps; n++) {
      current = completeStep(current, n);
    }
    expect(current.status).toBe("completed");
    expect(current.completed_at).not.toBeNull();
  });
});
