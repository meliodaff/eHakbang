import { NextRequest, NextResponse } from "next/server";
import { getQueueState } from "@/lib/server/application-queue";

/**
 * GET /api/application-queue/status?journeyId=...&stepNumber=...
 *
 * Polled by the client while a step's Auto Apply submission is pending.
 * Lazily flips "pending" to "accepted" once the mock delay has elapsed (see
 * lib/server/application-queue.ts). A 404 means the step has never been
 * auto-applied -- an expected idle response, not a failure.
 *
 * Response:
 *   ApplicationQueueState (see lib/server/application-queue.ts)
 */
export async function GET(request: NextRequest) {
  const journeyId = request.nextUrl.searchParams.get("journeyId");
  const stepNumberRaw = request.nextUrl.searchParams.get("stepNumber");
  const stepNumber = stepNumberRaw ? Number(stepNumberRaw) : NaN;

  if (!journeyId) {
    return NextResponse.json({ error: "journeyId is required" }, { status: 400 });
  }
  if (!Number.isInteger(stepNumber) || stepNumber <= 0) {
    return NextResponse.json({ error: "stepNumber must be a positive integer" }, { status: 400 });
  }

  try {
    const state = await getQueueState({ journeyId, stepNumber });
    if (!state) {
      return NextResponse.json({ error: "No queue entry found" }, { status: 404 });
    }
    return NextResponse.json(state, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch queue status", details: String(err) },
      { status: 500 },
    );
  }
}
