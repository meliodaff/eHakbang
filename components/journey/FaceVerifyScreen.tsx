"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EhakbangHeader } from "@/components/layout/EhakbangHeader";
import { verifyFace } from "@/lib/api-client";
import { cn } from "@/lib/cn";

type VerifyState = "idle" | "scanning" | "verified";

/**
 * Third screen of the married-onboarding flow: confirms it's really the user
 * making this civil-status change.
 *
 * Mocked for now — {@link verifyFace} always succeeds after a short simulated
 * delay. Swap its implementation for a real face-liveness API later; this
 * component doesn't need to change.
 */
export function FaceVerifyScreen({ eventId }: { eventId?: string }) {
  const router = useRouter();
  const [state, setState] = useState<VerifyState>("idle");

  async function handleStart() {
    setState("scanning");
    await verifyFace();
    setState("verified");
  }

  function handleContinue() {
    router.push(`/journey?event=${encodeURIComponent(eventId ?? "")}`);
  }

  return (
    <main className="flex flex-1 flex-col">
      <EhakbangHeader
        backHref={`/journey/confirm/document?event=${encodeURIComponent(eventId ?? "")}`}
      />

      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Verify it&apos;s you
          </h1>
          <p className="mt-2 text-sm text-muted">
            To protect your records, please verify your identity before we
            apply this change.
          </p>
        </div>

        <div
          className={cn(
            "flex h-40 w-40 items-center justify-center rounded-full border-4 text-5xl transition-colors",
            state === "idle" && "border-egov-blue-100 text-muted",
            state === "scanning" && "animate-pulse border-egov-blue text-egov-blue",
            state === "verified" &&
              "border-egov-success bg-egov-success-bg text-egov-success",
          )}
          aria-hidden
        >
          {state === "verified" ? "✓" : "🙂"}
        </div>

        {state === "verified" && (
          <p className="font-semibold text-egov-success">Identity Verified</p>
        )}

        {state === "verified" ? (
          <button
            type="button"
            onClick={handleContinue}
            className="min-h-11 w-full rounded-egov bg-egov-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStart}
            disabled={state === "scanning"}
            className="min-h-11 w-full rounded-egov bg-egov-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue disabled:cursor-not-allowed disabled:bg-border disabled:text-muted"
          >
            {state === "scanning" ? "Scanning…" : "Start Face Verification"}
          </button>
        )}
      </div>
    </main>
  );
}
