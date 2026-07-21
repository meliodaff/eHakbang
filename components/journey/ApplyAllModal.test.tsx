import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ApplyAllModal } from "./ApplyAllModal";
import type { JourneyStep } from "@/lib/types";

function step(n: number, title: string): JourneyStep {
  return {
    step_number: n,
    agency_name: `Agency ${n}`,
    agency_code: `A${n}`,
    step_title: title,
    step_type: "record_update",
    reason: "",
    documents_required: [],
    estimated_time: "",
    important_note: null,
    egov_service_name: "",
    egov_search_term: "",
  };
}

const steps = [step(1, "Step A"), step(2, "Step B")];

describe("ApplyAllModal", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows submitting state initially and lists every step", () => {
    render(<ApplyAllModal steps={steps} onFinished={vi.fn()} />);
    expect(
      screen.getByText(/submitting your applications/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Step A")).toBeInTheDocument();
    expect(screen.getByText("Step B")).toBeInTheDocument();
  });

  it("submits each step then reveals Continue which fires onFinished", () => {
    const onFinished = vi.fn();
    render(<ApplyAllModal steps={steps} onFinished={onFinished} />);

    // No Continue button until all steps are submitted.
    expect(
      screen.queryByRole("button", { name: /^continue$/i }),
    ).not.toBeInTheDocument();

    // Two steps × 900ms interval → run past both ticks.
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText(/all done applying/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
    expect(onFinished).toHaveBeenCalledTimes(1);
  });
});
