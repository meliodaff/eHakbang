import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { StepCard } from "./StepCard";
import type { JourneyStep } from "@/lib/types";

const { submitAutoApply, fetchAutoApplyStatus } = vi.hoisted(() => ({
  submitAutoApply: vi.fn(),
  fetchAutoApplyStatus: vi.fn(),
}));
vi.mock("@/lib/api-client", () => ({ submitAutoApply, fetchAutoApplyStatus }));

const recordStep: JourneyStep = {
  step_number: 1,
  agency_name: "Philippine Statistics Authority",
  agency_code: "PSA",
  step_title: "Register your baby's birth",
  step_type: "record_update",
  reason: "You need an official birth certificate.",
  documents_required: ["Certificate of Live Birth", "Valid IDs"],
  estimated_time: "1–2 weeks",
  important_note: "Register within 30 days.",
  egov_service_name: "PSA Birth Registration",
  egov_search_term: "PSA birth registration",
};

const benefitStep: JourneyStep = {
  ...recordStep,
  step_number: 2,
  step_title: "Claim your SSS maternity benefit",
  step_type: "benefit_claim",
  important_note: null,
};

const fieldStep: JourneyStep = {
  ...recordStep,
  step_number: 3,
  required_fields: [
    {
      field_key: "proposed_business_name",
      label: "Proposed business name",
      field_type: "text",
      hint: null,
      required: true,
    },
  ],
};

const baseProps = {
  journeyId: "ehakbang:journey:event:had-a-baby",
  eventId: "had-a-baby",
  fieldAnswers: {},
  onSubmitFields: vi.fn(),
  autoApplied: false,
  claimed: false,
};

describe("StepCard", () => {
  const onAutoApplied = vi.fn();
  const onClaim = vi.fn();

  beforeEach(() => {
    onAutoApplied.mockReset();
    onClaim.mockReset();
    submitAutoApply.mockReset();
    fetchAutoApplyStatus.mockReset();
    baseProps.onSubmitFields.mockReset();
    fetchAutoApplyStatus.mockResolvedValue(null);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the Record Update badge for record steps", async () => {
    render(
      <StepCard
        step={recordStep}
        completed={false}
        onAutoApplied={onAutoApplied}
        onClaim={onClaim}
        {...baseProps}
      />,
    );
    await act(async () => {});
    expect(screen.getByText("Record Update")).toBeInTheDocument();
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("shows the Benefit Claim badge and disclaimer for benefit steps", async () => {
    render(
      <StepCard
        step={benefitStep}
        completed={false}
        onAutoApplied={onAutoApplied}
        onClaim={onClaim}
        {...baseProps}
      />,
    );
    await act(async () => {});
    expect(screen.getByText("Benefit Claim")).toBeInTheDocument();
    expect(screen.getByRole("note")).toBeInTheDocument();
  });

  it("shows an idle Auto Apply button when no queue entry exists", async () => {
    render(
      <StepCard
        step={recordStep}
        completed={false}
        onAutoApplied={onAutoApplied}
        onClaim={onClaim}
        {...baseProps}
      />,
    );
    await act(async () => {});
    expect(fetchAutoApplyStatus).toHaveBeenCalledWith({
      journeyId: baseProps.journeyId,
      stepNumber: 1,
    });
    expect(screen.getByRole("button", { name: /auto apply/i })).toBeInTheDocument();
  });

  it("shows the required-fields form when the step has unanswered required_fields", async () => {
    render(
      <StepCard
        step={fieldStep}
        completed={false}
        onAutoApplied={onAutoApplied}
        onClaim={onClaim}
        {...baseProps}
      />,
    );
    await act(async () => {});
    fireEvent.click(screen.getByRole("button", { name: /auto apply/i }));
    expect(screen.getByText("Proposed business name")).toBeInTheDocument();
  });

  it("submits directly, then polls, then auto-applies once accepted", async () => {
    submitAutoApply.mockResolvedValue({
      journeyId: baseProps.journeyId,
      stepNumber: 1,
      status: "pending",
      createdAt: new Date().toISOString(),
      acceptedAt: null,
    });
    fetchAutoApplyStatus
      .mockResolvedValueOnce(null) // initial mount check
      .mockResolvedValueOnce({
        journeyId: baseProps.journeyId,
        stepNumber: 1,
        status: "accepted",
        createdAt: new Date().toISOString(),
        acceptedAt: new Date().toISOString(),
      });

    render(
      <StepCard
        step={recordStep}
        completed={false}
        onAutoApplied={onAutoApplied}
        onClaim={onClaim}
        {...baseProps}
      />,
    );
    await act(async () => {});

    fireEvent.click(screen.getByRole("button", { name: /auto apply/i }));
    await act(async () => {});
    expect(submitAutoApply).toHaveBeenCalledWith(
      expect.objectContaining({ journeyId: baseProps.journeyId, stepNumber: 1 }),
    );
    expect(screen.getByText(/application pending/i)).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(onAutoApplied).toHaveBeenCalledWith(1);
  });

  it("resumes polling on mount when a pending queue entry already exists", async () => {
    fetchAutoApplyStatus
      .mockResolvedValueOnce({
        journeyId: baseProps.journeyId,
        stepNumber: 1,
        status: "pending",
        createdAt: new Date().toISOString(),
        acceptedAt: null,
      })
      .mockResolvedValueOnce({
        journeyId: baseProps.journeyId,
        stepNumber: 1,
        status: "accepted",
        createdAt: new Date().toISOString(),
        acceptedAt: new Date().toISOString(),
      });

    render(
      <StepCard
        step={recordStep}
        completed={false}
        onAutoApplied={onAutoApplied}
        onClaim={onClaim}
        {...baseProps}
      />,
    );
    await act(async () => {});
    expect(screen.getByText(/application pending/i)).toBeInTheDocument();
    expect(submitAutoApply).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(onAutoApplied).toHaveBeenCalledWith(1);
  });

  it("auto-applies immediately on mount if already accepted", async () => {
    fetchAutoApplyStatus.mockResolvedValueOnce({
      journeyId: baseProps.journeyId,
      stepNumber: 1,
      status: "accepted",
      createdAt: new Date().toISOString(),
      acceptedAt: new Date().toISOString(),
    });

    render(
      <StepCard
        step={recordStep}
        completed={false}
        onAutoApplied={onAutoApplied}
        onClaim={onClaim}
        {...baseProps}
      />,
    );
    await act(async () => {});
    expect(onAutoApplied).toHaveBeenCalledWith(1);
  });

  it("renders a completed state without any Auto Apply action", async () => {
    render(
      <StepCard
        step={recordStep}
        completed
        onAutoApplied={onAutoApplied}
        onClaim={onClaim}
        {...baseProps}
      />,
    );
    await act(async () => {});
    expect(screen.getByText(/^completed$/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /auto apply/i }),
    ).not.toBeInTheDocument();
    expect(fetchAutoApplyStatus).not.toHaveBeenCalled();
  });

  it("shows a claim-at-office prompt for completed, auto-applied, unclaimed steps", async () => {
    render(
      <StepCard
        step={recordStep}
        completed
        onAutoApplied={onAutoApplied}
        onClaim={onClaim}
        {...baseProps}
        autoApplied
        claimed={false}
      />,
    );
    await act(async () => {});
    expect(screen.getByText(/claim your document at/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /mark as done/i }));
    expect(onClaim).toHaveBeenCalledWith(1);
  });

  it("shows the plain Completed badge once an auto-applied step is claimed", async () => {
    render(
      <StepCard
        step={recordStep}
        completed
        onAutoApplied={onAutoApplied}
        onClaim={onClaim}
        {...baseProps}
        autoApplied
        claimed
      />,
    );
    await act(async () => {});
    expect(screen.getByText(/^completed$/i)).toBeInTheDocument();
    expect(screen.queryByText(/claim your document at/i)).not.toBeInTheDocument();
  });
});
