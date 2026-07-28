import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-client";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Supabase OAuth (Google) redirect target. Exchanges the auth code for a
 * session, then branches on whether a profiles row already exists:
 * first-time sign-in (no row yet) -> /register to finish setup (phone
 * number only — name/email come from Google); returning user -> dashboard.
 *
 * Every failure path lands back on /login (there's no session to show
 * anything else with), but with `google_error` set and the reason logged
 * server-side -- previously this bounced back silently, which is what read
 * as "sometimes Continue with Google just relogs me in" with no way to tell
 * why. The most common real cause is the PKCE code_verifier cookie not
 * being present on this request (e.g. Google's redirect landing in a
 * different browser/tab context than the one that started the sign-in), so
 * `exchangeCodeForSession` fails even though the citizen picked a valid
 * account.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    const oauthError = searchParams.get("error_description") ?? searchParams.get("error");
    console.error(`/auth/callback: no code param (${oauthError ?? "citizen likely cancelled"})`);
    return NextResponse.redirect(`${origin}/login?google_error=1`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    console.error("/auth/callback: exchangeCodeForSession failed:", error?.message ?? error);
    return NextResponse.redirect(`${origin}/login?google_error=1`);
  }

  // Service-role lookup so this works the same regardless of whether RLS
  // is added to profiles later.
  const admin = getSupabaseServerClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  return NextResponse.redirect(`${origin}${profile ? "/" : "/register"}`);
}
