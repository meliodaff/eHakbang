import type { JourneyStep } from "./types";

/**
 * Fee aggregation for the eGovPay "pay your fees" flow. `StepFee.amount` is
 * AI-generated free text (e.g. "₱500", "Free", "₱200–500 depending on LGU"),
 * so parsing is deliberately conservative: anything ambiguous (a range, a
 * qualifier, non-numeric text) is left unparsed rather than guessed, since
 * guessing wrong could over/under-charge a citizen.
 */

const ZERO_FEE_PATTERN = /^(free|none|n\/?a|no fee|no charge)$/i;
const PLAIN_NUMBER_PATTERN = /^(?:php|₱)?\s*([\d,]+(?:\.\d{1,2})?)$/i;

export function parseFeeAmount(amountText: string): number | null {
  const normalized = amountText.trim();
  if (ZERO_FEE_PATTERN.test(normalized)) return 0;

  const match = normalized.match(PLAIN_NUMBER_PATTERN);
  if (!match) return null;

  const value = parseFloat(match[1].replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

export interface PayableFeeItem {
  stepNumber: number;
  agencyName: string;
  stepTitle: string;
  amount: number;
  currency: string;
}

export interface FeeBill {
  payable: PayableFeeItem[];
  /** Steps with a fee that couldn't be parsed — must be paid manually at the agency. */
  manualPayNotes: JourneyStep[];
  totalAmount: number;
  currency: string;
}

/**
 * Buckets each step's fee (excluding any in `paidStepNumbers`) into a
 * payable, billable total vs. steps whose fee must be paid manually because
 * the amount couldn't be confidently parsed. Zero-cost fees are dropped —
 * there's nothing to bill or note.
 */
export function getFeeBill(
  steps: JourneyStep[],
  paidStepNumbers: number[] = [],
): FeeBill {
  const payable: PayableFeeItem[] = [];
  const manualPayNotes: JourneyStep[] = [];
  let currency = "PHP";

  for (const step of steps) {
    if (!step.fee || paidStepNumbers.includes(step.step_number)) continue;

    const amount = parseFeeAmount(step.fee.amount);
    if (amount === null) {
      manualPayNotes.push(step);
      continue;
    }
    if (amount <= 0) continue;

    currency = step.fee.currency || currency;
    payable.push({
      stepNumber: step.step_number,
      agencyName: step.agency_name,
      stepTitle: step.step_title,
      amount,
      currency,
    });
  }

  const totalAmount = payable.reduce((sum, item) => sum + item.amount, 0);
  return { payable, manualPayNotes, totalAmount, currency };
}

export function hasPayableFees(bill: FeeBill): boolean {
  return bill.payable.length > 0;
}

export function formatCurrency(amount: number, currency = "PHP"): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}
