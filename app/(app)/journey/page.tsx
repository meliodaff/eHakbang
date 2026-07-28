import { EhakbangHeader } from "@/components/layout/EhakbangHeader";
import { JourneyScreen } from "@/components/journey/JourneyScreen";
import { getLifeEventById } from "@/lib/events";
import {
  getOrRegenerateCustomJourney,
  getOrRegenerateJourney,
} from "@/lib/server/journey-requirements";

export default async function JourneyPage({
  searchParams,
}: {
  // Next.js 16: searchParams is a Promise and must be awaited.
  searchParams: Promise<{ event?: string; q?: string; slug?: string }>;
}) {
  const { event, q, slug } = await searchParams;
  // Prefetch AI-generated (cached or freshly regenerated) requirements
  // server-side so the client never needs its own OpenAI/Supabase keys.
  // Language is fixed to "en" here since the FIL toggle is client-only.
  const result =
    event && getLifeEventById(event)
      ? await getOrRegenerateJourney({ eventId: event, language: "en" })
      : q?.trim()
        ? await getOrRegenerateCustomJourney({ text: q, slug, language: "en" })
        : null;
  return (
    <>
      <EhakbangHeader backHref="/ehakbang" />
      <JourneyScreen
        eventId={event}
        initialJourney={result?.journey}
        regenerated={result?.regenerated}
      />
    </>
  );
}
