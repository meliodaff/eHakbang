/**
 * Greeting card (eGov home pattern). E-Hakbang collects no personal data, so
 * instead of a user's name/number it shows a warm, generic greeting and a
 * decorative panel (original artwork — not copied from any app).
 */
export function GreetingCard() {
  return (
    <div className="mx-5 mt-1 flex items-center gap-4 rounded-egov-lg bg-surface-muted p-4">
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold text-foreground">Kumusta, Kababayan!</p>
        <p className="mt-0.5 text-sm text-muted">
          Anong bago sa buhay mo? Gagabayan ka namin.
        </p>
      </div>

      {/* Decorative sunrise + flag motif */}
      <div
        aria-hidden
        className="relative flex h-16 w-24 shrink-0 items-end justify-center overflow-hidden rounded-egov bg-gradient-to-b from-sky-200 to-amber-100"
      >
        <span className="absolute left-1/2 top-2 h-7 w-7 -translate-x-1/2 rounded-full bg-egov-yellow" />
        <span className="mb-1 text-2xl">🏝️</span>
      </div>
    </div>
  );
}
