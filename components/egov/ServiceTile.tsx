import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * eGov-style service tile: a pale-blue rounded icon with a caption. By default
 * it is a static (representative) tile for the host dashboard; pass `href` to
 * make it a real link (used for the E-Hakbang entry).
 */
export function ServiceTile({
  icon,
  label,
  badge,
  href,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  href?: string;
  highlight?: boolean;
}) {
  const inner = (
    <>
      <span
        aria-hidden
        className={cn(
          "relative flex h-16 w-16 items-center justify-center rounded-egov text-2xl",
          highlight ? "bg-egov-blue text-white" : "bg-egov-blue-050 text-egov-blue",
        )}
      >
        {icon}
        {badge && (
          <span className="absolute -right-1 -top-1 rounded-full bg-egov-red px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
            {badge}
          </span>
        )}
      </span>
      <span className="text-center text-xs font-medium leading-tight text-foreground">
        {label}
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group flex flex-col items-center gap-1.5 rounded-egov p-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1.5 p-1.5" aria-hidden>
      {inner}
    </div>
  );
}
