import Link from "next/link";

/**
 * "Continue with eGov" — a plain navigation to /auth/egov/start, which
 * redirects to the real eGov login (once configured) or the dev
 * paste-exchange-code fallback. No client JS needed, unlike Google's
 * signInWithOAuth (which needs a browser-side supabase-js call).
 */
export function EgovSignInButton() {
  return (
    <Link
      href="/auth/egov/start"
      className="flex items-center justify-center gap-2 rounded-egov border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
    >
      <span aria-hidden className="text-base">
        🇵🇭
      </span>
      Continue with eGov
    </Link>
  );
}
