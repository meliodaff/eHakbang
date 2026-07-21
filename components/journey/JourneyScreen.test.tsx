import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { JourneyScreen } from "./JourneyScreen";
import { getJourneyByEventId } from "@/lib/event-journeys";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

/** Manually completes every step via StepCard's "Mark as Done" → "Yes" flow. */
function completeAllSteps(total: number) {
  for (let i = 0; i < total; i++) {
    const [markButton] = screen.getAllByRole("button", {
      name: /mark as done/i,
    });
    fireEvent.click(markButton);
    fireEvent.click(screen.getAllByRole("button", { name: /^yes$/i })[0]);
  }
}

describe("JourneyScreen", () => {
  beforeEach(() => {
    push.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("goes to the celebration screen once the married journey is fully complete", async () => {
    render(<JourneyScreen eventId="got-married" />);
    const catalog = getJourneyByEventId("got-married")!;
    completeAllSteps(catalog.total_steps);

    await waitFor(
      () =>
        expect(push).toHaveBeenCalledWith(
          `/journey/complete?id=${encodeURIComponent(catalog.id)}`,
        ),
      { timeout: 1000 },
    );
  });

  it("goes to the celebration screen once the annulment journey is fully complete", async () => {
    render(<JourneyScreen eventId="annulment" />);
    const catalog = getJourneyByEventId("annulment")!;
    completeAllSteps(catalog.total_steps);

    await waitFor(
      () =>
        expect(push).toHaveBeenCalledWith(
          `/journey/complete?id=${encodeURIComponent(catalog.id)}`,
        ),
      { timeout: 1000 },
    );
  });

  it("goes to the celebration screen for a non-married journey", async () => {
    render(<JourneyScreen eventId="had-a-baby" />);
    const catalog = getJourneyByEventId("had-a-baby")!;
    completeAllSteps(catalog.total_steps);

    await waitFor(
      () =>
        expect(push).toHaveBeenCalledWith(
          `/journey/complete?id=${encodeURIComponent(catalog.id)}`,
        ),
      { timeout: 1000 },
    );
  });
});
