"use client";

import { useState } from "react";
import type { Journey, JourneyStep } from "@/lib/types";
import { useJourneys, markStepsSubmitted } from "@/lib/journey-store";
import { submitAutoApply } from "@/lib/api-client";
import { useT } from "@/lib/i18n";

/**
 * "Apply everything" control shown at the bottom of the Requirements tab
 * only -- submits every still-pending (not yet submitted, not yet
 * completed) step across the scoped journey(s) to its agency in one tap.
 * Renders nothing when there's nothing left to apply for. Unstyled wrapper
 * -- the parent (RequirementsTab) supplies layout padding/spacing.
 */
export function ApplyAllButton({ journeyId }: { journeyId?: string }) {
  const { journeys, ready } = useJourneys();
  const t = useT();
  const [busy, setBusy] = useState(false);

  const scopedJourneys = journeyId
    ? journeys.filter((j) => j.id === journeyId)
    : journeys;

  const pendingEntries = scopedJourneys
    .map((journey) => {
      const submitted = journey.submitted_step_numbers ?? [];
      const pending = journey.steps.filter(
        (s) =>
          !submitted.includes(s.step_number) &&
          !journey.completed_step_numbers.includes(s.step_number),
      );
      return { journey, pending };
    })
    .filter((entry) => entry.pending.length > 0);

  if (!ready || pendingEntries.length === 0) {
    return null;
  }

  async function applyAll(journey: Journey, pending: JourneyStep[]) {
    for (const step of pending) {
      await submitAutoApply({
        journeyId: journey.id,
        stepNumber: step.step_number,
        eventId: journey.event_id,
        agencyName: step.agency_name,
        stepTitle: step.step_title,
        fieldAnswers: journey.field_answers?.[step.step_number],
      });
    }
    markStepsSubmitted(journey, pending.map((s) => s.step_number));
  }

  async function applyEverything(
    entries: { journey: Journey; pending: JourneyStep[] }[],
  ) {
    setBusy(true);
    try {
      for (const { journey, pending } of entries) {
        await applyAll(journey, pending);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void applyEverything(pendingEntries)}
      disabled={busy}
      className="min-h-11 w-full rounded-egov bg-egov-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue disabled:opacity-50"
    >
      {busy ? t("Applying to agencies…") : t("Apply All")}
    </button>
  );
}
