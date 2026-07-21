"use client";

import type { StepType } from "@/lib/types";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";

function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="none">
      <path
        d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M13 3v5h5M9 13h6M9 16.5h6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PesoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" fill="none">
      <path
        d="M7 20V5h5.5a4 4 0 0 1 0 8H7M5 9.5h10M5 12.5h10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Visually distinct label for the step type (PRD FR-04). */
export function StepTypeBadge({ type }: { type: StepType }) {
  const t = useT();
  const isBenefit = type === "benefit_claim";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        isBenefit
          ? "bg-egov-success-bg text-egov-success"
          : "bg-egov-record-bg text-egov-record",
      )}
    >
      {isBenefit ? <PesoIcon /> : <DocIcon />}
      {isBenefit ? t("Benefit Claim") : t("Record Update")}
    </span>
  );
}
