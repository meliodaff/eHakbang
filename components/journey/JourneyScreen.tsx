"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Journey } from "@/lib/types";
import { EVENT_JOURNEYS } from "@/lib/event-journeys";
import {
  getActiveJourney,
  getStoredJourney,
  completeStep,
  markStepsDone,
} from "@/lib/journey-store";
import { useIdWallet, stepFulfilledByWallet } from "@/lib/id-wallet";
import { eventSupportsApplyAll } from "@/lib/journey-features";
import { useT } from "@/lib/i18n";
import { recordJourneyRefresh } from "@/lib/journey-notice-store";
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
  regenerated = false,
}: {
  eventId?: string;
  /** Server-prefetched AI/cache/seed journey for a predefined event (see app/journey/page.tsx). */
  initialJourney?: Journey;
  /** True when `initialJourney` was just freshly AI-generated (vs. served from cache/seed). */
  regenerated?: boolean;
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
  const refreshNoticeRecorded = useRef(false);

  useEffect(() => {
    let base: Journey | undefined;
    if (initialJourney) {
      base = getStoredJourney(initialJourney.id) ?? initialJourney;
    } else if (eventId && EVENT_JOURNEYS[eventId]) {
      const catalog = EVENT_JOURNEYS[eventId];
      base = getStoredJourney(catalog.id) ?? { ...catalog };
    } else {
      base = getActiveJourney();
    }
    setJourney(base ?? null);
    setReady(true);
  }, [eventId, initialJourney]);

  useEffect(() => {
    if (regenerated && initialJourney && !refreshNoticeRecorded.current) {
      refreshNoticeRecorded.current = true;
      recordJourneyRefresh(initialJourney.event_id ?? "", initialJourney.life_event);
    }
  }, [regenerated, initialJourney]);

  // Steps auto-satisfied because the matching ID is already in the wallet.
  const walletStepNumbers = useMemo(() => {
    if (!journey) return [];
    return journey.steps
      .filter((s) => stepFulfilledByWallet(s, heldIds))
      .map((s) => s.step_number);
  }, [journey, heldIds]);

  // Manual completions ∪ wallet-satisfied steps.
  const effectiveCompleted = useMemo(() => {
    if (!journey) return [];
    return Array.from(
      new Set([...journey.completed_step_numbers, ...walletStepNumbers]),
    );
  }, [journey, walletStepNumbers]);

  const allDone =
    !!journey &&
    journey.total_steps > 0 &&
    effectiveCompleted.length >= journey.total_steps;

  function handleComplete(stepNumber: number) {
    setJourney((current) => {
      if (!current) return current;
      // Fold wallet-satisfied steps in so progress/completion stay accurate.
      const updated = completeStep(current, stepNumber, walletStepNumbers);
      if (updated.status === "completed") {
        setTimeout(
          () =>
            router.push(
              `/journey/complete?id=${encodeURIComponent(updated.id)}`,
            ),
          400,
        );
      }
      return updated;
    });
  }

  function handleFinish() {
    if (!journey) return;
    const updated = markStepsDone(journey, walletStepNumbers);
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
    const updated = markStepsDone(journey, [...allSteps, ...walletStepNumbers]);
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

      <JourneyView
        journey={journey}
        completed={effectiveCompleted}
        walletStepNumbers={walletStepNumbers}
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
