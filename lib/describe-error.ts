/**
 * Renders a caught error as a stable, always-non-empty string for
 * `console.error`. Plain `Error`/`PostgrestError` instances carry their
 * useful fields (message, code, details, hint) as non-enumerable or
 * class-field properties that some log capture pipelines flatten to `{}` --
 * this pulls them out explicitly so the real cause survives.
 */
export function describeError(err: unknown): string {
  if (err instanceof Error) {
    const supabaseFields = ["code", "details", "hint"] as const;
    const extras = supabaseFields
      .map((field) => [field, (err as unknown as Record<string, unknown>)[field]] as const)
      .filter(([, value]) => typeof value === "string" && value.length > 0)
      .map(([field, value]) => `${field}: ${value}`);
    return extras.length > 0
      ? `${err.message} (${extras.join(", ")})`
      : err.message || err.name;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}
