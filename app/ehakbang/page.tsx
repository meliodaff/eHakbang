import { TopAppBar } from "@/components/layout/TopAppBar";
import { GreetingCard } from "@/components/layout/GreetingCard";
import { SearchInput } from "@/components/input/SearchInput";
import { EventCardGrid } from "@/components/input/EventCardGrid";

export default function EhakbangHome() {
  return (
    <main className="flex flex-1 flex-col bg-surface">
      <div className="sticky top-0 z-20 bg-surface">
        <TopAppBar brand="E-Hakbang" backHref="/" />
      </div>

      <GreetingCard />

      <div className="mt-4 px-5">
        <SearchInput />
      </div>

      <div className="mt-6 px-5">
        <EventCardGrid />
      </div>

      {/* Privacy note (eGov "featured" banner pattern) */}
      <div className="mt-6 px-5">
        <div className="flex items-center gap-3 rounded-egov-lg bg-surface-muted p-4">
          <span
            aria-hidden
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-egov-blue-050 text-xl"
          >
            🔒
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Privacy-first
            </p>
            <p className="text-xs text-muted">
              Walang personal na impormasyon ang kinokolekta. No personal
              information is collected.
            </p>
          </div>
        </div>
      </div>

      <div className="h-6" />
    </main>
  );
}
