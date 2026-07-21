import Link from "next/link";
import { LanguageToggle } from "@/components/input/LanguageToggle";

/**
 * eGov-style top app bar: brand wordmark on the left, language toggle + info
 * action on the right, with an optional back button. Reused by both the eGov
 * host home and the E-Hakbang service screens.
 */
export function TopAppBar({
  brand = "E-Hakbang",
  backHref,
}: {
  brand?: string;
  backHref?: string;
}) {
  return (
    <div className="flex items-center justify-between bg-surface px-5 pb-2 pt-4">
      <div className="flex items-center gap-1">
        {backHref && (
          <Link
            href={backHref}
            aria-label="Back"
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-egov-blue-050 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
          >
            <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6" fill="none">
              <path
                d="M15 5l-7 7 7 7"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        )}
        <Link
          href="/"
          className="flex items-baseline gap-0.5 text-xl font-extrabold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
        >
          <span className="text-egov-blue">{brand}</span>
          <span aria-hidden className="text-base">
            🇵🇭
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <LanguageToggle />
        <Link
          href="/about"
          aria-label="About E-Hakbang"
          className="flex h-10 w-10 items-center justify-center rounded-full text-egov-blue transition-colors hover:bg-egov-blue-050 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
        >
          <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            <path
              d="M12 11v5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <circle cx="12" cy="7.75" r="1.15" fill="currentColor" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
