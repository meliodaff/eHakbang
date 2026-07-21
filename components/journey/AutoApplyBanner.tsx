"use client";

import { useState } from "react";
import type { Journey, JourneyStep } from "@/lib/types";
import { applyMarriageTransaction } from "@/lib/api-client";
import { cn } from "@/lib/cn";

type Stage = "asking" | "declined" | "applying" | "done";

/**
 * Offers to auto-submit the citizen's civil-status update to the remaining
 * agencies on their behalf, using the marriage certificate they already
 * uploaded — shown only on the "got-married" journey.
 */
export function AutoApplyBanner({
  journey,
  completed,
  onComplete,
}: {
  journey: Journey;
  completed: number[];
  onComplete: (stepNumber: number) => void;
}) {
  const [stage, setStage] = useState<Stage>("asking");
  const [currentStepNumber, setCurrentStepNumber] = useState<number | null>(
    null,
  );
  // Snapshotted when the user confirms, so rows don't vanish from the list
  // as `completed` updates live during the applying/done stages.
  const [applyingSteps, setApplyingSteps] = useState<JourneyStep[]>([]);

  const targetSteps = journey.event_id === "got-married" ? journey.steps : [];
  const pendingSteps = targetSteps.filter(
    (s) => !completed.includes(s.step_number),
  );

  if (stage === "declined" || (stage === "asking" && pendingSteps.length === 0)) {
    return null;
  }

  async function handleConfirm() {
    const stepsToApply = pendingSteps;
    setApplyingSteps(stepsToApply);
    setStage("applying");
    for (const step of stepsToApply) {
      setCurrentStepNumber(step.step_number);
      await applyMarriageTransaction(step);
      onComplete(step.step_number);
    }
    setCurrentStepNumber(null);
    setStage("done");
  }

  return (
    <div className="mx-5 mt-4 rounded-egov border border-egov-blue-100 bg-egov-blue-050 p-4">
      {stage === "asking" && (
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-bold text-foreground">⚡ Auto Apply</p>
            <p className="mt-1 text-sm text-foreground">
              Would you like us to auto-apply your update to the remaining{" "}
              {pendingSteps.length}{" "}
              {pendingSteps.length === 1 ? "agency" : "agencies"} using your
              uploaded certificate?
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStage("declined")}
              className="min-h-11 flex-1 rounded-egov border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
            >
              No
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="min-h-11 flex-1 rounded-egov bg-egov-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
            >
              Yes, Auto Apply
            </button>
          </div>
        </div>
      )}

      {(stage === "applying" || stage === "done") && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-foreground">
            {stage === "applying"
              ? "Applying your update…"
              : "All done!"}
          </p>

          <ul className="flex flex-col gap-2">
            {applyingSteps.map((step) => {
              const isSubmitted = completed.includes(step.step_number);
              const isSubmitting =
                !isSubmitted && currentStepNumber === step.step_number;
              return (
                <li
                  key={step.step_number}
                  className="rounded-egov bg-surface px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {step.agency_name}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {step.step_title}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                        isSubmitted && "bg-egov-success-bg text-egov-success",
                        isSubmitting &&
                          "animate-pulse bg-egov-blue-100 text-egov-blue",
                        !isSubmitted &&
                          !isSubmitting &&
                          "bg-background text-muted",
                      )}
                    >
                      {isSubmitted
                        ? "✓ Submitted"
                        : isSubmitting
                          ? "Submitting…"
                          : "Pending"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    Civil status:{" "}
                    {isSubmitted ? (
                      <span>
                        <span className="line-through">Single</span>{" "}
                        <span className="font-semibold text-egov-success">
                          → Married
                        </span>
                      </span>
                    ) : (
                      "Single"
                    )}
                  </p>
                  {step.agency_code === "PHILSYS" && (
                    <p className="mt-1 text-xs italic text-muted">
                      Example: Juana Dela Cruz → Juana Dela Cruz-Santos
                    </p>
                  )}
                </li>
              );
            })}
          </ul>

          {stage === "done" && (
            <>
              <p className="text-sm font-semibold text-egov-success">
                🎉 Your civil status is now Married on all {applyingSteps.length}{" "}
                {applyingSteps.length === 1 ? "ID" : "IDs"}.
              </p>
              <p className="text-xs text-muted">
                This is a simulated submission — confirm with each agency once
                you receive their notice.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
