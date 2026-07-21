import { TopAppBar } from "./TopAppBar";

/**
 * Shared sticky eHakbang header. Wraps {@link TopAppBar} (brand wordmark +
 * Bagong Pilipinas logo) so every eHakbang service screen renders an
 * identical header. `backHref` controls the back button target.
 */
export function EhakbangHeader({ backHref = "/ehakbang" }: { backHref?: string }) {
  return (
    <div className="sticky top-0 z-20 bg-surface">
      <TopAppBar brand="eHakbang" backHref={backHref} />
    </div>
  );
}
