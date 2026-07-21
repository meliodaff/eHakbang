import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ApplyAllPrompt } from "./ApplyAllPrompt";

describe("ApplyAllPrompt", () => {
  it("shows the total number of processes", () => {
    render(
      <ApplyAllPrompt totalSteps={4} onApplyAll={vi.fn()} onDecline={vi.fn()} />,
    );
    expect(screen.getByText(/4/)).toBeInTheDocument();
  });

  it("calls onApplyAll when 'apply all' is clicked", () => {
    const onApplyAll = vi.fn();
    render(
      <ApplyAllPrompt
        totalSteps={4}
        onApplyAll={onApplyAll}
        onDecline={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /apply lahat/i }));
    expect(onApplyAll).toHaveBeenCalledTimes(1);
  });

  it("calls onDecline when 'no' is clicked", () => {
    const onDecline = vi.fn();
    render(
      <ApplyAllPrompt
        totalSteps={4}
        onApplyAll={vi.fn()}
        onDecline={onDecline}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /isa-isa/i }));
    expect(onDecline).toHaveBeenCalledTimes(1);
  });
});
