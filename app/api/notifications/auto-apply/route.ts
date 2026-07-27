import { NextRequest, NextResponse } from "next/server";
import { getLifeEventById } from "@/lib/events";
import { pushSms, isEmessageConfigured } from "@/lib/server/emessage";

/**
 * POST /api/notifications/auto-apply
 *
 * Sends an SMS notification when a citizen's auto-apply submission finishes
 * successfully. There is no phone-number capture in this app yet (it's
 * built "zero personal data"), so this notifies a fixed test number for now
 * -- swap TEMP_TEST_RECIPIENT for a real per-citizen number once phone
 * capture exists.
 *
 * Request body:
 *   { eventId: string }
 *
 * Response:
 *   { sent: boolean }
 */
const TEMP_TEST_RECIPIENT = "+639949642592";

export async function POST(request: NextRequest) {
  let body: { eventId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.eventId || typeof body.eventId !== "string") {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  const event = getLifeEventById(body.eventId);
  const eventLabel = event?.sublabel ?? event?.label ?? "life event";

  console.log("[DEBUG][api/notifications/auto-apply] received request", {
    eventId: body.eventId,
    eventLabel,
    recipient: TEMP_TEST_RECIPIENT,
  });

  const configured = isEmessageConfigured();
  console.log("[DEBUG][api/notifications/auto-apply] isEmessageConfigured() =", configured, {
    EMESSAGE_BASE_URL_set: Boolean(process.env.EMESSAGE_BASE_URL),
    EMESSAGE_API_TOKEN_set: Boolean(process.env.EMESSAGE_API_TOKEN),
  });

  if (!configured) {
    console.error("[api/notifications/auto-apply] eMessage is not configured");
    return NextResponse.json({ sent: false }, { status: 200 });
  }

  try {
    console.log("[DEBUG][api/notifications/auto-apply] calling pushSms...");
    await pushSms(
      TEMP_TEST_RECIPIENT,
      `eHakbang: Your ${eventLabel} application was successfully submitted to all agencies.`,
    );
    console.log("[DEBUG][api/notifications/auto-apply] pushSms succeeded");
    return NextResponse.json({ sent: true }, { status: 200 });
  } catch (err) {
    console.error("[api/notifications/auto-apply] pushSms failed:", err);
    return NextResponse.json({ sent: false }, { status: 200 });
  }
}
