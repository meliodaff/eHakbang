import { describe, it, expect, vi, beforeEach } from "vitest";

// The module under test imports "server-only", which throws when it detects
// a DOM global (jsdom, the default test environment, has `window`). Stub it
// out so this server-side module can still be unit tested here.
vi.mock("server-only", () => ({}));

const { getSupabaseServerClient } = vi.hoisted(() => ({
  getSupabaseServerClient: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ getSupabaseServerClient }));

import { upsertQueueSubmission, getQueueState } from "./application-queue";

function makeSupabaseMock(opts: {
  upsertResult?: { data: unknown; error: unknown };
  selectResults?: Array<{ data: unknown; error: unknown }>;
}) {
  const selectResults = opts.selectResults ?? [];
  const builder = {
    upsert: vi.fn(() => builder),
    select: vi.fn(() => builder),
    update: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    single: vi.fn(async () => opts.upsertResult ?? { data: null, error: null }),
    maybeSingle: vi.fn(async () => selectResults.shift() ?? { data: null, error: null }),
  };
  return { from: vi.fn(() => builder) };
}

const NOW = new Date("2026-07-27T12:00:00.000Z");

const BASE_ROW = {
  journey_id: "ehakbang:journey:event:had-a-baby",
  step_number: 1,
  event_id: "had-a-baby",
  agency_name: "Test Agency",
  step_title: "Test step",
  field_answers: {},
  status: "pending" as const,
  created_at: NOW.toISOString(),
  accepted_at: null,
};

describe("upsertQueueSubmission", () => {
  beforeEach(() => {
    getSupabaseServerClient.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  it("upserts and returns the pending state", async () => {
    getSupabaseServerClient.mockReturnValue(
      makeSupabaseMock({ upsertResult: { data: BASE_ROW, error: null } }),
    );

    const result = await upsertQueueSubmission({
      journeyId: BASE_ROW.journey_id,
      stepNumber: 1,
      eventId: "had-a-baby",
      agencyName: "Test Agency",
      stepTitle: "Test step",
    });

    expect(result.status).toBe("pending");
    expect(result.journeyId).toBe(BASE_ROW.journey_id);
  });

  it("throws when the upsert fails", async () => {
    getSupabaseServerClient.mockReturnValue(
      makeSupabaseMock({ upsertResult: { data: null, error: new Error("boom") } }),
    );

    await expect(
      upsertQueueSubmission({
        journeyId: BASE_ROW.journey_id,
        stepNumber: 1,
        agencyName: "Test Agency",
        stepTitle: "Test step",
      }),
    ).rejects.toThrow();
  });
});

describe("getQueueState", () => {
  beforeEach(() => {
    getSupabaseServerClient.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  it("returns null when no row exists", async () => {
    getSupabaseServerClient.mockReturnValue(
      makeSupabaseMock({ selectResults: [{ data: null, error: null }] }),
    );

    const result = await getQueueState({ journeyId: BASE_ROW.journey_id, stepNumber: 1 });
    expect(result).toBeNull();
  });

  it("returns pending as-is when the mock delay hasn't elapsed", async () => {
    getSupabaseServerClient.mockReturnValue(
      makeSupabaseMock({ selectResults: [{ data: BASE_ROW, error: null }] }),
    );

    const result = await getQueueState({ journeyId: BASE_ROW.journey_id, stepNumber: 1 });
    expect(result?.status).toBe("pending");
  });

  it("flips to accepted once the mock delay has elapsed", async () => {
    const staleRow = {
      ...BASE_ROW,
      created_at: new Date(NOW.getTime() - 20_000).toISOString(),
    };
    const acceptedRow = { ...staleRow, status: "accepted" as const, accepted_at: NOW.toISOString() };
    getSupabaseServerClient.mockReturnValue(
      makeSupabaseMock({
        selectResults: [
          { data: staleRow, error: null },
          { data: acceptedRow, error: null },
        ],
      }),
    );

    const result = await getQueueState({ journeyId: BASE_ROW.journey_id, stepNumber: 1 });
    expect(result?.status).toBe("accepted");
    expect(result?.acceptedAt).not.toBeNull();
  });

  it("returns already-accepted rows unchanged", async () => {
    const acceptedRow = { ...BASE_ROW, status: "accepted" as const, accepted_at: NOW.toISOString() };
    getSupabaseServerClient.mockReturnValue(
      makeSupabaseMock({ selectResults: [{ data: acceptedRow, error: null }] }),
    );

    const result = await getQueueState({ journeyId: BASE_ROW.journey_id, stepNumber: 1 });
    expect(result?.status).toBe("accepted");
  });
});
