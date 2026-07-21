"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EhakbangHeader } from "@/components/layout/EhakbangHeader";
import { getLifeEventById } from "@/lib/events";

/**
 * First screen of the married-onboarding flow: confirms the user actually
 * just got married before asking for evidence and identity verification.
 */
export function ConfirmLifeEventScreen({ eventId }: { eventId?: string }) {
  const router = useRouter();
  const [declined, setDeclined] = useState(false);
  const event = eventId ? getLifeEventById(eventId) : undefined;

  function handleYes() {
    router.push(
      `/journey/confirm/document?event=${encodeURIComponent(eventId ?? "")}`,
    );
  }

  return (
    <main className="flex flex-1 flex-col">
      <EhakbangHeader backHref="/ehakbang" />

      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        <span className="text-5xl" aria-hidden>
          {event?.emoji ?? "💍"}
        </span>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Did you just get married?
          </h1>
          <p className="mt-2 text-sm text-muted">
            We&apos;ll help you update your civil status across government
            agencies.
          </p>
        </div>

        {declined ? (
          <div className="flex w-full flex-col gap-3 rounded-egov bg-egov-blue-050 p-4">
            <p className="text-sm font-medium text-foreground">
              This flow is for people who recently got married.
            </p>
            <Link
              href="/ehakbang"
              className="flex min-h-11 items-center justify-center rounded-egov border border-egov-blue px-4 py-2.5 text-sm font-semibold text-egov-blue transition-colors hover:bg-egov-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={() => setDeclined(true)}
              className="min-h-11 flex-1 rounded-egov border border-border px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
            >
              No
            </button>
            <button
              type="button"
              onClick={handleYes}
              className="min-h-11 flex-1 rounded-egov bg-egov-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
            >
              Yes
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
