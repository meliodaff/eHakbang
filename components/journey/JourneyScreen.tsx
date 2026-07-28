"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Journey } from "@/lib/types";
import type { IdType } from "@/lib/types";
import { EVENT_JOURNEYS } from "@/lib/event-journeys";
import {
  getActiveJourney,
  getStoredJourney,
  hydrateFromSupabase,
  startJourney,
  completeStep,
  markStepsDone,
  markStepAutoApplied,
  markStepsClaimed,
  markStepsSubmitted,
  setFieldAnswers,
} from "@/lib/journey-store";
import { useIdWallet, stepFulfilledByWallet, setId } from "@/lib/id-wallet";
import { getPrerequisiteState, type PrerequisiteState } from "@/lib/journey-prerequisites";
import { isStepNotApplicable } from "@/lib/journey-record-update-gate";
import { eventSupportsApplyAll } from "@/lib/journey-features";
import { useT } from "@/lib/i18n";
import { JourneyView } from "./JourneyView";
import { ApplyAllPrompt } from "./ApplyAllPrompt";
import { ApplyAllModal } from "./ApplyAllModal";

/**
 * Screen 2 controller. Loads the journey for the selected event (resuming
 * saved progress if any), auto-satisfies steps whose ID the user already holds
 * (ID wallet), persists completions to localStorage, and routes to the
 * completion screen once every step is done.
 */
export function JourneyScreen({
  eventId,
  initialJourney,
}: {
  eventId?: string;
  /** Server-prefetched, freshly AI-generated (or seed-fallback) journey for a predefined event (see app/journey/page.tsx). */
  initialJourney?: Journey;
}) {
  const router = useRouter();
  const t = useT();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [ready, setReady] = useState(false);
  // Tracks the graduate's "Apply All / No" decision for this session.
  const [applyAllChoice, setApplyAllChoice] = useState<
    "applied" | "declined" | null
  >(null);
  // Shows the submission-progress modal while "Apply All" runs.
  const [showApplyModal, setShowApplyModal] = useState(false);
  const { heldIds, ready: walletReady } = useIdWallet();

  useEffect(() => {
    let cancelled = false;
    async function init() {
      // Reconcile with Supabase first (fills in journeys from another
      // device/reinstall) so getStoredJourney/getActiveJourney below see
      // the full picture before deciding whether this is a brand-new start.
      await hydrateFromSupabase();
      if (cancelled) return;
      let base: Journey | undefined;
      if (initialJourney) {
        // Persists to localStorage + Supabase the moment the journey is
        // started (preset card or flexible AI text), not only once a step
        // is completed.
        base = getStoredJourney(initialJourney.id) ?? startJourney(initialJourney);
      } else if (eventId && EVENT_JOURNEYS[eventId]) {
        const catalog = EVENT_JOURNEYS[eventId];
        base = getStoredJourney(catalog.id) ?? startJourney({ ...catalog });
      } else {
        base = getActiveJourney();
      }
      setJourney(base ?? null);
      setReady(true);
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, [eventId, initialJourney]);

  // Steps auto-satisfied because the matching ID is already in the wallet.
  const walletStepNumbers = useMemo(() => {
    if (!journey) return [];
    return journey.steps
      .filter((s) => stepFulfilledByWallet(s, heldIds))
      .map((s) => s.step_number);
  }, [journey, heldIds]);

  // Record-update steps that don't apply because the citizen doesn't hold
  // the ID they'd update (e.g. "Update civil status with SSS" when the
  // citizen has no SSS number on file) -- there's nothing to update, so
  // these count as resolved without requiring any action.
  const notApplicableStepNumbers = useMemo(() => {
    if (!journey) return [];
    return journey.steps
      .filter((s) => isStepNotApplicable(s, heldIds))
      .map((s) => s.step_number);
  }, [journey, heldIds]);

  // Per-step prerequisite status vs. the ID wallet. A benefit claim whose
  // required agency membership the citizen doesn't hold is "blocked-*", so
  // StepCard shows a locked "action needed" card with an enroll-first path
  // instead of the claim action. Recomputes as the wallet changes, so
  // enrolling (or declaring an existing ID) unlocks the claim with no reload.
  const prerequisiteStates = useMemo<Record<number, PrerequisiteState>>(() => {
    if (!journey) return {};
    const map: Record<number, PrerequisiteState> = {};
    for (const step of journey.steps) {
      map[step.step_number] = getPrerequisiteState(step, heldIds);
    }
    return map;
  }, [journey, heldIds]);

  const blockedCount = useMemo(
    () =>
      Object.values(prerequisiteStates).filter(
        (s) => s === "blocked-membership" || s === "blocked-contribution",
      ).length,
    [prerequisiteStates],
  );

  // Steps resolved without the citizen manually completing them: wallet-
  // satisfied (already has the ID) or not-applicable (doesn't have the ID an
  // update step would need). Folded into completion the same way in both
  // places, so progress/allDone/persisted state stay consistent.
  const autoResolvedStepNumbers = useMemo(
    () => [...walletStepNumbers, ...notApplicableStepNumbers],
    [walletStepNumbers, notApplicableStepNumbers],
  );

  // Manual completions ∪ auto-resolved steps.
  const effectiveCompleted = useMemo(() => {
    if (!journey) return [];
    return Array.from(
      new Set([...journey.completed_step_numbers, ...autoResolvedStepNumbers]),
    );
  }, [journey, autoResolvedStepNumbers]);

  const allDone =
    !!journey &&
    journey.total_steps > 0 &&
    effectiveCompleted.length >= journey.total_steps;

  // Once every step is done, routing to the completion screen is delayed
  // slightly so the "✓ Completed"/badge transition is visible first.
  function routeToCompletionIfDone(updated: Journey) {
    if (updated.status === "completed") {
      setTimeout(
        () => router.push(`/journey/complete?id=${encodeURIComponent(updated.id)}`),
        400,
      );
    }
  }

  function handleComplete(stepNumber: number) {
    setJourney((current) => {
      if (!current) return current;
      // Fold auto-resolved steps in so progress/completion stay accurate.
      const updated = completeStep(current, stepNumber, autoResolvedStepNumbers);
      routeToCompletionIfDone(updated);
      return updated;
    });
  }

  // Step completed via the mocked Auto Apply queue (see StepCard) -- unlike
  // handleComplete, also records the step as auto-applied so the "claim your
  // document" prompt (here and in the dashboard's To Do section) shows up.
  function handleAutoApplied(stepNumber: number) {
    setJourney((current) => {
      if (!current) return current;
      const updated = markStepAutoApplied(current, stepNumber, autoResolvedStepNumbers);
      routeToCompletionIfDone(updated);
      return updated;
    });
  }

  function handleClaim(stepNumber: number) {
    setJourney((current) => (current ? markStepsClaimed(current, [stepNumber]) : current));
  }

  // A step's application was submitted to its agency -- persist the
  // submitted-but-awaiting state so the tracking dashboard reflects it.
  function handleSubmit(stepNumber: number) {
    setJourney((current) =>
      current ? markStepsSubmitted(current, [stepNumber]) : current,
    );
  }

  function handleSubmitFields(answers: Record<number, Record<string, string>>) {
    setJourney((current) => (current ? setFieldAnswers(current, answers) : current));
  }

  // The citizen enrolled for (or declared they already hold) a required ID.
  // Writing it to the wallet triggers useIdWallet's reactive update, which
  // recomputes prerequisiteStates and unblocks the dependent claim -- no reload.
  function handleEnrolled(idType: IdType) {
    setId(idType, true);
  }

  function handleFinish() {
    if (!journey) return;
    const updated = markStepsDone(journey, autoResolvedStepNumbers);
    setJourney(updated);
    router.push(`/journey/complete?id=${encodeURIComponent(updated.id)}`);
  }

  // "Apply All": open the submission-progress modal. Actual completion is
  // persisted when the modal finishes (see handleApplyAllFinished).
  function handleApplyAll() {
    setApplyAllChoice("applied");
    setShowApplyModal(true);
  }

  // Called once the modal has "submitted" every step: mark all processes done,
  // then route to the completion summary.
  function handleApplyAllFinished() {
    if (!journey) return;
    const allSteps = journey.steps.map((s) => s.step_number);
    const updated = markStepsDone(journey, [...allSteps, ...autoResolvedStepNumbers]);
    setJourney(updated);
    setShowApplyModal(false);
    router.push(`/journey/complete?id=${encodeURIComponent(updated.id)}`);
  }

  // "No": dismiss the shortcut and use the normal one-by-one checklist.
  function handleDeclineApplyAll() {
    setApplyAllChoice("declined");
  }

  const supportsApplyAll = !!journey && eventSupportsApplyAll(journey.event_id);
  const showApplyAll = supportsApplyAll && applyAllChoice === null && !allDone;

  if (!ready || !walletReady) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 text-muted">
        {t("Loading…")}
      </main>
    );
  }

  if (!journey) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-xl font-bold text-egov-navy">{t("No active journey")}</h1>
        <p className="text-muted">{t("Choose a life event to start.")}</p>
        <Link
          href="/ehakbang"
          className="min-h-11 rounded-egov bg-egov-blue px-5 py-2.5 font-semibold text-white"
        >
          {t("Start a New Journey")}
        </Link>
      </main>
    );
  }

  return (
    <>
      {walletStepNumbers.length > 0 && (
        <div className="flex items-start gap-2 border-b border-border bg-egov-success-bg px-5 py-3 text-sm text-egov-success">
          <span aria-hidden>🪪</span>
          <p>
            {walletStepNumbers.length} step
            {walletStepNumbers.length === 1 ? "" : "s"}{" "}
            {t("auto-completed from your")}{" "}
            <Link
              href="/wallet"
              className="font-semibold underline underline-offset-2"
            >
              {t("ID Wallet")}
            </Link>
            .
          </p>
        </div>
      )}

      {blockedCount > 0 && (
        <div className="flex items-start gap-2 border-b border-border bg-egov-warning-bg px-5 py-3 text-sm text-egov-warning">
          <span aria-hidden>🔒</span>
          <p>
            {blockedCount}{" "}
            {t(
              blockedCount === 1 ? "benefit needs registration first" : "benefits need registration first",
            )}
            {". "}
            {t("Tap “Register” on a locked benefit to unlock it.")}
          </p>
        </div>
      )}

      <JourneyView
        journey={journey}
        completed={effectiveCompleted}
        walletStepNumbers={walletStepNumbers}
        notApplicableStepNumbers={notApplicableStepNumbers}
        prerequisiteStates={prerequisiteStates}
        afterHeader={
          showApplyAll ? (
            <ApplyAllPrompt
              totalSteps={journey.total_steps}
              onApplyAll={handleApplyAll}
              onDecline={handleDeclineApplyAll}
            />
          ) : null
        }
        onComplete={handleComplete}
        onAutoApplied={handleAutoApplied}
        onClaim={handleClaim}
        onSubmit={handleSubmit}
        onSubmitFields={handleSubmitFields}
        onEnrolled={handleEnrolled}
      />

      {allDone && (
        <div className="sticky bottom-0 z-20 border-t border-border bg-surface/95 px-5 py-4 backdrop-blur">
          <p className="mb-2 text-center text-sm font-semibold text-egov-success">
            {t("All steps complete! 🎉")}
          </p>
          <button
            type="button"
            onClick={handleFinish}
            className="min-h-12 w-full rounded-egov bg-egov-blue px-5 py-3 font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
          >
            {t("Finish journey")}
          </button>
        </div>
      )}

      {showApplyModal && (
        <ApplyAllModal
          steps={journey.steps}
          onFinished={handleApplyAllFinished}
        />
      )}
    </>
  );
}
