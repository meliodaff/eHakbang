"use client";

import { useState } from "react";
import type { JourneyStep } from "@/lib/types";
import { cn } from "@/lib/cn";
import { StepTypeBadge } from "./StepTypeBadge";
import { DisclaimerBox } from "./DisclaimerBox";
import { AskAboutStep } from "./AskAboutStep";

/**
 * A single journey step card (PRD FR-05/FR-06). Shows the step number, agency,
 * type badge, title, reason, documents, time estimate, note, an official
 * service link, and a "Mark as Done" flow with a single confirmation.
 */
export function StepCard({
  step,
  completed,
  walletFulfilled = false,
  onComplete,
}: {
  step: JourneyStep;
  completed: boolean;
  /** True when this step is satisfied by an ID already in the user's wallet. */
  walletFulfilled?: boolean;
  onComplete: (stepNumber: number) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const isBenefit = step.step_type === "benefit_claim";

  return (
    <article
      className={cn(
        "rounded-egov border border-border bg-surface p-4 shadow-sm transition-opacity",
        completed && "opacity-70",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
            completed
              ? "bg-egov-success text-white"
              : "bg-egov-blue text-white",
          )}
          aria-hidden
        >
          {completed ? "✓" : step.step_number}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-muted">{step.agency_name}</p>
          <div className="mt-1">
            <StepTypeBadge type={step.step_type} />
          </div>
          <h3 className="mt-2 text-base font-bold text-foreground">
            {step.step_title}
          </h3>
        </div>
      </div>

      <p className="mt-3 text-sm text-foreground">{step.reason}</p>

      <div className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Documents needed
        </p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-foreground">
          {step.documents_required.map((doc) => (
            <li key={doc}>{doc}</li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-sm text-muted">
        <span className="font-semibold text-foreground">Estimated time:</span>{" "}
        {step.estimated_time}
      </p>

      {step.important_note && (
        <p className="mt-2 rounded-egov bg-egov-blue-050 px-3 py-2 text-sm text-egov-blue-dark">
          {step.important_note}
        </p>
      )}

      {isBenefit && (
        <div className="mt-3">
          <DisclaimerBox />
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        <a
          href={step.egov_url ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 items-center justify-center gap-1.5 rounded-egov border border-egov-blue px-4 py-2.5 text-sm font-semibold text-egov-blue transition-colors hover:bg-egov-blue-050 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
        >
          Go to Official Service
          <span aria-hidden>↗</span>
        </a>

        {completed ? (
          walletFulfilled ? (
            <p className="flex min-h-11 items-center justify-center gap-1.5 rounded-egov bg-egov-success-bg px-4 py-2.5 text-center text-sm font-semibold text-egov-success">
              <span aria-hidden>🪪</span> Meron ka na nito — nasa iyong ID Wallet
            </p>
          ) : (
            <p className="flex min-h-11 items-center justify-center gap-1.5 rounded-egov bg-egov-success-bg px-4 py-2.5 text-sm font-semibold text-egov-success">
              <span aria-hidden>✓</span> Completed
            </p>
          )
        ) : confirming ? (
          <div className="flex flex-col gap-2 rounded-egov bg-background p-3">
            <p className="text-sm font-semibold text-foreground">
              Did you complete this step?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onComplete(step.step_number)}
                className="min-h-11 flex-1 rounded-egov bg-egov-success px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-success"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="min-h-11 flex-1 rounded-egov border border-border px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
              >
                Not Yet
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="min-h-11 rounded-egov bg-egov-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
          >
            Mark as Done
          </button>
        )}
      </div>

      <div className="mt-4">
        <AskAboutStep stepTitle={step.step_title} />
      </div>
    </article>
  );
}
