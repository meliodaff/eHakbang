import type { ReactNode } from "react";
import type { Journey } from "@/lib/types";
import { JourneySummaryHeader } from "./JourneySummaryHeader";
import { ProgressBar } from "./ProgressBar";
import { StepCard } from "./StepCard";
import { AutoApplyBanner } from "./AutoApplyBanner";

/**
 * Presentational journey checklist. Completion state is owned by the
 * store-connected JourneyScreen and passed in.
 */
export function JourneyView({
  journey,
  completed,
  walletStepNumbers = [],
  afterHeader,
  onComplete,
  onAutoApplied,
  onClaim,
  onSubmitFields,
}: {
  journey: Journey;
  completed: number[];
  /** Step numbers satisfied by IDs already in the user's wallet. */
  walletStepNumbers?: number[];
  /** Optional content rendered directly below the summary header. */
  afterHeader?: ReactNode;
  /** Used only by the bulk AutoApplyBanner flow -- see StepCard's onAutoApplied for the per-step queue. */
  onComplete: (stepNumber: number) => void;
  onAutoApplied: (stepNumber: number) => void;
  onClaim: (stepNumber: number) => void;
  /** Persists required_fields answers submitted from a step's Auto Apply flow. */
  onSubmitFields: (answers: Record<number, Record<string, string>>) => void;
}) {
  return (
    <main className="flex flex-1 flex-col">
      <JourneySummaryHeader journey={journey} />
      {afterHeader}
      <AutoApplyBanner
        journey={journey}
        completed={completed}
        onComplete={onComplete}
      />
      <ProgressBar completed={completed.length} total={journey.total_steps} />

      <div className="flex flex-col gap-3 px-5 py-4">
        {journey.steps.map((step) => (
          <StepCard
            key={step.step_number}
            step={step}
            completed={completed.includes(step.step_number)}
            walletFulfilled={walletStepNumbers.includes(step.step_number)}
            autoApplied={journey.auto_applied_step_numbers.includes(step.step_number)}
            claimed={journey.claimed_step_numbers.includes(step.step_number)}
            onAutoApplied={onAutoApplied}
            onClaim={onClaim}
            journeyId={journey.id}
            eventId={journey.event_id}
            fieldAnswers={journey.field_answers}
            onSubmitFields={onSubmitFields}
          />
        ))}
      </div>
    </main>
  );
}
