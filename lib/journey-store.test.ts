import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { EVENT_JOURNEYS, getJourneyByEventId } from "./event-journeys";
import {
  completeStep,
  getAllJourneys,
  getStoredJourney,
  markStepAutoApplied,
  markStepsApproved,
  markStepsClaimed,
  markStepsDone,
  markStepsPaid,
  resetJourney,
  startJourney,
} from "./journey-store";

const KEY = "ehakbang:journeys";

describe("journey-store persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("starts with an empty store (clean slate)", () => {
    expect(getAllJourneys()).toEqual([]);
  });

  it("replaces an existing empty journey only when repair is explicitly requested", () => {
    const catalog = EVENT_JOURNEYS["started-a-business"];
    const empty = { ...catalog, steps: [], total_steps: 0 };
    window.localStorage.setItem(KEY, JSON.stringify([empty]));

    expect(startJourney(catalog).steps).toHaveLength(0);

    const repaired = startJourney(catalog, { replaceExisting: true });
    expect(repaired.steps).toHaveLength(catalog.steps.length);
    expect(getStoredJourney(catalog.id)?.steps).toHaveLength(catalog.steps.length);
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

  it("folds wallet-satisfied steps in via completeStep's alsoComplete", () => {
    const catalog = EVENT_JOURNEYS["first-job"];
    // Suppose the user already holds SSS + Pag-IBIG (steps 2 and 4), then
    // manually completes step 1. All of 1,2,4 should be recorded.
    const updated = completeStep({ ...catalog }, 1, [2, 4]);
    expect(updated.completed_step_numbers.sort()).toEqual([1, 2, 4]);
    expect(updated.status).toBe("active");
  });

  it("markStepsDone completes a journey when it covers every step", () => {
    const catalog = EVENT_JOURNEYS["first-job"];
    const all = catalog.steps.map((s) => s.step_number);
    const updated = markStepsDone({ ...catalog }, all);
    expect(updated.completed_step_numbers.sort()).toEqual(all);
    expect(updated.status).toBe("completed");
    expect(updated.completed_at).not.toBeNull();
  });

  it("persists a journey once a step is completed", () => {
    const catalog = getJourneyByEventId("got-married")!;
    completeStep(catalog, 1);
    expect(getStoredJourney(catalog.id)?.completed_step_numbers).toEqual([1]);
  });

  it("markStepsPaid persists paid step numbers without affecting completion", () => {
    const catalog = getJourneyByEventId("got-married")!;
    const updated = markStepsPaid({ ...catalog }, [1]);
    expect(updated.paid_step_numbers).toEqual([1]);
    expect(updated.completed_step_numbers).toEqual([]);
    expect(updated.status).toBe("active");
  });

  it("markStepsPaid merges with previously paid step numbers", () => {
    const catalog = getJourneyByEventId("got-married")!;
    markStepsPaid({ ...catalog }, [1]);
    const updated = markStepsPaid(getStoredJourney(catalog.id)!, [2]);
    expect(updated.paid_step_numbers.sort()).toEqual([1, 2]);
  });

  it("completeStep preserves previously paid step numbers", () => {
    const catalog = getJourneyByEventId("got-married")!;
    markStepsPaid({ ...catalog }, [1]);
    const updated = completeStep(getStoredJourney(catalog.id)!, 1);
    expect(updated.paid_step_numbers).toEqual([1]);
    expect(updated.completed_step_numbers).toEqual([1]);
  });

  it("markStepAutoApplied completes the step and records it as auto-applied", () => {
    const catalog = getJourneyByEventId("got-married")!;
    const updated = markStepAutoApplied({ ...catalog }, 1);
    expect(updated.completed_step_numbers).toEqual([1]);
    expect(updated.auto_applied_step_numbers).toEqual([1]);
    expect(updated.claimed_step_numbers).toEqual([]);
  });

  it("markStepAutoApplied folds in wallet-satisfied steps like completeStep", () => {
    const catalog = getJourneyByEventId("first-job")!;
    const updated = markStepAutoApplied({ ...catalog }, 1, [2, 4]);
    expect(updated.completed_step_numbers.sort()).toEqual([1, 2, 4]);
    expect(updated.auto_applied_step_numbers).toEqual([1]);
  });

  it("markStepsApproved completes multiple submitted steps and records them as auto-applied", () => {
    const catalog = getJourneyByEventId("first-job")!;
    const updated = markStepsApproved({ ...catalog }, [1, 3]);
    expect(updated.completed_step_numbers.sort()).toEqual([1, 3]);
    expect(updated.auto_applied_step_numbers.sort()).toEqual([1, 3]);
    expect(updated.claimed_step_numbers).toEqual([]);
  });

  it("markStepsApproved keeps alsoComplete steps out of auto_applied_step_numbers", () => {
    const catalog = getJourneyByEventId("first-job")!;
    // Steps 2/4 are folded in as wallet-satisfied (not actually submitted),
    // so they shouldn't get a "claim your document" prompt.
    const updated = markStepsApproved({ ...catalog }, [1], [2, 4]);
    expect(updated.completed_step_numbers.sort()).toEqual([1, 2, 4]);
    expect(updated.auto_applied_step_numbers).toEqual([1]);
  });

  it("markStepsClaimed records claimed steps without affecting completion", () => {
    const catalog = getJourneyByEventId("got-married")!;
    markStepAutoApplied({ ...catalog }, 1);
    const updated = markStepsClaimed(getStoredJourney(catalog.id)!, [1]);
    expect(updated.claimed_step_numbers).toEqual([1]);
    expect(updated.completed_step_numbers).toEqual([1]);
    expect(updated.auto_applied_step_numbers).toEqual([1]);
  });

  it("markStepsClaimed merges with previously claimed step numbers", () => {
    const catalog = getJourneyByEventId("got-married")!;
    markStepAutoApplied({ ...catalog }, 1);
    markStepAutoApplied(getStoredJourney(catalog.id)!, 2);
    markStepsClaimed(getStoredJourney(catalog.id)!, [1]);
    const updated = markStepsClaimed(getStoredJourney(catalog.id)!, [2]);
    expect(updated.claimed_step_numbers.sort()).toEqual([1, 2]);
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
