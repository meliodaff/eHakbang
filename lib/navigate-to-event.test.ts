import { describe, it, expect, vi, beforeEach } from "vitest";
import { navigateToEvent } from "./navigate-to-event";
import type { LifeEvent, Journey, JourneyStep } from "@/lib/types";

const { getStoredJourney } = vi.hoisted(() => ({ getStoredJourney: vi.fn() }));
vi.mock("@/lib/journey-store", () => ({ getStoredJourney }));

const { getJourneyByEventId } = vi.hoisted(() => ({ getJourneyByEventId: vi.fn() }));
vi.mock("@/lib/event-journeys", () => ({ getJourneyByEventId }));

const { isCivilStatusEvent } = vi.hoisted(() => ({ isCivilStatusEvent: vi.fn() }));
vi.mock("@/lib/civil-status-events", () => ({ isCivilStatusEvent }));

const { eventRequiresVerification } = vi.hoisted(() => ({
  eventRequiresVerification: vi.fn(),
}));
vi.mock("@/lib/verification", () => ({ eventRequiresVerification }));

const EVENT: LifeEvent = {
  id: "some-event",
  emoji: "📋",
  label: "Test Event",
  sublabel: "Test Event",
  short: "Test",
  description: "A test life event.",
  common: true,
};

const router = { push: vi.fn() } as unknown as Parameters<typeof navigateToEvent>[0];

function journey(overrides: Partial<Journey> = {}): Journey {
  const step: JourneyStep = {
    step_number: 1,
    agency_name: "Test Agency",
    agency_code: "TEST",
    step_title: "Test step",
    step_type: "record_update",
    reason: "Because.",
    documents_required: [],
    estimated_time: "1 day",
    important_note: null,
    egov_service_name: "Test Service",
    egov_search_term: "test",
  };
  return {
    id: "ehakbang:journey:event:some-event",
    event_id: "some-event",
    emoji: "📋",
    life_event: "Test Event",
    summary: "Summary.",
    total_steps: 1,
    record_updates: 1,
    benefit_claims: 0,
    steps: [step],
    status: "active",
    language: "en",
    created_at: "2026-07-29T00:00:00.000Z",
    completed_at: null,
    completed_step_numbers: [],
    paid_step_numbers: [],
    field_answers: {},
    auto_applied_step_numbers: [],
    claimed_step_numbers: [],
    ...overrides,
  };
}

describe("navigateToEvent", () => {
  beforeEach(() => {
    (router.push as ReturnType<typeof vi.fn>).mockReset();
    getStoredJourney.mockReset();
    getJourneyByEventId.mockReset().mockReturnValue(journey());
    isCivilStatusEvent.mockReset().mockReturnValue(false);
    eventRequiresVerification.mockReset().mockReturnValue(false);
  });

  it("routes a never-started civil-status event to the confirm flow", () => {
    isCivilStatusEvent.mockReturnValue(true);
    getStoredJourney.mockReturnValue(undefined);

    navigateToEvent(router, EVENT);

    expect(router.push).toHaveBeenCalledWith("/journey/confirm?event=some-event");
  });

  it("resumes an already-started (active) civil-status journey directly, skipping confirm", () => {
    isCivilStatusEvent.mockReturnValue(true);
    getStoredJourney.mockReturnValue(journey({ status: "active" }));

    navigateToEvent(router, EVENT);

    expect(router.push).toHaveBeenCalledWith("/journey?event=some-event");
  });

  it("routes a completed journey to the read-only completion view, regardless of event type", () => {
    isCivilStatusEvent.mockReturnValue(true);
    const done = journey({ status: "completed" });
    getStoredJourney.mockReturnValue(done);

    navigateToEvent(router, EVENT);

    expect(router.push).toHaveBeenCalledWith(
      `/journey/complete?id=${encodeURIComponent(done.id)}&mode=info`,
    );
  });

  it("routes a never-started verification-gated event to the verify flow", () => {
    isCivilStatusEvent.mockReturnValue(false);
    eventRequiresVerification.mockReturnValue(true);
    getStoredJourney.mockReturnValue(undefined);

    navigateToEvent(router, EVENT);

    expect(router.push).toHaveBeenCalledWith("/journey/verify?event=some-event");
  });

  it("resumes an already-started verification-gated journey directly, skipping verify", () => {
    isCivilStatusEvent.mockReturnValue(false);
    eventRequiresVerification.mockReturnValue(true);
    getStoredJourney.mockReturnValue(journey({ status: "active" }));

    navigateToEvent(router, EVENT);

    expect(router.push).toHaveBeenCalledWith("/journey?event=some-event");
  });

  it("routes a never-started plain event straight to the journey checklist", () => {
    isCivilStatusEvent.mockReturnValue(false);
    eventRequiresVerification.mockReturnValue(false);
    getStoredJourney.mockReturnValue(undefined);

    navigateToEvent(router, EVENT);

    expect(router.push).toHaveBeenCalledWith("/journey?event=some-event");
  });
});
