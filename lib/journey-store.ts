"use client";

import { useEffect, useState } from "react";
import type { Journey } from "./types";
import {
  deleteAllJourneysFromSupabase,
  deleteJourneysFromSupabase,
  fetchJourneysFromSupabase,
  syncJourneyToSupabase,
} from "./journey-sync";
import { notifyStepUpdate } from "./api-client";

/**
 * Client-side journey persistence (PRD FR-08/09). localStorage is the
 * source of truth for instant reads/writes; every mutation also fires a
 * best-effort sync to the `journeys` Supabase table (see `journey-sync.ts`)
 * keyed to the signed-in user, so "My Journeys" and Track survive a
 * reinstall/new device. A journey is persisted (locally and to Supabase) as
 * soon as the citizen starts it -- see `startJourney` -- not only once they
 * complete a step.
 */

const KEY = "ehakbang:journeys";
const CHANGE_EVENT = "ehakbang:journeys-changed";

/**
 * Backfills fields added to the Journey shape after some records were
 * already saved, so older localStorage entries don't crash newer code that
 * assumes they're always present (e.g. `journey.auto_applied_step_numbers`).
 */
function migrate(journey: Journey): Journey {
  return {
    ...journey,
    auto_applied_step_numbers: journey.auto_applied_step_numbers ?? [],
    claimed_step_numbers: journey.claimed_step_numbers ?? [],
    submitted_step_numbers: journey.submitted_step_numbers ?? [],
  };
}

function read(): Journey[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Journey[]).map(migrate) : [];
  } catch {
    return [];
  }
}

function write(list: Journey[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    /* storage unavailable — session-only fallback is acceptable */
  }
}

export function getAllJourneys(): Journey[] {
  return read();
}

export function getActiveJourney(): Journey | undefined {
  return read().find((j) => j.status === "active");
}

export function getStoredJourney(id: string): Journey | undefined {
  return read().find((j) => j.id === id);
}

/**
 * Fires a best-effort SMS for every step that newly entered "submitted" or
 * "completed" state in this persist() call -- so citizens are notified per
 * requirement processed, not just once when the whole journey finishes.
 * Diffs against `source` (the record as it was before this write) so a step
 * already submitted/completed on an earlier persist() doesn't re-notify.
 */
function notifyStepChanges(source: Journey, record: Journey): void {
  const eventId = record.event_id;
  if (!eventId) return;

  const wasSubmitted = new Set(source.submitted_step_numbers ?? []);
  const wasCompleted = new Set(source.completed_step_numbers ?? []);
  const newlySubmitted = (record.submitted_step_numbers ?? []).filter(
    (n) => !wasSubmitted.has(n),
  );
  const newlyCompleted = record.completed_step_numbers.filter((n) => !wasCompleted.has(n));

  const notify = (stepNumber: number, status: "submitted" | "completed") => {
    const step = record.steps.find((s) => s.step_number === stepNumber);
    if (!step) return;
    void notifyStepUpdate({
      eventId,
      stepTitle: step.step_title,
      agencyName: step.agency_name,
      status,
    });
  };

  for (const stepNumber of newlySubmitted) notify(stepNumber, "submitted");
  for (const stepNumber of newlyCompleted) notify(stepNumber, "completed");
}

/**
 * Persist a journey with the given set of completed step numbers, creating the
 * record on first engagement. Completion status/date are derived from whether
 * every step is done.
 */
function persist(
  base: Journey,
  completedNumbers: number[],
  paidNumbers?: number[],
  fieldAnswers?: Record<number, Record<string, string>>,
  autoAppliedNumbers?: number[],
  claimedNumbers?: number[],
  submittedNumbers?: number[],
): Journey {
  const list = read();
  const idx = list.findIndex((j) => j.id === base.id);
  const source = idx >= 0 ? list[idx] : base;
  const merged = Array.from(new Set(completedNumbers));

  const record: Journey = {
    ...source,
    status: "active",
    created_at: source.created_at || new Date().toISOString(),
    completed_at: null,
    completed_step_numbers: merged,
    paid_step_numbers: Array.from(new Set(paidNumbers ?? existingPayments(base))),
    field_answers: fieldAnswers ?? existingFieldAnswers(base),
    auto_applied_step_numbers: Array.from(
      new Set(autoAppliedNumbers ?? existingAutoApplied(base)),
    ),
    claimed_step_numbers: Array.from(new Set(claimedNumbers ?? existingClaims(base))),
    submitted_step_numbers: Array.from(
      new Set(submittedNumbers ?? existingSubmitted(base)),
    ),
  };
  if (merged.length >= record.total_steps && record.total_steps > 0) {
    record.status = "completed";
    record.completed_at = new Date().toISOString();
  }

  notifyStepChanges(source, record);

  if (idx < 0) list.unshift(record);
  else list[idx] = record;
  write(list);
  void syncJourneyToSupabase(record);
  return record;
}

/**
 * Persist a freshly generated journey the moment the citizen starts it --
 * tapping a preset "Piliin ang life event" card or submitting the flexible
 * AI textbox -- rather than waiting for their first step interaction. Safe
 * to call speculatively: no-ops (returns the existing record unchanged) if
 * this journey id is already stored, so it never clobbers progress.
 */
export function startJourney(journey: Journey): Journey {
  const existing = getStoredJourney(journey.id);
  if (existing) return existing;
  return persist(
    journey,
    journey.completed_step_numbers,
    journey.paid_step_numbers,
    journey.field_answers,
    journey.auto_applied_step_numbers,
    journey.claimed_step_numbers,
    journey.submitted_step_numbers,
  );
}

let hydrated = false;

/**
 * One-time-per-session reconciliation with Supabase: fills in any journeys
 * that exist server-side (another device, a reinstall) but aren't in this
 * browser's localStorage yet. Never overwrites a locally present journey --
 * local state (already synced up via `persist`) always wins on conflict.
 */
export async function hydrateFromSupabase(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  const remote = await fetchJourneysFromSupabase();
  if (remote.length === 0) return;
  const local = read();
  const localIds = new Set(local.map((j) => j.id));
  const missing = remote.filter((j) => !localIds.has(j.id));
  if (missing.length > 0) write([...local, ...missing]);
}

/** Completions already persisted for this journey (or the base's own set). */
function existingCompletions(base: Journey): number[] {
  return getStoredJourney(base.id)?.completed_step_numbers ?? base.completed_step_numbers;
}

/** Paid fee step numbers already persisted for this journey (or the base's own set). */
function existingPayments(base: Journey): number[] {
  return getStoredJourney(base.id)?.paid_step_numbers ?? base.paid_step_numbers ?? [];
}

/** Required-field answers already persisted for this journey (or the base's own set). */
function existingFieldAnswers(base: Journey): Record<number, Record<string, string>> {
  return getStoredJourney(base.id)?.field_answers ?? base.field_answers ?? {};
}

/** Auto-applied step numbers already persisted for this journey (or the base's own set). */
function existingAutoApplied(base: Journey): number[] {
  return getStoredJourney(base.id)?.auto_applied_step_numbers ?? base.auto_applied_step_numbers ?? [];
}

/** Claimed step numbers already persisted for this journey (or the base's own set). */
function existingClaims(base: Journey): number[] {
  return getStoredJourney(base.id)?.claimed_step_numbers ?? base.claimed_step_numbers ?? [];
}

/** Submitted-but-awaiting step numbers already persisted for this journey (or the base's own set). */
function existingSubmitted(base: Journey): number[] {
  return getStoredJourney(base.id)?.submitted_step_numbers ?? base.submitted_step_numbers ?? [];
}

/**
 * Mark a step complete, persisting the journey on first engagement.
 * `base` is the journey being viewed (from the catalog or the store).
 *
 * `alsoComplete` lets callers fold in steps that are satisfied by other means
 * (e.g. IDs already held in the user's ID wallet) so progress and completion
 * stay accurate.
 */
export function completeStep(
  base: Journey,
  stepNumber: number,
  alsoComplete: number[] = [],
): Journey {
  return persist(base, [...existingCompletions(base), ...alsoComplete, stepNumber]);
}

/**
 * Mark several steps complete at once (persisting on first engagement).
 * Used to fold ID-wallet–satisfied steps into a journey without a manual tap.
 */
export function markStepsDone(base: Journey, stepNumbers: number[]): Journey {
  return persist(base, [...existingCompletions(base), ...stepNumbers]);
}

/**
 * Mark a step complete via the mocked Auto Apply queue, persisting the
 * journey on first engagement. Like completeStep, but also records the step
 * in auto_applied_step_numbers -- steps completed this way produce a
 * physical document the citizen still needs to claim at the agency office
 * (see the "To Do" section on the dashboard).
 */
export function markStepAutoApplied(
  base: Journey,
  stepNumber: number,
  alsoComplete: number[] = [],
): Journey {
  return persist(
    base,
    [...existingCompletions(base), ...alsoComplete, stepNumber],
    undefined,
    undefined,
    [...existingAutoApplied(base), stepNumber],
  );
}

/**
 * Mark steps' applications as submitted to their agencies and awaiting the
 * agency's response, persisting the journey on first engagement. These steps
 * are NOT completed -- they stay in a "waiting for the agencies to respond"
 * state (surfaced on the tracking dashboard) until an agency reacts.
 */
export function markStepsSubmitted(base: Journey, stepNumbers: number[]): Journey {
  return persist(
    base,
    existingCompletions(base),
    undefined,
    undefined,
    undefined,
    undefined,
    [...existingSubmitted(base), ...stepNumbers],
  );
}

/**
 * Mark auto-applied steps' resulting documents as claimed at the agency
 * office, persisting the journey on first engagement.
 */
export function markStepsClaimed(base: Journey, stepNumbers: number[]): Journey {
  return persist(
    base,
    existingCompletions(base),
    undefined,
    undefined,
    undefined,
    [...existingClaims(base), ...stepNumbers],
  );
}

/**
 * Mark steps' government fees as paid (via eGovPay), persisting the journey
 * on first engagement. Distinct from completion -- pairs with
 * completeStep/markStepsDone, which still drive the checklist/auto-apply loop.
 */
export function markStepsPaid(base: Journey, stepNumbers: number[]): Journey {
  return persist(base, existingCompletions(base), [
    ...existingPayments(base),
    ...stepNumbers,
  ]);
}

/**
 * Merge citizen-supplied answers to steps' `required_fields` into the
 * journey, persisting on first engagement. `answers` is merged per step
 * number (existing answers for other fields on that step are kept, not
 * overwritten wholesale).
 */
export function setFieldAnswers(
  base: Journey,
  answers: Record<number, Record<string, string>>,
): Journey {
  const merged: Record<number, Record<string, string>> = { ...existingFieldAnswers(base) };
  for (const [stepNumber, stepAnswers] of Object.entries(answers)) {
    merged[Number(stepNumber)] = { ...merged[Number(stepNumber)], ...stepAnswers };
  }
  return persist(base, existingCompletions(base), existingPayments(base), merged);
}

/** Remove any stored journey for a given life-event id (e.g. "got-married"). */
export function resetJourney(eventId: string): void {
  const removedIds = read()
    .filter((j) => j.event_id === eventId)
    .map((j) => j.id);
  write(read().filter((j) => j.event_id !== eventId));
  void deleteJourneysFromSupabase(removedIds);
}

export function archiveJourney(id: string): void {
  const list = read();
  const idx = list.findIndex((j) => j.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], status: "archived" };
    write(list);
    void syncJourneyToSupabase(list[idx]);
  }
}

export function clearAllJourneys(): void {
  write([]);
  void deleteAllJourneysFromSupabase();
}

/** Reactive list of stored journeys (re-renders on any change, incl. other tabs). */
export function useJourneys(): { journeys: Journey[]; ready: boolean } {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const update = () => {
      setJourneys(read());
      setReady(true);
    };
    update();
    window.addEventListener(CHANGE_EVENT, update);
    window.addEventListener("storage", update);
    // Reconciles with Supabase once per session -- write() (called inside
    // hydrateFromSupabase) dispatches CHANGE_EVENT itself, so `update` above
    // re-reads automatically once it resolves.
    void hydrateFromSupabase();
    return () => {
      window.removeEventListener(CHANGE_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return { journeys, ready };
}
