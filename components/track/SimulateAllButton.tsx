"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Journey } from "@/lib/types";
import { useJourneys, markStepsDone } from "@/lib/journey-store";
import { simulateAgencyApproval } from "@/lib/api-client";
import { useT } from "@/lib/i18n";

/**
 * Top-level "simulate everything" control shown above both Track page tabs
 * (Requirements and Tracking) so it's reachable from either one -- approves
 * every awaiting application across the scoped journey(s) in one tap. Renders
 * nothing when there's nothing awaiting a response.
 */
export function SimulateAllButton({ journeyId }: { journeyId?: string }) {
  const { journeys, ready } = useJourneys();
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const scopedJourneys = journeyId
    ? journeys.filter((j) => j.id === journeyId)
    : journeys;

  const awaitingEntries = scopedJourneys
    .map((journey) => {
      const submitted = journey.submitted_step_numbers ?? [];
      const awaiting = submitted.filter(
        (n) => !journey.completed_step_numbers.includes(n),
      );
      return { journey, awaiting };
    })
    .filter((entry) => entry.awaiting.length > 0);

  if (!ready || awaitingEntries.length === 0) {
    return null;
  }

  async function approveEverything(
    entries: { journey: Journey; awaiting: number[] }[],
  ) {
    setBusy(true);
    try {
      for (const { journey, awaiting } of entries) {
        await simulateAgencyApproval({ journeyId: journey.id });
        const updated = markStepsDone(journey, awaiting);
        if (updated.status === "completed" && entries.length === 1) {
          router.push(`/journey/complete?id=${encodeURIComponent(journey.id)}`);
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-5 pt-4">
      <button
        type="button"
        onClick={() => void approveEverything(awaitingEntries)}
        disabled={busy}
        className="min-h-11 w-full rounded-egov bg-egov-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue disabled:opacity-50"
      >
        {busy
          ? t("Simulating agency approval…")
          : t("Demo: Simulate all applications approved")}
      </button>
    </div>
  );
}
