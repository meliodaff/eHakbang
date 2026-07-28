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

const { getSupabaseServerClient } = vi.hoisted(() => ({
  getSupabaseServerClient: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ getSupabaseServerClient }));
vi.mock("@/lib/journey-eligibility", () => ({ inferEligibility: () => null }));

import { getOrRegenerateCustomJourney, getOrRegenerateJourney } from "./journey-requirements";
import { customEventId } from "@/lib/custom-event";

function makeSupabaseMock(opts: { existing?: unknown | null } = {}) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    upsert: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => ({ data: opts.existing ?? null, error: null })),
    single: vi.fn(async () => ({ data: null, error: null })),
  };
  return { from: vi.fn(() => builder), builder };
}

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
    getSupabaseServerClient.mockReset();
  });

  it("serves from Supabase cache when the cached row is fresh (<24h)", async () => {
    const cached = {
      event_id: "retired",
      language: "en",
      emoji: "🧓",
      life_event: "Retired",
      summary: "Cached summary",
      steps: AI_GENERATED.steps,
      total_steps: 1,
      record_updates: 0,
      benefit_claims: 1,
      updated_at: new Date().toISOString(), // fresh
    };
    getSupabaseServerClient.mockReturnValue(makeSupabaseMock({ existing: cached }).from(""));
    // Patch: mockReturnValue of the root `from` call
    const mock = makeSupabaseMock({ existing: cached });
    getSupabaseServerClient.mockReturnValue(mock);

    const result = await getOrRegenerateJourney({ eventId: "retired" });

    expect(generateJourneyWithOpenAI).not.toHaveBeenCalled();
    expect(result.regenerated).toBe(false);
    expect(result.journey.summary).toBe("Cached summary");
  });

  it("regenerates via OpenAI when there's no cached row, and upserts the result", async () => {
    const mock = makeSupabaseMock({ existing: null });
    getSupabaseServerClient.mockReturnValue(mock);
    generateJourneyWithOpenAI.mockResolvedValue(AI_GENERATED);

    const result = await getOrRegenerateJourney({ eventId: "retired" });

    expect(generateJourneyWithOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: "retired", language: "en", heldIds: [] }),
    );
    expect(result.source).toBe("ai");
    expect(result.regenerated).toBe(true);
    // Verify upsert was called
    expect(mock.builder.upsert).toHaveBeenCalled();
  });

  it("falls back to the seed journey when both cache and OpenAI fail", async () => {
    getSupabaseServerClient.mockImplementation(() => {
      throw new Error("Supabase is not configured");
    });
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
