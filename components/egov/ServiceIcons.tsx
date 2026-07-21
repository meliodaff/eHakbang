/**
 * Monoline service icons (eGov-style). All use `currentColor` so they inherit
 * the tile's text color (blue on pale tiles, white on the highlighted tile).
 */
const base = "h-7 w-7";
const stroke = {
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none",
};

export function EhakbangIcon() {
  return (
    <svg viewBox="0 0 24 24" className={base} fill="none" aria-hidden>
      {/* clipboard body */}
      <rect x="5" y="5" width="14" height="16" rx="2.2" {...stroke} />
      {/* clip */}
      <path d="M9 5V4a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 4v1" {...stroke} />
      {/* checked steps */}
      <path d="m8.5 11 1.4 1.4L12.7 10" {...stroke} />
      <path d="m8.5 16 1.4 1.4L12.7 15" {...stroke} />
      <path d="M15 11.5h1.5M15 16.5h1.5" {...stroke} />
    </svg>
  );
}

export function HealthIcon() {
  return (
    <svg viewBox="0 0 24 24" className={base} fill="none" aria-hidden>
      <path
        d="M12 20.2s-7-4.4-9-8.4C1.4 8.6 3 5.5 6 5a4.4 4.4 0 0 1 6 1.6A4.4 4.4 0 0 1 18 5c3 .5 4.6 3.6 3 6.8-2 4-9 8.4-9 8.4Z"
        {...stroke}
      />
      <path d="M6.5 12h2.3l1.4-2.6 1.6 4.6 1.3-2h3.4" {...stroke} />
    </svg>
  );
}

export function ReportIcon() {
  return (
    <svg viewBox="0 0 24 24" className={base} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" {...stroke} />
      <path d="M12 7.5v5.5" {...stroke} />
      <circle cx="12" cy="16.3" r="1" fill="currentColor" />
    </svg>
  );
}

export function JobsIcon() {
  return (
    <svg viewBox="0 0 24 24" className={base} fill="none" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="2.5" {...stroke} />
      <path d="M8 9h5M8 12.5h8M8 16h8" {...stroke} />
    </svg>
  );
}

export function WeatherIcon() {
  return (
    <svg viewBox="0 0 24 24" className={base} fill="none" aria-hidden>
      <path
        d="M8 17.5h9a3.5 3.5 0 0 0 .4-6.98A5.5 5.5 0 0 0 7.2 9.1 4 4 0 0 0 8 17.5Z"
        {...stroke}
      />
    </svg>
  );
}

export function LocationPinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden>
      <path
        d="M12 21s-6.5-5.6-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.4-6.5 11-6.5 11Z"
        {...stroke}
      />
      <circle cx="12" cy="10" r="2.1" {...stroke} />
    </svg>
  );
}

export function SignalIcon() {
  return (
    <svg viewBox="0 0 24 24" className={base} fill="none" aria-hidden>
      <path d="M4 17.5a8 8 0 0 1 16 0" {...stroke} />
      <path d="M12 17.5 15.2 11" {...stroke} />
      <circle cx="12" cy="17.5" r="1.1" fill="currentColor" stroke="none" />
      <path d="M4 17.5h1.4M18.6 17.5H20M6.3 11.8l1 1M17.7 11.8l-1 1" {...stroke} />
    </svg>
  );
}

export function TravelIcon() {
  return (
    <svg viewBox="0 0 24 24" className={base} fill="none" aria-hidden>
      <rect x="6" y="8" width="12" height="11" rx="2" {...stroke} />
      <path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M12 12v3" {...stroke} />
    </svg>
  );
}

export function NgaIcon() {
  return (
    <svg viewBox="0 0 24 24" className={base} fill="none" aria-hidden>
      <path d="M4 10 12 4l8 6M5 10v9h14v-9" {...stroke} />
      <path d="M9 19v-5h6v5" {...stroke} />
    </svg>
  );
}

export function LguIcon() {
  return (
    <svg viewBox="0 0 24 24" className={base} fill="none" aria-hidden>
      <path d="M5 20V6l7-2 7 2v14" {...stroke} />
      <path d="M9 9h.01M12 9h.01M15 9h.01M9 13h.01M12 13h.01M15 13h.01" {...stroke} />
    </svg>
  );
}

export function AiIcon() {
  return (
    <svg viewBox="0 0 24 24" className={base} fill="none" aria-hidden>
      <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" {...stroke} />
      <path d="M18.5 14.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" {...stroke} />
    </svg>
  );
}

export function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" className={base} fill="none" aria-hidden>
      <path d="M9 6.5h11M9 12h11M9 17.5h11" {...stroke} />
      <circle cx="4.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="17.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className={base} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" {...stroke} />
      <path d="M10 8.5 14 12l-4 3.5" {...stroke} />
    </svg>
  );
}

export function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" className={base} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" {...stroke} />
      <path d="M12 11v5" {...stroke} />
      <circle cx="12" cy="7.75" r="1.05" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IdCardIcon() {
  return (
    <svg viewBox="0 0 24 24" className={base} fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2.2" {...stroke} />
      <circle cx="8.5" cy="11" r="2" {...stroke} />
      <path d="M5.8 16a2.8 2.8 0 0 1 5.4 0M14 9.5h4M14 13h3" {...stroke} />
    </svg>
  );
}
