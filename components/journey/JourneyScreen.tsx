"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Journey } from "@/lib/types";
import { EVENT_JOURNEYS } from "@/lib/event-journeys";
import {
  getActiveJourney,
  getStoredJourney,
  completeStep,
} from "@/lib/journey-store";
import { JourneyView } from "./JourneyView";

/**
 * Screen 2 controller. Loads the journey for the selected event (resuming
 * saved progress if any), persists completions to localStorage, and routes to
 * the completion screen once every step is done.
 */
export function JourneyScreen({ eventId }: { eventId?: string }) {
  const router = useRouter();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let base: Journey | undefined;
    if (eventId && EVENT_JOURNEYS[eventId]) {
      const catalog = EVENT_JOURNEYS[eventId];
      base = getStoredJourney(catalog.id) ?? { ...catalog };
    } else {
      base = getActiveJourney();
    }
    setJourney(base ?? null);
    setReady(true);
  }, [eventId]);

  function handleComplete(stepNumber: number) {
    setJourney((current) => {
      if (!current) return current;
      const updated = completeStep(current, stepNumber);
      if (updated.status === "completed") {
        setTimeout(
          () =>
            router.push(
              `/journey/complete?id=${encodeURIComponent(updated.id)}`,
            ),
          400,
        );
      }
      return updated;
    });
  }

  if (!ready) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 text-muted">
        Loading…
      </main>
    );
  }

  if (!journey) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-xl font-bold text-egov-navy">No active journey</h1>
        <p className="text-muted">Pumili ng life event para magsimula.</p>
        <Link
          href="/ehakbang"
          className="min-h-11 rounded-egov bg-egov-blue px-5 py-2.5 font-semibold text-white"
        >
          Start a New Journey
        </Link>
      </main>
    );
  }

  return (
    <JourneyView
      journey={journey}
      completed={journey.completed_step_numbers}
      onComplete={handleComplete}
    />
  );
}
