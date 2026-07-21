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

  it("continues to the eHakbang services home", () => {
    render(<CompletionCard journey={journey} />);
    fireEvent.click(
      screen.getByRole("button", { name: /continue to ehakbang services/i }),
    );
    expect(push).toHaveBeenCalledWith("/ehakbang");
  });
});
