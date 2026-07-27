"use client";

import { useEffect, useRef, useState } from "react";
import type { JourneyStep } from "@/lib/types";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import { linkifyText, stripInlineLinks } from "@/lib/format-ai-text";
import { getMissingRequiredFields } from "@/lib/journey-fields";
import { fetchAutoApplyStatus, submitAutoApply } from "@/lib/api-client";
import { StepTypeBadge } from "./StepTypeBadge";
import { DisclaimerBox } from "./DisclaimerBox";
import { AskAboutStep } from "./AskAboutStep";
import { StepFieldsForm } from "./StepFieldsForm";

const POLL_INTERVAL_MS = 3000;

type QueueUiState =
  | { kind: "checking" }
  | { kind: "idle" }
  | { kind: "needs-fields" }
  | { kind: "pending" }
  | { kind: "error"; message: string };

/**
 * A single journey step card (PRD FR-05/FR-06). Shows the step number, agency,
 * type badge, title, reason, documents, time estimate, note, an official
 * service link, and an "Auto Apply" flow backed by a mocked Supabase queue
 * (see lib/server/application-queue.ts) -- there is no manual self-attestation
 * anymore; the step completes once the queue is accepted. Auto-applied steps
 * then show a "claim your document at the agency office" prompt until the
 * citizen marks it claimed (also surfaced in the dashboard's "To Do" section).
 */
export function StepCard({
  step,
  completed,
  walletFulfilled = false,
  autoApplied,
  claimed,
  onAutoApplied,
  onClaim,
  journeyId,
  eventId,
  fieldAnswers,
  onSubmitFields,
}: {
  step: JourneyStep;
  completed: boolean;
  /** True when this step is satisfied by an ID already in the user's wallet. */
  walletFulfilled?: boolean;
  /** True once this step was completed via the mocked Auto Apply queue. */
  autoApplied: boolean;
  /** True once the auto-applied step's document has been claimed at the agency office. */
  claimed: boolean;
  onAutoApplied: (stepNumber: number) => void;
  onClaim: (stepNumber: number) => void;
  /** Stable Journey.id, used as the Auto Apply queue's key alongside step_number. */
  journeyId: string;
  eventId?: string;
  /** journey.field_answers -- required_fields answers already on file. */
  fieldAnswers: Record<number, Record<string, string>>;
  onSubmitFields: (answers: Record<number, Record<string, string>>) => void;
}) {
  const t = useT();
  const isBenefit = step.step_type === "benefit_claim";
  const [queueState, setQueueState] = useState<QueueUiState>({ kind: "checking" });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function clearPoll() {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function startPolling() {
    clearPoll();
    pollRef.current = setInterval(() => {
      fetchAutoApplyStatus({ journeyId, stepNumber: step.step_number })
        .then((status) => {
          if (status?.status === "accepted") {
            clearPoll();
            onAutoApplied(step.step_number);
          }
        })
        .catch(() => {
          // Transient poll failure -- keep polling rather than surfacing an
          // error mid-wait; the next tick will retry.
        });
    }, POLL_INTERVAL_MS);
  }

  // On mount (unless already completed), resume whatever state this step's
  // queue entry is actually in -- it may already be pending or accepted from
  // a previous visit, since queue state lives in Supabase, not localStorage.
  useEffect(() => {
    if (completed) return;
    let cancelled = false;

    fetchAutoApplyStatus({ journeyId, stepNumber: step.step_number })
      .then((status) => {
        if (cancelled) return;
        if (!status) {
          setQueueState({ kind: "idle" });
        } else if (status.status === "accepted") {
          onAutoApplied(step.step_number);
        } else {
          setQueueState({ kind: "pending" });
          startPolling();
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQueueState({
            kind: "error",
            message: t("Couldn't check this step's status. Please try again."),
          });
        }
      });

    return () => {
      cancelled = true;
      clearPoll();
    };
    // Deliberately re-runs only when the step identity or completion changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed, journeyId, step.step_number]);

  async function submit(answers?: Record<string, string>) {
    setQueueState({ kind: "pending" });
    try {
      await submitAutoApply({
        journeyId,
        stepNumber: step.step_number,
        eventId,
        agencyName: step.agency_name,
        stepTitle: step.step_title,
        fieldAnswers: answers,
      });
      startPolling();
    } catch {
      setQueueState({
        kind: "error",
        message: t("Couldn't submit this step. Please try again."),
      });
    }
  }

  function handleAutoApply() {
    const missing = getMissingRequiredFields([step], fieldAnswers);
    if (missing.length > 0) {
      setQueueState({ kind: "needs-fields" });
      return;
    }
    void submit(fieldAnswers[step.step_number]);
  }

  function handleFieldsSubmit(answers: Record<number, Record<string, string>>) {
    onSubmitFields(answers);
    void submit(answers[step.step_number]);
  }

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
          <p className="text-sm font-semibold text-muted">{t(step.agency_name)}</p>
          <div className="mt-1">
            <StepTypeBadge type={step.step_type} />
          </div>
          <h3 className="mt-2 text-base font-bold text-foreground">
            {t(step.step_title)}
          </h3>
        </div>
      </div>

      <p className="mt-3 text-sm text-foreground">{linkifyText(t(step.reason))}</p>

      <div className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {t("Documents needed")}
        </p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-foreground">
          {step.documents_required.map((doc) => (
            <li key={doc}>{t(doc)}</li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-sm text-muted">
        <span className="font-semibold text-foreground">{t("Estimated time:")}</span>{" "}
        {stripInlineLinks(t(step.estimated_time))}
      </p>

      {step.important_note && (
        <p className="mt-2 rounded-egov bg-egov-blue-050 px-3 py-2 text-sm text-egov-blue-dark">
          {linkifyText(t(step.important_note))}
        </p>
      )}

      {step.fee && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {t("Fee")}
          </p>
          <p className="mt-1 text-sm text-foreground">
            {t(step.fee.amount)} — {linkifyText(t(step.fee.how_to_pay))}
          </p>
          {step.fee.official_source_url && (
            <a
              href={step.fee.official_source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs font-semibold text-egov-blue underline underline-offset-2"
            >
              {t("Source")}
            </a>
          )}
        </div>
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
          {t("Go to Official Service")}
          <span aria-hidden>↗</span>
        </a>

        {completed ? (
          walletFulfilled ? (
            <p className="flex min-h-11 items-center justify-center gap-1.5 rounded-egov bg-egov-success-bg px-4 py-2.5 text-center text-sm font-semibold text-egov-success">
              <span aria-hidden>🪪</span>{" "}
              {t("You already have this — it's in your ID Wallet")}
            </p>
          ) : autoApplied && !claimed ? (
            <div className="flex flex-col gap-2 rounded-egov bg-egov-blue-050 p-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-egov-blue-dark">
                <span aria-hidden>🏢</span>
                {t("Claim your document at")} {t(step.agency_name)}
              </p>
              <button
                type="button"
                onClick={() => onClaim(step.step_number)}
                className="min-h-11 rounded-egov bg-egov-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
              >
                {t("Mark as Done")}
              </button>
            </div>
          ) : (
            <p className="flex min-h-11 items-center justify-center gap-1.5 rounded-egov bg-egov-success-bg px-4 py-2.5 text-sm font-semibold text-egov-success">
              <span aria-hidden>✓</span> {t("Completed")}
            </p>
          )
        ) : queueState.kind === "needs-fields" ? (
          <StepFieldsForm
            steps={[step]}
            initialAnswers={fieldAnswers}
            onSubmit={handleFieldsSubmit}
          />
        ) : queueState.kind === "pending" ? (
          <p className="flex min-h-11 animate-pulse items-center justify-center gap-1.5 rounded-egov bg-egov-blue-100 px-4 py-2.5 text-sm font-semibold text-egov-blue">
            <span aria-hidden>⏳</span> {t("Application pending…")}
          </p>
        ) : queueState.kind === "error" ? (
          <div className="flex flex-col gap-2 rounded-egov bg-background p-3">
            <p className="text-sm font-semibold text-red-600">{queueState.message}</p>
            <button
              type="button"
              onClick={() => setQueueState({ kind: "idle" })}
              className="min-h-11 rounded-egov bg-egov-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
            >
              {t("Try again")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={queueState.kind === "checking"}
            onClick={handleAutoApply}
            className="min-h-11 rounded-egov bg-egov-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("Auto Apply")}
          </button>
        )}
      </div>

      <div className="mt-4">
        <AskAboutStep step={step} />
      </div>
    </article>
  );
}
