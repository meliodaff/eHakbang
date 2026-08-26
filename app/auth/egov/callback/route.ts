import { NextResponse } from "next/server";
import { completeEgovSignIn } from "@/lib/server/egov-session";

/** Real eGov SSO redirect target, once EGOV_SSO_AUTHORIZE_URL is configured. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const exchangeCode = searchParams.get("exchange_code") ?? searchParams.get("code");
  if (!exchangeCode) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const { error, reason } = await completeEgovSignIn(exchangeCode);
  if (error) {
    return NextResponse.redirect(`${origin}/login?egov_error=${reason ?? "session"}`);
  }

  return NextResponse.redirect(`${origin}/`);
}
