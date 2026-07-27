import type { LifeEvent } from "@/lib/types";
import { lifeEventIcon } from "@/components/egov/LifeEventIcons";

/**
 * eGov-style service tile: a pale-blue circular monoline icon with a short
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
      className="group flex w-full touch-manipulation flex-col items-center gap-1.5 rounded-egov p-1.5 transition-colors active:bg-egov-blue-050 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
    >
      <span
        aria-hidden
        className="flex h-14 w-14 items-center justify-center rounded-full bg-egov-blue-050 text-egov-blue transition-colors group-hover:bg-egov-blue-100"
      >
        {lifeEventIcon(event.id)}
      </span>
      <span className="text-center text-xs font-medium leading-tight text-foreground">
        {event.short}
      </span>
    </button>
  );
}
