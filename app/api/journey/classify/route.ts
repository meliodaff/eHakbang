import { NextRequest, NextResponse } from "next/server";
import { classifyLifeEvent } from "@/lib/server/classify-life-event";
import type { Language } from "@/lib/types";

const MIN_CHARS = 3;
const MAX_CHARS = 200;

/**
 * POST /api/journey/classify
 *
 * Classifies free-text life-event input against the preset catalog, so the
 * search flow can route a text match into the same preset flow a card tap
 * would (confirm/verify gating, already-completed handling) instead of
 * generating a separate custom journey for a known event.
 *
 * Request body:
 *   { text: string; language?: "en" | "fil" }
 *
 * Response:
 *   { eventId: string | null; canonicalSlug: string; isLifeEvent: boolean }
 */
export async function POST(request: NextRequest) {
  let body: { text?: string; language?: Language };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text || text.length < MIN_CHARS || text.length > MAX_CHARS) {
    return NextResponse.json(
      { error: `text must be between ${MIN_CHARS} and ${MAX_CHARS} characters` },
      { status: 400 },
    );
  }

  try {
    const { matchedEventId, canonicalSlug, isLifeEvent } = await classifyLifeEvent(
      text,
      body.language,
    );
    return NextResponse.json({ eventId: matchedEventId, canonicalSlug, isLifeEvent }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to classify life event", details: String(err) },
      { status: 500 },
    );
  }
}
