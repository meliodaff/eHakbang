import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { Journey } from "@/lib/types";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getLifeEventById: vi.fn(),
  getOrRegenerateJourney: vi.fn(),
  createTransaction: vi.fn(),
  generateTxnId: vi.fn(),
  getLivenessResult: vi.fn(),
  getStoredJourneyForEvent: vi.fn(),
}));

vi.mock("@/lib/events", () => ({ getLifeEventById: mocks.getLifeEventById }));
vi.mock("@/lib/server/journey-requirements", () => ({
  getOrRegenerateJourney: mocks.getOrRegenerateJourney,
}));
vi.mock("@/lib/server/egovpay", () => ({
  createTransaction: mocks.createTransaction,
  generateTxnId: mocks.generateTxnId,
}));
vi.mock("@/lib/server/liveness", () => ({
  getLivenessResult: mocks.getLivenessResult,
}));
vi.mock("@/lib/server/stored-journeys", () => ({
  getStoredJourneyForEvent: mocks.getStoredJourneyForEvent,
}));

import { POST } from "./route";

function customJourney(overrides: Partial<Journey["steps"][number]> = {}): Journey {
  return {
    id: "ehakbang:journey:event:custom:passport",
    event_id: "custom:passport",
    emoji: "📋",
    life_event: "Apply for a Philippine passport",
    summary: "Apply through DFA.",
    total_steps: 1,
    record_updates: 1,
    benefit_claims: 0,
    steps: [
      {
        step_number: 1,
        agency_name: "Department of Foreign Affairs",
        agency_code: "DFA",
        step_title: "Apply for a Philippine passport",
        step_type: "record_update",
        reason: "Schedule the application online.",
        documents_required: [],
        estimated_time: "Check with agency",
        important_note: null,
        fee: null,
        egov_service_name: "Passport Application",
        egov_search_term: "DFA passport application",
        required_fields: [],
        ...overrides,
      },
    ],
    status: "active",
    language: "en",
    created_at: "2026-08-26T00:00:00.000Z",
    completed_at: null,
    completed_step_numbers: [],
    paid_step_numbers: [],
    field_answers: {},
    auto_applied_step_numbers: [],
    claimed_step_numbers: [],
    submitted_step_numbers: [],
  };
}

function request(): NextRequest {
  return new NextRequest("http://localhost:3000/api/payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventId: "custom:passport",
      language: "en",
      stepNumbers: [1],
      livenessToken: "verified-token",
    }),
  });
}

describe("POST /api/payment custom journey", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getLifeEventById.mockReturnValue(undefined);
    mocks.getLivenessResult.mockResolvedValue({ verified: true });
    mocks.generateTxnId.mockReturnValue("EHKB-TEST-1");
    mocks.createTransaction.mockResolvedValue({
      uuid: "tx-uuid",
      url: "https://egovpay.example/tx-uuid",
      refno: null,
    });
  });

  it("re-derives the official DFA fee instead of trusting a stored custom fee", async () => {
    mocks.getStoredJourneyForEvent.mockResolvedValue(
      customJourney({
        fee: { amount: "₱1", currency: "PHP", how_to_pay: "Untrusted value" },
      }),
    );

    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual(
      expect.objectContaining({ amount: 950, currency: "PHP", stepNumbers: [1] }),
    );
    expect(mocks.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 950,
        items: [
          {
            name: "Department of Foreign Affairs — Apply for a Philippine passport",
            amount: 950,
          },
        ],
      }),
    );
  });

  it("rejects an arbitrary stored custom fee that has no deterministic official match", async () => {
    mocks.getStoredJourneyForEvent.mockResolvedValue(
      customJourney({
        agency_name: "Test Agency",
        agency_code: "TEST",
        step_title: "Unrelated service",
        egov_service_name: "Unrelated service",
        egov_search_term: "unrelated",
        fee: { amount: "₱500", currency: "PHP", how_to_pay: "Untrusted value" },
      }),
    );

    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("One or more requested steps are not billable");
    expect(mocks.createTransaction).not.toHaveBeenCalled();
  });
});
