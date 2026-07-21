import type { LifeEvent } from "@/lib/types";

/**
 * A single life-event shortcut tile (emoji, Filipino label, English sublabel).
 * Rendered as a button so selecting it can trigger journey generation.
 */
export function EventCard({
  event,
  onSelect,
}: {
  event: LifeEvent;
  onSelect: (event: LifeEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(event)}
      className="flex min-h-24 flex-col items-start gap-1 rounded-egov border border-border bg-surface p-4 text-left shadow-sm transition-colors hover:border-egov-blue hover:bg-egov-blue-050 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
    >
      <span className="text-3xl" aria-hidden>
        {event.emoji}
      </span>
      <span className="mt-1 font-semibold text-foreground">{event.label}</span>
      <span className="text-sm text-muted">{event.sublabel}</span>
    </button>
  );
}
