import { EhakbangHeader } from "@/components/layout/EhakbangHeader";
import { JourneyScreen } from "@/components/journey/JourneyScreen";
import { getLifeEventById } from "@/lib/events";
import {
  getOrRegenerateCustomJourney,
  getOrRegenerateJourney,
} from "@/lib/server/journey-requirements";
import { getHeldIdsForCurrentUser } from "@/lib/server/id-wallet";
import { getStoredJourneyForEvent } from "@/lib/server/stored-journeys";
import { customEventId } from "@/lib/custom-event";
import { hasUsableJourneySteps } from "@/lib/journey-validity";
import type { Journey } from "@/lib/types";

export default async function JourneyPage({
  searchParams,
}: {
  // Next.js 16: searchParams is a Promise and must be awaited.
  searchParams: Promise<{ event?: string; q?: string; slug?: string }>;
}) {
  const { event, q, slug } = await searchParams;

  let initialJourney: Journey | undefined;
  if (event && getLifeEventById(event)) {
    // Already started this event? Show what's already there instead of
    // generating a whole new set of requirements for it (see
    // lib/server/stored-journeys.ts) -- heldIds is only fetched when a fresh
    // generation is actually needed.
    const storedJourney = await getStoredJourneyForEvent(event);
    initialJourney = hasUsableJourneySteps(storedJourney)
      ? storedJourney
      : (
          await getOrRegenerateJourney({
            eventId: event,
            language: "en",
            heldIds: await getHeldIdsForCurrentUser(),
          })
        ).journey;
  } else if (q?.trim()) {
    const text = q.trim();
    const eventId = customEventId(slug?.trim() || text);
    const storedJourney = await getStoredJourneyForEvent(eventId);
    initialJourney = hasUsableJourneySteps(storedJourney)
      ? storedJourney
      : (
          await getOrRegenerateCustomJourney({
            text,
            slug,
            language: "en",
            heldIds: await getHeldIdsForCurrentUser(),
          })
        ).journey;
  }

  return (
    <>
      <EhakbangHeader backHref="/ehakbang" />
      <JourneyScreen eventId={event} initialJourney={initialJourney} />
    </>
  );
}
