import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EventCardGrid } from "./EventCardGrid";
import { COMMON_LIFE_EVENTS, MORE_LIFE_EVENTS } from "@/lib/events";
import { getJourneyByEventId } from "@/lib/event-journeys";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("EventCardGrid", () => {
  beforeEach(() => {
    push.mockReset();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders all common event cards by default", () => {
    render(<EventCardGrid />);
    for (const event of COMMON_LIFE_EVENTS) {
      expect(screen.getByText(event.short)).toBeInTheDocument();
    }
  });

  it("hides 'More events' cards until expanded", () => {
    render(<EventCardGrid />);
    const first = MORE_LIFE_EVENTS[0];
    expect(screen.queryByText(first.short)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /more events/i }));
    expect(screen.getByText(first.short)).toBeInTheDocument();
  });

  it("navigates to the journey route with the selected event id", () => {
    render(<EventCardGrid />);
    const target = COMMON_LIFE_EVENTS.find((e) => e.id !== "got-married")!;
    fireEvent.click(screen.getByText(target.short));
    expect(push).toHaveBeenCalledWith(`/journey?event=${target.id}`);
  });

  it("routes the married event to the confirm flow instead of straight to the journey", () => {
    render(<EventCardGrid />);
    const married = COMMON_LIFE_EVENTS.find((e) => e.id === "got-married")!;
    fireEvent.click(screen.getByText(married.short));
    expect(push).toHaveBeenCalledWith("/journey/confirm?event=got-married");
  });

  it("skips the confirm flow and goes straight to the read-only info view if the married journey is already completed", () => {
    const catalog = getJourneyByEventId("got-married")!;
    localStorage.setItem(
      "ehakbang:journeys",
      JSON.stringify([{ ...catalog, status: "completed" }]),
    );

    render(<EventCardGrid />);
    const married = COMMON_LIFE_EVENTS.find((e) => e.id === "got-married")!;
    fireEvent.click(screen.getByText(married.short));
    expect(push).toHaveBeenCalledWith(
      `/journey/complete?id=${encodeURIComponent(catalog.id)}&mode=info`,
    );
  });
});
