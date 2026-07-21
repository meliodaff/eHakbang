import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { SearchInput } from "@/components/input/SearchInput";
import { EventCardGrid } from "@/components/input/EventCardGrid";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <DashboardHeader />

      {/* Search card overlaps the header bottom, eGov-style. */}
      <div className="-mt-8 px-5">
        <div className="rounded-egov bg-surface p-4 shadow-md">
          <SearchInput />
        </div>
      </div>

      <div className="mt-6 px-5">
        <EventCardGrid />
      </div>

      <p className="mt-8 px-5 pb-6 text-center text-xs text-muted">
        🔒 Walang personal na impormasyon ang kinokolekta.
        <br />
        No personal information is collected.
      </p>
    </main>
  );
}
