import Link from "next/link";
import type { Journey } from "@/lib/types";
import { cn } from "@/lib/cn";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * A single row in the My Journeys list (PRD §10.5). Shows the life-event emoji
 * and label, a status badge, the date, and a Continue/View action.
 */
export function JourneyListItem({ journey }: { journey: Journey }) {
  const isActive = journey.status === "active";
  const dateLabel = isActive
    ? `Started ${formatDate(journey.created_at)}`
    : `Completed ${formatDate(journey.completed_at ?? journey.created_at)}`;

  return (
    <li className="flex items-center gap-3 rounded-egov border border-border bg-surface p-4 shadow-sm">
      <span className="text-2xl" aria-hidden>
        {journey.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground">
          {journey.life_event}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-semibold",
              isActive
                ? "bg-egov-blue-050 text-egov-blue"
                : "bg-egov-success-bg text-egov-success",
            )}
          >
            {isActive ? "In Progress" : "Complete"}
          </span>
          <span className="text-xs text-muted">{dateLabel}</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-stretch gap-2">
        {isActive ? (
          <Link
            href="/track"
            className="min-h-10 rounded-egov border border-egov-blue px-4 py-2 text-center text-sm font-semibold text-egov-blue transition-colors hover:bg-egov-blue-050 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
          >
            View Track
          </Link>
        ) : (
          <Link
            href={`/journey/complete?id=${journey.id}`}
            className="min-h-10 rounded-egov border border-egov-blue px-4 py-2 text-center text-sm font-semibold text-egov-blue transition-colors hover:bg-egov-blue-050 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
          >
            View
          </Link>
        )}
      </div>
    </li>
  );
}
