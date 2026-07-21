"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Journey } from "@/lib/types";
import { JourneySummaryHeader } from "./JourneySummaryHeader";
import { ProgressBar } from "./ProgressBar";
import { StepCard } from "./StepCard";

/**
 * Screen 2 — the journey checklist. Holds local completion state, keeps the
 * progress bar in sync, and routes to the completion screen once every step
 * is marked done.
 */
export function JourneyView({ journey }: { journey: Journey }) {
  const router = useRouter();
  const [completed, setCompleted] = useState<number[]>(
    journey.completed_step_numbers,
  );

  function handleComplete(stepNumber: number) {
    setCompleted((prev) => {
      if (prev.includes(stepNumber)) return prev;
      const next = [...prev, stepNumber];
      if (next.length >= journey.total_steps) {
        // Defer navigation until after state commit.
        setTimeout(() => router.push(`/journey/complete?id=${journey.id}`), 400);
      }
      return next;
    });
  }

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
            onComplete={handleComplete}
          />
        ))}
      </div>
    </main>
  );
}
