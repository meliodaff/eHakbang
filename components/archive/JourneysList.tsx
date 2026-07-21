"use client";

import Link from "next/link";
import { useJourneys, clearAllJourneys } from "@/lib/journey-store";
import { JourneyListItem } from "./JourneyListItem";

/**
 * Store-backed My Journeys list (PRD FR-09). Shows the user's saved journeys —
 * active first — with an empty state on a clean slate and a Clear All action.
 */
export function JourneysList() {
  const { journeys, ready } = useJourneys();

  const sorted = [...journeys].sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (b.status === "active" && a.status !== "active") return 1;
    const aDate = a.completed_at ?? a.created_at;
    const bDate = b.completed_at ?? b.created_at;
    return bDate.localeCompare(aDate);
  });

  return (
    <div className="flex flex-col gap-4 px-5 py-4">
      {ready && sorted.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {sorted.map((journey) => (
            <JourneyListItem key={journey.id} journey={journey} />
          ))}
        </ul>
      ) : (
        <p className="rounded-egov bg-surface p-6 text-center text-muted shadow-sm">
          {ready
            ? "Wala ka pang journey. Pumili ng life event para magsimula."
            : "Loading…"}
        </p>
      )}

      <Link
        href="/ehakbang"
        className="flex min-h-12 items-center justify-center rounded-egov bg-egov-blue px-5 py-3 font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
      >
        Start a New Journey
      </Link>

      {ready && sorted.length > 0 && (
        <button
          type="button"
          onClick={() => {
            if (
              typeof window !== "undefined" &&
              window.confirm("Clear all your saved journeys?")
            ) {
              clearAllJourneys();
            }
          }}
          className="mx-auto rounded-full px-4 py-2 text-sm font-semibold text-egov-danger transition-colors hover:bg-egov-warning-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-danger"
        >
          Clear All Journeys
        </button>
      )}
    </div>
  );
}
