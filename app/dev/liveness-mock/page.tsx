"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Dev-only stand-in for the external eGov Face Liveness capture page.
 * Only ever reached when EGOV liveness config is missing/unavailable and
 * NODE_ENV !== "production" (see lib/server/liveness.ts isLivenessMockEnabled).
 * Simulates the redirect-based flow so the app's own verification UI needs
 * no changes: after `delay` ms it bounces back to the real callback_url,
 * exactly like the real eGov page would after a successful capture.
 */
function LivenessMockContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callback_url");
  const delay = Number(searchParams.get("delay") ?? 3000);
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(delay / 1000));

  useEffect(() => {
    if (!callbackUrl) return;

    const tick = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);

    const redirect = setTimeout(() => {
      window.location.href = callbackUrl;
    }, delay);

    return () => {
      clearInterval(tick);
      clearTimeout(redirect);
    };
  }, [callbackUrl, delay]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-900 px-6 text-center text-white">
      <span className="rounded-full bg-yellow-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-yellow-300">
        Dev mock &middot; eGov liveness API unavailable
      </span>
      <div className="flex h-32 w-32 animate-pulse items-center justify-center rounded-full border-4 border-yellow-300 text-5xl">
        🙂
      </div>
      <p className="max-w-xs text-sm text-neutral-300">
        Simulating face liveness capture. This mock only runs outside
        production and always reports success.
      </p>
      {callbackUrl ? (
        <p className="text-xs text-neutral-500">
          Returning in {secondsLeft}s&hellip;
        </p>
      ) : (
        <p className="text-xs font-semibold text-red-400">
          Missing callback_url &mdash; cannot continue.
        </p>
      )}
    </main>
  );
}

export default function LivenessMockPage() {
  return (
    <Suspense fallback={null}>
      <LivenessMockContent />
    </Suspense>
  );
}
