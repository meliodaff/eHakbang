import { describe, it, expect, vi, beforeEach } from "vitest";
import { getJourneyByEventId } from "@/lib/event-journeys";

// The module under test imports "server-only", which throws when it detects
// a DOM global (jsdom, the default test environment, has `window`). Stub it
// out so this server-side module can still be unit tested here.
vi.mock("server-only", () => ({}));

const { getSupabaseServerClient } = vi.hoisted(() => ({
  getSupabaseServerClient: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ getSupabaseServerClient }));

const { generateJourneyWithEgovAi } = vi.hoisted(() => ({
  generateJourneyWithEgovAi: vi.fn(),
}));
vi.mock("./egov-ai", () => ({ generateJourneyWithEgovAi }));

import { getOrRegenerateJourney } from "./journey-requirements";

function makeSupabaseMock(opts: {
  existing?: unknown | null;
  upsertResult?: { data: unknown; error: unknown };
}) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    upsert: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => ({ data: opts.existing ?? null, error: null })),
    single: vi.fn(async () => opts.upsertResult ?? { data: null, error: null }),
  };
  return { from: vi.fn(() => builder) };
}

const NOW = new Date("2026-07-22T12:00:00.000Z");

const AI_GENERATED = {
  summary: "AI summary",
  model: "egov-ai-assistant",
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
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    generateJourneyWithEgovAi.mockReset();
    getSupabaseServerClient.mockReset();
  });

  it("serves a fresh cached row without calling the eGov AI Assistant", async () => {
    const existing = {
      event_id: "retired",
      language: "en",
      emoji: "🏖️",
      life_event: "Retired",
      summary: "cached summary",
      steps: [],
      total_steps: 0,
      record_updates: 0,
      benefit_claims: 0,
      updated_at: new Date(NOW.getTime() - 60 * 1000).toISOString(),
    };
    getSupabaseServerClient.mockReturnValue(makeSupabaseMock({ existing }));

    const result = await getOrRegenerateJourney({ eventId: "retired" });

    expect(result.source).toBe("cache");
    expect(result.regenerated).toBe(false);
    expect(result.journey.summary).toBe("cached summary");
    expect(generateJourneyWithEgovAi).not.toHaveBeenCalled();
  });

  it("regenerates via the eGov AI Assistant and upserts when the cached row is stale", async () => {
    const existing = {
      event_id: "retired",
      language: "en",
      emoji: "🏖️",
      life_event: "Retired",
      summary: "old summary",
      steps: [],
      total_steps: 0,
      record_updates: 0,
      benefit_claims: 0,
      updated_at: new Date(NOW.getTime() - 25 * 60 * 60 * 1000).toISOString(),
    };
    const upserted = {
      event_id: "retired",
      language: "en",
      emoji: "🏖️",
      life_event: "Retired",
      summary: AI_GENERATED.summary,
      steps: AI_GENERATED.steps.map((s, i) => ({ ...s, step_number: i + 1 })),
      total_steps: 1,
      record_updates: 0,
      benefit_claims: 1,
      updated_at: NOW.toISOString(),
    };
    getSupabaseServerClient.mockReturnValue(
      makeSupabaseMock({ existing, upsertResult: { data: upserted, error: null } }),
    );
    generateJourneyWithEgovAi.mockResolvedValue(AI_GENERATED);

    const result = await getOrRegenerateJourney({ eventId: "retired" });

    expect(generateJourneyWithEgovAi).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: "retired", language: "en" }),
    );
    expect(result.source).toBe("ai");
    expect(result.regenerated).toBe(true);
    expect(result.journey.summary).toBe(AI_GENERATED.summary);
  });

  it("regenerates when there is no cached row", async () => {
    const upserted = {
      event_id: "annulment",
      language: "en",
      emoji: "⚖️",
      life_event: "Annulment",
      summary: AI_GENERATED.summary,
      steps: AI_GENERATED.steps.map((s, i) => ({ ...s, step_number: i + 1 })),
      total_steps: 1,
      record_updates: 0,
      benefit_claims: 1,
      updated_at: NOW.toISOString(),
    };
    getSupabaseServerClient.mockReturnValue(
      makeSupabaseMock({ existing: null, upsertResult: { data: upserted, error: null } }),
    );
    generateJourneyWithEgovAi.mockResolvedValue(AI_GENERATED);

    const result = await getOrRegenerateJourney({ eventId: "annulment" });

    expect(result.source).toBe("ai");
    expect(result.regenerated).toBe(true);
  });

  it("falls back to the seed journey when Supabase is not configured", async () => {
    getSupabaseServerClient.mockImplementation(() => {
      throw new Error("Supabase is not configured");
    });

    const result = await getOrRegenerateJourney({ eventId: "retired" });

    expect(result.source).toBe("seed");
    expect(result.regenerated).toBe(false);
    expect(result.journey.id).toBe(getJourneyByEventId("retired")!.id);
  });

  it("falls back to the seed journey when the eGov AI Assistant fails", async () => {
    getSupabaseServerClient.mockReturnValue(makeSupabaseMock({ existing: null }));
    generateJourneyWithEgovAi.mockRejectedValue(new Error("eGov AI Assistant error"));

    const result = await getOrRegenerateJourney({ eventId: "retired" });

    expect(result.source).toBe("seed");
    expect(result.journey.id).toBe(getJourneyByEventId("retired")!.id);
  });

  it("rejects an unknown eventId", async () => {
    await expect(
      getOrRegenerateJourney({ eventId: "not-a-real-event" }),
    ).rejects.toThrow();
  });
});
