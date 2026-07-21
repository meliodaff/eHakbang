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
 * identity verification.
 */
export function DocumentUploadScreen({ eventId }: { eventId?: string }) {
  const router = useRouter();
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const copy = getCivilStatusCopy(eventId);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
  }

  async function handleContinue() {
    if (!file || uploading) return;
    setUploading(true);
    await uploadEvidenceDocument(file);
    router.push(
      `/journey/confirm/verify?event=${encodeURIComponent(eventId ?? "")}`,
    );
  }

  return (
    <main className="flex flex-1 flex-col">
      <EhakbangHeader
        backHref={`/journey/confirm?event=${encodeURIComponent(eventId ?? "")}`}
      />

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
