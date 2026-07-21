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
 * Mark a step complete, persisting the journey on first engagement.
 * `base` is the journey being viewed (from the catalog or the store).
 */
export function completeStep(base: Journey, stepNumber: number): Journey {
  const list = read();
  let idx = list.findIndex((j) => j.id === base.id);

  if (idx < 0) {
    // First engagement — persist as an active journey.
    list.unshift({
      ...base,
      status: "active",
      created_at: base.created_at || new Date().toISOString(),
      completed_at: null,
      completed_step_numbers: [...base.completed_step_numbers],
    });
    idx = 0;
  }

  const current = { ...list[idx] };
  if (!current.completed_step_numbers.includes(stepNumber)) {
    current.completed_step_numbers = [
      ...current.completed_step_numbers,
      stepNumber,
    ];
  }
  if (current.completed_step_numbers.length >= current.total_steps) {
    current.status = "completed";
    current.completed_at = new Date().toISOString();
  }
  list[idx] = current;
  write(list);
  return current;
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
