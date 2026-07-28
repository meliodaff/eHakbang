import "server-only";
import { createHash } from "node:crypto";

/**
 * Deterministic id for a free-text life event that doesn't match any preset
 * (see `lib/navigate-to-event.ts`/classification). Hashing the normalized
 * text means identical repeat phrasing reuses the same 24h
 * `journey_requirements` cache row as a preset event would, without needing
 * a catalog entry.
 */

const CUSTOM_PREFIX = "custom:";

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

export function customEventId(text: string): string {
  const hash = createHash("sha256").update(normalize(text)).digest("hex").slice(0, 24);
  return `${CUSTOM_PREFIX}${hash}`;
}

export function isCustomEventId(eventId: string | undefined): boolean {
  return !!eventId && eventId.startsWith(CUSTOM_PREFIX);
}
