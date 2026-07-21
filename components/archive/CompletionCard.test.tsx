import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CompletionCard } from "./CompletionCard";
import type { Journey } from "@/lib/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const journey: Journey = {
  id: "ehakbang:journey:1",
  emoji: "💍",
  life_event: "Got Married",
  summary: "Update your civil status.",
  total_steps: 5,
  record_updates: 5,
  benefit_claims: 0,
  steps: [],
  status: "completed",
  language: "en",
  created_at: "2026-06-27T04:00:00.000Z",
  completed_at: "2026-07-05T07:30:00.000Z",
  completed_step_numbers: [1, 2, 3, 4, 5],
};

describe("CompletionCard", () => {
  beforeEach(() => push.mockReset());

  it("shows the completion heading and totals", () => {
    render(<CompletionCard journey={journey} />);
    expect(
      screen.getByRole("heading", { name: /journey complete/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("5 of 5")).toBeInTheDocument();
  });

  it("archives to the journeys list", () => {
    render(<CompletionCard journey={journey} />);
    fireEvent.click(screen.getByRole("button", { name: /archive this journey/i }));
    expect(push).toHaveBeenCalledWith("/journeys");
  });

  it("starts a new journey from home", () => {
    render(<CompletionCard journey={journey} />);
    fireEvent.click(screen.getByRole("button", { name: /start a new journey/i }));
    expect(push).toHaveBeenCalledWith("/");
  });

  it("in read-only mode, shows only Back to Home with no archive/start-new prompts", () => {
    render(<CompletionCard journey={journey} readOnly />);
    expect(
      screen.queryByRole("button", { name: /start a new journey/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /archive this journey/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /back to home/i }));
    expect(push).toHaveBeenCalledWith("/ehakbang");
  });

  it("for the married journey, shows only Continue to Dashboard with no archive/start-new prompts", () => {
    render(<CompletionCard journey={{ ...journey, event_id: "got-married" }} />);
    expect(
      screen.queryByRole("button", { name: /start a new journey/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /archive this journey/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /continue to dashboard/i }),
    );
    expect(push).toHaveBeenCalledWith("/ehakbang");
  });
});
