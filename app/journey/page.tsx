import Link from "next/link";
import { getActiveJourney } from "@/lib/mock-data";
import { JourneyView } from "@/components/journey/JourneyView";

export default function JourneyPage() {
  const journey = getActiveJourney();

  if (!journey) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-xl font-bold text-egov-navy">No active journey</h1>
        <p className="text-muted">Start by describing a life event.</p>
        <Link
          href="/"
          className="min-h-11 rounded-egov bg-egov-blue px-5 py-2.5 font-semibold text-white"
        >
          Start a New Journey
        </Link>
      </main>
    );
  }

  return <JourneyView journey={journey} />;
}
