"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/* ---------------------------------- icons --------------------------------- */
const iconProps = {
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none",
};
const cls = "h-6 w-6";

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" className={cls} aria-hidden {...iconProps}>
    <path d="M3 10.5 12 3l9 7.5M5.25 9.75V20a1 1 0 0 0 1 1H9.5v-5.5h5V21h3.25a1 1 0 0 0 1-1V9.75" />
  </svg>
);
const ScanIcon = () => (
  <svg viewBox="0 0 24 24" className={cls} aria-hidden {...iconProps}>
    <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16" />
  </svg>
);
const ListIcon = () => (
  <svg viewBox="0 0 24 24" className={cls} aria-hidden {...iconProps}>
    <path d="M8 6h11M8 12h11M8 18h11" />
    <circle cx="4" cy="6" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="4" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="4" cy="18" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);
const HistoryIcon = () => (
  <svg viewBox="0 0 24 24" className={cls} aria-hidden {...iconProps}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6M6 3v3.5h3.5M12 8v4l3 2" />
  </svg>
);
const AccountIcon = () => (
  <svg viewBox="0 0 24 24" className={cls} aria-hidden {...iconProps}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </svg>
);
const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" className={cls} aria-hidden {...iconProps}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const InfoIcon = () => (
  <svg viewBox="0 0 24 24" className={cls} aria-hidden {...iconProps}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <circle cx="12" cy="7.75" r="1.05" fill="currentColor" stroke="none" />
  </svg>
);
const IdIcon = () => (
  <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden {...iconProps}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <circle cx="8.5" cy="11" r="2" />
    <path d="M5.8 16a2.8 2.8 0 0 1 5.4 0M14 9.5h4M14 13h3" />
  </svg>
);

/* --------------------------------- pieces --------------------------------- */
function TabLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue",
        active ? "text-egov-blue" : "text-muted hover:text-foreground",
      )}
    >
      <span aria-hidden>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

/** Representative (demo) tab — visible host chrome that does not navigate. */
function TabStub({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={`${label} (demo)`}
      className="flex min-h-14 flex-1 cursor-default flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium text-muted"
    >
      <span aria-hidden>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function Fab({
  label,
  href = "/ehakbang",
  ariaLabel = "Open eHakbang",
}: {
  label: string;
  href?: string;
  ariaLabel?: string;
}) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-end pb-1.5">
      <Link
        href={href}
        aria-label={ariaLabel}
        className="absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full bg-egov-blue text-white shadow-lg ring-4 ring-surface transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
      >
        <IdIcon />
      </Link>
      <span className="mt-9 text-[11px] font-medium text-egov-blue">{label}</span>
    </div>
  );
}

/* ---------------------------------- bar ----------------------------------- */
export function BottomTabBar() {
  const pathname = usePathname() ?? "/";
  const isHost = pathname === "/";

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-md items-stretch border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(16,35,58,0.06)]"
    >
      {isHost ? (
        <>
          <TabLink href="/" label="Home" icon={<HomeIcon />} active />
          <TabStub label="Scan QR" icon={<ScanIcon />} />
          <Fab label="Digital ID" href="/wallet" ariaLabel="Open my ID Wallet" />
          <TabStub label="History" icon={<HistoryIcon />} />
          <TabLink
            href="/account"
            label="Account"
            icon={<AccountIcon />}
            active={pathname.startsWith("/account")}
          />
        </>
      ) : (
        <>
          <TabLink
            href="/"
            label="Home"
            icon={<HomeIcon />}
            active={false}
          />
          <Fab label="New" />
          <TabLink
            href="/journeys"
            label="My Journeys"
            icon={<ListIcon />}
            active={pathname.startsWith("/journeys")}
          />
        </>
      )}
    </nav>
  );
}
