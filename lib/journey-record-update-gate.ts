import type { IdType, JourneyStep } from "./types";

/**
 * Some `record_update` steps update an *existing* agency record (e.g. "Update
 * civil status & beneficiaries" at SSS after getting married) rather than
 * obtaining a new ID (e.g. "Register for your SSS number" for a first job).
 * The former only makes sense if the citizen already holds that agency's ID
 * -- there's no existing SSS record to update if they've never registered.
 *
 * Steps that *obtain* a new ID are tagged `fulfills_id` (see
 * `inferFulfillsId` in `lib/server/egov-ai-journey.ts`) and are never gated
 * here -- the two concepts are mutually exclusive by construction: a step
 * either grants an ID, or (if it touches one of these agencies without
 * granting it) presupposes the citizen already has one.
 */

/** Agencies with a corresponding ID Wallet entry an "update" step can require. */
const AGENCY_TO_ID: Partial<Record<string, IdType>> = {
  SSS: "sss",
  PHILHEALTH: "philhealth",
  PAGIBIG: "pagibig",
  BIR: "tin",
  PHILSYS: "philsys",
  LTO: "drivers-license",
};

/**
 * The ID a step requires the citizen to already hold for its update to
 * apply, or undefined when the step isn't this kind of "update an existing
 * record" step (e.g. it obtains a new ID, isn't a record_update, or targets
 * an agency with no wallet ID type).
 */
export function inferRequiredExistingId(
  step: Pick<JourneyStep, "step_type" | "agency_code" | "fulfills_id">,
): IdType | undefined {
  if (step.step_type !== "record_update" || step.fulfills_id) return undefined;
  return AGENCY_TO_ID[step.agency_code.toUpperCase()];
}

/**
 * True when this step doesn't apply to the citizen because they don't hold
 * the ID it would update -- there's nothing for the step to do.
 */
export function isStepNotApplicable(
  step: Pick<JourneyStep, "step_type" | "agency_code" | "fulfills_id">,
  heldIds: IdType[],
): boolean {
  const requiredId = inferRequiredExistingId(step);
  return !!requiredId && !heldIds.includes(requiredId);
}
