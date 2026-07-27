import { describe, it, expect, vi, afterEach } from "vitest";
import {
  generateJourney,
  fetchJourney,
  listJourneys,
  createFeePayment,
  fetchPaymentStatus,
  submitAutoApply,
  fetchAutoApplyStatus,
  askAboutStep,
} from "./api-client";
import { MOCK_JOURNEYS } from "./mock-data";
import { getJourneyByEventId } from "./event-journeys";

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

describe("api-client (predefined event via /api/journey)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs to /api/journey and returns the journey when an eventId is given", async () => {
    const journey = getJourneyByEventId("retired")!;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ journey, regenerated: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateJourney({
      eventId: "retired",
      lifeEvent: "I am retiring",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/journey",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ eventId: "retired", language: "en" }),
      }),
    );
    expect(result).toEqual(journey);
  });

  it("throws when the route responds with an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "boom" }),
      }),
    );

    await expect(
      generateJourney({ eventId: "retired", lifeEvent: "I am retiring" }),
    ).rejects.toThrow("boom");
  });
});

describe("api-client (fee payment via /api/payment)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs to /api/payment and returns the transaction", async () => {
    const result = {
      uuid: "tx-uuid",
      url: "https://egovpay.example/tx-uuid",
      txnid: "EHKB-1",
      amount: 500,
      currency: "PHP",
      stepNumbers: [1],
    };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => result });
    vi.stubGlobal("fetch", fetchMock);

    const response = await createFeePayment({
      eventId: "got-married",
      stepNumbers: [1],
      livenessToken: "token-abc",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/payment",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          eventId: "got-married",
          language: "en",
          stepNumbers: [1],
          livenessToken: "token-abc",
        }),
      }),
    );
    expect(response).toEqual(result);
  });

  it("throws when /api/payment responds with an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "boom" }) }),
    );

    await expect(
      createFeePayment({ eventId: "got-married", stepNumbers: [1], livenessToken: "token-abc" }),
    ).rejects.toThrow("boom");
  });

  it("GETs /api/payment/[uuid] and returns the status", async () => {
    const status = {
      uuid: "tx-uuid",
      paid: true,
      paidAt: "2026-07-22T00:00:00.000Z",
      refno: "REF123",
      amount: "500.0000",
      currency: "PHP",
      paymentStatus: "SUCCESS",
    };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => status });
    vi.stubGlobal("fetch", fetchMock);

    const response = await fetchPaymentStatus("tx-uuid");

    expect(fetchMock).toHaveBeenCalledWith("/api/payment/tx-uuid");
    expect(response).toEqual(status);
  });

  it("throws when /api/payment/[uuid] responds with an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "boom" }) }),
    );

    await expect(fetchPaymentStatus("tx-uuid")).rejects.toThrow("boom");
  });
});

describe("api-client (Auto Apply queue via /api/application-queue)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs to /api/application-queue and returns the queue state", async () => {
    const state = {
      journeyId: "ehakbang:journey:event:had-a-baby",
      stepNumber: 1,
      status: "pending" as const,
      createdAt: "2026-07-27T00:00:00.000Z",
      acceptedAt: null,
    };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => state });
    vi.stubGlobal("fetch", fetchMock);

    const result = await submitAutoApply({
      journeyId: state.journeyId,
      stepNumber: 1,
      agencyName: "Test Agency",
      stepTitle: "Test step",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/application-queue",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result).toEqual(state);
  });

  it("throws when /api/application-queue responds with an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "boom" }) }),
    );

    await expect(
      submitAutoApply({
        journeyId: "j",
        stepNumber: 1,
        agencyName: "Test Agency",
        stepTitle: "Test step",
      }),
    ).rejects.toThrow("boom");
  });

  it("GETs /api/application-queue/status and returns the queue state", async () => {
    const state = {
      journeyId: "ehakbang:journey:event:had-a-baby",
      stepNumber: 1,
      status: "accepted" as const,
      createdAt: "2026-07-27T00:00:00.000Z",
      acceptedAt: "2026-07-27T00:00:15.000Z",
    };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => state });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchAutoApplyStatus({ journeyId: state.journeyId, stepNumber: 1 });

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/application-queue/status?journeyId=${encodeURIComponent(state.journeyId)}&stepNumber=1`,
    );
    expect(result).toEqual(state);
  });

  it("returns null (idle) when the status route responds 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({ error: "No queue entry found" }) }),
    );

    const result = await fetchAutoApplyStatus({ journeyId: "j", stepNumber: 1 });
    expect(result).toBeNull();
  });

  it("throws on a non-404 error from the status route", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: "boom" }) }),
    );

    await expect(fetchAutoApplyStatus({ journeyId: "j", stepNumber: 1 })).rejects.toThrow("boom");
  });
});

describe("api-client (Ask about this step via /api/ask-step)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const step = {
    step_title: "Register your baby's birth",
    agency_name: "Philippine Statistics Authority",
    reason: "You need an official birth certificate.",
    documents_required: ["Certificate of Live Birth"],
    estimated_time: "1–2 weeks",
    important_note: null,
  };

  it("POSTs to /api/ask-step and returns the answer", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ answer: "Bring a valid ID." }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await askAboutStep({ question: "What do I bring?", language: "en", step });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ask-step",
      expect.objectContaining({ method: "POST" }),
    );
    expect(result).toEqual({ answer: "Bring a valid ID." });
  });

  it("throws when /api/ask-step responds with an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "boom" }) }),
    );

    await expect(
      askAboutStep({ question: "What do I bring?", language: "en", step }),
    ).rejects.toThrow("boom");
  });
});
