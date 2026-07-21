import { describe, it, expect } from "vitest";
import { generateJourney, fetchJourney, listJourneys } from "./api-client";
import { MOCK_JOURNEYS } from "./mock-data";

describe("api-client (mock stub)", () => {
  it("generateJourney returns a typed journey with steps", async () => {
    const journey = await generateJourney({ lifeEvent: "I had a baby" });
    expect(journey).toBeDefined();
    expect(journey.total_steps).toBe(journey.steps.length);
    expect(journey.steps.length).toBeGreaterThan(0);
  });

  it("fetchJourney resolves a known journey by id", async () => {
    const target = MOCK_JOURNEYS[0];
    const journey = await fetchJourney(target.id);
    expect(journey?.id).toBe(target.id);
  });

  it("fetchJourney returns undefined for an unknown id", async () => {
    expect(await fetchJourney("does-not-exist")).toBeUndefined();
  });

  it("listJourneys returns active journey first", async () => {
    const list = await listJourneys();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].status).toBe("active");
  });
});
