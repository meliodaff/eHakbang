import { describe, it, expect, vi, beforeEach } from "vitest";
import { getJourneyByEventId } from "@/lib/event-journeys";

// The module under test imports "server-only", which throws when it detects
// a DOM global (jsdom, the default test environment, has `window`). Stub it
// out so this server-side module can still be unit tested here.
vi.mock("server-only", () => ({}));

const { generateJourneyWithOpenAI } = vi.hoisted(() => ({
  generateJourneyWithOpenAI: vi.fn(),
}));
vi.mock("./openai-journey", () => ({
  generateJourneyWithOpenAI,
  // Pass-through inference stubs; decoration behaviour is covered by
  // openai-journey.test.ts and journey-eligibility.test.ts.
  inferFulfillsId: () => undefined,
  inferPrerequisite: () => null,
}));

import { getOrRegenerateCustomJourney, getOrRegenerateJourney } from "./journey-requirements";
import { customEventId } from "@/lib/custom-event";

const AI_GENERATED = {
  summary: "AI summary",
  title: "AI Title",
  model: "gpt-4.1",
  requires_evidence: false,
  evidence_title: null,
  evidence_description: null,
  steps: [
    {
      agency_name: "Social Security System",
      agency_code: "SSS",
      step_title: "AI step",
      step_type: "benefit_claim" as const,
      reason: "AI reason",
      documents_required: ["Some doc"],
      estimated_time: "2 weeks",
      important_note: null,
      fee: null,
      egov_service_name: "SSS Benefit",
      egov_search_term: "sss benefit",
      fulfills_id: undefined,
    },
  ],
};

describe("getOrRegenerateJourney", () => {
  beforeEach(() => {
    generateJourneyWithOpenAI.mockReset();
  });

  it("always generates fresh via OpenAI, never reads a cache", async () => {
    generateJourneyWithOpenAI.mockResolvedValue(AI_GENERATED);

    const result = await getOrRegenerateJourney({ eventId: "retired" });

    expect(generateJourneyWithOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: "retired", language: "en", heldIds: [] }),
    );
    expect(result.source).toBe("ai");
    expect(result.regenerated).toBe(true);
    expect(result.journey.summary).toBe(AI_GENERATED.summary);
  });

  it("passes the citizen's held IDs through to generation", async () => {
    generateJourneyWithOpenAI.mockResolvedValue(AI_GENERATED);

    await getOrRegenerateJourney({ eventId: "retired", heldIds: ["sss", "philhealth"] });

    expect(generateJourneyWithOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({ heldIds: ["sss", "philhealth"] }),
    );
  });

  it("falls back to the seed journey when OpenAI fails", async () => {
    generateJourneyWithOpenAI.mockRejectedValue(new Error("OpenAI error"));

    const result = await getOrRegenerateJourney({ eventId: "retired" });

    expect(result.source).toBe("seed");
    expect(result.regenerated).toBe(false);
    expect(result.journey.id).toBe(getJourneyByEventId("retired")!.id);
  });

  it("rejects an unknown eventId", async () => {
    await expect(
      getOrRegenerateJourney({ eventId: "not-a-real-event" }),
    ).rejects.toThrow();
  });
});

describe("getOrRegenerateCustomJourney", () => {
  beforeEach(() => {
    generateJourneyWithOpenAI.mockReset();
  });

  it("derives the journey id from the canonical slug, not the raw text, when provided", async () => {
    generateJourneyWithOpenAI.mockResolvedValue(AI_GENERATED);

    const result = await getOrRegenerateCustomJourney({
      text: "I got accepted as a PH rep for a tournament in the US",
      slug: "representing-ph-international-tournament",
    });

    const expectedId = `ehakbang:journey:event:${customEventId("representing-ph-international-tournament")}`;
    expect(result.journey.id).toBe(expectedId);
  });

  it("stores the AI-generated title as the journey's life_event label", async () => {
    generateJourneyWithOpenAI.mockResolvedValue(AI_GENERATED);

    const result = await getOrRegenerateCustomJourney({
      text: "I got accepted as a PH rep for a tournament in the US",
      slug: "representing-ph-international-tournament",
    });

    expect(result.journey.life_event).toBe(AI_GENERATED.title);
  });

  it("falls back to the truncated raw text when the AI omits a title", async () => {
    generateJourneyWithOpenAI.mockResolvedValue({ ...AI_GENERATED, title: "" });

    const result = await getOrRegenerateCustomJourney({ text: "I am adopting a rescue dog" });

    expect(result.journey.life_event).toBe("I am adopting a rescue dog");
  });

  it("derives the journey id by hashing the raw text when no slug is given", async () => {
    generateJourneyWithOpenAI.mockResolvedValue(AI_GENERATED);

    const result = await getOrRegenerateCustomJourney({ text: "I am adopting a rescue dog" });

    const expectedId = `ehakbang:journey:event:${customEventId("I am adopting a rescue dog")}`;
    expect(result.journey.id).toBe(expectedId);
  });

  it("passes the citizen's held IDs through to generation", async () => {
    generateJourneyWithOpenAI.mockResolvedValue(AI_GENERATED);

    await getOrRegenerateCustomJourney({
      text: "I am adopting a rescue dog",
      heldIds: ["umid"],
    });

    expect(generateJourneyWithOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({ heldIds: ["umid"] }),
    );
  });

  it("surfaces the AI's evidence decision onto the result", async () => {
    generateJourneyWithOpenAI.mockResolvedValue({
      ...AI_GENERATED,
      requires_evidence: true,
      evidence_title: "Attach proof of adoption",
      evidence_description: "Upload your adoption certificate.",
    });

    const result = await getOrRegenerateCustomJourney({ text: "I am adopting a rescue dog" });

    expect(result.requiresEvidence).toBe(true);
    expect(result.evidenceTitle).toBe("Attach proof of adoption");
    expect(result.evidenceDescription).toBe("Upload your adoption certificate.");
  });

  it("returns an empty fallback journey (not a throw) when generation fails", async () => {
    generateJourneyWithOpenAI.mockRejectedValue(new Error("OpenAI error"));

    const result = await getOrRegenerateCustomJourney({
      text: "I am adopting a rescue dog",
    });

    expect(result.source).toBe("seed");
    expect(result.journey.total_steps).toBe(0);
    expect(result.journey.life_event).toBe("I am adopting a rescue dog");
  });
});
