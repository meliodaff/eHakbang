import Link from "next/link";
import { getJourneyById } from "@/lib/mock-data";
import { getEventJourneyById } from "@/lib/event-journeys";
import { CompletionCard } from "@/components/archive/CompletionCard";
import { EhakbangHeader } from "@/components/layout/EhakbangHeader";

export default async function JourneyCompletePage({
  searchParams,
}: {
  // Next.js 16: searchParams is a Promise and must be awaited.
  searchParams: Promise<{ id?: string; mode?: string }>;
}) {
  const { id, mode } = await searchParams;
  const journey = id
    ? (getJourneyById(id) ?? getEventJourneyById(id))
    : undefined;

  if (!journey) {
    return (
      <main className="flex flex-1 flex-col bg-surface">
        <EhakbangHeader backHref="/journeys" />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <h1 className="text-xl font-bold text-egov-navy">Journey not found</h1>
          <Link
            href="/"
            className="min-h-11 rounded-egov bg-egov-blue px-5 py-2.5 font-semibold text-white"
          >
            Start a New Journey
          </Link>
        </div>
      </main>
    );
  }

  return <CompletionCard journey={journey} readOnly={mode === "info"} />;
}
