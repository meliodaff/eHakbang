import type { Journey } from "@/lib/types";

/**
 * Empty generated/cached/stored journeys are invalid: they render a header and
 * progress bar but no checklist. Keep one shared guard so server cache reads,
 * stored-journey resume, and client localStorage resume make the same choice.
 */
export function hasUsableJourneySteps<T extends Pick<Journey, "steps">>(
  journey: T | null | undefined,
): journey is T {
  return !!journey && Array.isArray(journey.steps) && journey.steps.length > 0;
}
