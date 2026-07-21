import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/payment/webhook
 *
 * eGovPay requires a reachable callback_url on every transaction. The
 * pay/callback page confirms payment by polling GET /api/payment/[uuid]
 * (keyed off the unambiguous `paid_at` field), so this endpoint just accepts
 * the notification -- it isn't the source of truth for the UI.
 *
 * TODO: eGovPay's doc doesn't specify a signature scheme for verifying this
 * webhook is genuinely from eGovPay. Add verification once documented.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  console.log("eGovPay webhook received:", body);
  return NextResponse.json({ received: true });
}
