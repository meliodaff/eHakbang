"use client";

import { useEffect, useState } from "react";

/**
 * Local "requirements were just refreshed" notice, shown as a dismissible
 * banner on the dashboard. Self-expiring (30 min) instead of using a timer,
 * matching the same lazy check-on-read idiom as the 24h staleness check in
 * lib/server/journey-requirements.ts.
 */

export interface JourneyNotice {
  eventId: string;
  eventLabel: string;
  refreshedAt: string;
}

const KEY = "ehakbang:journey-notice";
const CHANGE_EVENT = "ehakbang:journey-notice-changed";
const EXPIRES_AFTER_MS = 30 * 60 * 1000;

function read(): JourneyNotice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as JourneyNotice;
    if (!parsed.refreshedAt) return null;
    const age = Date.now() - new Date(parsed.refreshedAt).getTime();
    if (age > EXPIRES_AFTER_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function write(notice: JourneyNotice | null): void {
  if (typeof window === "undefined") return;
  try {
    if (notice) {
      window.localStorage.setItem(KEY, JSON.stringify(notice));
    } else {
      window.localStorage.removeItem(KEY);
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    /* storage unavailable — session-only fallback is acceptable */
  }
}

/** Records that a life event's requirements were just AI-refreshed. */
export function recordJourneyRefresh(eventId: string, eventLabel: string): void {
  write({ eventId, eventLabel, refreshedAt: new Date().toISOString() });
}

/** Dismisses the current notice, if any. */
export function dismissJourneyNotice(): void {
  write(null);
}

/** Reactive view of the current refresh notice. */
export function useJourneyNotice(): {
  notice: JourneyNotice | null;
  ready: boolean;
  dismiss: () => void;
} {
  const [notice, setNotice] = useState<JourneyNotice | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const update = () => {
      setNotice(read());
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

  return { notice, ready, dismiss: dismissJourneyNotice };
}
