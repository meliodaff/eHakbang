import { NextRequest, NextResponse } from "next/server";
import { getLifeEventById } from "@/lib/events";
import { getOrRegenerateJourney } from "@/lib/server/journey-requirements";
import { createTransaction, generateTxnId } from "@/lib/server/egovpay";
import { getFeeBill } from "@/lib/journey-fees";
import type { Language } from "@/lib/types";

/**
 * POST /api/payment
 *
 * Starts an eGovPay transaction for a bundle of fee-bearing steps in a
 * predefined-event journey. Fee amounts are never trusted from the client --
 * this re-derives the canonical journey (the same source /api/journey uses)
 * and only bills steps whose fee it can independently confirm is payable.
 *
 * Request body:
 *   { eventId: string; language?: "en" | "fil"; stepNumbers: number[] }
 *
 * Response:
 *   { uuid: string; url: string; txnid: string; amount: number; currency: string; stepNumbers: number[] }
 */
export async function POST(request: NextRequest) {
  let body: { eventId?: string; language?: Language; stepNumbers?: number[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.eventId || typeof body.eventId !== "string") {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }
  if (!getLifeEventById(body.eventId)) {
    return NextResponse.json({ error: "Unknown eventId" }, { status: 400 });
  }
  if (!Array.isArray(body.stepNumbers) || body.stepNumbers.length === 0) {
    return NextResponse.json({ error: "stepNumbers is required" }, { status: 400 });
  }

  const { journey } = await getOrRegenerateJourney({
    eventId: body.eventId,
    language: body.language,
  });

  const bill = getFeeBill(journey.steps);
  const requested = new Set(body.stepNumbers);
  const matched = bill.payable.filter((item) => requested.has(item.stepNumber));

  if (matched.length !== requested.size) {
    const matchedNumbers = new Set(matched.map((m) => m.stepNumber));
    const unbillable = body.stepNumbers.filter((n) => !matchedNumbers.has(n));
    return NextResponse.json(
      { error: "One or more requested steps are not billable", stepNumbers: unbillable },
      { status: 400 },
    );
  }

  const amount = matched.reduce((sum, item) => sum + item.amount, 0);
  const items = matched.map((item) => ({
    name: `${item.agencyName} — ${item.stepTitle}`,
    amount: item.amount,
  }));
  const txnid = generateTxnId();
  const origin = request.nextUrl.origin;
  const redirectUrl = `${origin}/journey/pay/callback?event=${encodeURIComponent(body.eventId)}`;
  const callbackUrl = `${origin}/api/payment/webhook`;

  try {
    const tx = await createTransaction({
      items,
      amount,
      txnid,
      redirectUrl,
      callbackUrl,
      currency: bill.currency,
      description: { eventId: body.eventId, stepNumbers: matched.map((m) => m.stepNumber) },
    });

    return NextResponse.json(
      {
        uuid: tx.uuid,
        url: tx.url,
        txnid,
        amount,
        currency: bill.currency,
        stepNumbers: matched.map((m) => m.stepNumber),
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[api/payment] createTransaction failed:", err);
    return NextResponse.json(
      { error: "Payment could not be started", details: String(err) },
      { status: 500 },
    );
  }
}
