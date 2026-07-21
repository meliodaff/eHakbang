import type { Journey } from "@/lib/types";
import { JourneySummaryHeader } from "./JourneySummaryHeader";
import { ProgressBar } from "./ProgressBar";
import { StepCard } from "./StepCard";

/**
 * Presentational journey checklist. Completion state is owned by the
 * store-connected JourneyScreen and passed in.
 */
export function JourneyView({
  journey,
  completed,
  walletStepNumbers = [],
  onComplete,
}: {
  journey: Journey;
  completed: number[];
  /** Step numbers satisfied by IDs already in the user's wallet. */
  walletStepNumbers?: number[];
  onComplete: (stepNumber: number) => void;
}) {
  return (
    <main className="flex flex-1 flex-col">
      <JourneySummaryHeader journey={journey} />
      <ProgressBar completed={completed.length} total={journey.total_steps} />

      <div className="flex flex-col gap-3 px-5 py-4">
        {journey.steps.map((step) => (
          <StepCard
            key={step.step_number}
            step={step}
            completed={completed.includes(step.step_number)}
            walletFulfilled={walletStepNumbers.includes(step.step_number)}
            onComplete={onComplete}
          />
        ))}
      </div>
    </main>
  );
}
