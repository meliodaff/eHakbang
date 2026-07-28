import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { JourneyCompleteScreen } from "./JourneyCompleteScreen";
import type { Journey } from "@/lib/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const { useJourneys } = vi.hoisted(() => ({ useJourneys: vi.fn() }));
vi.mock("@/lib/journey-store", () => ({
  useJourneys,
  archiveJourney: vi.fn(),
}));

function customJourney(overrides: Partial<Journey> = {}): Journey {
  return {
    id: "ehakbang:journey:event:custom-won-the-lotto",
    event_id: "custom-won-the-lotto",
    emoji: "🎟️",
    life_event: "Won the Lottery",
    summary: "Claim your winnings.",
    total_steps: 1,
    record_updates: 0,
    benefit_claims: 1,
    steps: [],
    status: "completed",
    language: "en",
    created_at: "2026-07-29T00:00:00.000Z",
    completed_at: "2026-07-29T01:00:00.000Z",
    completed_step_numbers: [1],
    paid_step_numbers: [],
    field_answers: {},
    auto_applied_step_numbers: [1],
    claimed_step_numbers: [],
    ...overrides,
  };
}

describe("JourneyCompleteScreen", () => {
  beforeEach(() => {
    push.mockReset();
    useJourneys.mockReset();
  });

  it("shows a loading state before the store is ready", () => {
    useJourneys.mockReturnValue({ journeys: [], ready: false });
    render(<JourneyCompleteScreen id="anything" />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("finds a custom/AI-generated journey from the store even though it's not in the preset catalog", () => {
    const journey = customJourney();
    useJourneys.mockReturnValue({ journeys: [journey], ready: true });

    render(<JourneyCompleteScreen id={journey.id} />);

    expect(
      screen.getByRole("heading", { name: /journey complete/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/journey not found/i)).not.toBeInTheDocument();
  });

  it("shows 'Journey not found' only when no matching journey exists anywhere", () => {
    useJourneys.mockReturnValue({ journeys: [], ready: true });
    render(<JourneyCompleteScreen id="does-not-exist" />);
    expect(screen.getByText(/journey not found/i)).toBeInTheDocument();
  });

  it("resolves a preset event's id from the static catalog when it isn't in the store", () => {
    useJourneys.mockReturnValue({ journeys: [], ready: true });
    render(<JourneyCompleteScreen id="ehakbang:journey:event:got-married" />);
    expect(
      screen.getByRole("heading", { name: /journey complete/i }),
    ).toBeInTheDocument();
  });
});
