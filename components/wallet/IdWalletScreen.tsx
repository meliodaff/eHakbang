"use client";

import { useEffect, useState } from "react";
import { ID_CATALOG, useIdWallet } from "@/lib/id-wallet";
import { fetchIdWalletFromSupabase, saveIdWalletToSupabase } from "@/lib/id-wallet-sync";
import type { IdType } from "@/lib/types";

/** Order-independent equality check for two ID-type lists. */
function sameIds(a: IdType[], b: IdType[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}

/**
 * ID Wallet manager. The citizen toggles which government IDs they already
 * hold; journeys then auto-complete steps whose purpose is to obtain those IDs.
 * Checking/unchecking is instant locally (drives journey auto-completion right
 * away), but only persists to the database once the citizen taps "Save
 * changes" -- the button appears while the selection differs from what's last
 * saved, and disappears once it matches again (including reverting a toggle).
 *
 * PRIVACY: only the presence of an ID type is stored. No ID numbers, names,
 * or documents are collected or transmitted (PRD privacy-first posture).
 */
export function IdWalletScreen() {
  const { heldIds, ready, setId } = useIdWallet();
  const heldCount = heldIds.length;

  // Last selection known to be saved in Supabase -- null while unknown
  // (still loading), so the Save button never flashes on first paint.
  const [savedIds, setSavedIds] = useState<IdType[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    void fetchIdWalletFromSupabase().then((saved) => {
      if (!cancelled) setSavedIds(saved ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  const dirty = savedIds !== null && !sameIds(heldIds, savedIds);

  async function handleSaveChanges() {
    setSaving(true);
    setSaveError(null);
    try {
      await saveIdWalletToSupabase(heldIds);
      setSavedIds(heldIds);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Couldn't save your changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-4 px-5 py-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-egov-navy">Aking ID Wallet</h1>
        <p className="text-sm text-muted">
          Markahan ang mga IDs na meron ka na. Ang mga hakbang sa journey na
          kukuha ng ID na hawak mo na ay awtomatikong matatapos.
        </p>
      </div>

      <p
        className="rounded-egov bg-egov-blue-050 px-4 py-2.5 text-sm font-semibold text-egov-blue-dark"
        aria-live="polite"
      >
        {ready ? `${heldCount} ID${heldCount === 1 ? "" : "s"} sa wallet mo` : "…"}
      </p>

      <ul className="flex flex-col gap-2">
        {ID_CATALOG.map((entry) => {
          const held = heldIds.includes(entry.id);
          const inputId = `id-wallet-${entry.id}`;
          return (
            <li key={entry.id}>
              <label
                htmlFor={inputId}
                className="flex cursor-pointer items-center gap-3 rounded-egov border border-border bg-surface p-3.5 transition-colors hover:border-egov-blue"
              >
                <span aria-hidden className="text-2xl">
                  {entry.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {entry.label}
                    </span>
                    <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                      {entry.agency}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {entry.description}
                  </span>
                </span>
                <input
                  id={inputId}
                  type="checkbox"
                  checked={held}
                  onChange={(e) => setId(entry.id, e.target.checked)}
                  className="h-5 w-5 shrink-0 accent-egov-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
                  aria-label={`Meron ako ng ${entry.label}`}
                />
              </label>
            </li>
          );
        })}
      </ul>

      {dirty && (
        <div className="flex flex-col gap-2">
          {saveError && (
            <p className="text-xs font-semibold text-egov-danger" role="alert">
              {saveError}
            </p>
          )}
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={saving}
            className="min-h-12 rounded-egov bg-egov-blue px-5 py-3 font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Sinisave…" : "Save changes"}
          </button>
        </div>
      )}

      <p className="mt-auto rounded-egov bg-egov-success-bg px-4 py-3 text-xs text-egov-success">
        Privacy-first: ang listahan lang ng uri ng ID ang naka-save sa device
        mo. Walang ID number, pangalan, o dokumentong kinokolekta o ipinapadala.
      </p>
    </main>
  );
}
