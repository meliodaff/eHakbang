import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  dismissJourneyNotice,
  recordJourneyRefresh,
  useJourneyNotice,
} from "./journey-notice-store";

const KEY = "ehakbang:journey-notice";

describe("journey-notice-store persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useRealTimers();
  });

  it("records a refresh notice", () => {
    recordJourneyRefresh("retired", "Retired");
    const raw = window.localStorage.getItem(KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.eventId).toBe("retired");
    expect(parsed.eventLabel).toBe("Retired");
    expect(parsed.refreshedAt).toBeDefined();
  });

  it("dismisses the notice", () => {
    recordJourneyRefresh("retired", "Retired");
    dismissJourneyNotice();
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it("overwrites a previous notice with the latest one", () => {
    recordJourneyRefresh("retired", "Retired");
    recordJourneyRefresh("annulment", "Annulment");
    const parsed = JSON.parse(window.localStorage.getItem(KEY)!);
    expect(parsed.eventId).toBe("annulment");
  });
});

describe("useJourneyNotice", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns the current notice once ready", () => {
    recordJourneyRefresh("retired", "Retired");
    const { result } = renderHook(() => useJourneyNotice());
    expect(result.current.ready).toBe(true);
    expect(result.current.notice?.eventId).toBe("retired");
  });

  it("treats a notice older than 30 minutes as expired", () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        eventId: "retired",
        eventLabel: "Retired",
        refreshedAt: new Date(Date.now() - 31 * 60 * 1000).toISOString(),
      }),
    );
    const { result } = renderHook(() => useJourneyNotice());
    expect(result.current.notice).toBeNull();
  });
});
