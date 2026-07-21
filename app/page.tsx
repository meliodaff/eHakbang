import Link from "next/link";
import { ServiceTile } from "@/components/egov/ServiceTile";
import { TodayDate } from "@/components/egov/TodayDate";
import { EhakbangFeatureCard } from "@/components/egov/EhakbangFeatureCard";
import {
  EhakbangIcon,
  HealthIcon,
  ReportIcon,
  JobsIcon,
  WeatherIcon,
  SignalIcon,
  TravelIcon,
  NgaIcon,
  LguIcon,
  AiIcon,
  LocationPinIcon,
} from "@/components/egov/ServiceIcons";

/** Representative eGov service icons (horizontal scroll on the host home). */
const SERVICES: { icon: React.ReactNode; label: string; badge?: string }[] = [
  { icon: <HealthIcon />, label: "Health" },
  { icon: <ReportIcon />, label: "Report", badge: "New" },
  { icon: <JobsIcon />, label: "Jobs", badge: "New" },
  { icon: <WeatherIcon />, label: "Weather" },
  { icon: <SignalIcon />, label: "Signal", badge: "New" },
  { icon: <TravelIcon />, label: "Travel" },
  { icon: <NgaIcon />, label: "NGAs" },
  { icon: <LguIcon />, label: "LGUs" },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col bg-surface">
      {/* Top bar: wordmark + greeting + avatar */}
      <div className="sticky top-0 z-20 bg-surface px-5 pb-2 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-xl font-extrabold tracking-tight">
            <span className="text-egov-blue">eGov</span>
            <span className="text-egov-navy">PH</span>
          </span>
          <div className="flex items-center gap-2.5">
            <div className="text-right">
              <p className="text-sm font-bold leading-tight text-foreground">
                Mabuhay, Kababayan!
              </p>
              <p className="text-[11px] leading-tight text-muted">
                Welcome to eHakbang
              </p>
            </div>
            <Link
              href="/wallet"
              aria-label="Open my ID Wallet"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-egov-blue-050 text-egov-blue transition-colors hover:bg-egov-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
            >
              <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5" fill="none">
                <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.7" />
                <path
                  d="M5 19a7 7 0 0 1 14 0"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Location + date row */}
        <div className="mt-3 flex items-center justify-between text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span aria-hidden>
              <LocationPinIcon />
            </span>
            <span className="font-medium">PHILIPPINES</span>
          </span>
          <TodayDate />
        </div>
      </div>

      {/* Search bar — opens eHakbang */}
      <div className="px-5 pt-2">
        <Link
          href="/ehakbang"
          className="flex items-center justify-between rounded-egov border border-border bg-surface px-4 py-3.5 text-muted shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
        >
          <span className="text-sm">
            Search services like{" "}
            <span className="font-semibold text-foreground">Life Events</span>
          </span>
          <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 text-foreground" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </Link>
      </div>

      {/* Horizontal service icons (eHakbang first + representative) */}
      <div className="mt-4">
        <div className="flex gap-1 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ServiceTile icon={<EhakbangIcon />} label="eHakbang" href="/ehakbang" badge="New" />
          {SERVICES.map((s) => (
            <ServiceTile key={s.label} icon={s.icon} label={s.label} badge={s.badge} />
          ))}
        </div>
      </div>

      {/* Carousel-style banner — eHakbang promo */}
      <div className="mt-4 px-5">
        <EhakbangFeatureCard />
        <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
          <span className="h-1.5 w-5 rounded-full bg-egov-blue" />
          <span className="h-1.5 w-1.5 rounded-full bg-egov-blue-100" />
          <span className="h-1.5 w-1.5 rounded-full bg-egov-blue-100" />
          <span className="h-1.5 w-1.5 rounded-full bg-egov-blue-100" />
        </div>
      </div>

      {/* Cards: left tall weather + right stacked (Signal Tester, eGov AI) */}
      <div className="mt-5 grid grid-cols-2 gap-3 px-5">
        <div className="row-span-2 flex flex-col rounded-egov-lg bg-egov-blue-050 p-4">
          <span aria-hidden className="text-egov-blue">
            <WeatherIcon />
          </span>
          <p className="mt-auto text-3xl font-bold text-foreground">—°C</p>
          <p className="text-xs text-muted">Not available</p>
          <p className="text-[11px] text-muted">Enable Location</p>
        </div>

        <div className="flex flex-col rounded-egov-lg bg-surface-muted p-4">
          <p className="text-sm font-bold text-foreground">Signal Tester</p>
          <div className="relative mt-1 flex flex-1 items-center justify-center">
            <span aria-hidden className="text-egov-blue [&>svg]:h-16 [&>svg]:w-16">
              <SignalIcon />
            </span>
            <span className="absolute bottom-0 text-lg font-bold text-egov-blue">
              252
            </span>
          </div>
          <p className="text-center text-[11px] text-muted">Mbps (sample)</p>
        </div>

        <div className="flex items-center justify-between rounded-egov-lg bg-surface-muted p-4">
          <div>
            <p className="text-sm font-bold text-foreground">eGov AI</p>
            <p className="mt-1 text-[11px] text-muted">Ask anything</p>
          </div>
          <span
            aria-hidden
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-egov-blue to-egov-navy text-white"
          >
            <span className="[&>svg]:h-6 [&>svg]:w-6">
              <AiIcon />
            </span>
            <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-egov-yellow" />
          </span>
        </div>
      </div>

      {/* Featured eGovPH Services — tinted portal cards */}
      <section aria-label="Featured eGovPH services" className="mt-6 px-5">
        <h2 className="mb-3 text-base font-bold text-foreground">
          Featured eGovPH Services
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-egov bg-red-50 p-4">
            <p className="text-sm font-bold leading-tight text-foreground">
              National Government Portals
            </p>
            <p className="mt-1 text-[11px] text-muted">Powered by eNGA</p>
            <span aria-hidden className="mt-4 block text-egov-red">
              <NgaIcon />
            </span>
          </div>
          <div className="rounded-egov bg-amber-50 p-4">
            <p className="text-sm font-bold leading-tight text-foreground">
              Local Government Portals
            </p>
            <p className="mt-1 text-[11px] text-muted">Powered by eLGU</p>
            <span aria-hidden className="mt-4 block text-amber-600">
              <LguIcon />
            </span>
          </div>
        </div>
      </section>

      <p className="mt-6 px-5 text-center text-[11px] text-muted">
        Demo host dashboard. eHakbang is the active service — tap it above to
        begin.
      </p>

      <div className="h-6" />
    </main>
  );
}
