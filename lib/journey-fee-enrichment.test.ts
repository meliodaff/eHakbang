import { describe, expect, it } from "vitest";
import { getFeeBill } from "./journey-fees";
import {
  DFA_PASSPORT_FEE_SOURCE,
  enrichOfficialFees,
} from "./journey-fee-enrichment";
import type { JourneyStep } from "./types";

function step(overrides: Partial<JourneyStep> = {}): JourneyStep {
  return {
    step_number: 1,
    agency_name: "Department of Foreign Affairs",
    agency_code: "DFA",
    step_title: "Apply for a Philippine passport",
    step_type: "record_update",
    reason: "Schedule the application online.",
    documents_required: [],
    estimated_time: "Check with agency",
    important_note: null,
    fee: null,
    egov_service_name: "Passport Application",
    egov_search_term: "DFA passport application",
    required_fields: [],
    ...overrides,
  };
}

describe("enrichOfficialFees", () => {
  it("adds the official regular DFA passport fee and makes it payable", () => {
    const [passport] = enrichOfficialFees([step()]);

    expect(passport.fee).toEqual({
      amount: "₱950",
      currency: "PHP",
      how_to_pay: expect.stringContaining("Regular passport processing fee"),
      official_source_url: DFA_PASSPORT_FEE_SOURCE,
    });
    const bill = getFeeBill([passport]);
    expect(bill.payable).toEqual([
      expect.objectContaining({ stepNumber: 1, amount: 950, currency: "PHP" }),
    ]);
    expect(bill.totalAmount).toBe(950);
  });

  it("preserves a fee already supplied for a DFA passport step", () => {
    const existing = {
      amount: "₱1,200",
      currency: "PHP",
      how_to_pay: "Expedited processing",
      official_source_url: "https://example.test/official",
    };

    expect(enrichOfficialFees([step({ fee: existing })])[0].fee).toBe(existing);
  });

  it("does not add fees to non-passport DFA services or non-DFA passport text", () => {
    const authentication = step({
      step_title: "Authenticate a document",
      egov_service_name: "Document Authentication",
      egov_search_term: "DFA authentication",
    });
    const unrelatedAgency = step({
      agency_name: "Test Agency",
      agency_code: "TEST",
    });

    expect(enrichOfficialFees([authentication, unrelatedAgency]).map((s) => s.fee)).toEqual([
      null,
      null,
    ]);
  });
});
