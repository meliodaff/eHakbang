"use client";

import { useEffect } from "react";
import { resetJourney } from "@/lib/journey-store";

const SESSION_KEY = "ehakbang:server-session";

/**
 * Hackathon-demo convenience: whenever the server restarts (a new process,
 * detected via a fresh `serverSessionId`), clear any stored "got-married"
 * progress so the flow can be replayed from a clean slate each run without
 * manually clearing browser storage. Normal reloads/navigation within the
 * same server run leave stored progress untouched.
 */
export function DemoDataReset({ serverSessionId }: { serverSessionId: string }) {
  useEffect(() => {
    const lastSessionId = localStorage.getItem(SESSION_KEY);
    if (lastSessionId !== serverSessionId) {
      resetJourney("got-married");
      localStorage.setItem(SESSION_KEY, serverSessionId);
    }
  }, [serverSessionId]);

  return null;
}
