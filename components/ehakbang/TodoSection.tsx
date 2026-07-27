"use client";

import { useJourneys, markStepsClaimed } from "@/lib/journey-store";
import { useT } from "@/lib/i18n";
import type { Journey, JourneyStep } from "@/lib/types";

/**
 * Dashboard "To Do" section: lists steps completed via the mocked Auto Apply
 * queue (see StepCard) whose resulting document hasn't been marked claimed
 * yet, across every stored journey. Mirrors the same claim prompt shown on
 * the step itself, so the citizen can also close it out from the dashboard.
 */
export function EhakbangTodoSection() {
  const { journeys } = useJourneys();
  const t = useT();

  const todos = journeys.flatMap((journey) =>
    journey.steps
      .filter(
        (step) =>
          journey.auto_applied_step_numbers.includes(step.step_number) &&
          !journey.claimed_step_numbers.includes(step.step_number),
      )
      .map((step) => ({ journey, step })),
  );

  if (todos.length === 0) return null;

  function handleMarkDone(journey: Journey, step: JourneyStep) {
    markStepsClaimed(journey, [step.step_number]);
  }

  return (
    <section aria-label="To do" className="mt-6 px-5">
      <h2 className="mb-3 text-base font-bold text-foreground">{t("To Do")}</h2>
      <div className="flex flex-col gap-2">
        {todos.map(({ journey, step }) => (
          <div
            key={`${journey.id}:${step.step_number}`}
            className="flex items-center justify-between gap-3 rounded-egov-lg border border-egov-blue-100 bg-egov-blue-050 p-4"
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted">{t(journey.life_event)}</p>
              <p className="mt-0.5 truncate text-sm font-bold text-foreground">
                {t(step.step_title)}
              </p>
              <p className="mt-1 text-xs text-egov-blue-dark">
                {t("Claim your document at")} {t(step.agency_name)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleMarkDone(journey, step)}
              className="min-h-9 shrink-0 rounded-egov bg-egov-blue px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
            >
              {t("Mark as Done")}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
