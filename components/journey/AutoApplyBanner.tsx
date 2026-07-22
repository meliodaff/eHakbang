"use client";

import { useEffect, useState } from "react";
import type { Journey, JourneyStep } from "@/lib/types";
import {
  applyMarriageTransaction,
  createFeePayment,
  notifyAutoApplySuccess,
} from "@/lib/api-client";
import { isCivilStatusEvent, getCivilStatusTransition } from "@/lib/civil-status-events";
import { getFeeBill, hasPayableFees, formatCurrency } from "@/lib/journey-fees";
import { getMissingRequiredFields } from "@/lib/journey-fields";
import { setFieldAnswers } from "@/lib/journey-store";
import { StepFieldsForm } from "./StepFieldsForm";
import { cn } from "@/lib/cn";

type Stage = "asking" | "declined" | "fields" | "billing" | "applying" | "done";

const PENDING_PAYMENT_KEY = "ehakbang:pending-payment";
const RESUME_AUTO_APPLY_KEY = "ehakbang:resume-auto-apply";
const RESUME_PAY_KEY = "ehakbang:resume-pay";
const PAYMENT_VERIFIED_TOKEN_KEY = "ehakbang:payment-verified-token";

/**
 * Offers to auto-submit the citizen's civil-status update to the remaining
 * agencies on their behalf, using the certificate/decree they already
 * uploaded — shown only on civil-status journeys (marriage, annulment).
 *
 * When any pending step carries a payable government fee, an intermediate
 * "billing" stage lets the citizen pay the bundled total via eGovPay before
 * the (simulated) submission loop runs. Paying is optional — declining or
 * skipping proceeds straight to submission either way.
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
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  // Steps whose required_fields still need answers -- snapshotted when the
  // "fields" stage is entered, same reasoning as `applyingSteps`.
  const [fieldsSteps, setFieldsSteps] = useState<JourneyStep[]>([]);
  const [fieldAnswers, setLocalFieldAnswers] = useState<
    Record<number, Record<string, string>>
  >(journey.field_answers ?? {});
  const transition = getCivilStatusTransition(journey.event_id);

  const targetSteps = isCivilStatusEvent(journey.event_id) ? journey.steps : [];
  const pendingSteps = targetSteps.filter(
    (s) => !completed.includes(s.step_number),
  );
  const feeBill = getFeeBill(pendingSteps, journey.paid_step_numbers ?? []);
  const billable = hasPayableFees(feeBill);

  async function startApplying(
    stepsToApply: JourneyStep[],
    answers: Record<number, Record<string, string>> = fieldAnswers,
  ) {
    setApplyingSteps(stepsToApply);
    setStage("applying");
    for (const step of stepsToApply) {
      setCurrentStepNumber(step.step_number);
      await applyMarriageTransaction(step, answers[step.step_number]);
      onComplete(step.step_number);
    }
    setCurrentStepNumber(null);
    setStage("done");
    void notifyAutoApplySuccess(journey.event_id ?? "");
  }

  /** Proceeds exactly as a confirm with no missing fields always has: pay if billable, else apply. */
  function proceedAfterConfirm(answers: Record<number, Record<string, string>>) {
    if (billable) {
      setStage("billing");
    } else {
      void startApplying(pendingSteps, answers);
    }
  }

  async function handlePay() {
    if (!journey.event_id) return;

    // Every payment requires a fresh, verified face-liveness check. If we
    // don't have one yet, redirect through the verification flow and come
    // back here (see the RESUME_PAY_KEY effect below) once it succeeds.
    const livenessToken = window.sessionStorage.getItem(PAYMENT_VERIFIED_TOKEN_KEY);
    if (!livenessToken) {
      window.sessionStorage.setItem(RESUME_PAY_KEY, journey.event_id);
      window.location.href = `/journey/pay/verify?event=${encodeURIComponent(journey.event_id)}`;
      return;
    }
    window.sessionStorage.removeItem(PAYMENT_VERIFIED_TOKEN_KEY);

    setPaying(true);
    setPayError(null);
    try {
      const result = await createFeePayment({
        eventId: journey.event_id,
        language: journey.language,
        stepNumbers: feeBill.payable.map((item) => item.stepNumber),
        livenessToken,
      });
      window.sessionStorage.setItem(
        PENDING_PAYMENT_KEY,
        JSON.stringify({
          uuid: result.uuid,
          journeyId: journey.id,
          eventId: journey.event_id,
          stepNumbers: result.stepNumbers,
        }),
      );
      window.location.href = result.url;
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Failed to start payment");
      setPaying(false);
    }
  }

  // Resume automatically after a successful eGovPay redirect — the callback
  // page already marked the paid steps and set this flag.
  useEffect(() => {
    if (typeof window === "undefined" || pendingSteps.length === 0) return;
    const resumeId = window.sessionStorage.getItem(RESUME_AUTO_APPLY_KEY);
    if (resumeId === journey.id) {
      window.sessionStorage.removeItem(RESUME_AUTO_APPLY_KEY);
      void startApplying(pendingSteps);
    }
    // Only ever meant to fire once per mount for this journey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journey.id]);

  // Resume automatically after a successful face-verification redirect — the
  // pay-verify callback page already stored the verified token and this flag.
  useEffect(() => {
    if (typeof window === "undefined" || !journey.event_id) return;
    const resumeEventId = window.sessionStorage.getItem(RESUME_PAY_KEY);
    if (resumeEventId === journey.event_id) {
      window.sessionStorage.removeItem(RESUME_PAY_KEY);
      setStage("billing");
      void handlePay();
    }
    // Only ever meant to fire once per mount for this journey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journey.event_id]);

  if (stage === "declined" || (stage === "asking" && pendingSteps.length === 0)) {
    return null;
  }

  function handleConfirm() {
    const missing = getMissingRequiredFields(pendingSteps, fieldAnswers);
    if (missing.length > 0) {
      const stepNumbers = new Set(missing.map((m) => m.stepNumber));
      setFieldsSteps(pendingSteps.filter((s) => stepNumbers.has(s.step_number)));
      setStage("fields");
      return;
    }
    proceedAfterConfirm(fieldAnswers);
  }

  function handleFieldsSubmit(answers: Record<number, Record<string, string>>) {
    const persisted = setFieldAnswers(journey, answers);
    setLocalFieldAnswers(persisted.field_answers);
    proceedAfterConfirm(persisted.field_answers);
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

      {stage === "fields" && (
        <StepFieldsForm
          steps={fieldsSteps}
          initialAnswers={fieldAnswers}
          onSubmit={handleFieldsSubmit}
        />
      )}

      {stage === "billing" && (
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-bold text-foreground">💳 Pay government fees</p>
            <p className="mt-1 text-sm text-foreground">
              {feeBill.payable.length}{" "}
              {feeBill.payable.length === 1 ? "step" : "steps"} in this update
              {feeBill.payable.length === 1 ? " has" : " have"} a government fee.
              You can pay them together now via eGovPay, or skip and pay each
              agency directly.
            </p>
          </div>

          <ul className="flex flex-col gap-1.5">
            {feeBill.payable.map((item) => (
              <li
                key={item.stepNumber}
                className="flex items-center justify-between gap-2 rounded-egov bg-surface px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate text-foreground">
                  {item.agencyName} — {item.stepTitle}
                </span>
                <span className="shrink-0 font-semibold text-foreground">
                  {formatCurrency(item.amount, item.currency)}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between rounded-egov bg-surface px-3 py-2 text-sm font-bold text-foreground">
            <span>Total</span>
            <span>{formatCurrency(feeBill.totalAmount, feeBill.currency)}</span>
          </div>

          {feeBill.manualPayNotes.length > 0 && (
            <div className="rounded-egov bg-egov-warning-bg px-3 py-2 text-xs text-egov-warning">
              <p className="font-semibold">Pay these directly at the agency:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {feeBill.manualPayNotes.map((step) => (
                  <li key={step.step_number}>
                    {step.agency_name} — {step.fee?.how_to_pay}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {payError && (
            <p className="text-xs font-semibold text-red-600">{payError}</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void startApplying(pendingSteps)}
              disabled={paying}
              className="min-h-11 flex-1 rounded-egov border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue disabled:opacity-50"
            >
              Skip, pay later
            </button>
            <button
              type="button"
              onClick={handlePay}
              disabled={paying}
              className="min-h-11 flex-1 rounded-egov bg-egov-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue disabled:opacity-50"
            >
              {paying
                ? "Starting payment…"
                : `Pay ${formatCurrency(feeBill.totalAmount, feeBill.currency)} via eGovPay`}
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
                        <span className="line-through">{transition.from}</span>{" "}
                        <span className="font-semibold text-egov-success">
                          → {transition.to}
                        </span>
                      </span>
                    ) : (
                      transition.from
                    )}
                  </p>
                  {step.agency_code === "PHILSYS" && (
                    <p className="mt-1 text-xs italic text-muted">
                      Example: {transition.surnameExample}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>

          {stage === "done" && (
            <>
              <p className="text-sm font-semibold text-egov-success">
                🎉 Your civil status is now {transition.to} on all{" "}
                {applyingSteps.length}{" "}
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
