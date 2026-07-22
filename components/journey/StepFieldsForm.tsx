"use client";

import { useId, useState } from "react";
import type { JourneyStep } from "@/lib/types";
import { useT } from "@/lib/i18n";

/**
 * Collects the citizen-supplied `required_fields` values Auto Apply needs
 * for one or more steps, before those steps are submitted. Grouped by
 * agency/step so it reads like a short checklist rather than one long form.
 */
export function StepFieldsForm({
  steps,
  initialAnswers = {},
  onSubmit,
}: {
  /** Steps that have at least one `required_fields` entry to collect. */
  steps: JourneyStep[];
  initialAnswers?: Record<number, Record<string, string>>;
  onSubmit: (answers: Record<number, Record<string, string>>) => void;
}) {
  const t = useT();
  const formId = useId();
  const [answers, setAnswers] =
    useState<Record<number, Record<string, string>>>(initialAnswers);

  function setValue(stepNumber: number, fieldKey: string, value: string) {
    setAnswers((prev) => ({
      ...prev,
      [stepNumber]: { ...prev[stepNumber], [fieldKey]: value },
    }));
  }

  const isComplete = steps.every((step) =>
    (step.required_fields ?? [])
      .filter((field) => field.required !== false)
      .every((field) => (answers[step.step_number]?.[field.field_key] ?? "").trim().length > 0),
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-foreground">
        {t("A few agencies need some extra details from you before we can apply on your behalf.")}
      </p>

      {steps.map((step) => (
        <div key={step.step_number} className="rounded-egov bg-surface p-3">
          <p className="text-sm font-semibold text-muted">{t(step.agency_name)}</p>
          <p className="mt-0.5 text-sm font-bold text-foreground">{t(step.step_title)}</p>

          <div className="mt-3 flex flex-col gap-3">
            {(step.required_fields ?? []).map((field) => {
              const inputId = `${formId}-${step.step_number}-${field.field_key}`;
              return (
                <div key={field.field_key} className="flex flex-col gap-1">
                  <label htmlFor={inputId} className="text-sm font-semibold text-foreground">
                    {t(field.label)}
                    {field.required === false && (
                      <span className="ml-1 font-normal text-muted">({t("optional")})</span>
                    )}
                  </label>
                  <input
                    id={inputId}
                    type={field.field_type}
                    value={answers[step.step_number]?.[field.field_key] ?? ""}
                    onChange={(e) => setValue(step.step_number, field.field_key, e.target.value)}
                    className="w-full rounded-egov border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:border-egov-blue focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-egov-blue"
                  />
                  {field.hint && <p className="text-xs text-muted">{t(field.hint)}</p>}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <button
        type="button"
        disabled={!isComplete}
        onClick={() => onSubmit(answers)}
        className="min-h-11 rounded-egov bg-egov-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue disabled:cursor-not-allowed disabled:bg-border disabled:text-muted"
      >
        {t("Continue")}
      </button>
    </div>
  );
}
