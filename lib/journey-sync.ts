"use client";

import { createClient } from "@/lib/supabase/client";
import type { Journey } from "./types";
import { journeyToRow, rowToJourney, type JourneyRow } from "./journey-row";

/**
 * Best-effort browser <-> Supabase sync for per-user journey instances
 * (table: `journeys`, RLS-scoped to `auth.uid() = user_id`). localStorage
 * (`lib/journey-store.ts`) stays the source of truth for instant reads/writes;
 * this module is the fire-and-forget side channel that keeps the `journeys`
 * table current so "My Journeys" and Track survive a reinstall/new device and
 * so the row exists as soon as the citizen starts a journey, not only once
 * they interact with a step. The row also lets `app/journey/page.tsx` skip
 * AI regeneration entirely on a repeat visit -- see
 * `lib/server/stored-journeys.ts`.
 *
 * Every function swallows its own errors (network/auth/RLS) and logs instead
 * of throwing -- a failed sync must never block the local-first UI.
 */

/** False in any environment (e.g. tests) without Supabase env vars configured -- avoids noisy, expected-failure logging. */
function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Upserts one journey's current state. No-ops (silently) when signed out. */
export async function syncJourneyToSupabase(journey: Journey): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("journeys")
      .upsert(journeyToRow(journey, user.id), { onConflict: "id" });
    if (error) throw error;
  } catch (err) {
    console.error("syncJourneyToSupabase failed:", err);
  }
}

/** Deletes specific journeys (e.g. `resetJourney`). No-ops when signed out. */
export async function deleteJourneysFromSupabase(ids: string[]): Promise<void> {
  if (ids.length === 0 || !isSupabaseConfigured()) return;
  try {
    const supabase = createClient();
    const { error } = await supabase.from("journeys").delete().in("id", ids);
    if (error) throw error;
  } catch (err) {
    console.error("deleteJourneysFromSupabase failed:", err);
  }
}

/** Deletes every journey belonging to the signed-in user ("Clear All Journeys"). */
export async function deleteAllJourneysFromSupabase(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("journeys").delete().eq("user_id", user.id);
    if (error) throw error;
  } catch (err) {
    console.error("deleteAllJourneysFromSupabase failed:", err);
  }
}

/** Fetches every journey belonging to the signed-in user. Returns [] on any failure. */
export async function fetchJourneysFromSupabase(): Promise<Journey[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("journeys")
      .select("*")
      .eq("user_id", user.id);
    if (error) throw error;
    return ((data ?? []) as JourneyRow[]).map(rowToJourney);
  } catch (err) {
    console.error("fetchJourneysFromSupabase failed:", err);
    return [];
  }
}
