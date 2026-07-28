"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import { RequirementsTab } from "./RequirementsTab";
import { TrackScreen } from "./TrackScreen";

type Tab = "requirements" | "tracking";

/**
 * Tab switcher for the Track page (PRD track view): "Requirements" (a
 * read-only checklist of what the journey needs) and "Tracking" (submitted
 * applications and their agency-response status) -- the two things a
 * citizen wants to check on for a journey they've already started.
 */
export function TrackTabs({ journeyId }: { journeyId?: string }) {
  const [tab, setTab] = useState<Tab>("tracking");
  const t = useT();

  return (
    <>
      <div
        role="tablist"
        aria-label={t("Track view")}
        className="mx-5 mt-4 flex gap-1 rounded-full bg-egov-blue-050 p-1"
      >
        <button
          type="button"
          role="tab"
          id="track-tab-requirements"
          aria-selected={tab === "requirements"}
          aria-controls="track-tab-panel"
          onClick={() => setTab("requirements")}
          className={cn(
            "min-h-10 flex-1 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue",
            tab === "requirements"
              ? "bg-surface text-egov-blue shadow-sm"
              : "text-egov-blue-dark hover:bg-egov-blue-100",
          )}
        >
          {t("Requirements")}
        </button>
        <button
          type="button"
          role="tab"
          id="track-tab-tracking"
          aria-selected={tab === "tracking"}
          aria-controls="track-tab-panel"
          onClick={() => setTab("tracking")}
          className={cn(
            "min-h-10 flex-1 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue",
            tab === "tracking"
              ? "bg-surface text-egov-blue shadow-sm"
              : "text-egov-blue-dark hover:bg-egov-blue-100",
          )}
        >
          {t("Tracking")}
        </button>
      </div>

      <div
        id="track-tab-panel"
        role="tabpanel"
        aria-labelledby={tab === "requirements" ? "track-tab-requirements" : "track-tab-tracking"}
        className="flex flex-1 flex-col"
      >
        {tab === "requirements" ? (
          <RequirementsTab journeyId={journeyId} />
        ) : (
          <TrackScreen journeyId={journeyId} />
        )}
      </div>
    </>
  );
}
