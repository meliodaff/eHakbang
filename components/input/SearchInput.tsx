"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LIFE_EVENTS } from "@/lib/events";
import type { LifeEvent } from "@/lib/types";
import { cn } from "@/lib/cn";

const MIN_CHARS_FOR_SUGGESTIONS = 3;

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
 */
export function SearchInput() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const suggestions = matchEvents(query);

  function generate(text: string, eventId?: string) {
    if (!text.trim()) return;
    const params = new URLSearchParams();
    if (eventId) params.set("event", eventId);
    const qs = params.toString();
    router.push(`/journey${qs ? `?${qs}` : ""}`);
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
      <input
        id="life-event"
        name="life-event"
        type="text"
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ilarawan ang iyong sitwasyon… (hal. Bagong kasal, Nawalan ng trabaho)"
        className="w-full rounded-egov border border-border bg-surface px-4 py-3.5 text-base text-foreground shadow-sm placeholder:text-muted focus-visible:border-egov-blue focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-egov-blue"
      />

      {suggestions.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Mga mungkahi">
          {suggestions.map((event) => (
            <li key={event.id}>
              <button
                type="button"
                onClick={() => generate(event.description, event.id)}
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
        disabled={!query.trim()}
        className={cn(
          "min-h-12 rounded-egov bg-egov-blue px-5 py-3 text-base font-semibold text-white shadow-sm transition-colors",
          "hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        Generate My Journey
      </button>
    </form>
  );
}
