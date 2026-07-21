import { LanguageToggle } from "@/components/input/LanguageToggle";

/**
 * eGov-style dashboard header — a blue gradient banner with the brand,
 * a friendly greeting, and the tagline. Rounded bottom corners let the
 * search card overlap it, mirroring the eGovPH home dashboard.
 */
export function DashboardHeader() {
  return (
    <header className="rounded-b-egov-lg bg-gradient-to-b from-egov-navy to-egov-blue px-5 pb-12 pt-8 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-egov-blue-050">
          <span aria-hidden className="text-base">
            🇵🇭
          </span>
          <span>E-Hakbang</span>
        </div>
        <LanguageToggle />
      </div>
      <h1 className="mt-5 text-2xl font-bold leading-snug">
        Kumusta! Anong bago sa buhay mo?
      </h1>
      <p className="mt-1.5 text-egov-blue-050">
        Sabihin mo sa amin at gagabayan ka namin — hakbang-hakbang, hanggang
        matapos.
      </p>
    </header>
  );
}
