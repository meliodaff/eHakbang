"use client";

import { useEffect, useRef, useState } from "react";
import type { JourneyStep } from "@/lib/types";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";

type RowStatus = "pending" | "submitting" | "done";

/**
 * "Apply All" submission progress modal.
 *
 * Simulates submitting an application to each step's agency one after another
 * (FLOW PROTOTYPE — no real submission or API call). When every step has been
 * "submitted", it surfaces a Continue button that calls {@link onFinished} so
 * the caller can persist completion and route to the journey summary.
 */
export function ApplyAllModal({
  steps,
  onFinished,
}: {
  steps: JourneyStep[];
  onFinished: () => void;
}) {
  const t = useT();
  const [currentIndex, setCurrentIndex] = useState(0);
  const done = currentIndex >= steps.length;
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Advance through each step in sequence (mock submission). A single interval
  // drives every tick so the sequence is deterministic and testable.
  useEffect(() => {
    const id = setInterval(() => {
      setCurrentIndex((i) => {
        const next = i + 1;
        if (next >= steps.length) clearInterval(id);
        return next;
      });
    }, 900);
    return () => clearInterval(id);
  }, [steps.length]);

  // Move focus into the dialog when it opens.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-all-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
    >
      <div className="w-full max-w-md rounded-egov-lg bg-surface p-5 shadow-xl">
        <h2
          id="apply-all-modal-title"
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-bold text-egov-navy outline-none"
        >
          {done
            ? t("All done applying! 🎉")
            : t("Submitting your applications…")}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {done
            ? `${t("Submitted to all")} ${steps.length} ${t("agencies.")}`
            : t("Submitted to each agency in sequence.")}
        </p>

        <ul className="mt-4 flex flex-col gap-2" aria-live="polite">
          {steps.map((step, i) => {
            const status: RowStatus =
              i < currentIndex
                ? "done"
                : i === currentIndex
                  ? "submitting"
                  : "pending";
            return (
              <li
                key={step.step_number}
                className="flex items-center gap-3 rounded-egov border border-border px-3 py-2.5"
              >
                <span
                  aria-hidden
                  className="flex h-6 w-6 shrink-0 items-center justify-center"
                >
                  {status === "done" ? (
                    "✅"
                  ) : status === "submitting" ? (
                    <span className="inline-block motion-safe:animate-spin">
                      ⏳
                    </span>
                  ) : (
                    "•"
                  )}
                </span>
                <span
                  className={cn(
                    "min-w-0 flex-1 text-sm",
                    status === "pending" ? "text-muted" : "text-foreground",
                  )}
                >
                  {t(step.step_title)}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-xs font-semibold",
                    status === "done"
                      ? "text-egov-success"
                      : status === "submitting"
                        ? "text-egov-blue"
                        : "text-muted",
                  )}
                >
                  {status === "done"
                    ? t("Submitted")
                    : status === "submitting"
                      ? t("Submitting…")
                      : t("Waiting")}
                </span>
              </li>
            );
          })}
        </ul>

        {done && (
          <button
            type="button"
            onClick={onFinished}
            className="mt-5 min-h-12 w-full rounded-egov bg-egov-blue px-5 py-3 font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
          >
            {t("Continue")}
          </button>
        )}
      </div>
    </div>
  );
}
