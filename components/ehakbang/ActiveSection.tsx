"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { useJourneys } from "@/lib/journey-store";
import {
  ListIcon,
} from "@/components/egov/ServiceIcons";
import LivenessMockPage from "@/app/(app)/dev/liveness-mock/page";

const DocIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
    aria-hidden="true"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const HeartIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
    aria-hidden="true"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

/**
 * Store-backed home section: quick actions, the active-journey banner (only
 * once the user has actually started a journey), and running stats. On a
 * clean slate nothing shows as active and stats read zero.
 */
export function EhakbangActiveSection() {
  const { journeys } = useJourneys();

  const active = journeys.find((j) => j.status === "active");
  const remaining = active
    ? active.total_steps - active.completed_step_numbers.length
    : 0;
  // Steps whose application was submitted but hasn't been completed yet --
  // i.e. still waiting for the agency to respond.
  const awaiting = active
    ? (active.submitted_step_numbers ?? []).filter(
        (n) => !active.completed_step_numbers.includes(n),
      )
    : [];
  const activeCount = journeys.filter((j) => j.status === "active").length;
  const totalRecordUpdates = journeys.reduce((s, j) => s + j.record_updates, 0);
  const totalBenefitClaims = journeys.reduce((s, j) => s + j.benefit_claims, 0);
  const continueHref = active?.event_id
    ? `/journey?event=${active.event_id}`
    : "/journey";

  return (
    <>
      {/* Active journey banner */}
      {active && (
        <div className="mt-4 px-5">
          <Link
            href={continueHref}
            className="flex items-center gap-3 overflow-hidden rounded-egov-lg bg-egov-blue-050 p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
          >
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-extrabold tracking-tight text-egov-blue">
                Active Journey
                <span className="rounded bg-egov-yellow px-1 py-0.5 text-[9px] font-bold leading-none text-egov-navy">
                  {active.completed_step_numbers.length}/{active.total_steps}
                </span>
              </p>
              <p className="mt-1 text-base font-bold leading-snug text-foreground">
                {active.life_event}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {`${remaining} step${remaining === 1 ? "" : "s"} left — tap to continue`}
              </p>
            </div>
            <div
              aria-hidden
              className="relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-egov bg-gradient-to-br from-egov-blue to-egov-navy text-white"
            >
              <span className="text-3xl">{active.emoji}</span>
              <span className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-egov-yellow/60" />
            </div>
          </Link>
          
          {awaiting.length > 0 && (
            <Link
              href={`/track?journey=${encodeURIComponent(active.id)}`}
              className="mt-3 flex items-center justify-center gap-1.5 rounded-egov bg-egov-blue-050 px-3 py-2 text-center text-xs font-semibold text-egov-blue transition-colors hover:bg-egov-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
            >
              <span aria-hidden>🕓</span>
              {awaiting.length} application{awaiting.length === 1 ? "" : "s"}{" "}
              submitted — track the agencies&rsquo; response
              <span aria-hidden>→</span>
            </Link>
          )}
        </div>
      )}



      {/* Stats Section */}
      <div className="mt-4 px-5">
        <div className="flex items-center justify-between rounded-egov border border-border bg-surface p-4 shadow-sm">
          {/* Column 1: Active Journeys */}
          <Link href="/journeys" className="flex flex-1 items-center justify-center gap-3">
            <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-egov-blue-050 text-egov-blue [&>svg]:h-5 [&>svg]:w-5">
              <ListIcon />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">
                {activeCount} Active
              </p>
              <p className="text-[10px] text-muted leading-tight font-medium">
                My Journeys
              </p>
            </div>
          </Link>

          {/* Divider */}
          <div className="h-8 w-px bg-border shrink-0" />

          {/* Column 2: Record Updates */}
          <div className="flex flex-1 items-center justify-center gap-3">
            <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <DocIcon />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">
                {totalRecordUpdates} Updates
              </p>
              <p className="text-[10px] text-muted leading-tight font-medium">
                Records
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-border shrink-0" />

          {/* Column 3: Benefit Claims */}
          <Link href="/journeys" className="flex flex-1 items-center justify-center gap-3">
            <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <HeartIcon />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">
                {totalBenefitClaims} Claims
              </p>
              <p className="text-[10px] text-muted leading-tight font-medium">
                Benefits
              </p>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
