"use client";

import Link from "next/link";
import { useJourneys } from "@/lib/journey-store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { ApplyAllButton } from "./ApplyAllButton";

/**
 * Requirements checklist -- the "what does this journey need" counterpart
 * to the Tracking tab's "what have I submitted, and what's the status"
 * view. `journeyId` scopes to a single journey (e.g. "View Track" from a
 * specific My Journeys row); omitted, it lists every journey's
 * requirements, grouped the same way the Tracking tab groups submitted
 * applications. The one interactive element is the "Apply All" button at
 * the bottom, which submits every still-pending step shown above.
 */
export function RequirementsTab({ journeyId }: { journeyId?: string }) {
  const { journeys, ready } = useJourneys();
  const t = useT();

  const scoped = journeyId ? journeys.filter((j) => j.id === journeyId) : journeys;

  if (!ready) {
    return (
      <p className="px-5 py-8 text-center text-sm text-muted">{t("Loading…")}</p>
    );
  }

  if (scoped.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <span aria-hidden className="text-4xl">
          📋
        </span>
        <h2 className="text-lg font-bold text-foreground">
          {t("No requirements to show")}
        </h2>
        <p className="text-sm text-muted">
          {t("Start a journey to see its requirements here.")}
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
    <div className="flex flex-col gap-5 px-5 py-4">
      {scoped.map((journey) => {
        const doneCount = journey.completed_step_numbers.length;
        return (
          <section
            key={journey.id}
            aria-label={`${journey.life_event} requirements`}
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
              {doneCount} {t("of")} {journey.total_steps}{" "}
              {t("requirements completed")}
            </p>

            <ul className="mt-3 flex flex-col gap-2">
              {journey.steps.map((step) => {
                const done = journey.completed_step_numbers.includes(step.step_number);
                return (
                  <li
                    key={step.step_number}
                    className="rounded-egov bg-background px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-muted">
                          {t(step.agency_name)}
                        </p>
                        <p className="truncate text-sm font-semibold text-foreground">
                          {t(step.step_title)}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {step.documents_required.length > 0
                            ? step.documents_required.map((d) => t(d)).join(", ")
                            : t("No documents required")}
                        </p>
                        {step.fee && (
                          <p className="mt-0.5 text-xs font-semibold text-egov-blue">
                            {t(step.fee.amount)}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          done
                            ? "bg-egov-success-bg text-egov-success"
                            : "bg-egov-blue-050 text-egov-blue",
                        )}
                      >
                        {done ? t("Done") : t("Pending")}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <ApplyAllButton journeyId={journeyId} />
    </div>
  );
}
