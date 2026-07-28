import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Routes reachable while signed out. Everything else is gated by
 * updateSession() below (mandatory login for this app).
 */
const PUBLIC_PATHS = ["/login", "/register", "/terms"];

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/auth/") // OAuth callback route handler
  );
}

/**
 * Refreshes the Supabase session cookie on every request and redirects
 * unauthenticated visitors to /login for any non-public route. Only does the
 * cheap "is there a valid session" check here (per Next's Proxy guidance —
 * no DB calls); whether the user still needs to complete their profile is
 * checked in the page itself, close to the data source.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run other code between createServerClient and getClaims() —
  // getClaims() validates the JWT signature on every call, which is the
  // safe check to rely on inside Proxy (unlike getSession()).
  const { data } = await supabase.auth.getClaims();
  const isAuthed = Boolean(data?.claims);

  if (!isAuthed && !isPublicPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
