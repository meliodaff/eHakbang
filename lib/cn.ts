/**
 * Minimal className joiner. Filters out falsy values so components can use
 * conditional classes without pulling in extra dependencies.
 *
 * Example: cn("p-4", isActive && "bg-egov-blue", undefined) => "p-4 bg-egov-blue"
 */
export type ClassValue = string | number | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
