import { NextRequest, NextResponse } from "next/server";
import { upsertQueueSubmission } from "@/lib/server/application-queue";

/**
 * POST /api/application-queue
 *
 * Queues a single step for the (mocked) Auto Apply flow -- inserts or
 * re-queues a row in the application_queue table. There is no real agency
 * backend behind this; the row is later auto-accepted after a short mock
 * delay (see lib/server/application-queue.ts).
 *
 * Request body:
 *   { journeyId: string; stepNumber: number; eventId?: string;
 *     agencyName: string; stepTitle: string; fieldAnswers?: Record<string, string> }
 *
 * Response:
 *   ApplicationQueueState (see lib/server/application-queue.ts)
 */
export async function POST(request: NextRequest) {
  let body: {
    journeyId?: string;
    stepNumber?: number;
    eventId?: string;
    agencyName?: string;
    stepTitle?: string;
    fieldAnswers?: Record<string, string>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.journeyId || typeof body.journeyId !== "string") {
    return NextResponse.json({ error: "journeyId is required" }, { status: 400 });
  }
  if (!Number.isInteger(body.stepNumber) || (body.stepNumber as number) <= 0) {
    return NextResponse.json({ error: "stepNumber must be a positive integer" }, { status: 400 });
  }
  if (!body.agencyName || typeof body.agencyName !== "string") {
    return NextResponse.json({ error: "agencyName is required" }, { status: 400 });
  }
  if (!body.stepTitle || typeof body.stepTitle !== "string") {
    return NextResponse.json({ error: "stepTitle is required" }, { status: 400 });
  }

  try {
    const state = await upsertQueueSubmission({
      journeyId: body.journeyId,
      stepNumber: body.stepNumber as number,
      eventId: body.eventId,
      agencyName: body.agencyName,
      stepTitle: body.stepTitle,
      fieldAnswers: body.fieldAnswers,
    });
    return NextResponse.json(state, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to queue application", details: String(err) },
      { status: 500 },
    );
  }
}
