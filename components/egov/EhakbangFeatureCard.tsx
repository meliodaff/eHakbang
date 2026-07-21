import Link from "next/link";

/**
 * Prominent entry point for the E-Hakbang service on the eGov host home.
 * This is the main call-to-action button that launches the journey planner.
 */
export function EhakbangFeatureCard() {
  return (
    <Link
      href="/ehakbang"
      className="flex items-center gap-4 rounded-egov-lg bg-gradient-to-r from-egov-navy to-egov-blue p-4 text-white shadow-md transition-transform hover:scale-[1.01] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
    >
      <span
        aria-hidden
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-egov bg-white/15 text-3xl"
      >
        🧭
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-bold">
          E-Hakbang
          <span className="rounded-full bg-egov-yellow px-1.5 py-0.5 text-[10px] font-bold leading-none text-egov-navy">
            AI
          </span>
        </p>
        <p className="mt-0.5 text-sm text-egov-blue-050">
          Anong dapat gawin pagkatapos ng life event? Alamin dito.
        </p>
      </div>
      <span aria-hidden className="text-xl">
        →
      </span>
    </Link>
  );
}
