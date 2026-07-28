import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cookie-aware, session-scoped Supabase client for Server Components,
 * Server Actions, and Route Handlers. Distinct from `server.ts`'s
 * service-role client — this one respects the signed-in user's own session
 * (and RLS, once added), it never bypasses access control.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore because
            // proxy.ts refreshes the session cookie on every request.
          }
        },
      },
    },
  );
}
