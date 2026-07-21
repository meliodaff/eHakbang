"use client";

import { useId, useState } from "react";

/**
 * Collapsible "Ask about this step" section (PRD FR-12). UI stub for the
 * UI-only phase: it collects a question and shows a placeholder response.
 * The real Claude call (with step context) is wired in later.
 */
export function AskAboutStep({ stepTitle }: { stepTitle: string }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState(false);
  const panelId = useId();

  return (
    <div className="border-t border-border pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between text-sm font-semibold text-egov-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
      >
        Ask about this step
        <span aria-hidden className="text-lg leading-none">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div id={panelId} className="mt-3 flex flex-col gap-2">
          <label htmlFor={`${panelId}-input`} className="sr-only">
            Your question about {stepTitle}
          </label>
          <textarea
            id={`${panelId}-input`}
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              setAsked(false);
            }}
            rows={2}
            placeholder="e.g. Kailangan ko ba ng appointment bago pumunta?"
            className="w-full rounded-egov border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:border-egov-blue focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-egov-blue"
          />
          <button
            type="button"
            disabled={!question.trim()}
            onClick={() => setAsked(true)}
            className="self-end rounded-full bg-egov-blue px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
          {asked && (
            <p className="rounded-egov bg-egov-blue-050 px-3 py-2 text-sm text-egov-blue-dark">
              Answers from E-Hakbang AI will appear here once connected. For now,
              please refer to the official service page above.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
