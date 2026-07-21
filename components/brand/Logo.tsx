import { cn } from "@/lib/cn";

/**
 * E-Hakbang logo mark — an app-icon badge with ascending steps ("hakbang")
 * climbing toward a goal dot: step-by-step progress through government.
 * Original artwork.
 */
export function EhakbangMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="E-Hakbang"
    >
      <defs>
        <linearGradient id="eh-mark-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1b5fe0" />
          <stop offset="1" stopColor="#0f3d99" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#eh-mark-grad)" />
      {/* ascending steps */}
      <g fill="#ffffff">
        <rect x="10" y="29.5" width="8" height="8" rx="1.6" />
        <rect x="20" y="23.5" width="8" height="14" rx="1.6" />
        <rect x="30" y="17.5" width="8" height="20" rx="1.6" />
      </g>
      {/* goal */}
      <circle cx="34" cy="12" r="3.2" fill="#fcd116" />
    </svg>
  );
}

/**
 * Full horizontal lockup: mark + "E-Hakbang" wordmark.
 * `onDark` switches the wordmark to white for use on blue headers.
 */
export function EhakbangLogo({
  className,
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <EhakbangMark className="h-8 w-8" />
      <span className="text-xl font-extrabold tracking-tight">
        {onDark ? (
          <span className="text-white">E-Hakbang</span>
        ) : (
          <>
            <span className="text-egov-blue">E-</span>
            <span className="text-egov-navy">Hakbang</span>
          </>
        )}
      </span>
    </span>
  );
}
