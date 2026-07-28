import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server-client";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Supabase OAuth (Google) redirect target. Exchanges the auth code for a
 * session, then branches on whether a profiles row already exists:
 * first-time sign-in (no row yet) -> /register to finish setup (phone
 * number only — name/email come from Google); returning user -> dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login`);
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
