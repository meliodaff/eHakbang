/**
 * Journey feature flags keyed by life event.
 *
 * "Apply All" offers a bulk-submission shortcut: instead of marking each
 * government process one by one, the user applies to every step at once and
 * watches a submission-progress modal. This is a FLOW PROTOTYPE — no real
 * application is filed with any agency.
 */

/** Life events that offer the "Apply All" shortcut. */
export const APPLY_ALL_EVENT_IDS = [
  "just-graduated",
  "first-job",
  "became-senior",
  "became-pwd",
  "death-in-family",
] as const;

/** True when the given life event supports the "Apply All" shortcut. */
export function eventSupportsApplyAll(eventId: string | undefined): boolean {
  if (!eventId) return false;
  return (APPLY_ALL_EVENT_IDS as readonly string[]).includes(eventId);
}
