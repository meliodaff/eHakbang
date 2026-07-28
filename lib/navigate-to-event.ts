import type { useRouter } from "next/navigation";
import { eventRequiresVerification } from "@/lib/verification";
import { isCivilStatusEvent } from "@/lib/civil-status-events";
import { getJourneyByEventId } from "@/lib/event-journeys";
import { getStoredJourney } from "@/lib/journey-store";
import type { LifeEvent } from "@/lib/types";

type Router = ReturnType<typeof useRouter>;

/**
 * Routes to the right screen for a selected (matched) life event: the
 * confirm/document/face-verify flow for civil-status events (or straight to
 * the read-only completion view if already completed once), the
 * verification gate for events that require it, or straight to the journey
 * checklist otherwise. Shared by the preset card grid and the free-text
 * search flow so a text match to a preset behaves identically to tapping
 * its card.
 */
export function navigateToEvent(router: Router, event: LifeEvent): void {
  try {
    if (isCivilStatusEvent(event.id)) {
      const catalog = getJourneyByEventId(event.id);
      const stored = catalog ? getStoredJourney(catalog.id) : undefined;
      if (stored?.status === "completed") {
        // Already verified and completed once — no need to go through
        // confirm/document/face-verify again. Show the info read-only,
        // without prompting to archive or start another journey.
        router.push(
          `/journey/complete?id=${encodeURIComponent(stored.id)}&mode=info`,
        );
        return;
      }
      router.push(`/journey/confirm?event=${encodeURIComponent(event.id)}`);
      return;
    }
    // Verification-gated events (e.g. Just Graduated) route through the
    // document + liveness flow before their journey checklist is shown.
    const target = eventRequiresVerification(event.id)
      ? `/journey/verify?event=${encodeURIComponent(event.id)}`
      : `/journey?event=${encodeURIComponent(event.id)}`;
    router.push(target);
  } catch (err) {
    // TEMPORARY diagnostic — surfaces the real error on-device since
    // remote devtools aren't available. Remove once the cause is found.
    window.alert(`navigateToEvent failed for ${event.id}: ${String(err)}`);
  }
}
