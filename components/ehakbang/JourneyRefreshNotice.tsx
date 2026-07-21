"use client";

import { useT } from "@/lib/i18n";
import { useJourneyNotice } from "@/lib/journey-notice-store";

/**
 * Dashboard banner shown after AI-generated requirements were just
 * regenerated for a life event (see JourneyScreen's recordJourneyRefresh
 * call). Dismissible, and self-expires after 30 minutes if ignored.
 */
export function JourneyRefreshNotice() {
  const t = useT();
  const { notice, dismiss } = useJourneyNotice();

  if (!notice) return null;

  return (
    <div className="mx-5 mt-4 flex items-start gap-3 rounded-egov border border-egov-blue-100 bg-egov-blue-050 p-4">
      <span aria-hidden className="mt-0.5 text-lg">
        🔄
      </span>
      <p className="min-w-0 flex-1 text-sm text-foreground">
        {t("Requirements for")} &ldquo;{t(notice.eventLabel)}&rdquo;{" "}
        {t("were just refreshed with the latest information.")}
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("Dismiss")}
        className="shrink-0 rounded-full p-1 text-muted hover:bg-egov-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
      >
        ✕
      </button>
    </div>
  );
}
