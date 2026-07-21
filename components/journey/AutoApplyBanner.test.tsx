import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AutoApplyBanner } from "./AutoApplyBanner";
import type { Journey, JourneyStep } from "@/lib/types";

const { applyMarriageTransaction, createFeePayment } = vi.hoisted(() => ({
  applyMarriageTransaction: vi.fn(),
  createFeePayment: vi.fn(),
}));
vi.mock("@/lib/api-client", () => ({ applyMarriageTransaction, createFeePayment }));

function step(overrides: Partial<JourneyStep>): JourneyStep {
  return {
    step_number: 1,
    agency_name: "Test Agency",
    agency_code: "TEST",
    step_title: "Test step",
    step_type: "record_update",
    reason: "Because.",
    documents_required: [],
    estimated_time: "1 day",
    important_note: null,
    egov_service_name: "Test Service",
    egov_search_term: "test",
    ...overrides,
  };
}

function journey(overrides: Partial<Journey> = {}): Journey {
  return {
    id: "ehakbang:journey:event:got-married",
    event_id: "got-married",
    emoji: "💍",
    life_event: "Got Married",
    summary: "Update your civil status.",
    total_steps: 2,
    record_updates: 2,
    benefit_claims: 0,
    steps: [
      step({ step_number: 1, agency_name: "PSA" }),
      step({ step_number: 2, agency_name: "PhilSys" }),
    ],
    status: "active",
    language: "en",
    created_at: "2026-07-22T00:00:00.000Z",
    completed_at: null,
    completed_step_numbers: [],
    paid_step_numbers: [],
    ...overrides,
  };
}

describe("AutoApplyBanner", () => {
  const onComplete = vi.fn();

  beforeEach(() => {
    onComplete.mockReset();
    applyMarriageTransaction.mockReset().mockResolvedValue({ submitted: true });
    createFeePayment.mockReset();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("skips straight to applying when no pending step has a fee", async () => {
    render(
      <AutoApplyBanner journey={journey()} completed={[]} onComplete={onComplete} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /yes, auto apply/i }));

    expect(screen.queryByText(/pay government fees/i)).not.toBeInTheDocument();
    await waitFor(() => expect(applyMarriageTransaction).toHaveBeenCalled());
  });

  it("shows a billing stage with the itemized total when a step has a payable fee", () => {
    const withFee = journey({
      steps: [
        step({
          step_number: 1,
          agency_name: "PSA",
          fee: { amount: "₱500", currency: "PHP", how_to_pay: "Pay at branch" },
        }),
        step({ step_number: 2, agency_name: "PhilSys" }),
      ],
    });
    render(<AutoApplyBanner journey={withFee} completed={[]} onComplete={onComplete} />);

    fireEvent.click(screen.getByRole("button", { name: /yes, auto apply/i }));

    expect(screen.getByText(/pay government fees/i)).toBeInTheDocument();
    expect(screen.getAllByText("₱500.00").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /pay ₱500.00 via egovpay/i }),
    ).toBeInTheDocument();
  });

  it("skipping the bill proceeds to applying without calling createFeePayment", async () => {
    const withFee = journey({
      steps: [
        step({
          step_number: 1,
          agency_name: "PSA",
          fee: { amount: "₱500", currency: "PHP", how_to_pay: "Pay at branch" },
        }),
      ],
      total_steps: 1,
      record_updates: 1,
    });
    render(<AutoApplyBanner journey={withFee} completed={[]} onComplete={onComplete} />);

    fireEvent.click(screen.getByRole("button", { name: /yes, auto apply/i }));
    fireEvent.click(screen.getByRole("button", { name: /skip, pay later/i }));

    await waitFor(() => expect(applyMarriageTransaction).toHaveBeenCalled());
    expect(createFeePayment).not.toHaveBeenCalled();
  });

  it("paying stores the pending-payment record and redirects to the eGovPay url", async () => {
    const withFee = journey({
      steps: [
        step({
          step_number: 1,
          agency_name: "PSA",
          fee: { amount: "₱500", currency: "PHP", how_to_pay: "Pay at branch" },
        }),
      ],
      total_steps: 1,
      record_updates: 1,
    });
    createFeePayment.mockResolvedValue({
      uuid: "tx-uuid",
      url: "https://egovpay.example/tx-uuid",
      txnid: "EHKB-1",
      amount: 500,
      currency: "PHP",
      stepNumbers: [1],
    });

    Object.defineProperty(window, "location", {
      value: { ...window.location, href: "" },
      writable: true,
    });

    render(<AutoApplyBanner journey={withFee} completed={[]} onComplete={onComplete} />);
    fireEvent.click(screen.getByRole("button", { name: /yes, auto apply/i }));
    fireEvent.click(screen.getByRole("button", { name: /pay ₱500.00 via egovpay/i }));

    await waitFor(() => expect(createFeePayment).toHaveBeenCalled());
    expect(window.sessionStorage.getItem("ehakbang:pending-payment")).toContain("tx-uuid");
    expect(window.location.href).toBe("https://egovpay.example/tx-uuid");
  });

  it("resumes straight into applying when the resume-auto-apply flag matches this journey", async () => {
    const base = journey();
    window.sessionStorage.setItem("ehakbang:resume-auto-apply", base.id);

    render(<AutoApplyBanner journey={base} completed={[]} onComplete={onComplete} />);

    await waitFor(() => expect(applyMarriageTransaction).toHaveBeenCalled());
    expect(window.sessionStorage.getItem("ehakbang:resume-auto-apply")).toBeNull();
  });
});
