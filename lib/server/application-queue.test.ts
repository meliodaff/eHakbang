import { describe, it, expect, vi, beforeEach } from "vitest";

// The module under test imports "server-only", which throws when it detects
// a DOM global (jsdom, the default test environment, has `window`). Stub it
// out so this server-side module can still be unit tested here.
vi.mock("server-only", () => ({}));

const NOW = new Date("2026-07-27T12:00:00.000Z");

const BASE_INPUT = {
  journeyId: "ehakbang:journey:event:had-a-baby",
  stepNumber: 1,
  eventId: "had-a-baby",
  agencyName: "Test Agency",
  stepTitle: "Test step",
};

describe("upsertQueueSubmission", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  it("stores and returns the pending state", async () => {
    const { upsertQueueSubmission } = await import("./application-queue");

    const result = await upsertQueueSubmission(BASE_INPUT);

    expect(result.status).toBe("pending");
    expect(result.journeyId).toBe(BASE_INPUT.journeyId);
    expect(result.createdAt).toBe(NOW.toISOString());
    expect(result.acceptedAt).toBeNull();
  });

  it("re-queuing resets an existing entry back to pending", async () => {
    const { upsertQueueSubmission, getQueueState } = await import("./application-queue");

    await upsertQueueSubmission(BASE_INPUT);
    vi.setSystemTime(new Date(NOW.getTime() + 20_000));
    const accepted = await getQueueState({
      journeyId: BASE_INPUT.journeyId,
      stepNumber: BASE_INPUT.stepNumber,
    });
    expect(accepted?.status).toBe("accepted");

    const requeued = await upsertQueueSubmission(BASE_INPUT);
    expect(requeued.status).toBe("pending");
    expect(requeued.acceptedAt).toBeNull();
  });
});

describe("getQueueState", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  it("returns null when no entry exists", async () => {
    const { getQueueState } = await import("./application-queue");

    const result = await getQueueState({ journeyId: BASE_INPUT.journeyId, stepNumber: 1 });
    expect(result).toBeNull();
  });

  it("returns pending as-is when the mock delay hasn't elapsed", async () => {
    const { upsertQueueSubmission, getQueueState } = await import("./application-queue");

    await upsertQueueSubmission(BASE_INPUT);
    const result = await getQueueState({
      journeyId: BASE_INPUT.journeyId,
      stepNumber: BASE_INPUT.stepNumber,
    });
    expect(result?.status).toBe("pending");
  });

  it("flips to accepted once the mock delay has elapsed", async () => {
    const { upsertQueueSubmission, getQueueState } = await import("./application-queue");

    await upsertQueueSubmission(BASE_INPUT);
    vi.setSystemTime(new Date(NOW.getTime() + 20_000));

    const result = await getQueueState({
      journeyId: BASE_INPUT.journeyId,
      stepNumber: BASE_INPUT.stepNumber,
    });
    expect(result?.status).toBe("accepted");
    expect(result?.acceptedAt).not.toBeNull();
  });

  it("returns already-accepted entries unchanged", async () => {
    const { upsertQueueSubmission, getQueueState } = await import("./application-queue");

    await upsertQueueSubmission(BASE_INPUT);
    vi.setSystemTime(new Date(NOW.getTime() + 20_000));
    await getQueueState({ journeyId: BASE_INPUT.journeyId, stepNumber: BASE_INPUT.stepNumber });

    const result = await getQueueState({
      journeyId: BASE_INPUT.journeyId,
      stepNumber: BASE_INPUT.stepNumber,
    });
    expect(result?.status).toBe("accepted");
  });
});
