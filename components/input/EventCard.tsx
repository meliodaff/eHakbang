import type { LifeEvent } from "@/lib/types";

/**
 * eGov-style service tile: a pale-blue rounded-square icon (emoji) with a short
 * caption underneath. Rendered as a button so selecting it generates a journey.
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
      className="group flex flex-col items-center gap-1.5 rounded-egov p-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
    >
      <span
        aria-hidden
        className="flex h-16 w-16 items-center justify-center rounded-egov bg-egov-blue-050 text-3xl transition-colors group-hover:bg-egov-blue-100"
      >
        {event.emoji}
      </span>
      <span className="text-center text-xs font-medium leading-tight text-foreground">
        {event.sublabel}
      </span>
    </button>
  );
}
