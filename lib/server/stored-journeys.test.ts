import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/server-client", () => ({ createClient }));

import { getStoredJourneyForEvent, saveJourneyForCurrentUser } from "./stored-journeys";
import type { Journey } from "@/lib/types";

function makeSupabaseMock(opts: {
  user?: { id: string } | null;
  row?: unknown;
  selectError?: unknown;
  upsertError?: unknown;
}) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    upsert: vi.fn(async () => ({ error: opts.upsertError ?? null })),
    maybeSingle: vi.fn(async () => ({
      data: opts.row ?? null,
      error: opts.selectError ?? null,
    })),
  };
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: opts.user ?? null } })) },
    from: vi.fn(() => builder),
    builder,
  };
}

const ROW = {
  id: "ehakbang:journey:event:got-married",
  user_id: "u1",
  event_id: "got-married",
  emoji: "💍",
  life_event: "Got Married",
  summary: "Update your civil status.",
  language: "en",
  status: "active",
  total_steps: 1,
  record_updates: 1,
  benefit_claims: 0,
  steps: [],
  completed_step_numbers: [1],
  paid_step_numbers: [],
  field_answers: {},
  auto_applied_step_numbers: [],
  claimed_step_numbers: [],
  submitted_step_numbers: [],
  created_at: "2026-07-29T00:00:00.000Z",
  completed_at: null,
  updated_at: "2026-07-29T00:00:00.000Z",
};

describe("getStoredJourneyForEvent", () => {
  beforeEach(() => {
    createClient.mockReset();
  });

  it("returns the citizen's already-started journey for the event, keyed by the stable journey id", async () => {
    const client = makeSupabaseMock({ user: { id: "u1" }, row: ROW });
    createClient.mockResolvedValue(client);

    const journey = await getStoredJourneyForEvent("got-married");

    expect(journey?.id).toBe("ehakbang:journey:event:got-married");
    expect(journey?.completed_step_numbers).toEqual([1]);
    expect(client.builder.eq).toHaveBeenCalledWith(
      "id",
      "ehakbang:journey:event:got-married",
    );
    expect(client.builder.eq).toHaveBeenCalledWith("user_id", "u1");
  });

  it("returns null when nothing has been started for this event yet", async () => {
    createClient.mockResolvedValue(makeSupabaseMock({ user: { id: "u1" }, row: null }));

    expect(await getStoredJourneyForEvent("got-married")).toBeNull();
  });

  it("returns null when signed out", async () => {
    createClient.mockResolvedValue(makeSupabaseMock({ user: null }));

    expect(await getStoredJourneyForEvent("got-married")).toBeNull();
  });

  it("returns null on any read failure instead of throwing", async () => {
    createClient.mockResolvedValue(
      makeSupabaseMock({ user: { id: "u1" }, selectError: new Error("boom") }),
    );

    expect(await getStoredJourneyForEvent("got-married")).toBeNull();
  });
});

const JOURNEY: Journey = {
  id: "ehakbang:journey:event:custom:abc123",
  event_id: "custom:abc123",
  emoji: "📋",
  life_event: "Adopting a rescue dog",
  summary: "Register your new pet.",
  total_steps: 1,
  record_updates: 1,
  benefit_claims: 0,
  steps: [],
  status: "active",
  language: "en",
  created_at: "2026-07-29T00:00:00.000Z",
  completed_at: null,
  completed_step_numbers: [],
  paid_step_numbers: [],
  field_answers: {},
  auto_applied_step_numbers: [],
  claimed_step_numbers: [],
};

describe("saveJourneyForCurrentUser", () => {
  beforeEach(() => {
    createClient.mockReset();
  });

  it("upserts the journey row for the signed-in user", async () => {
    const client = makeSupabaseMock({ user: { id: "u1" } });
    createClient.mockResolvedValue(client);

    await saveJourneyForCurrentUser(JOURNEY);

    expect(client.builder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: JOURNEY.id, user_id: "u1" }),
      { onConflict: "user_id,id" },
    );
  });

  it("no-ops when signed out", async () => {
    const client = makeSupabaseMock({ user: null });
    createClient.mockResolvedValue(client);

    await saveJourneyForCurrentUser(JOURNEY);

    expect(client.builder.upsert).not.toHaveBeenCalled();
  });

  it("swallows a write failure instead of throwing", async () => {
    createClient.mockResolvedValue(
      makeSupabaseMock({ user: { id: "u1" }, upsertError: new Error("boom") }),
    );

    await expect(saveJourneyForCurrentUser(JOURNEY)).resolves.toBeUndefined();
  });
});
