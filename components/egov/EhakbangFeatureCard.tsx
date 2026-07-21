import Link from "next/link";
import { EhakbangIcon } from "./ServiceIcons";

/**
 * Carousel-style banner promoting the eHakbang service, styled like the eGov
 * home banners: a light card with a title block and a decorative panel.
 * (Original artwork — not copied from any app.) Links to the planner.
 */
export function EhakbangFeatureCard() {
  return (
    <Link
      href="/ehakbang"
      className="flex items-center gap-3 overflow-hidden rounded-egov-lg bg-egov-blue-050 p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
    >
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-extrabold tracking-tight text-egov-blue">
          eHakbang
          <span className="rounded bg-egov-yellow px-1 py-0.5 text-[9px] font-bold leading-none text-egov-navy">
            AI
          </span>
        </p>
        <p className="mt-1 text-base font-bold leading-snug text-foreground">
          Gabay sa Gobyerno
        </p>
        <p className="mt-0.5 text-xs text-muted">
          Step-by-step after any life event
        </p>
      </div>

      {/* Decorative panel (original) */}
      <div
        aria-hidden
        className="relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-egov bg-gradient-to-br from-egov-blue to-egov-navy text-white"
      >
        <span className="[&>svg]:h-8 [&>svg]:w-8">
          <EhakbangIcon />
        </span>
        <span className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-egov-yellow/60" />
      </div>
    </Link>
  );
}
