import { cn } from "@/lib/cn";

/**
 * Sticky journey progress bar (PRD FR-07). Shows "X of Y steps complete",
 * a horizontal fill bar that transitions blue → green at completion, and a
 * numeric percentage.
 */
export function ProgressBar({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const safeTotal = Math.max(total, 1);
  const percent = Math.round((completed / safeTotal) * 100);
  const isComplete = completed >= total && total > 0;

  return (
    <div className="sticky top-0 z-20 border-b border-border bg-surface/95 px-5 py-3 backdrop-blur">
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-semibold text-foreground">
          {completed} of {total} steps complete
        </span>
        <span
          className={cn(
            "font-semibold",
            isComplete ? "text-egov-success" : "text-egov-blue",
          )}
        >
          {percent}%
        </span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-egov-blue-050"
        role="progressbar"
        aria-valuenow={completed}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${completed} of ${total} steps complete`}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width,background-color] duration-300",
            isComplete ? "bg-egov-success" : "bg-egov-blue",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
