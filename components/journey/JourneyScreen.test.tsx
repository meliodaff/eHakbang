import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { JourneyScreen } from "./JourneyScreen";
import { getJourneyByEventId } from "@/lib/event-journeys";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const { submitAutoApply, fetchAutoApplyStatus, submitEnrollment, notifyStepUpdate } =
  vi.hoisted(() => ({
    submitAutoApply: vi.fn(),
    fetchAutoApplyStatus: vi.fn(),
    submitEnrollment: vi.fn(),
    notifyStepUpdate: vi.fn(),
  }));
vi.mock("@/lib/api-client", () => ({
  submitAutoApply,
  fetchAutoApplyStatus,
  submitEnrollment,
  notifyStepUpdate,
}));

let queued: Set<number>;

/**
 * Holds every ID these tests' civil-status journeys touch, so their
 * record-update steps ("Update civil status with SSS", etc.) are actionable
 * instead of auto-resolving as not-applicable (see
 * lib/journey-record-update-gate.ts) -- these tests exercise driving every
 * step to completion manually, not the not-applicable gate itself.
 */
function seedIdWallet() {
  localStorage.setItem(
    "ehakbang:id-wallet",
    JSON.stringify(["sss", "philhealth", "pagibig", "tin", "philsys"]),
  );
}

/**
 * Unlocks every benefit currently shown in a locked "action needed" state by
 * declaring the citizen already holds the required ID -- so the claim's
 * Auto Apply action appears and completeAllSteps can drive it.
 */
async function unlockBlockedBenefits() {
  let unlockButtons = screen.queryAllByRole("button", {
    name: /i already have this number/i,
  });
  while (unlockButtons.length > 0) {
    fireEvent.click(unlockButtons[0]);
    await act(async () => {});
    unlockButtons = screen.queryAllByRole("button", {
      name: /i already have this number/i,
    });
  }
}

/**
 * Passes any indicative eligibility pre-check currently shown by filling the
 * contingency date (recent, within any window), ticking the contributions
 * self-check, and clicking "Check eligibility" until none remain.
 */
async function passEligibilityGates() {
  let checkButtons = screen.queryAllByRole("button", {
    name: /^check eligibility$/i,
  });
  while (checkButtons.length > 0) {
    const dateInputs = screen.queryAllByLabelText(/date of delivery/i);
    if (dateInputs.length > 0) {
      fireEvent.change(dateInputs[0], { target: { value: "2026-07-01" } });
    }
    for (const box of screen.queryAllByRole("checkbox")) {
      if (!(box as HTMLInputElement).checked) fireEvent.click(box);
    }
    fireEvent.click(checkButtons[0]);
    await act(async () => {});
    checkButtons = screen.queryAllByRole("button", {
      name: /^check eligibility$/i,
    });
  }
}

/**
 * Manually completes every step via StepCard's "Auto Apply" → mocked
 * queue-accepted flow. Unlocks enrollment-blocked benefits and clears their
 * eligibility gates first. None of the journeys exercised here have
 * `required_fields`, so every step submits directly.
 */
async function completeAllSteps(total: number) {
  await unlockBlockedBenefits();
  await passEligibilityGates();
  for (let i = 0; i < total; i++) {
    const [applyButton] = screen.getAllByRole("button", {
      name: /^(auto apply|file this claim)$/i,
    });
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
    submitEnrollment.mockReset();
    notifyStepUpdate.mockReset();
    submitEnrollment.mockResolvedValue({
      stepNumber: 0,
      requiredId: "philhealth",
      referenceNumber: "SIM-PHILHEALTH-TEST",
      simulated: true,
    });
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
    vi.setSystemTime(new Date("2026-07-28T00:00:00.000Z"));
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it("repairs a persisted empty journey instead of rendering a blank checklist", async () => {
    const catalog = getJourneyByEventId("started-a-business")!;
    localStorage.setItem(
      "ehakbang:journeys",
      JSON.stringify([{ ...catalog, steps: [], total_steps: 0 }]),
    );

    render(<JourneyScreen eventId="started-a-business" initialJourney={catalog} />);
    await act(async () => {});

    expect(screen.getByText("Register your business name")).toBeInTheDocument();
    const stored = JSON.parse(localStorage.getItem("ehakbang:journeys") ?? "[]");
    expect(stored[0].steps).toHaveLength(catalog.steps.length);
  });

  it("shows a recovery state instead of blank whitespace for a zero-step journey", async () => {
    const catalog = getJourneyByEventId("started-a-business")!;
    render(
      <JourneyScreen
        eventId="started-a-business"
        initialJourney={{ ...catalog, steps: [], total_steps: 0 }}
      />,
    );
    await act(async () => {});

    expect(screen.getByRole("status")).toHaveTextContent(
      "No checklist steps are available",
    );
  });

  it("goes to the celebration screen once the married journey is fully complete", async () => {
    seedIdWallet();
    render(<JourneyScreen eventId="got-married" />);
    await act(async () => {});
    const catalog = getJourneyByEventId("got-married")!;
    await completeAllSteps(catalog.total_steps);

    expect(push).toHaveBeenCalledWith(
      `/journey/complete?id=${encodeURIComponent(catalog.id)}`,
    );
  });

  it("goes to the celebration screen once the annulment journey is fully complete", async () => {
    seedIdWallet();
    render(<JourneyScreen eventId="annulment" />);
    await act(async () => {});
    const catalog = getJourneyByEventId("annulment")!;
    await completeAllSteps(catalog.total_steps);

    expect(push).toHaveBeenCalledWith(
      `/journey/complete?id=${encodeURIComponent(catalog.id)}`,
    );
  });

  it("goes to the celebration screen for a non-married journey", async () => {
    seedIdWallet();
    render(<JourneyScreen eventId="had-a-baby" />);
    await act(async () => {});
    const catalog = getJourneyByEventId("had-a-baby")!;
    await completeAllSteps(catalog.total_steps);

    expect(push).toHaveBeenCalledWith(
      `/journey/complete?id=${encodeURIComponent(catalog.id)}`,
    );
  });

  it("locks a benefit whose ID is missing, then unlocks it after enrolling", async () => {
    render(<JourneyScreen eventId="had-a-baby" />);
    await act(async () => {});

    // With an empty wallet, the prerequisite benefit(s) render locked.
    expect(screen.getAllByText(/action needed/i).length).toBeGreaterThan(0);
    const enrollButtons = screen.getAllByRole("button", { name: /register for/i });
    expect(enrollButtons.length).toBeGreaterThan(0);

    // Declaring an existing number unlocks that claim (Auto Apply appears).
    const [alreadyHave] = screen.getAllByRole("button", {
      name: /i already have this number/i,
    });
    fireEvent.click(alreadyHave);
    await act(async () => {});

    // One fewer locked benefit than before.
    expect(screen.getAllByText(/action needed/i).length).toBe(
      enrollButtons.length - 1,
    );
  });

  it("marks a civil-status update step not applicable when the citizen lacks the ID it would update", async () => {
    // Empty wallet: got-married's SSS step ("Update civil status &
    // beneficiaries") has no fulfills_id -- it updates an existing SSS
    // record the citizen doesn't have yet, so it should resolve as N/A
    // rather than requiring an Auto Apply click.
    render(<JourneyScreen eventId="got-married" />);
    await act(async () => {});

    expect(screen.getAllByText(/not applicable/i).length).toBeGreaterThan(0);
  });
});
