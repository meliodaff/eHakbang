import type { JourneyStep } from "./types";

/**
 * Phrasing that means "nothing to submit -- just show up somewhere in
 * person" (e.g. "Go to the barangay hall", "Visit the nearest LTO branch",
 * "Report to the SSS office for biometrics"). Steps like this have no
 * application for Auto Apply to submit on the citizen's behalf.
 */
const VISIT_ONLY_RE =
  /\b(go|proceed|head|report)\s+to\b|\bvisit\b[^.]{0,30}?\b(office|branch|barangay|counter|window|agency|site|location)\b|\bwalk-?in\b|\bin[- ]person\b|\bappear\s+(at|before)\b|\bpresent\s+yourself\b/i;

/**
 * Phrasing that means "just put your own signature on something" (e.g.
 * "Sign the claim form", "Sign the back of the winning ticket", "affix your
 * signature"). A citizen's signature can't be produced on their behalf, so
 * there's nothing for Auto Apply to submit -- excludes "sign up"/"sign in",
 * which are legitimate online registration/login actions.
 */
const SIGN_ONLY_RE = /\bsign(?:ing|ed)?\b(?!\s*(up|in)\b)|\baffix(?:ing)?\s+(your\s+)?signature\b/i;

/** An online destination mentioned alongside the visit/sign wording means there IS something to file. */
const ONLINE_EXCEPTION_RE = /\b(website|portal|online|e-?service|mobile\s+app|\blink\b|\burl\b)\b/i;

/**
 * Whether a step is something an agency can actually process on the
 * citizen's behalf (a record update or benefit claim submitted online), as
 * opposed to a step that's just a physical visit or a signature with nothing
 * to file -- derived from the step's own text since the AI/seed data doesn't
 * tag this explicitly. Steps like "Go to the barangay hall to pick up your
 * certificate" or "Sign the winning ticket" shouldn't offer "Auto Apply":
 * there's no application for the agency to receive, only something the
 * citizen has to do in person themselves.
 */
export function stepSupportsAutoApply(
  step: Pick<JourneyStep, "step_title" | "reason">,
): boolean {
  const text = `${step.step_title} ${step.reason}`;
  if (ONLINE_EXCEPTION_RE.test(text)) return true;
  return !VISIT_ONLY_RE.test(text) && !SIGN_ONLY_RE.test(text);
}
