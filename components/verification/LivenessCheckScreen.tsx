"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "idle" | "scanning" | "passed";

/**
 * Verification gate — Step 2 of 2 (PROTOTYPE).
 *
 * A mocked liveness check meant to confirm the person present is the real user.
 * There is NO camera, NO biometric capture, and NO API — pressing "Start" just
 * simulates a short scan and auto-passes. See {@link ../../lib/verification.ts}
 * for the privacy caveat before wiring a real liveness provider.
 */
export function LivenessCheckScreen({ eventId }: { eventId?: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");

  const nextHref = eventId
    ? `/journey?event=${encodeURIComponent(eventId)}`
    : "/journey";

  function startCheck() {
    // STUB: mock liveness — auto-pass after a short simulated scan.
    setStatus("scanning");
    setTimeout(() => setStatus("passed"), 1500);
  }

  return (
    <main className="flex flex-1 flex-col gap-5 px-6 py-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-egov-blue">
        Verification · Step 2 of 2
      </p>

      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold text-egov-navy">Liveness check</h1>
        <p className="text-muted">
          I-verify na ikaw mismo ang gumagawa ng hakbang na ito.
        </p>
      </div>

      <div
        className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-egov bg-surface-muted text-center"
        aria-live="polite"
      >
        {status === "idle" && (
          <>
            <span aria-hidden className="text-5xl">📷</span>
            <span className="text-muted">
              Iharap ang mukha sa camera at pindutin ang &ldquo;Simulan&rdquo;.
            </span>
          </>
        )}
        {status === "scanning" && (
          <>
            <span aria-hidden className="text-5xl motion-safe:animate-pulse">🔍</span>
            <span className="font-semibold text-egov-blue">
              Sinusuri… huwag gumalaw.
            </span>
          </>
        )}
        {status === "passed" && (
          <>
            <span aria-hidden className="text-5xl">✅</span>
            <span className="font-semibold text-egov-success">
              Na-verify ang pagkakakilanlan
            </span>
          </>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <p className="rounded-egov bg-egov-warning-bg px-4 py-3 text-sm text-egov-warning">
          Demo lang: walang camera o biometric na kinukuha. Awtomatikong pumapasa
          ang check na ito.
        </p>

        {status !== "passed" ? (
          <button
            type="button"
            disabled={status === "scanning"}
            onClick={startCheck}
            className="min-h-12 rounded-egov bg-egov-blue px-5 py-3 text-center font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "scanning" ? "Sinusuri…" : "Simulan ang liveness check"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => router.push(nextHref)}
            className="min-h-12 rounded-egov bg-egov-blue px-5 py-3 text-center font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
          >
            Ipagpatuloy ang journey
          </button>
        )}
      </div>
    </main>
  );
}
