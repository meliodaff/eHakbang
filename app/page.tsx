import Link from "next/link";
import { GreetingCard } from "@/components/layout/GreetingCard";
import { LanguageToggle } from "@/components/input/LanguageToggle";
import { ServiceTile } from "@/components/egov/ServiceTile";
import { EhakbangFeatureCard } from "@/components/egov/EhakbangFeatureCard";

/** Representative eGov service categories (host dashboard, non-interactive). */
const SERVICES: { icon: string; label: string; badge?: string }[] = [
  { icon: "🏛️", label: "NGAs" },
  { icon: "🏢", label: "LGUs" },
  { icon: "💼", label: "Jobs", badge: "New" },
  { icon: "🛒", label: "Market", badge: "New" },
  { icon: "✈️", label: "Travel" },
  { icon: "🩺", label: "Health" },
  { icon: "⚠️", label: "Report", badge: "New" },
  { icon: "⋯", label: "More" },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col bg-surface">
      {/* Top app bar — eGov host brand */}
      <div className="sticky top-0 z-20 flex items-center justify-between bg-surface px-5 pb-2 pt-4">
        <span className="text-xl font-extrabold tracking-tight">
          <span className="text-egov-blue">eGov</span>
          <span className="text-egov-navy">PH</span>
        </span>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Link
            href="/about"
            aria-label="About"
            className="flex h-10 w-10 items-center justify-center rounded-full text-egov-blue transition-colors hover:bg-egov-blue-050 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
          >
            <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6" fill="none">
              <path
                d="M6 8.5a6 6 0 0 1 12 0v3.2c0 .5.2 1 .5 1.4l.9 1.1c.6.8.1 2-.9 2H5.5c-1 0-1.5-1.2-.9-2l.9-1.1c.3-.4.5-.9.5-1.4V8.5Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </Link>
        </div>
      </div>

      <GreetingCard />

      {/* Service grid (representative eGov super-app services) */}
      <section aria-label="Government services" className="mt-5 px-5">
        <div className="grid grid-cols-4 gap-2">
          {SERVICES.map((s) => (
            <ServiceTile key={s.label} icon={s.icon} label={s.label} badge={s.badge} />
          ))}
        </div>
      </section>

      {/* Featured: E-Hakbang entry button */}
      <section aria-label="Featured service" className="mt-6 px-5">
        <h2 className="mb-2 text-base font-bold text-foreground">
          Featured service
        </h2>
        <EhakbangFeatureCard />
      </section>

      {/* Featured eGovPH services (representative cards) */}
      <section aria-label="Featured eGovPH services" className="mt-6 px-5">
        <h2 className="mb-2 text-base font-bold text-foreground">
          Featured eGovPH Services
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-egov bg-surface-muted p-4">
            <p className="text-sm font-bold text-foreground">
              National Government Services
            </p>
            <p className="mt-1 text-xs text-muted">National Documents</p>
            <span aria-hidden className="mt-3 block text-2xl">
              🏛️
            </span>
          </div>
          <div className="rounded-egov bg-surface-muted p-4">
            <p className="text-sm font-bold text-foreground">
              Local Government Services
            </p>
            <p className="mt-1 text-xs text-muted">Local Documents</p>
            <span aria-hidden className="mt-3 block text-2xl">
              🏢
            </span>
          </div>
        </div>
      </section>

      <p className="mt-6 px-5 text-center text-[11px] text-muted">
        Demo host dashboard. E-Hakbang is the active service.
      </p>

      <div className="h-6" />
    </main>
  );
}
