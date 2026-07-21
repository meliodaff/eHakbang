"use client";

import { ID_CATALOG, useIdWallet } from "@/lib/id-wallet";

/**
 * ID Wallet manager. The citizen toggles which government IDs they already
 * hold; journeys then auto-complete steps whose purpose is to obtain those IDs.
 *
 * PRIVACY: only the presence of an ID type is stored on-device. No ID numbers,
 * names, or documents are collected or transmitted (PRD privacy-first posture).
 */
export function IdWalletScreen() {
  const { heldIds, ready, setId } = useIdWallet();
  const heldCount = heldIds.length;

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

      <p className="mt-auto rounded-egov bg-egov-success-bg px-4 py-3 text-xs text-egov-success">
        Privacy-first: ang listahan lang ng uri ng ID ang naka-save sa device
        mo. Walang ID number, pangalan, o dokumentong kinokolekta o ipinapadala.
      </p>
    </main>
  );
}
