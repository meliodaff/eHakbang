import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RequirementsTab } from "./RequirementsTab";
import type { Journey, JourneyStep } from "@/lib/types";

const { useJourneys } = vi.hoisted(() => ({ useJourneys: vi.fn() }));
vi.mock("@/lib/journey-store", () => ({ useJourneys }));

vi.mock("./ApplyAllButton", () => ({
  ApplyAllButton: ({ journeyId }: { journeyId?: string }) => (
    <div>Apply all button for {journeyId ?? "all"}</div>
  ),
}));

function step(overrides: Partial<JourneyStep>): JourneyStep {
  return {
    step_number: 1,
    agency_name: "Test Agency",
    agency_code: "TEST",
    step_title: "Test step",
    step_type: "record_update",
    reason: "Because.",
    documents_required: ["PSA certificate"],
    estimated_time: "1 day",
    important_note: null,
    egov_service_name: "Test Service",
    egov_search_term: "test",
    ...overrides,
  };
}

function journey(overrides: Partial<Journey>): Journey {
  return {
    id: "ehakbang:journey:event:got-married",
    event_id: "got-married",
    emoji: "💍",
    life_event: "Got Married",
    summary: "Update your civil status.",
    total_steps: 2,
    record_updates: 2,
    benefit_claims: 0,
    steps: [
      step({ step_number: 1, agency_name: "SSS" }),
      step({
        step_number: 2,
        agency_name: "PhilHealth",
        documents_required: ["PhilHealth MDR"],
      }),
    ],
    status: "active",
    language: "en",
    created_at: "2026-07-29T00:00:00.000Z",
    completed_at: null,
    completed_step_numbers: [1],
    paid_step_numbers: [],
    field_answers: {},
    auto_applied_step_numbers: [],
    claimed_step_numbers: [],
    ...overrides,
  };
}

describe("RequirementsTab", () => {
  beforeEach(() => {
    useJourneys.mockReset();
  });

  it("lists only the requested journey's requirements, showing done/pending status", () => {
    const married = journey({ id: "j1", life_event: "Got Married" });
    const baby = journey({ id: "j2", life_event: "Had a Baby" });
    useJourneys.mockReturnValue({ journeys: [married, baby], ready: true });

    render(<RequirementsTab journeyId="j1" />);

    expect(screen.getByText("Got Married")).toBeInTheDocument();
    expect(screen.queryByText("Had a Baby")).not.toBeInTheDocument();
    expect(screen.getByText("1 of 2 requirements completed")).toBeInTheDocument();
    expect(screen.getAllByText("Done").length).toBe(1);
    expect(screen.getAllByText("Pending").length).toBe(1);
    expect(screen.getByText("PSA certificate")).toBeInTheDocument();
  });

  it("shows the Apply All button at the bottom, scoped to the same journey", () => {
    const married = journey({ id: "j1", life_event: "Got Married" });
    useJourneys.mockReturnValue({ journeys: [married], ready: true });

    render(<RequirementsTab journeyId="j1" />);

    expect(screen.getByText("Apply all button for j1")).toBeInTheDocument();
  });

  it("shows every journey's requirements when unscoped", () => {
    const married = journey({ id: "j1", life_event: "Got Married" });
    const baby = journey({ id: "j2", life_event: "Had a Baby" });
    useJourneys.mockReturnValue({ journeys: [married, baby], ready: true });

    render(<RequirementsTab />);

    expect(screen.getByText("Got Married")).toBeInTheDocument();
    expect(screen.getByText("Had a Baby")).toBeInTheDocument();
  });

  it("shows an empty state with a link back to My Journeys when nothing matches", () => {
    useJourneys.mockReturnValue({ journeys: [], ready: true });

    render(<RequirementsTab journeyId="missing" />);

    expect(screen.getByText(/no requirements to show/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /back to my journeys/i }),
    ).toHaveAttribute("href", "/journeys");
  });
});
