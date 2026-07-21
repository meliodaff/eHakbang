import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StepCard } from "./StepCard";
import type { JourneyStep } from "@/lib/types";

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

describe("StepCard", () => {
  const onComplete = vi.fn();
  beforeEach(() => onComplete.mockReset());

  it("shows the Record Update badge for record steps", () => {
    render(<StepCard step={recordStep} completed={false} onComplete={onComplete} />);
    expect(screen.getByText("Record Update")).toBeInTheDocument();
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("shows the Benefit Claim badge and disclaimer for benefit steps", () => {
    render(<StepCard step={benefitStep} completed={false} onComplete={onComplete} />);
    expect(screen.getByText("Benefit Claim")).toBeInTheDocument();
    expect(screen.getByRole("note")).toBeInTheDocument();
  });

  it("requires confirmation before marking done", () => {
    render(<StepCard step={recordStep} completed={false} onComplete={onComplete} />);
    fireEvent.click(screen.getByRole("button", { name: /mark as done/i }));
    expect(screen.getByText(/did you complete this step\?/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^yes$/i }));
    expect(onComplete).toHaveBeenCalledWith(1);
  });

  it("renders a completed state without the action button", () => {
    render(<StepCard step={recordStep} completed onComplete={onComplete} />);
    expect(screen.getByText(/^completed$/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /mark as done/i }),
    ).not.toBeInTheDocument();
  });
});
