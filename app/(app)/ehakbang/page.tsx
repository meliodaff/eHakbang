import { EhakbangHeader } from "@/components/layout/EhakbangHeader";
import { GreetingCard } from "@/components/layout/GreetingCard";
import { SearchInput } from "@/components/input/SearchInput";
import { EventCardGrid } from "@/components/input/EventCardGrid";
import { EhakbangActiveSection } from "@/components/ehakbang/ActiveSection";
import { EhakbangTodoSection } from "@/components/ehakbang/TodoSection";
import { TodayDate } from "@/components/egov/TodayDate";
import { LocationPinIcon, AiIcon } from "@/components/egov/ServiceIcons";

export default function EhakbangHome() {
  return (
    <main className="flex flex-1 flex-col bg-surface">
      <EhakbangHeader backHref="/" />

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

      {/* Quick actions + active journey + stats (from saved journeys) */}
      <EhakbangActiveSection />

      <EhakbangTodoSection />

      <div className="mt-6 px-5">
        <EventCardGrid />
      </div>

      {/* Why eHakbang — tinted info cards */}
      <section aria-label="Why eHakbang" className="mt-6 px-5">
        <h2 className="mb-3 text-base font-bold text-foreground">
          Why eHakbang
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
