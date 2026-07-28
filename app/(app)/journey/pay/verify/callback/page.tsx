"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EhakbangHeader } from "@/components/layout/EhakbangHeader";
import { cn } from "@/lib/cn";

type Status = "loading" | "verified" | "failed";

const PAY_VERIFY_TOKEN_KEY = "ehakbang:pay-verify-token";
const RESUME_PAY_KEY = "ehakbang:resume-pay";
const PAYMENT_VERIFIED_TOKEN_KEY = "ehakbang:payment-verified-token";

function PayVerifyCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event") ?? "";
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const token =
      sessionStorage.getItem(PAY_VERIFY_TOKEN_KEY) ??
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
          sessionStorage.removeItem(PAY_VERIFY_TOKEN_KEY);
          sessionStorage.setItem(PAYMENT_VERIFIED_TOKEN_KEY, token!);
          sessionStorage.setItem(RESUME_PAY_KEY, eventId);
          setStatus("verified");
        } else {
          setStatus("failed");
        }
      } catch {
        setStatus("failed");
      }
    }

    checkResult();
  }, [searchParams, eventId]);

  function handleContinue() {
    router.push(`/journey?event=${encodeURIComponent(eventId)}`);
  }

  function handleRetry() {
    sessionStorage.removeItem(PAY_VERIFY_TOKEN_KEY);
    router.push(`/journey/pay/verify?event=${encodeURIComponent(eventId)}`);
  }

  return (
    <main className="flex flex-1 flex-col">
      <EhakbangHeader backHref={`/journey?event=${encodeURIComponent(eventId)}`} />

      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Verify it&apos;s you
          </h1>
          <p className="mt-2 text-sm text-muted">
            {status === "loading" && "Checking your verification result…"}
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
              Continue to payment
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

export default function PayVerifyCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 flex-col items-center justify-center">
          <p className="animate-pulse text-muted">Loading…</p>
        </main>
      }
    >
      <PayVerifyCallbackContent />
    </Suspense>
  );
}
