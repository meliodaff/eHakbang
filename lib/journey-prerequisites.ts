import type { IdType, JourneyStep } from "./types";

/**
 * Benefit-claim prerequisite resolution — the mirror of the ID wallet's
 * {@link stepFulfilledByWallet}. Where the wallet *auto-completes* a step
 * whose ID the citizen already holds, this decides when a benefit claim is
 * *blocked* because the citizen lacks the agency membership/number it needs.
 *
 * A blocked claim is never hidden: the UI surfaces it in a locked "action
 * needed" state with an enroll-first path, keeping benefits discoverable
 * (PRD Goal 2.2). Pure and React-free so it's trivially testable and reusable
 * on the server.
 */

/** Resolved prerequisite status for a step, given the citizen's held IDs. */
export type PrerequisiteState =
  | "none" // no prerequisite (or not a benefit claim)
  | "met" // required ID is held — claim is unblocked
  | "blocked-membership" // missing an enrollable membership/number
  | "blocked-contribution"; // missing membership that also needs contributions

/**
 * Classify a step's prerequisite against the wallet.
 * Only `benefit_claim` steps can be blocked; everything else is `"none"`.
 */
export function getPrerequisiteState(
  step: Pick<JourneyStep, "step_type" | "prerequisite">,
  heldIds: IdType[],
): PrerequisiteState {
  const prereq = step.prerequisite;
  if (!prereq || step.step_type !== "benefit_claim") return "none";
  if (heldIds.includes(prereq.required_id)) return "met";
  return prereq.prerequisite_type === "contribution"
    ? "blocked-contribution"
    : "blocked-membership";
}

/** True when the claim can't be filed yet because its prerequisite is unmet. */
export function isStepBlocked(
  step: Pick<JourneyStep, "step_type" | "prerequisite">,
  heldIds: IdType[],
): boolean {
  const state = getPrerequisiteState(step, heldIds);
  return state === "blocked-membership" || state === "blocked-contribution";
}
