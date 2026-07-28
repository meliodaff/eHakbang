import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TrackScreen } from "./TrackScreen";
import type { Journey, JourneyStep } from "@/lib/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const { useJourneys, markStepsDone } = vi.hoisted(() => ({
  useJourneys: vi.fn(),
  markStepsDone: vi.fn(),
}));
vi.mock("@/lib/journey-store", () => ({ useJourneys, markStepsDone }));

const { simulateAgencyApproval } = vi.hoisted(() => ({
  simulateAgencyApproval: vi.fn(),
}));
vi.mock("@/lib/api-client", () => ({ simulateAgencyApproval }));

function step(overrides: Partial<JourneyStep>): JourneyStep {
  return {
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
    total_steps: 1,
    record_updates: 1,
    benefit_claims: 0,
    steps: [step({ step_number: 1 })],
    status: "active",
    language: "en",
    created_at: "2026-07-29T00:00:00.000Z",
    completed_at: null,
    completed_step_numbers: [],
    paid_step_numbers: [],
    field_answers: {},
    auto_applied_step_numbers: [],
    claimed_step_numbers: [],
    submitted_step_numbers: [1],
    ...overrides,
  };
}

describe("TrackScreen", () => {
  beforeEach(() => {
    push.mockReset();
    markStepsDone.mockReset();
    simulateAgencyApproval.mockReset();
  });

  it("shows only the requested journey's applications, not every journey's", () => {
    const married = journey({ id: "j1", life_event: "Got Married" });
    const babyStep = step({ step_number: 1, agency_name: "PSA" });
    const baby = journey({
      id: "j2",
      life_event: "Had a Baby",
      steps: [babyStep],
      submitted_step_numbers: [1],
    });
    useJourneys.mockReturnValue({ journeys: [married, baby], ready: true });

    render(<TrackScreen journeyId="j1" />);

    expect(screen.getByText("Got Married")).toBeInTheDocument();
    expect(screen.queryByText("Had a Baby")).not.toBeInTheDocument();
  });

  it("shows a scoped empty state naming the journey when it has nothing submitted yet", () => {
    const married = journey({ id: "j1", life_event: "Got Married", submitted_step_numbers: [] });
    useJourneys.mockReturnValue({ journeys: [married], ready: true });

    render(<TrackScreen journeyId="j1" />);

    expect(screen.getByText(/nothing submitted yet/i)).toBeInTheDocument();
    expect(screen.getByText(/got married/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /back to my journeys/i }),
    ).toHaveAttribute("href", "/journeys");
  });

  it("shows every journey with submitted applications when unscoped", () => {
    const married = journey({ id: "j1", life_event: "Got Married" });
    const baby = journey({
      id: "j2",
      life_event: "Had a Baby",
      steps: [step({ step_number: 1, agency_name: "PSA" })],
      submitted_step_numbers: [1],
    });
    useJourneys.mockReturnValue({ journeys: [married, baby], ready: true });

    render(<TrackScreen />);

    expect(screen.getByText("Got Married")).toBeInTheDocument();
    expect(screen.getByText("Had a Baby")).toBeInTheDocument();
  });

  it("offers a top-level Simulate All button that approves every awaiting application across journeys", async () => {
    const married = journey({ id: "j1", life_event: "Got Married" });
    const baby = journey({
      id: "j2",
      life_event: "Had a Baby",
      steps: [step({ step_number: 1, agency_name: "PSA" })],
      submitted_step_numbers: [1],
    });
    useJourneys.mockReturnValue({ journeys: [married, baby], ready: true });
    simulateAgencyApproval.mockResolvedValue({ acceptedStepNumbers: [] });
    markStepsDone.mockImplementation((j: Journey) => ({ ...j, status: "active" }));

    render(<TrackScreen />);

    const simulateAllButton = screen.getByRole("button", {
      name: /demo: simulate all applications approved/i,
    });
    fireEvent.click(simulateAllButton);

    await waitFor(() => expect(markStepsDone).toHaveBeenCalledTimes(2));
    expect(simulateAgencyApproval).toHaveBeenCalledWith({ journeyId: "j1" });
    expect(simulateAgencyApproval).toHaveBeenCalledWith({ journeyId: "j2" });
    // Multiple journeys involved -- no single completion screen to navigate to.
    expect(push).not.toHaveBeenCalled();
  });

  it("navigates to the completion screen when Simulate All finishes the only tracked journey", async () => {
    const married = journey({ id: "j1", life_event: "Got Married" });
    useJourneys.mockReturnValue({ journeys: [married], ready: true });
    simulateAgencyApproval.mockResolvedValue({ acceptedStepNumbers: [] });
    markStepsDone.mockImplementation((j: Journey) => ({ ...j, status: "completed" }));

    render(<TrackScreen journeyId="j1" />);

    fireEvent.click(
      screen.getByRole("button", { name: /demo: simulate all applications approved/i }),
    );

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/journey/complete?id=j1"),
    );
  });
});
