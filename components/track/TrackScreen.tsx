"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Journey } from "@/lib/types";
import { useJourneys, markStepsDone } from "@/lib/journey-store";
import { simulateAgencyApproval } from "@/lib/api-client";
import { useT } from "@/lib/i18n";

/**
 * Application tracking screen. Lists every step whose application has been
 * submitted to an agency and is still awaiting a response (across all stored
 * journeys), grouped by journey.
 *
 * Hosts the demo "Simulate agency approval" control (moved here from the
 * AutoApplyBanner): since there is no real agency backend, this locally
 * simulates the agencies responding and approving the pending applications,
 * marking those steps complete.
 */
export function TrackScreen() {
  const { journeys, ready } = useJourneys();
  const t = useT();
  const router = useRouter();
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const tracked = journeys
    .map((journey) => ({
      journey,
      awaiting: (journey.submitted_step_numbers ?? []).filter(
        (n) => !journey.completed_step_numbers.includes(n),
      ),
    }))
    .filter((entry) => entry.awaiting.length > 0);

  async function handleApprove(journey: Journey, awaiting: number[]) {
    setApprovingId(journey.id);
    try {
      // Local demo stand-in for the agencies responding (no real backend).
      await simulateAgencyApproval({ journeyId: journey.id });
      markStepsDone(journey, awaiting);
      // Agencies have "approved" -- take the citizen to the journey-complete
      // ("Journey Complete!") screen.
      router.push(`/journey/complete?id=${encodeURIComponent(journey.id)}`);
    } finally {
      setApprovingId(null);
    }
  }

  if (!ready) {
    return (
      <p className="px-5 py-8 text-center text-sm text-muted">{t("Loading…")}</p>
    );
  }

  if (tracked.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <span aria-hidden className="text-4xl">
          📭
        </span>
        <h2 className="text-lg font-bold text-foreground">
          {t("No applications to track")}
        </h2>
        <p className="text-sm text-muted">
          {t(
            "Once you submit an update to your agencies, you can track their responses here.",
          )}
        </p>
        <Link
          href="/ehakbang"
          className="mt-2 min-h-11 rounded-egov bg-egov-blue px-5 py-2.5 font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
        >
          {t("Start a New Journey")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-5 py-4">
      {tracked.map(({ journey, awaiting }) => {
        const awaitingSteps = journey.steps.filter((s) =>
          awaiting.includes(s.step_number),
        );
        const isApproving = approvingId === journey.id;
        return (
          <section
            key={journey.id}
            aria-label={`${journey.life_event} applications`}
            className="rounded-egov-lg border border-border bg-surface p-4"
          >
            <div className="flex items-center gap-2">
              <span aria-hidden className="text-xl">
                {journey.emoji}
              </span>
              <h2 className="min-w-0 truncate text-base font-bold text-foreground">
                {t(journey.life_event)}
              </h2>
            </div>

            <p className="mt-1 text-xs text-muted">
              {awaitingSteps.length}{" "}
              {awaitingSteps.length === 1 ? t("application") : t("applications")}{" "}
              {t("waiting for the agencies to respond")}
            </p>

            <ul className="mt-3 flex flex-col gap-2">
              {awaitingSteps.map((step) => (
                <li
                  key={step.step_number}
                  className="flex items-center justify-between gap-2 rounded-egov bg-egov-blue-050 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {t(step.agency_name)}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {t(step.step_title)}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-egov-blue-100 px-2.5 py-1 text-xs font-semibold text-egov-blue">
                    <span aria-hidden>🕓</span>
                    {t("Awaiting")}
                  </span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => void handleApprove(journey, awaiting)}
              disabled={isApproving}
              className="mt-4 min-h-11 w-full rounded-egov border border-egov-blue bg-surface px-4 py-2.5 text-sm font-semibold text-egov-blue transition-colors hover:bg-egov-blue-050 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue disabled:opacity-50"
            >
              {isApproving
                ? t("Simulating agency approval…")
                : t("Demo: Simulate agency approval & document updates")}
            </button>
          </section>
        );
      })}
    </div>
  );
}
