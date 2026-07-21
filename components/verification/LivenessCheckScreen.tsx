"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n";

type Status = "idle" | "loading" | "error";

/**
 * Verification gate — Step 2 of 2.
 *
 * Redirects the user to the eGov Face Liveness page. On completion, the eGov
 * page redirects back to /journey/liveness/callback where the result is checked.
 */
export function LivenessCheckScreen({ eventId }: { eventId?: string }) {
  const t = useT();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function startCheck() {
    setStatus("loading");
    setErrorMsg(null);

    try {
      // Build the callback URL (where eGov redirects after liveness check)
      const callbackUrl = new URL(
        "/journey/liveness/callback",
        window.location.origin,
      );
      if (eventId) {
        callbackUrl.searchParams.set("event", eventId);
      }

      // Create a liveness session via our server-side proxy
      const res = await fetch("/api/liveness/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_url: callbackUrl.toString(),
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
      setStatus("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Something went wrong",
      );
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-5 px-6 py-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-egov-blue">
        {t("Verification \u00b7 Step 2 of 2")}
      </p>

      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold text-egov-navy">{t("Liveness check")}</h1>
        <p className="text-muted">
          {t("Verify that you are the one performing this step.")}
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
              {t("Press \u201cStart\u201d to begin face verification.")}
            </span>
          </>
        )}
        {status === "loading" && (
          <>
            <span aria-hidden className="text-5xl motion-safe:animate-pulse">🔍</span>
            <span className="font-semibold text-egov-blue">
              {t("Connecting\u2026 please wait.")}
            </span>
          </>
        )}
        {status === "error" && (
          <>
            <span aria-hidden className="text-5xl">❌</span>
            <span className="font-semibold text-red-500">
              {errorMsg ?? t("Something went wrong")}
            </span>
          </>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <button
          type="button"
          disabled={status === "loading"}
          onClick={startCheck}
          className="min-h-12 rounded-egov bg-egov-blue px-5 py-3 text-center font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "loading"
            ? t("Connecting\u2026 please wait.")
            : status === "error"
              ? t("Try Again")
              : t("Start liveness check")}
        </button>
      </div>
    </main>
  );
}
