"use client";

import { useId, useState } from "react";
import type { JourneyStep } from "@/lib/types";
import { useLanguage, useT } from "@/lib/i18n";
import { askAboutStep } from "@/lib/api-client";

/**
 * Collapsible "Ask about this step" section (PRD FR-12). Sends the question
 * plus this step's context to /api/ask-step, which calls OpenAI for a
 * concise, step-scoped answer (see lib/server/ask-step.ts).
 */
export function AskAboutStep({ step }: { step: JourneyStep }) {
  const t = useT();
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const panelId = useId();

  async function handleSend() {
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await askAboutStep({
        question: trimmed,
        language: lang,
        step: {
          step_title: step.step_title,
          agency_name: step.agency_name,
          reason: step.reason,
          documents_required: step.documents_required,
          estimated_time: step.estimated_time,
          important_note: step.important_note,
          fee: step.fee ? { amount: step.fee.amount, how_to_pay: step.fee.how_to_pay } : null,
          required_fields: step.required_fields?.map((f) => ({
            label: f.label,
            hint: f.hint,
          })),
        },
      });
      setAnswer(result.answer);
    } catch {
      setError(
        t("Something went wrong answering that. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-t border-border pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between text-sm font-semibold text-egov-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
      >
        {t("Ask about this step")}
        <span aria-hidden className="text-lg leading-none">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div id={panelId} className="mt-3 flex flex-col gap-2">
          <label htmlFor={`${panelId}-input`} className="sr-only">
            {t("Your question about")} {step.step_title}
          </label>
          <textarea
            id={`${panelId}-input`}
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              setAnswer(null);
              setError(null);
            }}
            rows={2}
            placeholder={t("e.g. Kailangan ko ba ng appointment bago pumunta?")}
            className="w-full rounded-egov border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:border-egov-blue focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-egov-blue"
          />
          <button
            type="button"
            disabled={!question.trim() || loading}
            onClick={handleSend}
            className="self-end rounded-full bg-egov-blue px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? t("Asking…") : t("Send")}
          </button>
          {error ? (
            <p className="rounded-egov bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          ) : (
            answer && (
              <p className="rounded-egov bg-egov-blue-050 px-3 py-2 text-sm text-egov-blue-dark">
                {answer}
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
}
