"use client";

import { useRouter } from "next/navigation";
import type { Journey } from "@/lib/types";
import { EhakbangHeader } from "@/components/layout/EhakbangHeader";
import { archiveJourney } from "@/lib/journey-store";
import { useT } from "@/lib/i18n";

function formatDate(iso: string | null): string {
  const date = iso ? new Date(iso) : new Date();
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Screen 3 — Journey Complete (PRD §10.4). Celebration state with the life
 * event, total steps completed, and completion date, plus archive / new
 * journey actions.
 *
 * `readOnly` renders the same info without the archive/start-new actions —
 * used when revisiting an already-completed journey (e.g. re-tapping the
 * "Married" tile) rather than landing here fresh right after finishing.
 */
export function CompletionCard({
  journey,
  readOnly = false,
}: {
  journey: Journey;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const t = useT();

  return (
    <main className="flex flex-1 flex-col bg-surface">
      <EhakbangHeader backHref={readOnly ? "/ehakbang" : "/journeys"} />
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-10 text-center">
      <span
        className="flex h-20 w-20 items-center justify-center rounded-full bg-egov-success-bg text-4xl text-egov-success"
        aria-hidden
      >
        ✓
      </span>

      <div>
        <h1 className="text-2xl font-bold text-egov-navy">{t("Journey Complete!")}</h1>
        <p className="mt-2 text-muted">
          {t("You've completed all the steps for")}{" "}
          <span className="font-semibold text-foreground">
            {journey.emoji} {t(journey.life_event)}
          </span>
          .
        </p>
      </div>

      <dl className="w-full max-w-xs rounded-egov bg-surface p-4 text-left shadow-sm">
        <div className="flex items-center justify-between py-1.5">
          <dt className="text-muted">{t("Life event")}</dt>
          <dd className="font-semibold text-foreground">
            {t(journey.life_event)}
          </dd>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <dt className="text-muted">{t("Steps completed")}</dt>
          <dd className="font-semibold text-foreground">
            {`${journey.total_steps} ${t("of")} ${journey.total_steps}`}
          </dd>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <dt className="text-muted">{t("Completed on")}</dt>
          <dd className="font-semibold text-foreground">
            {formatDate(journey.completed_at)}
          </dd>
        </div>
      </dl>

      {journey.event_id === "got-married" && journey.steps.length > 0 && (
        <div className="w-full max-w-xs rounded-egov bg-egov-success-bg p-4 text-left">
          <p className="text-sm font-semibold text-egov-success">
            🎉 Civil status updated to Married on all {journey.steps.length}{" "}
            IDs
          </p>
          <ul className="mt-2 space-y-1 text-xs text-egov-success">
            {journey.steps.map((step) => (
              <li key={step.step_number}>✓ {step.agency_name}: Married</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex w-full max-w-xs flex-col gap-2">
        {readOnly ? (
          <button
            type="button"
            onClick={() => router.push("/ehakbang")}
            className="min-h-12 rounded-egov border border-egov-blue px-5 py-3 font-semibold text-egov-blue transition-colors hover:bg-egov-blue-050 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
          >
            {t("Back to Home")}
          </button>
        ) : journey.event_id === "got-married" ? (
          <button
            type="button"
            onClick={() => router.push("/ehakbang")}
            className="min-h-12 rounded-egov bg-egov-blue px-5 py-3 font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
          >
            {t("Continue to Dashboard")}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                archiveJourney(journey.id);
                router.push("/journeys");
              }}
              className="min-h-12 rounded-egov bg-egov-blue px-5 py-3 font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
            >
              {t("Archive This Journey")}
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="min-h-12 rounded-egov border border-egov-blue px-5 py-3 font-semibold text-egov-blue transition-colors hover:bg-egov-blue-050 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
            >
              {t("Start a New Journey")}
            </button>
          </>
        )}
      </div>
      </div>
    </main>
  );
}
