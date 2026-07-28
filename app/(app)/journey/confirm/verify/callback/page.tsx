"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EhakbangHeader } from "@/components/layout/EhakbangHeader";
import { cn } from "@/lib/cn";

type Status = "loading" | "verified" | "failed";

function FaceVerifyCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event") ?? "";
  const target = searchParams.get("target");
  const title = searchParams.get("title");
  const description = searchParams.get("description");
  const [status, setStatus] = useState<Status>("loading");

  const carryParams = target
    ? (() => {
        const p = new URLSearchParams({ target });
        if (title) p.set("title", title);
        if (description) p.set("description", description);
        return p;
      })()
    : null;

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
          setStatus("verified");
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

  function handleContinue() {
    router.push(target ?? `/journey?event=${encodeURIComponent(eventId)}`);
  }

  function handleRetry() {
    // Clean up the failed token so a fresh session can be started
    sessionStorage.removeItem("ehakbang:liveness-token");
    router.push(
      carryParams
        ? `/journey/confirm/verify?${carryParams.toString()}`
        : `/journey/confirm/verify?event=${encodeURIComponent(eventId)}`,
    );
  }

  const backHref = carryParams
    ? `/journey/confirm/document?${carryParams.toString()}`
    : `/journey/confirm/document?event=${encodeURIComponent(eventId)}`;

  return (
    <main className="flex flex-1 flex-col">
      <EhakbangHeader backHref={backHref} />

      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Verify it&apos;s you
          </h1>
          <p className="mt-2 text-sm text-muted">
            {status === "loading" && "Checking your verification result\u2026"}
            {status === "verified" && "Your identity has been confirmed."}
            {status === "failed" && "Verification failed. Please try again."}
          </p>
        </div>

        <div
          className={cn(
            "flex h-40 w-40 items-center justify-center rounded-full border-4 text-5xl transition-colors",
            status === "loading" &&
              "animate-pulse border-egov-blue text-egov-blue",
            status === "verified" &&
              "border-egov-success bg-egov-success-bg text-egov-success",
            status === "failed" && "border-red-400 bg-red-50 text-red-500",
          )}
          aria-hidden
        >
          {status === "loading" && "🙂"}
          {status === "verified" && "✓"}
          {status === "failed" && "✗"}
        </div>

        {status === "verified" && (
          <>
            <p className="font-semibold text-egov-success">Identity Verified</p>
            <button
              type="button"
              onClick={handleContinue}
              className="min-h-11 w-full rounded-egov bg-egov-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
            >
              Continue
            </button>
          </>
        )}

        {status === "failed" && (
          <button
            type="button"
            onClick={handleRetry}
            className="min-h-11 w-full rounded-egov bg-egov-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
          >
            Try Again
          </button>
        )}
      </div>
    </main>
  );
}

export default function FaceVerifyCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 flex-col items-center justify-center">
          <p className="animate-pulse text-muted">Loading…</p>
        </main>
      }
    >
      <FaceVerifyCallbackContent />
    </Suspense>
  );
}
