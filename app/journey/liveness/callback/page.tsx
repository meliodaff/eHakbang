"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EhakbangHeader } from "@/components/layout/EhakbangHeader";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/cn";

type Status = "loading" | "passed" | "failed";

function LivenessCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();
  const eventId = searchParams.get("event") ?? "";
  const [status, setStatus] = useState<Status>("loading");

  const nextHref = eventId
    ? `/journey?event=${encodeURIComponent(eventId)}`
    : "/journey";

  const retryHref = eventId
    ? `/journey/liveness?event=${encodeURIComponent(eventId)}`
    : "/journey/liveness";

  const backHref = eventId
    ? `/journey/verify?event=${encodeURIComponent(eventId)}`
    : "/journey/verify";

  useEffect(() => {
    // Resolve the liveness session token. Priority:
    // 1. sessionStorage (set before redirect)
    // 2. "token" query param (if eGov appends it)
    // 3. "sessionToken" query param (alternate param name)
    const token =
      sessionStorage.getItem("ehakbang:liveness-token") ??
      searchParams.get("token") ??
      searchParams.get("sessionToken");

    if (!token) {
      setStatus("failed");
      return;
    }

    async function checkResult() {
      try {
        const res = await fetch(`/api/liveness/result/${encodeURIComponent(token!)}`);
        if (!res.ok) {
          setStatus("failed");
          return;
        }
        const data: { verified: boolean } = await res.json();
        if (data.verified) {
          setStatus("passed");
          // Clean up the stored token
          sessionStorage.removeItem("ehakbang:liveness-token");
        } else {
          setStatus("failed");
        }
      } catch {
        setStatus("failed");
      }
    }

    checkResult();
  }, [searchParams]);

  return (
    <>
      <EhakbangHeader backHref={backHref} />
      <main className="flex flex-1 flex-col gap-5 px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-egov-blue">
          {t("Verification \u00b7 Step 2 of 2")}
        </p>

        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-egov-navy">
            {t("Liveness check")}
          </h1>
          <p className="text-muted">
            {status === "loading" && t("Checking your verification result\u2026")}
            {status === "passed" && t("Your identity has been confirmed.")}
            {status === "failed" && t("Verification failed. Please try again.")}
          </p>
        </div>

        <div
          className={cn(
            "flex min-h-56 flex-col items-center justify-center gap-3 rounded-egov bg-surface-muted text-center",
          )}
          aria-live="polite"
        >
          {status === "loading" && (
            <>
              <span aria-hidden className="text-5xl motion-safe:animate-pulse">
                🔍
              </span>
              <span className="font-semibold text-egov-blue">
                {t("Verifying\u2026 please wait.")}
              </span>
            </>
          )}
          {status === "passed" && (
            <>
              <span aria-hidden className="text-5xl">
                ✅
              </span>
              <span className="font-semibold text-egov-success">
                {t("Identity verified")}
              </span>
            </>
          )}
          {status === "failed" && (
            <>
              <span aria-hidden className="text-5xl">
                ❌
              </span>
              <span className="font-semibold text-red-500">
                {t("Verification failed")}
              </span>
            </>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-3">
          {status === "passed" && (
            <button
              type="button"
              onClick={() => router.push(nextHref)}
              className="min-h-12 rounded-egov bg-egov-blue px-5 py-3 text-center font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
            >
              {t("Continue journey")}
            </button>
          )}
          {status === "failed" && (
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem("ehakbang:liveness-token");
                router.push(retryHref);
              }}
              className="min-h-12 rounded-egov bg-egov-blue px-5 py-3 text-center font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
            >
              {t("Try Again")}
            </button>
          )}
        </div>
      </main>
    </>
  );
}

export default function LivenessCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 flex-col items-center justify-center">
          <p className="animate-pulse text-muted">Loading…</p>
        </main>
      }
    >
      <LivenessCallbackContent />
    </Suspense>
  );
}
