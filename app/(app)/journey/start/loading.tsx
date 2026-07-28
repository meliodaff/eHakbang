/**
 * Shown automatically (via React Suspense) while `page.tsx`'s async work is
 * in flight -- almost always the AI generation call, since the
 * already-started-journey shortcut resolves near-instantly.
 */
export default function JourneyStartLoading() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      <span aria-hidden className="text-4xl motion-safe:animate-pulse">
        ✨
      </span>
      <p className="text-base font-semibold text-egov-navy" aria-live="polite">
        Generating requirements…
      </p>
      <p className="text-sm text-muted">
        Please wait while we prepare your checklist.
      </p>
    </main>
  );
}
