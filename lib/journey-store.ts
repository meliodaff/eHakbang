"use client";

import { useEffect, useState } from "react";
import type { Journey } from "./types";

/**
 * Client-side journey persistence (PRD FR-08/09). Journeys live in
 * localStorage; a journey is created only when the user actually engages
 * (marks a step done), so a fresh install shows a clean slate.
 */

const KEY = "ehakbang:journeys";
const CHANGE_EVENT = "ehakbang:journeys-changed";

function read(): Journey[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Journey[]) : [];
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
 * Persist a journey with the given set of completed step numbers, creating the
 * record on first engagement. Completion status/date are derived from whether
 * every step is done.
 */
function persist(
  base: Journey,
  completedNumbers: number[],
  paidNumbers?: number[],
  fieldAnswers?: Record<number, Record<string, string>>,
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
  };
  if (merged.length >= record.total_steps && record.total_steps > 0) {
    record.status = "completed";
    record.completed_at = new Date().toISOString();
  }

  if (idx < 0) list.unshift(record);
  else list[idx] = record;
  write(list);
  return record;
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
  write(read().filter((j) => j.event_id !== eventId));
}

export function archiveJourney(id: string): void {
  const list = read();
  const idx = list.findIndex((j) => j.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], status: "archived" };
    write(list);
  }
}

export function clearAllJourneys(): void {
  write([]);
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
    return () => {
      window.removeEventListener(CHANGE_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return { journeys, ready };
}
