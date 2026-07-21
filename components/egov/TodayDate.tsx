"use client";

import { useEffect, useState } from "react";

/**
 * Renders today's date like "Thu – Apr 16, 2026". Computed after mount to
 * avoid a server/client hydration mismatch on statically rendered pages.
 */
export function TodayDate() {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const now = new Date();
    const weekday = now.toLocaleDateString("en-US", { weekday: "short" });
    const rest = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    setLabel(`${weekday} – ${rest}`);
  }, []);

  return <span suppressHydrationWarning>{label}</span>;
}
