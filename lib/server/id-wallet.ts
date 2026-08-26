import "server-only";
import { createClient } from "@/lib/supabase/server-client";
import type { IdType } from "@/lib/types";

/**
 * The signed-in citizen's saved ID Wallet selection (see
 * `lib/id-wallet-sync.ts` for the client-side "Save changes" write path),
 * read server-side so AI journey generation can personalize which
 * record-update steps apply (`lib/server/egov-ai-journey.ts`). Uses the
 * session-aware (RLS-respecting) Supabase client, so this only ever returns
 * the calling citizen's own row.
 *
 * Returns [] when signed out, nothing has been saved yet, or on any read
 * failure -- generation then conservatively assumes no IDs are held (never
 * invents a step that presupposes one).
 */
export async function getHeldIdsForCurrentUser(): Promise<IdType[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("id_wallets")
      .select("held_ids")
      .eq("user_id", user.id)
      .maybeSingle<{ held_ids: IdType[] }>();
    if (error) throw error;
    return data?.held_ids ?? [];
  } catch (err) {
    console.error("getHeldIdsForCurrentUser failed:", err);
    return [];
  }
}
