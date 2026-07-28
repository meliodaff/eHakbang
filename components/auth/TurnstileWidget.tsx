"use client";

import Script from "next/script";

/**
 * Cloudflare Turnstile challenge widget. Cloudflare's script renders the
 * challenge into this div and injects a hidden `cf-turnstile-response` input
 * inside it once solved — since the div sits inside the surrounding <form>,
 * that token rides along automatically in the submitted FormData, no extra
 * client-side wiring needed.
 *
 * Verification itself happens server-side inside Supabase Auth (Auth >
 * Protection > Bot and Abuse Protection, configured with the Turnstile
 * secret key) — app/actions/auth.ts just forwards the token as
 * `options.captchaToken` on signUp/signInWithPassword.
 */
export function TurnstileWidget() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        async
        defer
      />
      <div className="cf-turnstile" data-sitekey={siteKey ?? ""} />
    </>
  );
}
