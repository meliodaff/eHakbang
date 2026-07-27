import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { JourneyScreen } from "./JourneyScreen";
import { getJourneyByEventId } from "@/lib/event-journeys";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const { submitAutoApply, fetchAutoApplyStatus } = vi.hoisted(() => ({
  submitAutoApply: vi.fn(),
  fetchAutoApplyStatus: vi.fn(),
}));
vi.mock("@/lib/api-client", () => ({ submitAutoApply, fetchAutoApplyStatus }));

let queued: Set<number>;

/**
 * Manually completes every step via StepCard's "Auto Apply" → mocked
 * queue-accepted flow. None of the journeys exercised here have
 * `required_fields`, so every step submits directly.
 */
async function completeAllSteps(total: number) {
  for (let i = 0; i < total; i++) {
    const [applyButton] = screen.getAllByRole("button", { name: "Auto Apply" });
    fireEvent.click(applyButton);
    await act(async () => {});
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
  }
  // handleComplete's navigation is delayed by a 400ms setTimeout once the
  // journey is fully done -- advance past it so `push` has actually fired.
  await act(async () => {
    await vi.advanceTimersByTimeAsync(400);
  });
}

describe("JourneyScreen", () => {
  beforeEach(() => {
    push.mockReset();
    localStorage.clear();
    queued = new Set();
    submitAutoApply.mockReset();
    fetchAutoApplyStatus.mockReset();
    submitAutoApply.mockImplementation(async ({ stepNumber }: { stepNumber: number }) => {
      queued.add(stepNumber);
      return {
        journeyId: "test",
        stepNumber,
        status: "pending" as const,
        createdAt: new Date().toISOString(),
        acceptedAt: null,
      };
    });
    fetchAutoApplyStatus.mockImplementation(async ({ stepNumber }: { stepNumber: number }) => {
      if (!queued.has(stepNumber)) return null;
      return {
        journeyId: "test",
        stepNumber,
        status: "accepted" as const,
        createdAt: new Date().toISOString(),
        acceptedAt: new Date().toISOString(),
      };
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it("goes to the celebration screen once the married journey is fully complete", async () => {
    render(<JourneyScreen eventId="got-married" />);
    await act(async () => {});
    const catalog = getJourneyByEventId("got-married")!;
    await completeAllSteps(catalog.total_steps);

    expect(push).toHaveBeenCalledWith(
      `/journey/complete?id=${encodeURIComponent(catalog.id)}`,
    );
  });

  it("goes to the celebration screen once the annulment journey is fully complete", async () => {
    render(<JourneyScreen eventId="annulment" />);
    await act(async () => {});
    const catalog = getJourneyByEventId("annulment")!;
    await completeAllSteps(catalog.total_steps);

    expect(push).toHaveBeenCalledWith(
      `/journey/complete?id=${encodeURIComponent(catalog.id)}`,
    );
  });

  it("goes to the celebration screen for a non-married journey", async () => {
    render(<JourneyScreen eventId="had-a-baby" />);
    await act(async () => {});
    const catalog = getJourneyByEventId("had-a-baby")!;
    await completeAllSteps(catalog.total_steps);

    expect(push).toHaveBeenCalledWith(
      `/journey/complete?id=${encodeURIComponent(catalog.id)}`,
    );
  });
});
