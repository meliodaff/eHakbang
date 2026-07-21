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
    const target = COMMON_LIFE_EVENTS.find((e) => e.id === "started-a-business")!;
    fireEvent.click(screen.getByText(target.short));
    expect(push).toHaveBeenCalledWith(`/journey?event=${target.id}`);
  });

  it("routes the graduated event through the verification gate", () => {
    render(<EventCardGrid />);
    fireEvent.click(screen.getByRole("button", { name: /more events/i }));
    const graduated = MORE_LIFE_EVENTS.find((e) => e.id === "just-graduated");
    expect(graduated).toBeDefined();
    fireEvent.click(screen.getByText(graduated!.short));
    expect(push).toHaveBeenCalledWith("/journey/verify?event=just-graduated");
  });

  it("routes the moved-residence event through the verification gate", () => {
    render(<EventCardGrid />);
    fireEvent.click(screen.getByRole("button", { name: /more events/i }));
    const moved = MORE_LIFE_EVENTS.find((e) => e.id === "moved-residence");
    expect(moved).toBeDefined();
    fireEvent.click(screen.getByText(moved!.short));
    expect(push).toHaveBeenCalledWith("/journey/verify?event=moved-residence");
  });

  it("routes the first-job event through the verification gate", () => {
    render(<EventCardGrid />);
    fireEvent.click(screen.getByRole("button", { name: /more events/i }));
    const firstJob = MORE_LIFE_EVENTS.find((e) => e.id === "first-job");
    expect(firstJob).toBeDefined();
    fireEvent.click(screen.getByText(firstJob!.short));
    expect(push).toHaveBeenCalledWith("/journey/verify?event=first-job");
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

  it("routes the annulment event to the confirm flow instead of straight to the journey", () => {
    render(<EventCardGrid />);
    fireEvent.click(screen.getByRole("button", { name: /more events/i }));
    const annulment = MORE_LIFE_EVENTS.find((e) => e.id === "annulment")!;
    expect(annulment).toBeDefined();
    fireEvent.click(screen.getByText(annulment.short));
    expect(push).toHaveBeenCalledWith("/journey/confirm?event=annulment");
  });

  it("skips the confirm flow and goes straight to the read-only info view if the annulment journey is already completed", () => {
    const catalog = getJourneyByEventId("annulment")!;
    localStorage.setItem(
      "ehakbang:journeys",
      JSON.stringify([{ ...catalog, status: "completed" }]),
    );

    render(<EventCardGrid />);
    fireEvent.click(screen.getByRole("button", { name: /more events/i }));
    const annulment = MORE_LIFE_EVENTS.find((e) => e.id === "annulment")!;
    fireEvent.click(screen.getByText(annulment.short));
    expect(push).toHaveBeenCalledWith(
      `/journey/complete?id=${encodeURIComponent(catalog.id)}&mode=info`,
    );
  });
});
