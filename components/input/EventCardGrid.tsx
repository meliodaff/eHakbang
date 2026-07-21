"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COMMON_LIFE_EVENTS, MORE_LIFE_EVENTS } from "@/lib/events";
import { eventRequiresVerification } from "@/lib/verification";
import { getJourneyByEventId } from "@/lib/event-journeys";
import { getStoredJourney } from "@/lib/journey-store";
import type { LifeEvent } from "@/lib/types";
import { EventCard } from "./EventCard";

/**
 * Predefined life-event cards (PRD FR-02): a 2-column mobile grid of the 8
 * common events, with a "More events" expansion for less-common ones.
 * Selecting a card generates its journey.
 */
export function EventCardGrid() {
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);

  function handleSelect(event: LifeEvent) {
    if (event.id === "got-married") {
      const catalog = getJourneyByEventId("got-married");
      const stored = catalog ? getStoredJourney(catalog.id) : undefined;
      if (stored?.status === "completed") {
        // Already verified and completed once — no need to go through
        // confirm/document/face-verify again. Show the info read-only,
        // without prompting to archive or start another journey.
        router.push(
          `/journey/complete?id=${encodeURIComponent(stored.id)}&mode=info`,
        );
        return;
      }
      router.push(`/journey/confirm?event=${encodeURIComponent(event.id)}`);
      return;
    }
    // Verification-gated events (e.g. Just Graduated) route through the
    // document + liveness flow before their journey checklist is shown.
    const target = eventRequiresVerification(event.id)
      ? `/journey/verify?event=${encodeURIComponent(event.id)}`
      : `/journey?event=${encodeURIComponent(event.id)}`;
    router.push(target);
  }

  return (
    <section aria-labelledby="events-heading" className="flex flex-col gap-3">
      <h2 id="events-heading" className="text-base font-bold text-foreground">
        Piliin ang life event
      </h2>

      <div className="grid grid-cols-4 gap-2">
        {COMMON_LIFE_EVENTS.map((event) => (
          <EventCard key={event.id} event={event} onSelect={handleSelect} />
        ))}
      </div>

      {showMore && (
        <div className="grid grid-cols-4 gap-2">
          {MORE_LIFE_EVENTS.map((event) => (
            <EventCard key={event.id} event={event} onSelect={handleSelect} />
          ))}
        </div>
      )}

      {MORE_LIFE_EVENTS.length > 0 && (
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
          className="mx-auto mt-1 rounded-full px-4 py-2 text-sm font-semibold text-egov-blue transition-colors hover:bg-egov-blue-050 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
        >
          {showMore ? "Fewer events" : "More events"}
        </button>
      )}
    </section>
  );
}
