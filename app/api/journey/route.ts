import { NextRequest, NextResponse } from "next/server";
import { getLifeEventById } from "@/lib/events";
import { getOrRegenerateJourney } from "@/lib/server/journey-requirements";
import { getHeldIdsForCurrentUser } from "@/lib/server/id-wallet";
import type { Language } from "@/lib/types";

/**
 * POST /api/journey
 *
 * Returns freshly AI-generated (or seed-fallback) requirements for a
 * predefined life event, personalized by the signed-in citizen's held IDs.
 * Primarily used for manual refresh -- the main `/journey?event=` flow
 * prefetches server-side in `app/journey/page.tsx`.
 *
 * Request body:
 *   { eventId: string; language?: "en" | "fil" }
 *
 * Response:
 *   { journey: Journey; regenerated: boolean }
 */
export async function POST(request: NextRequest) {
  let body: { eventId?: string; language?: Language };
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

  try {
    const heldIds = await getHeldIdsForCurrentUser();
    const { journey, regenerated } = await getOrRegenerateJourney({
      eventId: body.eventId,
      language: body.language,
      heldIds,
    });
    return NextResponse.json({ journey, regenerated }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to generate journey", details: String(err) },
      { status: 500 },
    );
  }
}
