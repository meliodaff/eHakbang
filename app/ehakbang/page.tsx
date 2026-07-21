import Link from "next/link";
import { cn } from "@/lib/cn";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { GreetingCard } from "@/components/layout/GreetingCard";
import { SearchInput } from "@/components/input/SearchInput";
import { EventCardGrid } from "@/components/input/EventCardGrid";
import { ServiceTile } from "@/components/egov/ServiceTile";
import { TodayDate } from "@/components/egov/TodayDate";
import {
  LocationPinIcon,
  ListIcon,
  ArrowRightIcon,
  InfoIcon,
  AiIcon,
  JobsIcon,
  HealthIcon,
} from "@/components/egov/ServiceIcons";
import { MOCK_JOURNEYS, getActiveJourney } from "@/lib/mock-data";

export default function EhakbangHome() {
  const activeJourney = getActiveJourney();
  const totalJourneys = MOCK_JOURNEYS.length;
  const activeCount = MOCK_JOURNEYS.filter((j) => j.status === "active").length;
  const totalRecordUpdates = MOCK_JOURNEYS.reduce((sum, j) => sum + j.record_updates, 0);
  const totalBenefitClaims = MOCK_JOURNEYS.reduce((sum, j) => sum + j.benefit_claims, 0);
  const remainingSteps = activeJourney
    ? activeJourney.total_steps - activeJourney.completed_step_numbers.length
    : 0;

  return (
    <main className="flex flex-1 flex-col bg-surface">
      <div className="sticky top-0 z-20 bg-surface">
        <TopAppBar brand="E-Hakbang" backHref="/" />
      </div>

      {/* Location + date row (eGov home pattern) */}
      <div className="mt-3 flex items-center justify-between px-5 pb-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span aria-hidden>
            <LocationPinIcon />
          </span>
          <span className="font-medium">PHILIPPINES</span>
        </span>
        <TodayDate />
      </div>

      <div className="mt-2">
        <GreetingCard />
      </div>

      <div className="mt-4 px-5">
        <SearchInput />
      </div>

      {/* Quick actions (eGov home service-icon row pattern) */}
      <div className="mt-4">
        <div className="flex gap-1 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ServiceTile icon={<ListIcon />} label="My Journeys" href="/journeys" />
          {activeJourney && (
            <ServiceTile
              icon={<ArrowRightIcon />}
              label="Continue"
              href="/journey"
              badge={remainingSteps > 0 ? `${remainingSteps} left` : undefined}
            />
          )}
          <ServiceTile icon={<InfoIcon />} label="About" href="/about" />
        </div>
      </div>

      {/* Active journey progress (eGov promo-banner slot) */}
      {activeJourney && (
        <div className="mt-4 px-5">
          <Link
            href="/journey"
            className="flex items-center gap-3 overflow-hidden rounded-egov-lg bg-egov-blue-050 p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
          >
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-extrabold tracking-tight text-egov-blue">
                Active Journey
                <span className="rounded bg-egov-yellow px-1 py-0.5 text-[9px] font-bold leading-none text-egov-navy">
                  {activeJourney.completed_step_numbers.length}/
                  {activeJourney.total_steps}
                </span>
              </p>
              <p className="mt-1 text-base font-bold leading-snug text-foreground">
                {activeJourney.life_event}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {`${remainingSteps} step${remainingSteps === 1 ? "" : "s"} left — tap to continue`}
              </p>
            </div>

            {/* Decorative panel (original) */}
            <div
              aria-hidden
              className="relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-egov bg-gradient-to-br from-egov-blue to-egov-navy text-white"
            >
              <span className="text-3xl">{activeJourney.emoji}</span>
              <span className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-egov-yellow/60" />
            </div>
          </Link>

          <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
            {activeJourney.steps.map((s) => (
              <span
                key={s.step_number}
                className={cn(
                  "h-1.5 rounded-full",
                  activeJourney.completed_step_numbers.includes(s.step_number)
                    ? "w-5 bg-egov-blue"
                    : "w-1.5 bg-egov-blue-100",
                )}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 px-5">
        <EventCardGrid />
      </div>

      {/* Stats: my journeys + record updates + benefit claims */}
      <div className="mt-5 grid grid-cols-2 gap-3 px-5">
        <div className="row-span-2 flex flex-col rounded-egov-lg bg-egov-blue-050 p-4">
          <span aria-hidden className="text-egov-blue">
            <ListIcon />
          </span>
          <p className="mt-auto text-3xl font-bold text-foreground">
            {totalJourneys}
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

      {/* Why E-Hakbang — tinted info cards */}
      <section aria-label="Why E-Hakbang" className="mt-6 px-5">
        <h2 className="mb-3 text-base font-bold text-foreground">
          Why E-Hakbang
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-egov bg-egov-blue-050 p-4">
            <p className="text-sm font-bold leading-tight text-foreground">
              AI-Powered Guidance
            </p>
            <p className="mt-1 text-[11px] text-muted">
              An ordered, personalized checklist for your situation
            </p>
            <span aria-hidden className="mt-4 block text-egov-blue">
              <AiIcon />
            </span>
          </div>
          <div className="rounded-egov bg-egov-success-bg p-4">
            <p className="text-sm font-bold leading-tight text-foreground">
              Privacy-First
            </p>
            <p className="mt-1 text-[11px] text-muted">
              Walang personal na impormasyon ang kinokolekta. No personal
              information is collected.
            </p>
          </div>
        </div>
      </section>

      <div className="h-6" />
    </main>
  );
}
