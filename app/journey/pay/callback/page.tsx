"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EhakbangHeader } from "@/components/layout/EhakbangHeader";
import { cn } from "@/lib/cn";
import { fetchPaymentStatus } from "@/lib/api-client";
import { getStoredJourney, markStepsPaid } from "@/lib/journey-store";
import { EVENT_JOURNEYS } from "@/lib/event-journeys";

type Status = "loading" | "paid" | "unconfirmed" | "failed";

const PENDING_PAYMENT_KEY = "ehakbang:pending-payment";
const RESUME_AUTO_APPLY_KEY = "ehakbang:resume-auto-apply";
const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 2000;

interface PendingPayment {
  uuid: string;
  journeyId: string;
  eventId: string;
  stepNumbers: number[];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event") ?? "";
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    const raw = sessionStorage.getItem(PENDING_PAYMENT_KEY);
    if (!raw) {
      setStatus("failed");
      return;
    }

    let pending: PendingPayment;
    try {
      pending = JSON.parse(raw);
    } catch {
      setStatus("failed");
      return;
    }

    let cancelled = false;

    async function checkResult() {
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        try {
          const result = await fetchPaymentStatus(pending.uuid);
          if (result.paid) {
            // Never mark a step paid on anything less than a confirmed
            // paid_at from eGovPay (see /api/payment/[uuid]).
            const catalog = EVENT_JOURNEYS[pending.eventId];
            const base = getStoredJourney(pending.journeyId) ?? catalog;
            if (base) markStepsPaid(base, pending.stepNumbers);
            sessionStorage.removeItem(PENDING_PAYMENT_KEY);
            sessionStorage.setItem(RESUME_AUTO_APPLY_KEY, pending.journeyId);
            if (!cancelled) setStatus("paid");
            return;
          }
        } catch {
          if (!cancelled) setStatus("failed");
          return;
        }
        if (attempt < MAX_ATTEMPTS - 1) await delay(RETRY_DELAY_MS);
      }
      if (!cancelled) setStatus("unconfirmed");
    }

    void checkResult();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleContinue() {
    router.push(`/journey?event=${encodeURIComponent(eventId)}`);
  }

  function handleCheckAgain() {
    setStatus("loading");
    window.location.reload();
  }

  return (
    <main className="flex flex-1 flex-col">
      <EhakbangHeader backHref={`/journey?event=${encodeURIComponent(eventId)}`} />

      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        <div>
          <h1 className="text-xl font-bold text-foreground">Payment status</h1>
          <p className="mt-2 text-sm text-muted">
            {status === "loading" && "Checking your payment…"}
            {status === "paid" && "Your payment has been confirmed."}
            {status === "unconfirmed" &&
              "We couldn't confirm your payment yet. It may still be processing."}
            {status === "failed" &&
              "Something went wrong checking your payment."}
          </p>
        </div>

        <div
          className={cn(
            "flex h-40 w-40 items-center justify-center rounded-full border-4 text-5xl transition-colors",
            status === "loading" &&
              "animate-pulse border-egov-blue text-egov-blue",
            status === "paid" &&
              "border-egov-success bg-egov-success-bg text-egov-success",
            (status === "unconfirmed" || status === "failed") &&
              "border-egov-warning bg-egov-warning-bg text-egov-warning",
          )}
          aria-hidden
        >
          {status === "loading" && "💳"}
          {status === "paid" && "✓"}
          {(status === "unconfirmed" || status === "failed") && "!"}
        </div>

        {status === "paid" && (
          <button
            type="button"
            onClick={handleContinue}
            className="min-h-11 w-full rounded-egov bg-egov-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
          >
            Continue
          </button>
        )}

        {status === "unconfirmed" && (
          <div className="flex w-full flex-col gap-2">
            <button
              type="button"
              onClick={handleCheckAgain}
              className="min-h-11 w-full rounded-egov bg-egov-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
            >
              Check again
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className="min-h-11 w-full rounded-egov border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
            >
              Continue anyway
            </button>
          </div>
        )}

        {status === "failed" && (
          <button
            type="button"
            onClick={handleContinue}
            className="min-h-11 w-full rounded-egov bg-egov-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
          >
            Back to journey
          </button>
        )}
      </div>
    </main>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 flex-col items-center justify-center">
          <p className="animate-pulse text-muted">Loading…</p>
        </main>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}
