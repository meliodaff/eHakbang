import { NextResponse } from "next/server";

/**
 * Entry point for "Continue with eGov". Redirects to the real eGov login
 * page once EGOV_SSO_AUTHORIZE_URL is configured; until then, falls back to
 * the dev paste-exchange-code page so the rest of the flow (token exchange,
 * profile fetch, session bridging, storage) can be built and tested end to
 * end without waiting on that URL.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const authorizeUrl = process.env.EGOV_SSO_AUTHORIZE_URL;

  if (authorizeUrl) {
    const url = new URL(authorizeUrl);
    url.searchParams.set("redirect_uri", `${origin}/auth/egov/callback`);
    return NextResponse.redirect(url.toString());
  }

  return NextResponse.redirect(`${origin}/auth/egov/dev`);
}
