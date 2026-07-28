"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LIFE_EVENTS, getLifeEventById } from "@/lib/events";
import type { LifeEvent } from "@/lib/types";
import { cn } from "@/lib/cn";
import { navigateToEvent } from "@/lib/navigate-to-event";
import { InvalidLifeEventDialog } from "./InvalidLifeEventDialog";

const MIN_CHARS_FOR_SUGGESTIONS = 3;
const MIN_CHARS = 3;
const MAX_CHARS = 200;

function matchEvents(query: string): LifeEvent[] {
  const q = query.trim().toLowerCase();
  if (q.length < MIN_CHARS_FOR_SUGGESTIONS) return [];
  return LIFE_EVENTS.filter(
    (e) =>
      e.label.toLowerCase().includes(q) ||
      e.sublabel.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q),
  ).slice(0, 4);
}

/**
 * Hero life-event input (PRD FR-01). Auto-focused free-text field that accepts
 * Filipino/English/Taglish, surfaces matching event chips after 3 characters,
 * and generates a journey on submit.
 *
 * Free text that doesn't match a suggestion chip is first classified against
 * the preset catalog (`/api/journey/classify`) so a paraphrased match (e.g.
 * "I just became a parent") still routes into that preset's confirm/verify
 * flow; only genuinely new events fall through to the custom-event intake
 * gate at `/journey/start?q=` (generation + evidence/liveness verification).
 */
export function SearchInput() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalidEventMessage, setInvalidEventMessage] = useState<string | null>(null);
  const suggestions = matchEvents(query);

  function selectSuggestion(event: LifeEvent) {
    navigateToEvent(router, event);
  }

  async function generate(text: string) {
    const trimmed = text.trim();
    if (trimmed.length < MIN_CHARS || trimmed.length > MAX_CHARS) {
      setError(
        `Ilarawan ang iyong sitwasyon sa ${MIN_CHARS}-${MAX_CHARS} na character.`,
      );
      return;
    }
    setError(null);
    setInvalidEventMessage(null);
    setLoading(true);
    // Canonical, wording-independent slug for this situation (from
    // classification) — lets the server reuse a cached journey for a
    // different phrasing of the same context. Falls back to hashing the raw
    // text server-side when classification is unavailable.
    let canonicalSlug: string | null = null;
    try {
      const res = await fetch("/api/journey/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          eventId: string | null;
          canonicalSlug?: string;
          isLifeEvent?: boolean;
        };
        const matched = data.eventId ? getLifeEventById(data.eventId) : undefined;
        if (matched) {
          navigateToEvent(router, matched);
          return;
        }
        // Only blocks on a confident "no" from the classifier -- anything
        // else (a real but uncatalogued situation, or the classifier being
        // unavailable) still falls through to the custom journey below, so
        // an ambiguous description or a service hiccup never blocks a
        // legitimate citizen.
        if (data.isLifeEvent === false) {
          setInvalidEventMessage(
            "Parang hindi ito naglalarawan ng tunay na life event. Subukan ulit gamit ang mas malinaw na paglalarawan (hal. bagong kasal, nawalan ng trabaho).",
          );
          return;
        }
        canonicalSlug = data.canonicalSlug ?? null;
      }
    } catch {
      // Classification unavailable — fall through to a custom journey below
      // rather than blocking the user.
    } finally {
      setLoading(false);
    }
    const slugParam = canonicalSlug ? `&slug=${encodeURIComponent(canonicalSlug)}` : "";
    // Routes through the intake gate rather than straight to /journey so a
    // custom event that needs evidence (per the AI's own judgment) asks for
    // it before showing the checklist -- see app/journey/start/page.tsx.
    router.push(`/journey/start?q=${encodeURIComponent(trimmed)}${slugParam}`);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        generate(query);
      }}
      className="flex flex-col gap-3"
      role="search"
    >
      <label htmlFor="life-event" className="sr-only">
        Ilarawan ang iyong sitwasyon
      </label>
      <div className="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-foreground"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="m20 20-3.2-3.2"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <input
          id="life-event"
          name="life-event"
          type="text"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ilarawan ang sitwasyon… (hal. Bagong kasal)"
          className="w-full rounded-egov border border-border bg-surface py-3.5 pl-4 pr-11 text-base text-foreground shadow-sm placeholder:text-muted focus-visible:border-egov-blue focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-egov-blue"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-egov-danger">
          {error}
        </p>
      )}

      {suggestions.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Mga mungkahi">
          {suggestions.map((event) => (
            <li key={event.id}>
              <button
                type="button"
                onClick={() => selectSuggestion(event)}
                className="flex items-center gap-1.5 rounded-full border border-egov-blue-100 bg-egov-blue-050 px-3 py-1.5 text-sm font-medium text-egov-blue-dark transition-colors hover:bg-egov-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
              >
                <span aria-hidden>{event.emoji}</span>
                {event.sublabel}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="submit"
        disabled={!query.trim() || loading}
        className={cn(
          "min-h-12 rounded-egov bg-egov-blue px-5 py-3 text-base font-semibold text-white transition-colors",
          "hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {loading ? "Ginagawa…" : "Generate My Journey"}
      </button>

      {invalidEventMessage && (
        <InvalidLifeEventDialog
          message={invalidEventMessage}
          onDismiss={() => setInvalidEventMessage(null)}
        />
      )}
    </form>
  );
}
