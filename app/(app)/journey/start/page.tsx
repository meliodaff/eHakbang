import { redirect } from "next/navigation";
import { getOrRegenerateCustomJourney } from "@/lib/server/journey-requirements";
import { getHeldIdsForCurrentUser } from "@/lib/server/id-wallet";
import {
  getStoredJourneyForEvent,
  saveJourneyForCurrentUser,
} from "@/lib/server/stored-journeys";
import { customEventId } from "@/lib/custom-event";

/**
 * Intake gate for a custom (free-text) life event that didn't match a preset
 * (see `components/input/SearchInput.tsx`). Generates (or reuses an
 * already-started) journey, then:
 *  - when the AI decided this life event needs supporting evidence, routes
 *    into the exact same evidence-upload + face-liveness flow as a preset
 *    "Piliin ang life event" card (`DocumentUploadScreen` /
 *    `FaceVerifyScreen`), just carrying the AI's own copy and a `target`
 *    (this custom event's journey URL) instead of a fixed `eventId`;
 *  - otherwise skips verification entirely -- no evidence step and no face
 *    liveness -- straight to the checklist.
 */
export default async function JourneyStartPage({
  searchParams,
}: {
  // Next.js 16: searchParams is a Promise and must be awaited.
  searchParams: Promise<{ q?: string; slug?: string }>;
}) {
  const { q, slug } = await searchParams;
  const text = q?.trim();
  if (!text) redirect("/ehakbang");

  const journeyParams = new URLSearchParams({ q: text });
  if (slug) journeyParams.set("slug", slug);
  const target = `/journey?${journeyParams.toString()}`;

  const eventId = customEventId(slug?.trim() || text);
  const existing = await getStoredJourneyForEvent(eventId);
  if (existing) redirect(target);

  const heldIds = await getHeldIdsForCurrentUser();
  const result = await getOrRegenerateCustomJourney({ text, slug, language: "en", heldIds });

  if (result.source === "ai") {
    await saveJourneyForCurrentUser(result.journey);
  }

  if (result.source !== "ai" || !result.requiresEvidence) {
    // Generation failed (nothing confident to gate), or this life event
    // doesn't need evidence -- either way, skip evidence AND liveness.
    redirect(target);
  }

  const documentParams = new URLSearchParams({ target });
  documentParams.set("title", result.evidenceTitle?.trim() || "Attach supporting evidence");
  documentParams.set(
    "description",
    result.evidenceDescription?.trim() || "Upload a document that supports this update.",
  );
  redirect(`/journey/confirm/document?${documentParams.toString()}`);
}
