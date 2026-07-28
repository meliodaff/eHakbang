"use client";

import { useEffect, useRef, useState } from "react";
import type { IdType, JourneyStep } from "@/lib/types";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import { linkifyText, stripInlineLinks } from "@/lib/format-ai-text";
import { getMissingRequiredFields } from "@/lib/journey-fields";
import { fetchAutoApplyStatus, submitAutoApply, submitEnrollment } from "@/lib/api-client";
import { ID_CATALOG } from "@/lib/id-wallet";
import { inferRequiredExistingId } from "@/lib/journey-record-update-gate";
import type { PrerequisiteState } from "@/lib/journey-prerequisites";
import {
  getEligibilityRequirements,
  checkEligibility,
} from "@/lib/journey-eligibility";
import { resolveOfficialService, resolveOfficialUrl } from "@/lib/egov-catalog";
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

/** Local UI state for the "apply/enroll first" flow on a blocked claim. */
type EnrollUiState =
  | { kind: "idle" }
  | { kind: "enrolling" }
  | { kind: "error"; message: string };

/** Local UI state for the indicative eligibility pre-check on a benefit claim. */
type EligibilityUiState =
  | { kind: "unchecked" }
  | { kind: "eligible" }
  | { kind: "not-yet"; reason: string }
  | { kind: "lapsed"; reason: string }
  | { kind: "needs-info"; reason: string };

/**
 * A single journey step card (PRD FR-05/FR-06). Shows the step number, agency,
 * type badge, title, reason, documents, time estimate, note, an official
 * service link, and an "Auto Apply" flow. Submitting an application records it
 * locally (see the journey store's markStepsSubmitted); the step then stays
 * "awaiting the agency's response" until an agency reacts.
 */
export function StepCard({
  step,
  completed,
  walletFulfilled = false,
  notApplicable = false,
  autoApplied,
  claimed,
  submitted = false,
  onAutoApplied,
  onClaim,
  onSubmit,
  journeyId,
  eventId,
  fieldAnswers,
  onSubmitFields,
  prerequisiteState = "none",
  onEnrolled,
}: {
  step: JourneyStep;
  completed: boolean;
  /** True when this step is satisfied by an ID already in the user's wallet. */
  walletFulfilled?: boolean;
  /** True when this record-update step doesn't apply because the citizen lacks the ID it would update. */
  notApplicable?: boolean;
  /** True once this step was completed via the mocked Auto Apply queue. */
  autoApplied: boolean;
  /** True once the auto-applied step's document has been claimed at the agency office. */
  claimed: boolean;
  /** True once this step's application has been submitted and is awaiting the agency's response. */
  submitted?: boolean;
  onAutoApplied: (stepNumber: number) => void;
  onClaim: (stepNumber: number) => void;
  /** Persists the submitted-but-awaiting state (see journey store's markStepsSubmitted). */
  onSubmit?: (stepNumber: number) => void;
  /** Stable Journey.id, used as the Auto Apply queue's key alongside step_number. */
  journeyId: string;
  eventId?: string;
  /** journey.field_answers -- required_fields answers already on file. */
  fieldAnswers: Record<number, Record<string, string>>;
  onSubmitFields: (answers: Record<number, Record<string, string>>) => void;
  /**
   * Prerequisite status for this claim vs. the citizen's ID wallet (see
   * lib/journey-prerequisites). When "blocked-*", the claim is locked and an
   * enroll-first path is shown instead of the Auto Apply action.
   */
  prerequisiteState?: PrerequisiteState;
  /** Called once the citizen enrolls (or declares they already hold the ID). */
  onEnrolled?: (idType: IdType) => void;
}) {
  const t = useT();
  const isBenefit = step.step_type === "benefit_claim";
  // A benefit claim is *filed*; a record update is *auto-applied*. Use claim
  // wording for benefit claims so the flow reads coherently.
  const applyLabel = isBenefit ? t("File this claim") : t("Auto Apply");
  const submittedLabel = isBenefit
    ? t("Claim filed — awaiting agency decision")
    : t("Submitted — awaiting agency review");
  // Resolved official destination for the "Go to Official Service" CTA.
  const official = resolveOfficialService(step);
  const [queueState, setQueueState] = useState<QueueUiState>({ kind: "checking" });
  const [enrollState, setEnrollState] = useState<EnrollUiState>({ kind: "idle" });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Indicative eligibility pre-check (filing window + contributions self-check).
  const eligReqs = getEligibilityRequirements(step);
  const [eligState, setEligState] = useState<EligibilityUiState>({ kind: "unchecked" });
  const [contingencyDate, setContingencyDate] = useState("");
  const [contributionsPosted, setContributionsPosted] = useState(false);

  // A claim whose required agency membership the citizen doesn't hold yet.
  const isBlocked =
    !completed &&
    (prerequisiteState === "blocked-membership" ||
      prerequisiteState === "blocked-contribution");
  const requiredId = step.prerequisite?.required_id;
  const requiredIdLabel = requiredId
    ? ID_CATALOG.find((e) => e.id === requiredId)?.label ?? requiredId
    : "";

  // For a not-applicable record-update step, the ID it would have updated.
  const requiredExistingId = inferRequiredExistingId(step);
  const requiredExistingIdLabel = requiredExistingId
    ? ID_CATALOG.find((e) => e.id === requiredExistingId)?.label ?? requiredExistingId
    : "";

  // Membership is resolved (not blocked) but the claim still needs an
  // indicative eligibility pre-check before it can be filed.
  const showEligibilityGate =
    !completed &&
    !submitted &&
    !isBlocked &&
    eligReqs !== null &&
    eligState.kind !== "eligible";

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

    // A step already submitted (persisted in the store) is awaiting the
    // agency's response -- show that state directly without a status lookup.
    if (submitted) {
      setQueueState({ kind: "pending" });
      return;
    }

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
  }, [completed, journeyId, step.step_number, submitted]);

  async function submit(answers?: Record<string, string>) {
    setQueueState({ kind: "pending" });
    // Persist the submitted-but-awaiting state so it survives navigation and
    // shows on the tracking dashboard.
    onSubmit?.(step.step_number);
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

  // "Apply / Enroll here" — simulated enrollment for a blocked claim. On
  // success the citizen is marked as holding the required ID (via onEnrolled),
  // which reactively unblocks this claim.
  async function handleEnroll() {
    if (!requiredId) return;
    setEnrollState({ kind: "enrolling" });
    try {
      await submitEnrollment({
        journeyId,
        stepNumber: step.step_number,
        agencyName: step.agency_name,
        requiredId,
      });
      setEnrollState({ kind: "idle" });
      onEnrolled?.(requiredId);
    } catch {
      setEnrollState({
        kind: "error",
        message: t("Couldn't register you. Please try again."),
      });
    }
  }

  // "I already have this number" — the citizen holds the ID but hadn't
  // recorded it; add it to the wallet (via onEnrolled) to unblock the claim.
  function handleAlreadyHave() {
    if (requiredId) onEnrolled?.(requiredId);
  }

  // Run the indicative eligibility pre-check. On "eligible" the render falls
  // through to the normal claim action; other outcomes stay on the gate with
  // an honest explanation.
  function handleCheckEligibility() {
    if (!eligReqs) return;
    const result = checkEligibility(eligReqs, {
      contingencyDate: contingencyDate || undefined,
      contributionsPosted,
    });
    setEligState(
      result.status === "eligible"
        ? { kind: "eligible" }
        : { kind: result.status, reason: result.reason },
    );
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
        {official.kind === "link" ? (
          <a
            href={official.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 flex-wrap items-center justify-center gap-x-1.5 gap-y-0 rounded-egov border border-egov-blue px-4 py-2.5 text-sm font-semibold text-egov-blue transition-colors hover:bg-egov-blue-050 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
          >
            <span className="inline-flex items-center gap-1.5">
              {t("Go to Official Service")}
              <span aria-hidden>↗</span>
            </span>
            {official.domain && (
              <span className="text-xs font-normal text-muted">{official.domain}</span>
            )}
          </a>
        ) : (
          <p className="flex min-h-11 items-center justify-center gap-1.5 rounded-egov bg-background px-4 py-2.5 text-center text-sm text-muted">
            <span aria-hidden>🏢</span>
            {t("Handled outside government online services — coordinate directly with")}{" "}
            {t(step.agency_name)}.
          </p>
        )}

        {completed ? (
          notApplicable ? (
            <p className="flex min-h-11 items-center justify-center gap-1.5 rounded-egov bg-background px-4 py-2.5 text-center text-sm font-semibold text-muted">
              <span aria-hidden>—</span>{" "}
              {t("Not applicable — you don't have a")} {t(requiredExistingIdLabel)}{" "}
              {t("on file, so there's nothing to update.")}
            </p>
          ) : walletFulfilled ? (
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
        ) : isBlocked ? (
          <div className="flex flex-col gap-2 rounded-egov border border-egov-warning/40 bg-egov-warning-bg p-3">
            <p className="flex items-center gap-1.5 text-sm font-bold text-egov-warning">
              <span aria-hidden>🔒</span> {t("Action needed")}
            </p>
            <p className="text-sm text-foreground">
              {step.prerequisite?.note
                ? linkifyText(t(step.prerequisite.note))
                : `${t("You need a")} ${t(requiredIdLabel)} ${t("to claim this benefit.")}`}
            </p>
            {prerequisiteState === "blocked-contribution" && (
              <p className="rounded-egov bg-surface px-3 py-2 text-xs text-muted">
                {t(
                  "Enrolling starts your membership, but this benefit may require prior contributions before you can claim.",
                )}
              </p>
            )}
            {enrollState.kind === "error" && (
              <p className="text-xs font-semibold text-red-600">
                {enrollState.message}
              </p>
            )}
            <button
              type="button"
              onClick={handleEnroll}
              disabled={enrollState.kind === "enrolling"}
              className="flex min-h-11 items-center justify-center gap-2 rounded-egov bg-egov-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enrollState.kind === "enrolling" ? (
                <>
                  <span aria-hidden>⏳</span> {t("Registering…")}
                </>
              ) : (
                <>
                  {t("Register for")} {t(requiredIdLabel)}
                  <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    {t("Simulated")}
                  </span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleAlreadyHave}
              disabled={enrollState.kind === "enrolling"}
              className="min-h-11 rounded-egov border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-egov-blue transition-colors hover:bg-egov-blue-050 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue disabled:opacity-50"
            >
              {t("I already have this number")}
            </button>
            <p className="text-xs italic text-muted">
              {t("We don't verify this with the agency — they'll confirm it when you file.")}
            </p>
          </div>
        ) : showEligibilityGate ? (
          <div className="flex flex-col gap-2 rounded-egov border border-egov-blue-100 bg-egov-blue-050 p-3">
            <p className="flex items-center gap-2 text-sm font-bold text-egov-blue-dark">
              <span aria-hidden>📋</span> {t("Check eligibility")}
              <span className="rounded-full bg-egov-blue/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-egov-blue">
                {t("Simulated")}
              </span>
            </p>
            <p className="text-xs text-muted">
              {t("Benefits have conditions — let's check if you can still claim.")}{" "}
              {t(
                "This is an indicative pre-check only. The agency makes the final decision when you file.",
              )}
            </p>

            {eligReqs?.filingWindowDays != null && (
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-foreground">
                  {t(eligReqs.contingencyLabel)}
                </span>
                <input
                  type="date"
                  value={contingencyDate}
                  onChange={(ev) => setContingencyDate(ev.target.value)}
                  className="min-h-11 rounded-egov border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
                />
                {eligReqs.filingWindowLabel && (
                  <span className="text-xs text-muted">
                    {t("You must file within")} {t(eligReqs.filingWindowLabel)}{" "}
                    {t("of this date.")}
                  </span>
                )}
              </label>
            )}

            {eligReqs?.requiresContributions && (
              <label className="flex flex-col gap-0.5 text-sm text-foreground">
                <span className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={contributionsPosted}
                    onChange={(ev) => setContributionsPosted(ev.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0"
                  />
                  <span>{t("My contributions are posted and up to date")}</span>
                </span>
                <span className="pl-6 text-xs text-muted">
                  {t("Cash benefits usually require posted contributions.")}
                </span>
              </label>
            )}

            {(eligState.kind === "not-yet" ||
              eligState.kind === "lapsed" ||
              eligState.kind === "needs-info") && (
              <p
                className={cn(
                  "rounded-egov px-3 py-2 text-sm",
                  eligState.kind === "lapsed"
                    ? "bg-egov-warning-bg font-semibold text-red-700"
                    : "bg-egov-warning-bg text-egov-warning",
                )}
              >
                {t(eligState.reason)}
              </p>
            )}

            {(eligState.kind === "lapsed" || eligState.kind === "not-yet") && (
              <a
                href={resolveOfficialUrl(step)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-egov-blue underline underline-offset-2"
              >
                {t("Check the official requirements")}
              </a>
            )}
            <button
              type="button"
              onClick={handleCheckEligibility}
              className="min-h-11 rounded-egov bg-egov-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
            >
              {eligState.kind === "unchecked"
                ? t("Check eligibility")
                : t("Re-check eligibility")}
            </button>
          </div>
        ) : queueState.kind === "needs-fields" ? (
          <StepFieldsForm
            steps={[step]}
            initialAnswers={fieldAnswers}
            onSubmit={handleFieldsSubmit}
          />
        ) : queueState.kind === "pending" ? (
          <p className="flex min-h-11 animate-pulse items-center justify-center gap-1.5 rounded-egov bg-egov-blue-100 px-4 py-2.5 text-sm font-semibold text-egov-blue">
            <span aria-hidden>⏳</span> {submittedLabel}
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
          <>
            {eligReqs !== null && eligState.kind === "eligible" && (
              <p className="flex items-center gap-1.5 rounded-egov bg-egov-success-bg px-3 py-2 text-xs font-semibold text-egov-success">
                <span aria-hidden>✓</span>{" "}
                {t("Indicative: you may be eligible — the agency decides when you file.")}
              </p>
            )}
            <button
              type="button"
              disabled={queueState.kind === "checking"}
              onClick={handleAutoApply}
              className="min-h-11 rounded-egov bg-egov-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue disabled:cursor-not-allowed disabled:opacity-50"
            >
              {applyLabel}
            </button>
          </>
        )}
      </div>

      <div className="mt-4">
        <AskAboutStep step={step} />
      </div>
    </article>
  );
}
