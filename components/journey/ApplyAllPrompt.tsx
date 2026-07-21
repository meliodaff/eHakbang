"use client";

import { useT } from "@/lib/i18n";

/**
 * "Apply All or No" prompt — shown at the top of the graduated life-event
 * journey. Offers the new graduate a shortcut to apply to every government
 * process at once instead of marking each step individually. Choosing "No"
 * keeps the normal one-by-one checklist flow.
 */
export function ApplyAllPrompt({
  totalSteps,
  onApplyAll,
  onDecline,
}: {
  totalSteps: number;
  onApplyAll: () => void;
  onDecline: () => void;
}) {
  const t = useT();
  return (
    <section
      aria-label="Apply to all steps"
      className="mx-5 mt-4 flex flex-col gap-3 rounded-egov border border-egov-blue-100 bg-egov-blue-050 p-4"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-bold text-egov-navy">{t("Quick apply")}</h2>
        <p className="text-sm text-foreground">
          {t("Do you want to apply to all")} {totalSteps}{" "}
          {t("processes at once, or one by one?")}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onApplyAll}
          className="min-h-11 flex-1 rounded-egov bg-egov-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
        >
          {t("Apply All")}
        </button>
        <button
          type="button"
          onClick={onDecline}
          className="min-h-11 flex-1 rounded-egov border border-egov-blue px-4 py-2.5 text-sm font-semibold text-egov-blue transition-colors hover:bg-egov-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
        >
          {t("No, one by one")}
        </button>
      </div>
    </section>
  );
}
