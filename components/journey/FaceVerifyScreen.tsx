"use client";

import { useState } from "react";
import { EhakbangHeader } from "@/components/layout/EhakbangHeader";
import { cn } from "@/lib/cn";

type VerifyState = "idle" | "loading" | "error";

/**
 * Third screen of the civil-status onboarding flow: redirects the user to the
 * eGov Face Liveness verification page. On completion, the eGov page redirects
 * back to /journey/confirm/verify/callback where the result is checked.
 */
export function FaceVerifyScreen({ eventId }: { eventId?: string }) {
  const [state, setState] = useState<VerifyState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleStart() {
    setState("loading");
    setErrorMsg(null);

    try {
      // Build the callback URL (where eGov redirects after liveness check).
      // We include the token in the URL after session creation so the callback
      // page can retrieve the result from the eGov API.
      const callbackBase = new URL(
        "/journey/confirm/verify/callback",
        window.location.origin,
      );
      if (eventId) {
        callbackBase.searchParams.set("event", eventId);
      }

      // Create a liveness session via our server-side proxy.
      // We pass a placeholder callback_url first, then reconstruct it with the token.
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

      // Store the token in sessionStorage so the callback page can retrieve it
      // even if eGov doesn't append it as a query param.
      sessionStorage.setItem("ehakbang:liveness-token", token);

      // Redirect the user to the eGov face liveness page
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
            state === "loading" &&
              "animate-pulse border-egov-blue text-egov-blue",
            state === "error" && "border-red-400 bg-red-50 text-red-500",
          )}
          aria-hidden
        >
          {state === "error" ? "\u2717" : "\uD83D\uDE42"}
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
            ? "Connecting\u2026"
            : state === "error"
              ? "Try Again"
              : "Start Face Verification"}
        </button>
      </div>
    </main>
  );
}
