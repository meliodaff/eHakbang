"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useJourneys, markStepsDone } from "@/lib/journey-store";
import { simulateAgencyApproval } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";

/**
 * Detail view for a single submitted application (one journey step). Shows all
 * of the step's details -- reason, documents, estimated time, note, fee, and
 * the official service link -- plus the demo "Simulate" control that locally
 * approves this specific application.
 */
export function ApplicationDetailScreen({
  journeyId,
  stepNumber,
}: {
  journeyId: string;
  stepNumber: number;
}) {
  const { journeys, ready } = useJourneys();
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const journey = journeys.find((j) => j.id === journeyId);
  const step = journey?.steps.find((s) => s.step_number === stepNumber);
  const done = journey?.completed_step_numbers.includes(stepNumber) ?? false;

  async function handleSimulate() {
    if (!journey || !step) return;
    setBusy(true);
    try {
      // Local demo stand-in for this agency responding (no real backend).
      await simulateAgencyApproval({ journeyId: journey.id });
      const updated = markStepsDone(journey, [step.step_number]);
      // Whole journey done -> celebration screen; otherwise back to the list.
      if (updated.status === "completed") {
        router.push(`/journey/complete?id=${encodeURIComponent(journey.id)}`);
      } else {
        router.push("/track");
      }
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <p className="px-5 py-8 text-center text-sm text-muted">{t("Loading…")}</p>
    );
  }

  if (!journey || !step) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <h2 className="text-lg font-bold text-foreground">
          {t("Application not found")}
        </h2>
        <Link
          href="/track"
          className="min-h-11 rounded-egov bg-egov-blue px-5 py-2.5 font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
        >
          {t("Back to Track")}
        </Link>
      </div>
    );
  }

  // The processing steps this agency must do for this application, so the
  // citizen can track progress. Everything before "approved" is complete once
  // the application is submitted; the rest resolves when the agency responds.
  const agencyName = t(step.agency_name);
  const stages: { label: string; hint: string; state: "done" | "current" | "pending" }[] = [
    {
      label: t("Application received"),
      hint: `${agencyName} ${t("received your submitted update.")}`,
      state: "done",
    },
    {
      label: t("Documents reviewed"),
      hint: `${agencyName} ${t("verifies your uploaded documents.")}`,
      state: done ? "done" : "current",
    },
    {
      label: t("Records updated"),
      hint: `${agencyName} ${t("updates your record in its system.")}`,
      state: done ? "done" : "pending",
    },
    {
      label: t("Update approved"),
      hint: t("Your updated record or document is ready."),
      state: done ? "done" : "pending",
    },
  ];

  return (
    <div className="flex flex-col gap-4 px-5 py-4">
      {/* Status */}
      <div
        className={`flex items-center justify-between gap-2 rounded-egov px-4 py-3 ${
          done ? "bg-egov-success-bg" : "bg-egov-blue-050"
        }`}
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted">
            {t(journey.life_event)}
          </p>
          <p className="truncate text-sm font-bold text-foreground">
            {t(step.agency_name)}
          </p>
        </div>
        {done ? (
          <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-egov-success">
            <input
              type="checkbox"
              checked
              readOnly
              aria-label={`${t(step.agency_name)} — ${t("Done")}`}
              className="h-4 w-4 accent-egov-success"
            />
            {t("Done")}
          </span>
        ) : (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-egov-blue-100 px-2.5 py-1 text-xs font-semibold text-egov-blue">
            <span aria-hidden>🕓</span>
            {t("Awaiting agency response")}
          </span>
        )}
      </div>

      {/* Agency processing steps to track */}
      <section className="rounded-egov border border-border bg-surface p-4">
        <h2 className="text-sm font-bold text-foreground">
          {t("What")} {agencyName} {t("needs to do")}
        </h2>
        <ol className="mt-3 flex flex-col">
          {stages.map((stage, i) => {
            const isLast = i === stages.length - 1;
            return (
              <li key={stage.label} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      stage.state === "done" &&
                        "bg-egov-success text-white",
                      stage.state === "current" &&
                        "animate-pulse bg-egov-blue text-white",
                      stage.state === "pending" &&
                        "border border-border bg-surface text-muted",
                    )}
                    aria-hidden
                  >
                    {stage.state === "done" ? "✓" : i + 1}
                  </span>
                  {!isLast && (
                    <span
                      className={cn(
                        "my-1 w-0.5 flex-1",
                        stage.state === "done"
                          ? "bg-egov-success"
                          : "bg-border",
                      )}
                    />
                  )}
                </div>
                <div className={cn("pb-4", isLast && "pb-0")}>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      stage.state === "pending"
                        ? "text-muted"
                        : "text-foreground",
                    )}
                  >
                    {stage.label}
                    {stage.state === "current" && (
                      <span className="ml-2 rounded-full bg-egov-blue-100 px-2 py-0.5 text-[10px] font-semibold text-egov-blue">
                        {t("In progress")}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">{stage.hint}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Simulate control for this specific application */}
      {done ? (
        <p className="rounded-egov bg-egov-success-bg px-4 py-3 text-center text-sm font-semibold text-egov-success">
          🎉 {t("This agency has approved your application.")}
        </p>
      ) : (
        <button
          type="button"
          onClick={() => void handleSimulate()}
          disabled={busy}
          className="min-h-12 w-full rounded-egov bg-egov-blue px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue disabled:opacity-50"
        >
          {busy
            ? t("Simulating agency approval…")
            : t("Demo: Simulate agency approval")}
        </button>
      )}
    </div>
  );
}
