"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile challenge widget, using EXPLICIT rendering
 * (window.turnstile.render) rather than the implicit `class="cf-turnstile"`
 * auto-detection. Implicit rendering only scans the DOM once, when the
 * script first loads — since this app is a client-side-routed SPA, the
 * script (loaded once on whichever auth page is visited first) never
 * re-scans the DOM after a client-side navigation to another auth page, so
 * a widget on a page visited second would never render/produce a token.
 * Explicit rendering runs our own render call on every mount instead, so it
 * works correctly regardless of navigation order (login -> register,
 * register -> login, or a fresh load of either).
 *
 * Verification itself happens server-side inside Supabase Auth (Auth >
 * Protection > Bot and Abuse Protection, configured with the Turnstile
 * secret key) — app/actions/auth.ts just forwards the token as
 * `options.captchaToken` on signUp/signInWithPassword.
 */

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "flexible";
        },
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export function TurnstileWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(
    typeof window !== "undefined" && Boolean(window.turnstile),
  );

  useEffect(() => {
    if (!scriptReady || !containerRef.current || !window.turnstile) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      theme: "light",
      size: "flexible",
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [scriptReady]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div ref={containerRef} className="w-full" />
    </>
  );
}
