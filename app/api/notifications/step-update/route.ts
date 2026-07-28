import { NextRequest, NextResponse } from "next/server";
import { getLifeEventById } from "@/lib/events";
import { pushSms, isEmessageConfigured } from "@/lib/server/emessage";

/**
 * POST /api/notifications/step-update
 *
 * Sends an SMS notification every time one of a citizen's journey
 * requirements is submitted to its agency or completed -- fired per
 * requirement, not just once when the whole journey finishes. There is no
 * phone-number capture in this app yet (it's built "zero personal data"),
 * so this notifies a fixed test number for now -- swap TEMP_TEST_RECIPIENT
 * for a real per-citizen number once phone capture exists.
 *
 * Request body:
 *   { eventId: string; stepTitle: string; agencyName: string; status: "submitted" | "completed" }
 *
 * Response:
 *   { sent: boolean }
 */
const TEMP_TEST_RECIPIENT = "+639949642592";

export async function POST(request: NextRequest) {
  let body: {
    eventId?: string;
    stepTitle?: string;
    agencyName?: string;
    status?: "submitted" | "completed";
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.eventId || typeof body.eventId !== "string") {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }
  if (!body.stepTitle || !body.agencyName) {
    return NextResponse.json(
      { error: "stepTitle and agencyName are required" },
      { status: 400 },
    );
  }
  if (body.status !== "submitted" && body.status !== "completed") {
    return NextResponse.json(
      { error: 'status must be "submitted" or "completed"' },
      { status: 400 },
    );
  }

  const event = getLifeEventById(body.eventId);
  const eventLabel = event?.sublabel ?? event?.label ?? "life event";

  if (!isEmessageConfigured()) {
    console.error("[api/notifications/step-update] eMessage is not configured");
    return NextResponse.json({ sent: false }, { status: 200 });
  }

  const message =
    body.status === "submitted"
      ? `eHakbang: Your "${body.stepTitle}" requirement at ${body.agencyName} (${eventLabel}) was submitted and is now being processed.`
      : `eHakbang: Your "${body.stepTitle}" requirement at ${body.agencyName} (${eventLabel}) has been completed.`;

  try {
    await pushSms(TEMP_TEST_RECIPIENT, message);
    return NextResponse.json({ sent: true }, { status: 200 });
  } catch (err) {
    console.error("[api/notifications/step-update] pushSms failed:", err);
    return NextResponse.json({ sent: false }, { status: 200 });
  }
}
