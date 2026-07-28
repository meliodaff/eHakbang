"use client";

import { createClient } from "@/lib/supabase/client";
import { describeError } from "./describe-error";
import type { IdType } from "./types";

/**
 * Best-effort browser <-> Supabase sync for the ID Wallet (table:
 * `id_wallets`, RLS-scoped to `auth.uid() = user_id`, one row per user).
 * Unlike journeys, this is deliberately NOT written on every checkbox
 * toggle -- `IdWalletScreen` only calls `saveIdWalletToSupabase` when the
 * citizen explicitly taps "Save changes", so the local, reactive wallet
 * (`lib/id-wallet.ts`, which still drives instant journey auto-completion)
 * and the durable database record stay independent until the user commits.
 */

function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Persists the citizen's current ID Wallet selection. Throws on failure -- the caller shows the error. */
export async function saveIdWalletToSupabase(heldIds: IdType[]): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { error } = await supabase
    .from("id_wallets")
    .upsert(
      { user_id: user.id, held_ids: heldIds, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  if (error) throw error;
}

/** Fetches the citizen's last-saved ID Wallet selection. Returns null on any failure/no row/signed out. */
export async function fetchIdWalletFromSupabase(): Promise<IdType[] | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from("id_wallets")
      .select("held_ids")
      .eq("user_id", user.id)
      .maybeSingle<{ held_ids: IdType[] }>();
    if (error) throw error;
    return data?.held_ids ?? null;
  } catch (err) {
    console.error("fetchIdWalletFromSupabase failed:", describeError(err));
    return null;
  }
}
