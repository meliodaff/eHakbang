import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AutoApplyBanner } from "./AutoApplyBanner";
import type { Journey, JourneyStep } from "@/lib/types";

const { submitAutoApply, createFeePayment, notifyAutoApplySuccess } = vi.hoisted(() => ({
  submitAutoApply: vi.fn(),
  createFeePayment: vi.fn(),
  notifyAutoApplySuccess: vi.fn(),
}));
vi.mock("@/lib/api-client", () => ({
  submitAutoApply,
  createFeePayment,
  notifyAutoApplySuccess,
}));

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
    field_answers: {},
    auto_applied_step_numbers: [],
    claimed_step_numbers: [],
    ...overrides,
  };
}

describe("AutoApplyBanner", () => {
  const onComplete = vi.fn();

  beforeEach(() => {
    onComplete.mockReset();
    submitAutoApply.mockReset().mockResolvedValue({ status: "pending" });
    createFeePayment.mockReset();
    notifyAutoApplySuccess.mockReset();
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  afterEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  it("skips straight to applying when no pending step has a fee", async () => {
    render(
      <AutoApplyBanner journey={journey()} completed={[]} onComplete={onComplete} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /yes, auto apply/i }));

    expect(screen.queryByText(/pay government fees/i)).not.toBeInTheDocument();
    await waitFor(() => expect(submitAutoApply).toHaveBeenCalled());
    await waitFor(() => expect(notifyAutoApplySuccess).toHaveBeenCalledWith("got-married"));
    // Approval now lives on the /track page, so the banner never completes
    // steps itself -- it links there instead.
    expect(onComplete).not.toHaveBeenCalled();
    const trackLink = await screen.findByRole("link", {
      name: /track your applications/i,
    });
    expect(trackLink).toHaveAttribute("href", "/track");
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

    await waitFor(() => expect(submitAutoApply).toHaveBeenCalled());
    expect(createFeePayment).not.toHaveBeenCalled();
  });

  it("redirects to face verification instead of paying when no verified token is present", () => {
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

    Object.defineProperty(window, "location", {
      value: { ...window.location, href: "" },
      writable: true,
    });

    render(<AutoApplyBanner journey={withFee} completed={[]} onComplete={onComplete} />);
    fireEvent.click(screen.getByRole("button", { name: /yes, auto apply/i }));
    fireEvent.click(screen.getByRole("button", { name: /pay ₱500.00 via egovpay/i }));

    expect(createFeePayment).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem("ehakbang:resume-pay")).toBe("got-married");
    expect(window.location.href).toBe("/journey/pay/verify?event=got-married");
  });

  it("paying stores the pending-payment record and redirects to the eGovPay url once verified", async () => {
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
    window.sessionStorage.setItem("ehakbang:payment-verified-token", "verified-token");

    Object.defineProperty(window, "location", {
      value: { ...window.location, href: "" },
      writable: true,
    });

    render(<AutoApplyBanner journey={withFee} completed={[]} onComplete={onComplete} />);
    fireEvent.click(screen.getByRole("button", { name: /yes, auto apply/i }));
    fireEvent.click(screen.getByRole("button", { name: /pay ₱500.00 via egovpay/i }));

    await waitFor(() => expect(createFeePayment).toHaveBeenCalled());
    expect(createFeePayment).toHaveBeenCalledWith(
      expect.objectContaining({ livenessToken: "verified-token" }),
    );
    expect(window.sessionStorage.getItem("ehakbang:pending-payment")).toContain("tx-uuid");
    expect(window.sessionStorage.getItem("ehakbang:payment-verified-token")).toBeNull();
    expect(window.location.href).toBe("https://egovpay.example/tx-uuid");
  });

  it("resumes straight into applying when the resume-auto-apply flag matches this journey", async () => {
    const base = journey();
    window.sessionStorage.setItem("ehakbang:resume-auto-apply", base.id);

    render(<AutoApplyBanner journey={base} completed={[]} onComplete={onComplete} />);

    await waitFor(() => expect(submitAutoApply).toHaveBeenCalled());
    expect(window.sessionStorage.getItem("ehakbang:resume-auto-apply")).toBeNull();
  });

  it("shows the fields form instead of applying when a pending step needs required fields", () => {
    const withField = journey({
      steps: [
        step({
          step_number: 1,
          agency_name: "DTI",
          step_title: "Register your business name",
          required_fields: [
            {
              field_key: "proposed_business_name",
              label: "Proposed business name",
              field_type: "text",
              required: true,
            },
          ],
        }),
      ],
      total_steps: 1,
      record_updates: 1,
    });

    render(<AutoApplyBanner journey={withField} completed={[]} onComplete={onComplete} />);
    fireEvent.click(screen.getByRole("button", { name: /yes, auto apply/i }));

    expect(submitAutoApply).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/proposed business name/i)).toBeInTheDocument();
  });

  it("submitting the fields form persists the answers and proceeds to applying", async () => {
    const withField = journey({
      steps: [
        step({
          step_number: 1,
          agency_name: "DTI",
          step_title: "Register your business name",
          required_fields: [
            {
              field_key: "proposed_business_name",
              label: "Proposed business name",
              field_type: "text",
              required: true,
            },
          ],
        }),
      ],
      total_steps: 1,
      record_updates: 1,
    });

    render(<AutoApplyBanner journey={withField} completed={[]} onComplete={onComplete} />);
    fireEvent.click(screen.getByRole("button", { name: /yes, auto apply/i }));

    fireEvent.change(screen.getByLabelText(/proposed business name/i), {
      target: { value: "Juana's Sari-Sari Store" },
    });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => expect(submitAutoApply).toHaveBeenCalled());
    expect(submitAutoApply).toHaveBeenCalledWith(
      expect.objectContaining({
        stepNumber: 1,
        fieldAnswers: { proposed_business_name: "Juana's Sari-Sari Store" },
      }),
    );
  });

  it("offers auto apply and fee billing on a non-civil-status (flexible/custom) journey too", () => {
    const custom = journey({
      id: "ehakbang:journey:event:custom-abc123",
      event_id: "custom-abc123",
      steps: [
        step({
          step_number: 1,
          agency_name: "DFA",
          fee: { amount: "₱950", currency: "PHP", how_to_pay: "Pay at branch" },
        }),
      ],
      total_steps: 1,
      record_updates: 1,
    });

    render(<AutoApplyBanner journey={custom} completed={[]} onComplete={onComplete} />);

    expect(screen.queryByText(/uploaded certificate/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /yes, auto apply/i }));

    expect(screen.getByText(/pay government fees/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /pay ₱950.00 via egovpay/i }),
    ).toBeInTheDocument();
  });

  it("resumes straight into payment when the resume-pay flag matches this journey", async () => {
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
    window.sessionStorage.setItem("ehakbang:resume-pay", "got-married");
    window.sessionStorage.setItem("ehakbang:payment-verified-token", "verified-token");

    Object.defineProperty(window, "location", {
      value: { ...window.location, href: "" },
      writable: true,
    });

    render(<AutoApplyBanner journey={withFee} completed={[]} onComplete={onComplete} />);

    await waitFor(() => expect(createFeePayment).toHaveBeenCalled());
    expect(window.sessionStorage.getItem("ehakbang:resume-pay")).toBeNull();
    expect(window.location.href).toBe("https://egovpay.example/tx-uuid");
  });
});
