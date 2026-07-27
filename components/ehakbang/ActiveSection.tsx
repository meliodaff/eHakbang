"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { useJourneys } from "@/lib/journey-store";
import { ServiceTile } from "@/components/egov/ServiceTile";
import {
  ListIcon,
  ArrowRightIcon,
  InfoIcon,
  IdCardIcon,
  JobsIcon,
  HealthIcon,
} from "@/components/egov/ServiceIcons";

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
  const activeCount = journeys.filter((j) => j.status === "active").length;
  const totalRecordUpdates = journeys.reduce((s, j) => s + j.record_updates, 0);
  const totalBenefitClaims = journeys.reduce((s, j) => s + j.benefit_claims, 0);
  const continueHref = active?.event_id
    ? `/journey?event=${active.event_id}`
    : "/journey";

  return (
    <>
      {/* Quick actions */}
      <div className="mt-4">
        <div className="flex touch-pan-x gap-1 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ServiceTile icon={<ListIcon />} label="My Journeys" href="/journeys" />
          <ServiceTile icon={<IdCardIcon />} label="My IDs" href="/wallet" />
          {active && (
            <ServiceTile
              icon={<ArrowRightIcon />}
              label="Continue"
              href={continueHref}
              badge={remaining > 0 ? `${remaining} left` : undefined}
            />
          )}
          <ServiceTile icon={<InfoIcon />} label="About" href="/about" />
        </div>
      </div>

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

          <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
            {active.steps.map((s) => (
              <span
                key={s.step_number}
                className={cn(
                  "h-1.5 rounded-full",
                  active.completed_step_numbers.includes(s.step_number)
                    ? "w-5 bg-egov-blue"
                    : "w-1.5 bg-egov-blue-100",
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mt-5 grid grid-cols-2 gap-3 px-5">
        <div className="row-span-2 flex flex-col rounded-egov-lg bg-egov-blue-050 p-4">
          <span aria-hidden className="text-egov-blue">
            <ListIcon />
          </span>
          <p className="mt-auto text-3xl font-bold text-foreground">
            {journeys.length}
          </p>
          <p className="text-xs text-muted">My Journeys</p>
          <p className="text-[11px] text-muted">{activeCount} active</p>
        </div>

        <div className="flex items-center justify-between rounded-egov-lg bg-egov-record-bg p-4">
          <div>
            <p className="text-sm font-bold text-foreground">Record Updates</p>
            <p className="mt-1 text-xl font-bold text-egov-record">
              {totalRecordUpdates}
            </p>
          </div>
          <span aria-hidden className="text-egov-record">
            <JobsIcon />
          </span>
        </div>

        <div className="flex items-center justify-between rounded-egov-lg bg-egov-success-bg p-4">
          <div>
            <p className="text-sm font-bold text-foreground">Benefit Claims</p>
            <p className="mt-1 text-xl font-bold text-egov-success">
              {totalBenefitClaims}
            </p>
          </div>
          <span aria-hidden className="text-egov-success">
            <HealthIcon />
          </span>
        </div>
      </div>
    </>
  );
}
