import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { JourneyListItem } from "./JourneyListItem";
import type { Journey } from "@/lib/types";

const base: Journey = {
  id: "ehakbang:journey:1",
  emoji: "👶",
  life_event: "Had a Baby",
  summary: "Register and claim benefits.",
  total_steps: 5,
  record_updates: 3,
  benefit_claims: 2,
  steps: [],
  status: "active",
  language: "en",
  created_at: "2026-07-18T09:00:00.000Z",
  completed_at: null,
  completed_step_numbers: [1, 2],
  paid_step_numbers: [],
  field_answers: {},
  auto_applied_step_numbers: [],
  claimed_step_numbers: [],
};

describe("JourneyListItem", () => {
  it("shows an In Progress badge and View Track link for active journeys", () => {
    render(
      <ul>
        <JourneyListItem journey={base} />
      </ul>,
    );
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /continue/i }),
    ).not.toBeInTheDocument();
    const link = screen.getByRole("link", { name: /view track/i });
    expect(link).toHaveAttribute("href", "/track");
  });

  it("shows a Complete badge and View link for archived journeys", () => {
    const archived: Journey = {
      ...base,
      status: "archived",
      completed_at: "2026-07-20T09:00:00.000Z",
      completed_step_numbers: [1, 2, 3, 4, 5],
    };
    render(
      <ul>
        <JourneyListItem journey={archived} />
      </ul>,
    );
    expect(screen.getByText("Complete")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /view/i });
    expect(link).toHaveAttribute("href", `/journey/complete?id=${archived.id}`);
  });
});
