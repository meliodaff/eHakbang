"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden className="h-4.5 w-4.5">
    <path
      fill="#4285F4"
      d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.48a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.56-5.17 3.56-8.82Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.96-1.07 7.96-2.91l-3.88-3c-1.08.72-2.46 1.16-4.08 1.16-3.13 0-5.79-2.12-6.74-4.96H1.25v3.09A12 12 0 0 0 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.26 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.25a12 12 0 0 0 0 10.76l4.01-3.09Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.6 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.25 6.62l4.01 3.09C6.21 6.87 8.87 4.75 12 4.75Z"
    />
  </svg>
);

/** "Continue with Google" — signInWithOAuth needs a real browser redirect, so this can't be a Server Action. */
export function GoogleSignInButton() {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={cn(
        "flex items-center justify-center gap-2 rounded-egov border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue",
        pending && "opacity-60",
      )}
    >
      <GoogleIcon />
      {pending ? "Redirecting…" : "Continue with Google"}
    </button>
  );
}
