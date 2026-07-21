import { NextRequest, NextResponse } from "next/server";
import { getTransaction } from "@/lib/server/egovpay";

/**
 * GET /api/payment/[uuid]
 *
 * Checks an eGovPay transaction's status. `paid` is derived server-side from
 * `paid_at` -- the one unambiguous signal in the eGovPay spec -- so the
 * client never has to guess based on `payment_status` string values.
 *
 * Response:
 *   { uuid, paid, paidAt, refno, amount, currency, paymentStatus }
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  const { uuid } = await params;
  if (!uuid) {
    return NextResponse.json({ error: "Transaction uuid is required" }, { status: 400 });
  }

  try {
    const detail = await getTransaction(uuid);
    return NextResponse.json({
      uuid: detail.uuid,
      paid: detail.paidAt != null,
      paidAt: detail.paidAt,
      refno: detail.refno,
      amount: detail.amount,
      currency: detail.currency,
      paymentStatus: detail.paymentStatus,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch payment status", details: String(err) },
      { status: 500 },
    );
  }
}
