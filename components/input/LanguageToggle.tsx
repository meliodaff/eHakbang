"use client";

import type { Language } from "@/lib/types";
import { cn } from "@/lib/cn";
import { useLanguage } from "@/lib/i18n";

const OPTIONS: { value: Language; label: string }[] = [
  { value: "fil", label: "FIL" },
  { value: "en", label: "EN" },
];

/**
 * Filipino / English toggle (PRD FR-11). Backed by the global language context
 * so the whole app re-renders in the selected language; the choice persists to
 * localStorage across sessions.
 */
export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex overflow-hidden rounded-full border border-egov-blue-100 text-xs font-semibold"
    >
      {OPTIONS.map((opt) => {
        const active = lang === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setLang(opt.value)}
            aria-pressed={active}
            className={cn(
              "min-h-8 px-3 py-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue",
              active ? "bg-egov-blue text-white" : "text-egov-blue",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
