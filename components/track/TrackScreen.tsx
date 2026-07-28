"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Journey } from "@/lib/types";
import { useJourneys, markStepsApproved } from "@/lib/journey-store";
import { simulateAgencyApproval } from "@/lib/api-client";
import { useT } from "@/lib/i18n";

/**
 * Application tracking screen. Lists every step whose application has been
 * submitted to an agency, grouped by journey. Each application is a tappable
 * card that opens its detail page (all the details/steps of that application,
 * plus the demo "Simulate" control). Done applications show a checked checkbox.
 *
 * `journeyId` scopes the screen to a single journey (e.g. tapping "View
 * Track" on a specific row in My Journeys) instead of showing every journey
 * with submitted applications.
 *
 * The top-level "simulate everything" control lives in `TrackTabs` (shown
 * above both the Requirements and Tracking tabs); this screen keeps only the
 * per-journey simulate button.
 */
export function TrackScreen({ journeyId }: { journeyId?: string }) {
  const { journeys, ready } = useJourneys();
  const t = useT();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  /**
   * Locally simulate every remaining agency for this journey responding and
   * approving. Completing the journey redirects to the "Journey Complete!"
   * screen.
   */
  async function approveAll(journey: Journey, awaiting: number[]) {
    setBusyId(journey.id);
    try {
      await simulateAgencyApproval({ journeyId: journey.id });
      const updated = markStepsApproved(journey, awaiting);
      if (updated.status === "completed") {
        router.push(`/journey/complete?id=${encodeURIComponent(journey.id)}`);
      }
    } finally {
      setBusyId(null);
    }
  }

  const scopedJourneys = journeyId ? journeys.filter((j) => j.id === journeyId) : journeys;

  // Every step whose application was submitted (awaiting a response OR already
  // approved/done), grouped by journey.
  const tracked = scopedJourneys
    .map((journey) => {
      const submitted = journey.submitted_step_numbers ?? [];
      return {
        journey,
        steps: journey.steps.filter((s) => submitted.includes(s.step_number)),
      };
    })
    .filter((entry) => entry.steps.length > 0);

  if (!ready) {
    return (
      <p className="px-5 py-8 text-center text-sm text-muted">{t("Loading…")}</p>
    );
  }

  if (tracked.length === 0) {
    // Scoped to one journey (e.g. "View Track" from My Journeys) that hasn't
    // had anything submitted yet -- distinct from the global empty state, so
    // this doesn't read as "you have no journeys at all".
    if (journeyId) {
      const journey = journeys.find((j) => j.id === journeyId);
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <span aria-hidden className="text-4xl">
            📭
          </span>
          <h2 className="text-lg font-bold text-foreground">
            {t("Nothing submitted yet")}
          </h2>
          <p className="text-sm text-muted">
            {journey
              ? `${t("You haven't submitted any updates for")} "${t(journey.life_event)}" ${t("yet.")}`
              : t("This journey hasn't submitted any updates yet.")}
          </p>
          <Link
            href="/journeys"
            className="mt-2 min-h-11 rounded-egov bg-egov-blue px-5 py-2.5 font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
          >
            {t("Back to My Journeys")}
          </Link>
        </div>
      );
    }

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
      {tracked.map(({ journey, steps }) => {
        const isDone = (n: number) =>
          journey.completed_step_numbers.includes(n);
        const awaiting = steps
          .filter((s) => !isDone(s.step_number))
          .map((s) => s.step_number);
        const awaitingCount = awaiting.length;
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
              {awaitingCount > 0
                ? `${awaitingCount} ${
                    awaitingCount === 1 ? t("application") : t("applications")
                  } ${t("waiting for the agencies to respond")}`
                : t("All applications approved")}
            </p>

            <ul className="mt-3 flex flex-col gap-2">
              {steps.map((step) => {
                const done = isDone(step.step_number);
                return (
                  <li key={step.step_number}>
                    <Link
                      href={`/track/application?journey=${encodeURIComponent(
                        journey.id,
                      )}&step=${step.step_number}`}
                      className={`flex items-center justify-between gap-2 rounded-egov px-3 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue ${
                        done
                          ? "bg-egov-success-bg hover:bg-egov-success-bg/80"
                          : "bg-egov-blue-050 hover:bg-egov-blue-100"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {t(step.agency_name)}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {t(step.step_title)}
                        </p>
                      </div>
                      {done ? (
                        <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-egov-success">
                          <input
                            type="checkbox"
                            checked
                            readOnly
                            aria-label={`${t(step.agency_name)} — ${t("Done")}`}
                            className="h-4 w-4 accent-egov-success"
                          />
                          {t("Done")}
                        </span>
                      ) : (
                        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-egov-blue">
                          <span aria-hidden>🕓</span>
                          {t("Awaiting")}
                          <span aria-hidden className="text-base leading-none">
                            ›
                          </span>
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {awaitingCount > 0 && (
              <button
                type="button"
                onClick={() => void approveAll(journey, awaiting)}
                disabled={busyId !== null}
                className="mt-4 min-h-11 w-full rounded-egov border border-egov-blue bg-surface px-4 py-2.5 text-sm font-semibold text-egov-blue transition-colors hover:bg-egov-blue-050 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue disabled:opacity-50"
              >
                {busyId === journey.id
                  ? t("Simulating agency approval…")
                  : t("Demo: Simulate all agencies' approval")}
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
}
