"use client";

import { useState } from "react";
import { EhakbangHeader } from "@/components/layout/EhakbangHeader";
import { cn } from "@/lib/cn";

type VerifyState = "idle" | "loading" | "error";

const PAY_VERIFY_TOKEN_KEY = "ehakbang:pay-verify-token";

/**
 * Redirects the user to the eGov Face Liveness verification page before a
 * government-fee payment is started. On completion, eGov redirects back to
 * /journey/pay/verify/callback where the result is checked.
 */
export function PayVerifyScreen({ eventId }: { eventId?: string }) {
  const [state, setState] = useState<VerifyState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleStart() {
    setState("loading");
    setErrorMsg(null);

    try {
      const callbackBase = new URL(
        "/journey/pay/verify/callback",
        window.location.origin,
      );
      if (eventId) {
        callbackBase.searchParams.set("event", eventId);
      }

      const res = await fetch("/api/liveness/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_url: callbackBase.toString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create liveness session");
      }

      const { token, url }: { token: string; url: string } = await res.json();

      sessionStorage.setItem(PAY_VERIFY_TOKEN_KEY, token);

      window.location.href = url;
    } catch (err) {
      setState("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Something went wrong",
      );
    }
  }

  return (
    <main className="flex flex-1 flex-col">
      <EhakbangHeader
        backHref={`/journey?event=${encodeURIComponent(eventId ?? "")}`}
      />

      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Verify it&apos;s you
          </h1>
          <p className="mt-2 text-sm text-muted">
            To protect your payment, please verify your identity before
            paying government fees.
          </p>
        </div>

        <div
          className={cn(
            "flex h-40 w-40 items-center justify-center rounded-full border-4 text-5xl transition-colors",
            state === "idle" && "border-egov-blue-100 text-muted",
            state === "loading" &&
              "animate-pulse border-egov-blue text-egov-blue",
            state === "error" && "border-red-400 bg-red-50 text-red-500",
          )}
          aria-hidden
        >
          {state === "error" ? "✗" : "🙂"}
        </div>

        {state === "error" && errorMsg && (
          <p className="text-sm font-medium text-red-500">{errorMsg}</p>
        )}

        <button
          type="button"
          onClick={handleStart}
          disabled={state === "loading"}
          className="min-h-11 w-full rounded-egov bg-egov-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue disabled:cursor-not-allowed disabled:bg-border disabled:text-muted"
        >
          {state === "loading"
            ? "Connecting…"
            : state === "error"
              ? "Try Again"
              : "Start Face Verification"}
        </button>
      </div>
    </main>
  );
}
