import "server-only";
import { createClient } from "@/lib/supabase/server-client";
import { journeyToRow, rowToJourney, type JourneyRow } from "@/lib/journey-row";
import type { Journey } from "@/lib/types";
import { journeyId } from "./journey-requirements";

/**
 * Looks up the signed-in citizen's already-started journey for an event
 * (table: `journeys`, RLS-scoped) so `app/journey/page.tsx` can show it
 * directly on a repeat visit instead of calling OpenAI again -- generating
 * a whole new set of requirements for something the citizen already has is
 * wasted latency/cost and would silently be discarded anyway (see
 * JourneyScreen's `getStoredJourney(...) ?? startJourney(...)`).
 *
 * Returns null when signed out, nothing has been saved for this event yet,
 * or on any read failure -- callers should fall back to generating fresh.
 */
export async function getStoredJourneyForEvent(eventId: string): Promise<Journey | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("journeys")
      .select("*")
      .eq("id", journeyId(eventId))
      .eq("user_id", user.id)
      .maybeSingle<JourneyRow>();
    if (error) throw error;
    return data ? rowToJourney(data) : null;
  } catch (err) {
    console.error(`getStoredJourneyForEvent(${eventId}) failed:`, err);
    return null;
  }
}

/**
 * Persists a freshly generated journey server-side (table: `journeys`)
 * immediately after generation, before routing into the custom-event
 * evidence/liveness intake gate (`app/journey/start/page.tsx`) -- so that
 * once verification passes, `getStoredJourneyForEvent` finds it and the
 * final `/journey` page never has to generate it a second time. Best-effort:
 * swallows its own errors (the client-side sync in `lib/journey-sync.ts`
 * still covers this journey once the citizen reaches JourneyScreen).
 */
export async function saveJourneyForCurrentUser(journey: Journey): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("journeys")
      .upsert(journeyToRow(journey, user.id), { onConflict: "id" });
    if (error) throw error;
  } catch (err) {
    console.error(`saveJourneyForCurrentUser(${journey.id}) failed:`, err);
  }
}
