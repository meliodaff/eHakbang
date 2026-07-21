import { describe, it, expect } from "vitest";
import { parseFeeAmount, getFeeBill, hasPayableFees, formatCurrency } from "./journey-fees";
import type { JourneyStep } from "./types";

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

describe("parseFeeAmount", () => {
  it.each([
    ["₱500", 500],
    ["500", 500],
    ["php500", 500],
    ["₱1,200.50", 1200.5],
    ["Free", 0],
    ["None", 0],
    ["N/A", 0],
    ["No fee", 0],
    ["₱200–500 depending on LGU", null],
    ["₱200-500", null],
    ["Varies", null],
    ["Php 300 or 500", null],
    ["approx ₱250", null],
  ])("parses %s -> %s", (input, expected) => {
    expect(parseFeeAmount(input)).toBe(expected);
  });
});

describe("getFeeBill", () => {
  it("buckets payable, manual, and free fees; sums the total", () => {
    const steps = [
      step({ step_number: 1, fee: { amount: "₱500", currency: "PHP", how_to_pay: "Pay at branch" } }),
      step({ step_number: 2, fee: { amount: "₱200–500 depending on LGU", currency: "PHP", how_to_pay: "Pay at LGU" } }),
      step({ step_number: 3, fee: { amount: "Free", currency: "PHP", how_to_pay: "N/A" } }),
      step({ step_number: 4, fee: null }),
      step({ step_number: 5, fee: { amount: "₱300", currency: "PHP", how_to_pay: "Pay online" } }),
    ];

    const bill = getFeeBill(steps);

    expect(bill.payable.map((p) => p.stepNumber)).toEqual([1, 5]);
    expect(bill.manualPayNotes.map((s) => s.step_number)).toEqual([2]);
    expect(bill.totalAmount).toBe(800);
    expect(bill.currency).toBe("PHP");
    expect(hasPayableFees(bill)).toBe(true);
  });

  it("excludes steps already marked paid", () => {
    const steps = [
      step({ step_number: 1, fee: { amount: "₱500", currency: "PHP", how_to_pay: "Pay at branch" } }),
    ];

    const bill = getFeeBill(steps, [1]);

    expect(bill.payable).toEqual([]);
    expect(hasPayableFees(bill)).toBe(false);
  });

  it("returns an empty bill when nothing has a fee", () => {
    const bill = getFeeBill([step({ step_number: 1, fee: null })]);
    expect(bill.payable).toEqual([]);
    expect(bill.manualPayNotes).toEqual([]);
    expect(bill.totalAmount).toBe(0);
  });
});

describe("formatCurrency", () => {
  it("formats PHP amounts", () => {
    expect(formatCurrency(500)).toBe("₱500.00");
  });
});
