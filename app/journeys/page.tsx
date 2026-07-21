import Link from "next/link";
import { MOCK_JOURNEYS } from "@/lib/mock-data";
import { JourneyListItem } from "@/components/archive/JourneyListItem";

export default function JourneysPage() {
  // Active journeys first, then the rest by most-recent activity.
  const journeys = [...MOCK_JOURNEYS].sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (b.status === "active" && a.status !== "active") return 1;
    const aDate = a.completed_at ?? a.created_at;
    const bDate = b.completed_at ?? b.created_at;
    return bDate.localeCompare(aDate);
  });

  return (
    <main className="flex flex-1 flex-col">
      <header className="rounded-b-egov-lg bg-gradient-to-b from-egov-navy to-egov-blue px-5 pb-6 pt-8 text-white">
        <h1 className="text-2xl font-bold">My Journeys</h1>
        <p className="mt-1 text-sm text-egov-blue-050">
          Ipagpatuloy ang mga nasimulan mo, o tingnan ang mga natapos.
        </p>
      </header>

      <div className="flex flex-col gap-4 px-5 py-4">
        {journeys.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {journeys.map((journey) => (
              <JourneyListItem key={journey.id} journey={journey} />
            ))}
          </ul>
        ) : (
          <p className="rounded-egov bg-surface p-6 text-center text-muted shadow-sm">
            Wala ka pang journey. Start one from the Home tab.
          </p>
        )}

        <Link
          href="/"
          className="flex min-h-12 items-center justify-center rounded-egov bg-egov-blue px-5 py-3 font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
        >
          Start a New Journey
        </Link>

        {journeys.length > 0 && (
          <button
            type="button"
            className="mx-auto rounded-full px-4 py-2 text-sm font-semibold text-egov-danger transition-colors hover:bg-egov-warning-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-danger"
          >
            Clear All Journeys
          </button>
        )}
      </div>
    </main>
  );
}
