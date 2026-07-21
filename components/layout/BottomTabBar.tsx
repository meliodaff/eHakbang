"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type Tab = {
  href: string;
  label: string;
  icon: React.ReactNode;
  matchPrefixes?: string[];
};

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6" fill="none">
      <path
        d="M3 10.5 12 3l9 7.5M5.25 9.75V20a1 1 0 0 0 1 1H9.5v-5.5h5V21h3.25a1 1 0 0 0 1-1V9.75"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function JourneysIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6" fill="none">
      <path d="M8 6h11M8 12h11M8 18h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="4" cy="6" r="1.4" fill="currentColor" />
      <circle cx="4" cy="12" r="1.4" fill="currentColor" />
      <circle cx="4" cy="18" r="1.4" fill="currentColor" />
    </svg>
  );
}

function AboutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 11v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="7.75" r="1.15" fill="currentColor" />
    </svg>
  );
}

const LEFT_TABS: Tab[] = [
  {
    href: "/",
    label: "Home",
    icon: <HomeIcon />,
    matchPrefixes: ["/ehakbang", "/journey"],
  },
  { href: "/journeys", label: "My Journeys", icon: <JourneysIcon /> },
];
const RIGHT_TABS: Tab[] = [
  { href: "/about", label: "About", icon: <AboutIcon /> },
];

function isActive(pathname: string, tab: Tab): boolean {
  if (tab.href === "/") {
    if (pathname === "/") return true;
    return (tab.matchPrefixes ?? []).some((p) => pathname.startsWith(p));
  }
  return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
}

function TabLink({ tab, active }: { tab: Tab; active: boolean }) {
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue",
        active ? "text-egov-blue" : "text-muted hover:text-foreground",
      )}
    >
      <span aria-hidden>{tab.icon}</span>
      <span>{tab.label}</span>
    </Link>
  );
}

export function BottomTabBar() {
  const pathname = usePathname() ?? "/";

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-md items-stretch border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(16,35,58,0.06)]"
    >
      {LEFT_TABS.map((tab) => (
        <TabLink key={tab.href} tab={tab} active={isActive(pathname, tab)} />
      ))}

      {/* Center floating action — launch E-Hakbang */}
      <div className="relative flex flex-1 items-center justify-center">
        <Link
          href="/ehakbang"
          aria-label="Open E-Hakbang"
          className="absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full bg-egov-blue text-2xl text-white shadow-lg ring-4 ring-surface transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
        >
          <span aria-hidden>🧭</span>
        </Link>
      </div>

      {RIGHT_TABS.map((tab) => (
        <TabLink key={tab.href} tab={tab} active={isActive(pathname, tab)} />
      ))}
      {/* Balancing spacer so the FAB stays centered (5-slot eGov layout). */}
      <div aria-hidden className="flex-1" />
    </nav>
  );
}
