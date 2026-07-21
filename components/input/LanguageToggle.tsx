"use client";

import { useState } from "react";
import type { Language } from "@/lib/types";
import { cn } from "@/lib/cn";

const OPTIONS: { value: Language; label: string }[] = [
  { value: "fil", label: "FIL" },
  { value: "en", label: "EN" },
];

/**
 * Filipino / English toggle (PRD FR-11). UI stub for now — persistence to
 * localStorage and re-rendering of content is wired in later.
 */
export function LanguageToggle() {
  const [language, setLanguage] = useState<Language>("fil");

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex overflow-hidden rounded-full border border-white/30 text-xs font-semibold"
    >
      {OPTIONS.map((opt) => {
        const active = language === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setLanguage(opt.value)}
            aria-pressed={active}
            className={cn(
              "min-h-8 px-3 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
              active ? "bg-white text-egov-blue-dark" : "text-white",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
