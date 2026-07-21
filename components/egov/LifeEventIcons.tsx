import type { ReactNode } from "react";

/**
 * Monoline icons for life-event tiles (eGov style). All use `currentColor` so
 * they inherit the tile color. Keyed by LifeEvent id via `lifeEventIcon()`.
 */
const cls = "h-7 w-7";
const s = {
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none",
};

function Married() {
  return (
    <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden>
      <circle cx="9" cy="14.5" r="5" {...s} />
      <circle cx="15" cy="14.5" r="5" {...s} />
      <path d="m10.5 4 1.5 2 1.5-2M12 6v2.5" {...s} />
    </svg>
  );
}

function Baby() {
  return (
    <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4.2" {...s} />
      <circle cx="10.4" cy="8" r="0.6" fill="currentColor" />
      <circle cx="13.6" cy="8" r="0.6" fill="currentColor" />
      <path d="M10.6 10.2c.9.7 1.9.7 2.8 0" {...s} />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" {...s} />
    </svg>
  );
}

function JobLoss() {
  return (
    <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden>
      <rect x="3.5" y="8" width="17" height="11" rx="2" {...s} />
      <path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" {...s} />
      <path d="M3.5 13h17" {...s} />
    </svg>
  );
}

function Retired() {
  return (
    <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden>
      <path d="M3 18h18" {...s} />
      <circle cx="12" cy="13.5" r="3.8" {...s} />
      <path d="M12 5.5v1.6M5.6 8.1l1.1 1.1M18.4 8.1l-1.1 1.1M3.8 14H5.4M18.6 14h1.6" {...s} />
    </svg>
  );
}

function Business() {
  return (
    <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden>
      <path d="M4 9.5 5.2 5h13.6L20 9.5" {...s} />
      <path d="M4 9.5a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" {...s} />
      <path d="M5 11v8h14v-8" {...s} />
      <path d="M10 19v-4.5h4V19" {...s} />
    </svg>
  );
}

function Senior() {
  return (
    <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden>
      <circle cx="10" cy="4.8" r="2.1" {...s} />
      <path d="M10 7.2v6M10 10.5 7 12.5M10 13l-2.5 8M10 13l2.5 8" {...s} />
      <path d="M15.5 8v13" {...s} />
    </svg>
  );
}

function Pwd() {
  return (
    <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden>
      <circle cx="10.5" cy="4.6" r="1.9" {...s} />
      <path d="M10.5 7v5.5h4.5l2.2 4.2" {...s} />
      <circle cx="12" cy="16.5" r="4.6" {...s} />
    </svg>
  );
}

function Loss() {
  return (
    <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden>
      <path d="M12 20s-6.5-4.2-6.5-8.7A3.7 3.7 0 0 1 12 8.2a3.7 3.7 0 0 1 6.5 3.1C18.5 15.8 12 20 12 20Z" {...s} />
    </svg>
  );
}

function Graduated() {
  return (
    <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden>
      <path d="M2 9.5 12 5.5l10 4-10 4-10-4Z" {...s} />
      <path d="M6 11.5v4c0 1.2 2.7 2.2 6 2.2s6-1 6-2.2v-4" {...s} />
      <path d="M22 9.5v4.5" {...s} />
    </svg>
  );
}

function FirstJob() {
  return (
    <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden>
      <rect x="5" y="4" width="14" height="16" rx="2" {...s} />
      <path d="M10 4h4" {...s} />
      <circle cx="12" cy="10" r="2.4" {...s} />
      <path d="M8.4 17a3.6 3.6 0 0 1 7.2 0" {...s} />
    </svg>
  );
}

function Moved() {
  return (
    <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden>
      <path d="M4 11 12 5l8 6" {...s} />
      <path d="M6 10v9h12v-9" {...s} />
      <path d="M10 19v-5h4v5" {...s} />
    </svg>
  );
}

function Annulment() {
  return (
    <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden>
      <path d="M12 3v4M12 3 6 6.5M12 3l6 3.5" {...s} />
      <path d="M4.5 7 3 11a2.7 2.7 0 0 0 3 2.5A2.7 2.7 0 0 0 9 11L7.5 7" {...s} />
      <path d="M16.5 7 15 11a2.7 2.7 0 0 0 3 2.5 2.7 2.7 0 0 0 3-2.5L19.5 7" {...s} />
      <path d="M8 20h8M12 13.5V20" {...s} />
    </svg>
  );
}

const ICONS: Record<string, ReactNode> = {
  "got-married": <Married />,
  "had-a-baby": <Baby />,
  "lost-a-job": <JobLoss />,
  retired: <Retired />,
  "started-a-business": <Business />,
  "became-senior": <Senior />,
  "became-pwd": <Pwd />,
  "death-in-family": <Loss />,
  "just-graduated": <Graduated />,
  "first-job": <FirstJob />,
  "moved-residence": <Moved />,
  annulment: <Annulment />,
};

/** Returns the monoline icon for a life-event id (falls back to a briefcase). */
export function lifeEventIcon(id: string): ReactNode {
  return ICONS[id] ?? <JobLoss />;
}
