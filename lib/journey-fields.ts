import type { Journey, JourneyStep, RequiredField } from "./types";

/**
 * Required-field gating for Auto Apply. Some steps need a citizen-supplied
 * data value (see `RequiredField` in lib/types.ts) that the single uploaded
 * evidence document can't cover -- these must be collected before that step
 * is submitted.
 */

export interface MissingRequiredField {
  stepNumber: number;
  agencyName: string;
  stepTitle: string;
  field: RequiredField;
}

function isAnswered(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/** Every required (non-optional) field across `steps` with no non-empty answer yet. */
export function getMissingRequiredFields(
  steps: JourneyStep[],
  fieldAnswers: Journey["field_answers"],
): MissingRequiredField[] {
  const missing: MissingRequiredField[] = [];

  for (const step of steps) {
    for (const field of step.required_fields ?? []) {
      if (field.required === false) continue;
      const answer = fieldAnswers[step.step_number]?.[field.field_key];
      if (!isAnswered(answer)) {
        missing.push({
          stepNumber: step.step_number,
          agencyName: step.agency_name,
          stepTitle: step.step_title,
          field,
        });
      }
    }
  }

  return missing;
}

export function hasMissingRequiredFields(
  steps: JourneyStep[],
  fieldAnswers: Journey["field_answers"],
): boolean {
  return getMissingRequiredFields(steps, fieldAnswers).length > 0;
}
