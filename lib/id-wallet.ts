"use client";

import { useEffect, useState } from "react";
import type { IdType, JourneyStep } from "./types";
import { fetchIdWalletFromSupabase } from "./id-wallet-sync";

/**
 * ID Wallet — a local, on-device record of the government IDs the citizen
 * already holds. Journey steps whose purpose is to obtain one of these IDs are
 * auto-satisfied when the matching ID is present (see {@link stepFulfilledByWallet}).
 *
 * PRIVACY: only the *presence* of an ID type is stored (a list of type keys) —
 * never ID numbers, names, or any document. Data lives in localStorage on the
 * user's device and is never transmitted. This keeps the wallet consistent
 * with the PRD's privacy-first, zero-personal-data posture.
 */

/** Display metadata for each ID type shown in the wallet manager. */
export interface IdCatalogEntry {
  id: IdType;
  /** English label. */
  label: string;
  /** Short Filipino label. */
  labelFil: string;
  /** Issuing agency (code shown as a chip). */
  agency: string;
  emoji: string;
  /** One-line plain-language description. */
  description: string;
}

/** The IDs a citizen can register in their wallet. */
export const ID_CATALOG: IdCatalogEntry[] = [
  {
    id: "tin",
    label: "TIN (Tax ID)",
    labelFil: "TIN",
    agency: "BIR",
    emoji: "🧾",
    description: "Tax Identification Number — required for employment.",
  },
  {
    id: "sss",
    label: "SSS Number",
    labelFil: "SSS",
    agency: "SSS",
    emoji: "🪪",
    description: "Social Security System membership number.",
  },
  {
    id: "philhealth",
    label: "PhilHealth ID",
    labelFil: "PhilHealth",
    agency: "PHILHEALTH",
    emoji: "🏥",
    description: "National health insurance membership.",
  },
  {
    id: "pagibig",
    label: "Pag-IBIG MID",
    labelFil: "Pag-IBIG",
    agency: "PAGIBIG",
    emoji: "🏠",
    description: "Pag-IBIG Fund membership ID.",
  },
  {
    id: "umid",
    label: "UMID Card",
    labelFil: "UMID",
    agency: "SSS",
    emoji: "💳",
    description: "Unified Multi-Purpose ID.",
  },
  {
    id: "philsys",
    label: "National ID (PhilSys)",
    labelFil: "National ID",
    agency: "PSA",
    emoji: "🆔",
    description: "Philippine Identification System ID.",
  },
  {
    id: "passport",
    label: "Passport",
    labelFil: "Pasaporte",
    agency: "DFA",
    emoji: "🛂",
    description: "Philippine passport.",
  },
  {
    id: "drivers-license",
    label: "Driver's License",
    labelFil: "Lisensya",
    agency: "LTO",
    emoji: "🚗",
    description: "Land Transportation Office driver's license.",
  },
  {
    id: "voters-id",
    label: "Voter's ID / Cert.",
    labelFil: "Voter's ID",
    agency: "COMELEC",
    emoji: "🗳️",
    description: "Voter registration ID or certification.",
  },
  {
    id: "prc",
    label: "PRC License",
    labelFil: "PRC",
    agency: "PRC",
    emoji: "📜",
    description: "Professional Regulation Commission license.",
  },
];

const VALID_IDS = new Set<string>(ID_CATALOG.map((e) => e.id));

const KEY = "ehakbang:id-wallet";
const CHANGE_EVENT = "ehakbang:id-wallet-changed";

function read(): IdType[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    // Keep only known ID types (guards against stale/tampered data).
    return parsed.filter((x): x is IdType => typeof x === "string" && VALID_IDS.has(x));
  } catch {
    return [];
  }
}

function write(ids: IdType[]): void {
  if (typeof window === "undefined") return;
  try {
    // De-dupe and persist.
    const unique = Array.from(new Set(ids));
    window.localStorage.setItem(KEY, JSON.stringify(unique));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    /* storage unavailable — session-only fallback is acceptable */
  }
}

/** The IDs currently held (non-reactive read). */
export function getHeldIds(): IdType[] {
  return read();
}

/** True when the wallet contains the given ID. */
export function hasId(id: IdType): boolean {
  return read().includes(id);
}

/** Add or remove an ID from the wallet. */
export function setId(id: IdType, held: boolean): IdType[] {
  const current = read();
  const next = held
    ? Array.from(new Set([...current, id]))
    : current.filter((x) => x !== id);
  write(next);
  return next;
}

/** Flip whether an ID is held. */
export function toggleId(id: IdType): IdType[] {
  return setId(id, !hasId(id));
}

/** Remove every ID from the wallet. */
export function clearWallet(): void {
  write([]);
}

/**
 * True when this step's purpose is to obtain an ID the citizen already holds.
 * Such steps are treated as already complete.
 */
export function stepFulfilledByWallet(
  step: Pick<JourneyStep, "fulfills_id">,
  heldIds: IdType[],
): boolean {
  return !!step.fulfills_id && heldIds.includes(step.fulfills_id);
}

/** Reactive view of the wallet (re-renders on change, incl. other tabs). */
export function useIdWallet(): {
  heldIds: IdType[];
  ready: boolean;
  setId: (id: IdType, held: boolean) => void;
  toggleId: (id: IdType) => void;
} {
  const [heldIds, setHeldIds] = useState<IdType[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const update = () => {
      setHeldIds(read());
      setReady(true);
    };
    update();
    window.addEventListener(CHANGE_EVENT, update);
    window.addEventListener("storage", update);

    // Fresh device/reinstall (empty local wallet): restore the citizen's
    // last-saved selection from Supabase, if any. Never overwrites an
    // existing local selection -- local edits (saved or not) always win.
    if (read().length === 0) {
      void fetchIdWalletFromSupabase().then((saved) => {
        if (saved && saved.length > 0 && read().length === 0) write(saved);
      });
    }

    return () => {
      window.removeEventListener(CHANGE_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return {
    heldIds,
    ready,
    setId: (id, held) => setHeldIds(setId(id, held)),
    toggleId: (id) => setHeldIds(toggleId(id)),
  };
}
