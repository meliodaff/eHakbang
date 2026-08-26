import { describe, it, expect, vi, beforeEach } from "vitest";
import { getJourneyByEventId } from "@/lib/event-journeys";

// The module under test imports "server-only", which throws when it detects
// a DOM global (jsdom, the default test environment, has `window`). Stub it
// out so this server-side module can still be unit tested here.
vi.mock("server-only", () => ({}));

const { generateJourneyWithEgovAI } = vi.hoisted(() => ({
  generateJourneyWithEgovAI: vi.fn(),
}));
vi.mock("./egov-ai-journey", () => ({
  generateJourneyWithEgovAI,
  // Pass-through inference stubs; decoration behaviour is covered by
  // egov-ai-journey.test.ts and journey-eligibility tests.
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
  model: "egov-ai-assistant",
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
    generateJourneyWithEgovAI.mockReset();
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
    const mock = makeSupabaseMock({ existing: cached });
    getSupabaseServerClient.mockReturnValue(mock);

    const result = await getOrRegenerateJourney({ eventId: "retired" });

    expect(generateJourneyWithEgovAI).not.toHaveBeenCalled();
    expect(result.regenerated).toBe(false);
    expect(result.journey.summary).toBe("Cached summary");
  });

  it("ignores a fresh cached row with no steps and regenerates it", async () => {
    const emptyCached = {
      event_id: "started-a-business",
      language: "en",
      emoji: "🏪",
      life_event: "Started a Business",
      summary: "Empty cached summary",
      steps: [],
      total_steps: 0,
      record_updates: 0,
      benefit_claims: 0,
      updated_at: new Date().toISOString(),
    };
    const mock = makeSupabaseMock({ existing: emptyCached });
    getSupabaseServerClient.mockReturnValue(mock);
    generateJourneyWithEgovAI.mockResolvedValue(AI_GENERATED);

    const result = await getOrRegenerateJourney({ eventId: "started-a-business" });

    expect(generateJourneyWithEgovAI).toHaveBeenCalledOnce();
    expect(result.source).toBe("ai");
    expect(result.journey.steps).toHaveLength(1);
    expect(mock.builder.upsert).toHaveBeenCalled();
  });

  it("regenerates via eGov AI when there's no cached row, and upserts the result", async () => {
    const mock = makeSupabaseMock({ existing: null });
    getSupabaseServerClient.mockReturnValue(mock);
    generateJourneyWithEgovAI.mockResolvedValue(AI_GENERATED);

    const result = await getOrRegenerateJourney({ eventId: "retired" });

    expect(generateJourneyWithEgovAI).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: "retired", language: "en", heldIds: [] }),
    );
    expect(result.source).toBe("ai");
    expect(result.regenerated).toBe(true);
    // Verify upsert was called
    expect(mock.builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ model: "egov-ai-assistant" }),
      { onConflict: "event_id,language" },
    );
  });

  it("falls back to the preset seed when the generator returns no steps", async () => {
    const mock = makeSupabaseMock({ existing: null });
    getSupabaseServerClient.mockReturnValue(mock);
    generateJourneyWithEgovAI.mockResolvedValue({ ...AI_GENERATED, steps: [] });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await getOrRegenerateJourney({ eventId: "started-a-business" });

    expect(result.source).toBe("seed");
    expect(result.regenerated).toBe(false);
    expect(result.journey.steps.length).toBeGreaterThan(0);
    expect(result.journey.steps).toHaveLength(
      getJourneyByEventId("started-a-business")!.steps.length,
    );
    expect(mock.builder.upsert).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("failed, using fallback"),
    );
    expect(error).not.toHaveBeenCalled();
    warn.mockRestore();
    error.mockRestore();
  });

  it("falls back to the seed journey when both cache and eGov AI fail", async () => {
    getSupabaseServerClient.mockImplementation(() => {
      throw new Error("Supabase is not configured");
    });
    generateJourneyWithEgovAI.mockRejectedValue(new Error("eGov AI error"));

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
    generateJourneyWithEgovAI.mockReset();
  });

  it("derives the journey id from the canonical slug, not the raw text, when provided", async () => {
    generateJourneyWithEgovAI.mockResolvedValue(AI_GENERATED);

    const result = await getOrRegenerateCustomJourney({
      text: "I got accepted as a PH rep for a tournament in the US",
      slug: "representing-ph-international-tournament",
    });

    const expectedId = `ehakbang:journey:event:${customEventId("representing-ph-international-tournament")}`;
    expect(result.journey.id).toBe(expectedId);
  });

  it("stores the AI-generated title as the journey's life_event label", async () => {
    generateJourneyWithEgovAI.mockResolvedValue(AI_GENERATED);

    const result = await getOrRegenerateCustomJourney({
      text: "I got accepted as a PH rep for a tournament in the US",
      slug: "representing-ph-international-tournament",
    });

    expect(result.journey.life_event).toBe(AI_GENERATED.title);
  });

  it("falls back to the truncated raw text when the AI omits a title", async () => {
    generateJourneyWithEgovAI.mockResolvedValue({ ...AI_GENERATED, title: "" });

    const result = await getOrRegenerateCustomJourney({ text: "I am adopting a rescue dog" });

    expect(result.journey.life_event).toBe("I am adopting a rescue dog");
  });

  it("derives the journey id by hashing the raw text when no slug is given", async () => {
    generateJourneyWithEgovAI.mockResolvedValue(AI_GENERATED);

    const result = await getOrRegenerateCustomJourney({ text: "I am adopting a rescue dog" });

    const expectedId = `ehakbang:journey:event:${customEventId("I am adopting a rescue dog")}`;
    expect(result.journey.id).toBe(expectedId);
  });

  it("passes the citizen's held IDs through to generation", async () => {
    generateJourneyWithEgovAI.mockResolvedValue(AI_GENERATED);

    await getOrRegenerateCustomJourney({
      text: "I am adopting a rescue dog",
      heldIds: ["umid"],
    });

    expect(generateJourneyWithEgovAI).toHaveBeenCalledWith(
      expect.objectContaining({ heldIds: ["umid"] }),
    );
  });

  it("surfaces the AI's evidence decision onto the result", async () => {
    generateJourneyWithEgovAI.mockResolvedValue({
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
    generateJourneyWithEgovAI.mockRejectedValue(new Error("eGov AI error"));

    const result = await getOrRegenerateCustomJourney({
      text: "I am adopting a rescue dog",
    });

    expect(result.source).toBe("seed");
    expect(result.journey.total_steps).toBe(0);
    expect(result.journey.life_event).toBe("I am adopting a rescue dog");
  });
});
