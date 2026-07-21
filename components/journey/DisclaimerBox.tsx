function WarningIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-5 w-5 shrink-0"
      fill="none"
    >
      <path
        d="M12 3.5 21 19H3l9-15.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M12 9.5v4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16.5" r="1" fill="currentColor" />
    </svg>
  );
}

/**
 * Standardized benefit-claim disclaimer (PRD FR-10). Visually distinct
 * (amber) but not obtrusive; never presents amounts as guaranteed.
 */
export function DisclaimerBox() {
  return (
    <div
      role="note"
      className="flex items-start gap-2 rounded-egov bg-egov-warning-bg px-3 py-2.5 text-sm text-egov-warning"
    >
      <WarningIcon />
      <p>
        Benefit details and eligibility may change. Always verify current
        amounts and requirements on the official agency page before proceeding.
      </p>
    </div>
  );
}
