import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EventCardGrid } from "./EventCardGrid";
import { COMMON_LIFE_EVENTS, MORE_LIFE_EVENTS } from "@/lib/events";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("EventCardGrid", () => {
  beforeEach(() => {
    push.mockReset();
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
    const target = COMMON_LIFE_EVENTS[0];
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
});
