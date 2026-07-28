"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { EhakbangHeader } from "@/components/layout/EhakbangHeader";
import { uploadEvidenceDocument } from "@/lib/api-client";
import { getCivilStatusCopy } from "@/lib/civil-status-events";
import { cn } from "@/lib/cn";

/**
 * Second screen of the civil-status onboarding flow: attach evidence of the
 * life event (e.g. a PSA marriage certificate or annulment decree) before
 * identity verification. Also reused, with the exact same UI, for a custom
 * (AI-generated) life event that the model decided needs supporting
 * evidence -- `target`/`title`/`description` carry the AI's own copy and
 * final destination in place of a fixed preset `eventId`/catalog lookup
 * (see `app/journey/start/page.tsx`).
 */
export function DocumentUploadScreen({
  eventId,
  target,
  title,
  description,
}: {
  eventId?: string;
  /** URL-encoded final destination once verification passes -- used for a custom event instead of `eventId`. */
  target?: string;
  /** AI-generated evidence copy override for a custom event, in place of the static per-preset-event copy. */
  title?: string;
  description?: string;
}) {
  const router = useRouter();
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const copy = title
    ? {
        documentTitle: title,
        documentDescription: description || "Upload a document that supports this update.",
      }
    : getCivilStatusCopy(eventId);

  const carryParams = target
    ? (() => {
        const p = new URLSearchParams({ target });
        if (title) p.set("title", title);
        if (description) p.set("description", description);
        return p;
      })()
    : null;

  const backHref = carryParams ? "/ehakbang" : `/journey/confirm?event=${encodeURIComponent(eventId ?? "")}`;
  const nextHref = carryParams
    ? `/journey/confirm/verify?${carryParams.toString()}`
    : `/journey/confirm/verify?event=${encodeURIComponent(eventId ?? "")}`;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
  }

  async function handleContinue() {
    if (!file || uploading) return;
    setUploading(true);
    await uploadEvidenceDocument(file);
    router.push(nextHref);
  }

  return (
    <main className="flex flex-1 flex-col">
      <EhakbangHeader backHref={backHref} />

      <div className="flex flex-1 flex-col gap-5 px-6 py-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {copy.documentTitle}
          </h1>
          <p className="mt-2 text-sm text-muted">{copy.documentDescription}</p>
        </div>

        <label
          htmlFor={inputId}
          className={cn(
            "flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-egov border-2 border-dashed border-egov-blue px-4 py-6 text-center transition-colors hover:bg-egov-blue-050 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-egov-blue",
            file && "border-solid bg-egov-blue-050",
          )}
        >
          <span aria-hidden className="text-3xl">
            {file ? "📄" : "📎"}
          </span>
          {file ? (
            <span className="break-all text-sm font-semibold text-foreground">
              {file.name}
            </span>
          ) : (
            <span className="text-sm font-semibold text-egov-blue">
              Tap to choose a photo or PDF
            </span>
          )}
          <input
            id={inputId}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>

        {file && (
          <p className="text-center text-sm font-medium text-egov-blue">
            Tap the box above to change the file.
          </p>
        )}

        <button
          type="button"
          onClick={handleContinue}
          disabled={!file || uploading}
          className="mt-auto min-h-11 rounded-egov bg-egov-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue disabled:cursor-not-allowed disabled:bg-border disabled:text-muted"
        >
          {uploading ? "Uploading…" : "Continue"}
        </button>
      </div>
    </main>
  );
}
