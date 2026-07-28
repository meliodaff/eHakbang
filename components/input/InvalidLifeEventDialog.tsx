"use client";

import { useEffect, useRef } from "react";

/**
 * Blocking dialog shown when the classifier confidently decides the typed
 * text doesn't describe a real life event (gibberish, spam, an unrelated
 * question) -- see SearchInput's `isLifeEvent` check.
 */
export function InvalidLifeEventDialog({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="invalid-life-event-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
    >
      <div className="w-full max-w-sm rounded-egov-lg bg-surface p-5 shadow-xl">
        <h2
          id="invalid-life-event-title"
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-bold text-egov-navy outline-none"
        >
          Hindi Wastong Life Event
        </h2>
        <p className="mt-2 text-sm text-foreground">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-5 min-h-11 w-full rounded-egov bg-egov-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
        >
          OK
        </button>
      </div>
    </div>
  );
}
