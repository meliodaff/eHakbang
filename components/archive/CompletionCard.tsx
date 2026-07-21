"use client";

import { useRouter } from "next/navigation";
import type { Journey } from "@/lib/types";

function formatDate(iso: string | null): string {
  const date = iso ? new Date(iso) : new Date();
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Screen 3 — Journey Complete (PRD §10.4). Celebration state with the life
 * event, total steps completed, and completion date, plus archive / new
 * journey actions.
 */
export function CompletionCard({ journey }: { journey: Journey }) {
  const router = useRouter();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-10 text-center">
      <span
        className="flex h-20 w-20 items-center justify-center rounded-full bg-egov-success-bg text-4xl text-egov-success"
        aria-hidden
      >
        ✓
      </span>

      <div>
        <h1 className="text-2xl font-bold text-egov-navy">Journey Complete!</h1>
        <p className="mt-2 text-muted">
          Natapos mo na ang lahat ng hakbang para sa{" "}
          <span className="font-semibold text-foreground">
            {journey.emoji} {journey.life_event}
          </span>
          .
        </p>
      </div>

      <dl className="w-full max-w-xs rounded-egov bg-surface p-4 text-left shadow-sm">
        <div className="flex items-center justify-between py-1.5">
          <dt className="text-muted">Life event</dt>
          <dd className="font-semibold text-foreground">
            {journey.life_event}
          </dd>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <dt className="text-muted">Steps completed</dt>
          <dd className="font-semibold text-foreground">
            {journey.total_steps} of {journey.total_steps}
          </dd>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <dt className="text-muted">Completed on</dt>
          <dd className="font-semibold text-foreground">
            {formatDate(journey.completed_at)}
          </dd>
        </div>
      </dl>

      <div className="flex w-full max-w-xs flex-col gap-2">
        <button
          type="button"
          onClick={() => router.push("/journeys")}
          className="min-h-12 rounded-egov bg-egov-blue px-5 py-3 font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
        >
          Archive This Journey
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="min-h-12 rounded-egov border border-egov-blue px-5 py-3 font-semibold text-egov-blue transition-colors hover:bg-egov-blue-050 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
        >
          Start a New Journey
        </button>
      </div>
    </main>
  );
}
