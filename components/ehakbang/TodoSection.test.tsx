import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EhakbangTodoSection } from "./TodoSection";
import { getJourneyByEventId } from "@/lib/event-journeys";
import { markStepAutoApplied, markStepsClaimed } from "@/lib/journey-store";

describe("EhakbangTodoSection", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("renders nothing when there are no auto-applied, unclaimed steps", async () => {
    render(<EhakbangTodoSection />);
    await waitFor(() => expect(screen.queryByText("To Do")).not.toBeInTheDocument());
  });

  it("lists an auto-applied step awaiting claim", async () => {
    const catalog = getJourneyByEventId("had-a-baby")!;
    markStepAutoApplied({ ...catalog }, 1);

    render(<EhakbangTodoSection />);

    await waitFor(() => expect(screen.getByText("To Do")).toBeInTheDocument());
    expect(screen.getByText(/claim your document at/i)).toBeInTheDocument();
  });

  it("removes the item once Mark as Done is clicked", async () => {
    const catalog = getJourneyByEventId("had-a-baby")!;
    markStepAutoApplied({ ...catalog }, 1);

    render(<EhakbangTodoSection />);
    await waitFor(() => expect(screen.getByText("To Do")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /mark as done/i }));

    await waitFor(() => expect(screen.queryByText("To Do")).not.toBeInTheDocument());
  });

  it("does not list steps already claimed", async () => {
    const catalog = getJourneyByEventId("had-a-baby")!;
    const applied = markStepAutoApplied({ ...catalog }, 1);
    markStepsClaimed(applied, [1]);

    render(<EhakbangTodoSection />);
    await waitFor(() => expect(screen.queryByText("To Do")).not.toBeInTheDocument());
  });
});
