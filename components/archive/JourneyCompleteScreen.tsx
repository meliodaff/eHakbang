"use client";

import Link from "next/link";
import { getJourneyById } from "@/lib/mock-data";
import { getEventJourneyById } from "@/lib/event-journeys";
import { useJourneys } from "@/lib/journey-store";
import { useT } from "@/lib/i18n";
import { EhakbangHeader } from "@/components/layout/EhakbangHeader";
import { CompletionCard } from "./CompletionCard";

/**
 * Screen 2/3 controller for `/journey/complete`. The journey being
 * celebrated (or reviewed, in `mode=info`) is a real citizen record --
 * started via `startJourney` and updated via `completeStep`/`markStepsDone`/
 * the Apply All flow -- so it lives in the client-side journey store
 * (localStorage), not the static seed catalog or mock data. Looking it up
 * server-side only (the seed catalog) meant any journey outside the ~8
 * preset events -- every custom/free-text/AI-generated one -- always showed
 * "Journey not found" here, no matter how it was completed.
 */
export function JourneyCompleteScreen({
  id,
  mode,
}: {
  id?: string;
  mode?: string;
}) {
  const t = useT();
  const { journeys, ready } = useJourneys();

  const journey = id
    ? (journeys.find((j) => j.id === id) ??
      getJourneyById(id) ??
      getEventJourneyById(id))
    : undefined;

  if (!ready) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 text-muted">
        {t("Loading…")}
      </main>
    );
  }

  if (!journey) {
    return (
      <main className="flex flex-1 flex-col bg-surface">
        <EhakbangHeader backHref="/journeys" />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <h1 className="text-xl font-bold text-egov-navy">{t("Journey not found")}</h1>
          <Link
            href="/ehakbang"
            className="min-h-11 rounded-egov bg-egov-blue px-5 py-2.5 font-semibold text-white"
          >
            {t("Start a New Journey")}
          </Link>
        </div>
      </main>
    );
  }

  return <CompletionCard journey={journey} readOnly={mode === "info"} />;
}
