import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ApplyAllButton } from "./ApplyAllButton";
import type { Journey, JourneyStep } from "@/lib/types";

const { useJourneys, markStepsSubmitted } = vi.hoisted(() => ({
  useJourneys: vi.fn(),
  markStepsSubmitted: vi.fn(),
}));
vi.mock("@/lib/journey-store", () => ({ useJourneys, markStepsSubmitted }));

const { submitAutoApply } = vi.hoisted(() => ({
  submitAutoApply: vi.fn(),
}));
vi.mock("@/lib/api-client", () => ({ submitAutoApply }));

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
    submitted_step_numbers: [],
    ...overrides,
  };
}

describe("ApplyAllButton", () => {
  beforeEach(() => {
    markStepsSubmitted.mockReset();
    submitAutoApply.mockReset();
  });

  it("renders nothing when there's nothing pending to apply for", () => {
    const married = journey({
      id: "j1",
      completed_step_numbers: [1],
      submitted_step_numbers: [],
    });
    useJourneys.mockReturnValue({ journeys: [married], ready: true });

    render(<ApplyAllButton />);

    expect(
      screen.queryByRole("button", { name: /apply all/i }),
    ).not.toBeInTheDocument();
  });

  it("renders nothing for steps already submitted", () => {
    const married = journey({ id: "j1", submitted_step_numbers: [1] });
    useJourneys.mockReturnValue({ journeys: [married], ready: true });

    render(<ApplyAllButton />);

    expect(
      screen.queryByRole("button", { name: /apply all/i }),
    ).not.toBeInTheDocument();
  });

  it("submits every pending step across journeys when unscoped", async () => {
    const married = journey({ id: "j1", life_event: "Got Married" });
    const baby = journey({
      id: "j2",
      life_event: "Had a Baby",
      steps: [step({ step_number: 1, agency_name: "PSA" })],
      submitted_step_numbers: [],
    });
    useJourneys.mockReturnValue({ journeys: [married, baby], ready: true });
    submitAutoApply.mockResolvedValue({
      journeyId: "j1",
      stepNumber: 1,
      status: "pending",
      createdAt: "2026-07-29T00:00:00.000Z",
      acceptedAt: null,
    });

    render(<ApplyAllButton />);

    fireEvent.click(screen.getByRole("button", { name: /apply all/i }));

    await waitFor(() => expect(markStepsSubmitted).toHaveBeenCalledTimes(2));
    expect(submitAutoApply).toHaveBeenCalledWith(
      expect.objectContaining({ journeyId: "j1", stepNumber: 1 }),
    );
    expect(submitAutoApply).toHaveBeenCalledWith(
      expect.objectContaining({ journeyId: "j2", stepNumber: 1 }),
    );
    expect(markStepsSubmitted).toHaveBeenCalledWith(married, [1]);
    expect(markStepsSubmitted).toHaveBeenCalledWith(baby, [1]);
  });

  it("only applies the scoped journey's pending steps when a journeyId is given", async () => {
    const married = journey({ id: "j1", life_event: "Got Married" });
    const baby = journey({
      id: "j2",
      life_event: "Had a Baby",
      steps: [step({ step_number: 1, agency_name: "PSA" })],
      submitted_step_numbers: [],
    });
    useJourneys.mockReturnValue({ journeys: [married, baby], ready: true });
    submitAutoApply.mockResolvedValue({
      journeyId: "j1",
      stepNumber: 1,
      status: "pending",
      createdAt: "2026-07-29T00:00:00.000Z",
      acceptedAt: null,
    });

    render(<ApplyAllButton journeyId="j1" />);

    fireEvent.click(screen.getByRole("button", { name: /apply all/i }));

    await waitFor(() => expect(markStepsSubmitted).toHaveBeenCalledTimes(1));
    expect(submitAutoApply).toHaveBeenCalledWith(
      expect.objectContaining({ journeyId: "j1", stepNumber: 1 }),
    );
  });
});
