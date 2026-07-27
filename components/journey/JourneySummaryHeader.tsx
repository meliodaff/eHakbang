"use client";

import type { Journey } from "@/lib/types";
import { useT } from "@/lib/i18n";

/**
 * Journey summary header (PRD §10.3): life-event label + emoji, and count
 * badges for record updates vs benefit claims. Kept short by design -- no
 * long-form AI-generated text is rendered here.
 */
export function JourneySummaryHeader({ journey }: { journey: Journey }) {
  const t = useT();
  return (
    <div className="rounded-b-egov-lg bg-gradient-to-b from-egov-navy to-egov-blue px-5 pb-6 pt-7 text-white">
      <div className="flex items-center gap-3">
        <span className="text-3xl" aria-hidden>
          {journey.emoji}
        </span>
        <h1 className="text-xl font-bold">{t(journey.life_event)}</h1>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
          {journey.record_updates}{" "}
          {t(journey.record_updates === 1 ? "Record Update" : "Record Updates")}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
          {journey.benefit_claims}{" "}
          {t(journey.benefit_claims === 1 ? "Benefit Claim" : "Benefit Claims")}
        </span>
      </div>
    </div>
  );
}
