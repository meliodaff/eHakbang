"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { getVerificationCopy } from "@/lib/verification";
import { useT } from "@/lib/i18n";

/**
 * Verification gate — Step 1 of 2 (PROTOTYPE).
 *
 * The citizen "uploads" a document proving their eligibility (e.g. a graduation
 * record, or proof of new address for a move). For now the upload is
 * auto-accepted the moment a file is chosen — no validation, no storage, no
 * API. Copy is event-aware via {@link getVerificationCopy}. See {@link
 * ../../lib/verification.ts} for the privacy caveat on real implementation.
 */
export function DocumentVerifyScreen({ eventId }: { eventId?: string }) {
  const router = useRouter();
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const copy = getVerificationCopy(eventId);
  const nextHref = eventId
    ? `/journey/liveness?event=${encodeURIComponent(eventId)}`
    : "/journey/liveness";

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    // STUB: any chosen document is auto-accepted (flow prototype only).
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  }

  return (
    <main className="flex flex-1 flex-col gap-5 px-6 py-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-egov-blue">
        {t("Verification · Step 1 of 2")}
      </p>

      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold text-egov-navy">{t(copy.documentTitle)}</h1>
        <p className="text-muted">{t(copy.documentDescription)}</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileChange}
        className="sr-only"
        aria-label="Upload verification document"
      />

      {!fileName ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-egov border-2 border-dashed border-border bg-surface-muted px-6 py-8 text-center text-muted transition-colors hover:border-egov-blue hover:text-egov-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
        >
          <span aria-hidden className="text-3xl">📄</span>
          <span className="font-semibold">{t("Choose a document")}</span>
          <span className="text-xs">{t(copy.uploadHint)}</span>
        </button>
      ) : (
        <div className="flex items-center gap-3 rounded-egov bg-egov-success-bg px-4 py-4 text-egov-success">
          <span aria-hidden className="text-2xl">✓</span>
          <div className="flex flex-col">
            <span className="font-semibold">{t("Document accepted")}</span>
            <span className="truncate text-sm text-muted">{fileName}</span>
          </div>
        </div>
      )}

      {fileName && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="self-start text-sm font-semibold text-egov-blue underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
        >
          {t("Change document")}
        </button>
      )}

      <div className="mt-auto flex flex-col gap-3">
        <p className="rounded-egov bg-egov-warning-bg px-4 py-3 text-sm text-egov-warning">
          {t(
            "Demo only: any document is auto-accepted. Nothing is saved or uploaded to a server.",
          )}
        </p>
        <button
          type="button"
          disabled={!fileName}
          onClick={() => router.push(nextHref)}
          className="min-h-12 rounded-egov bg-egov-blue px-5 py-3 text-center font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("Continue")}
        </button>
      </div>
    </main>
  );
}
