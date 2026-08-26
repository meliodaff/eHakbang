// Diagnostic for the "Could not create your session" error in completeEgovSignIn.
// The eGov half (token + profile) is not exercised here — this isolates the
// Supabase session-bridging half that actually throws that message, and prints
// the REAL error (status/code/message) the app swallows into a generic string.
//
// Usage:  node --env-file=.env.local scripts/supabase-session-check.mjs [email]
// Safe:   generateLink does NOT send an email; if it succeeds it may create the
//         auth user (same as the real flow would). Defaults to a throwaway probe
//         email so it won't pre-create your real test identity.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const email = process.argv[2] ?? `probe+${Date.now()}@example.com`;

function show(label, err) {
  if (!err) return console.log(`    ${label}: (no error)`);
  console.log(`    ${label}:`);
  console.log(`      message: ${err.message}`);
  console.log(`      status:  ${err.status ?? "(none)"}`);
  console.log(`      code:    ${err.code ?? err.error_code ?? "(none)"}`);
}

if (!url || !serviceRole || !anon) {
  console.error("Missing Supabase env vars (URL / SERVICE_ROLE / ANON).");
  process.exit(1);
}

console.log("Supabase session-bridge check");
console.log("─────────────────────────────");
console.log(`url:   ${url}`);
console.log(`email: ${email}`);

const admin = createClient(url, serviceRole, { auth: { persistSession: false } });

console.log(`\n[1] admin.auth.admin.generateLink({ type: "magiclink" })`);
const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
  type: "magiclink",
  email,
  options: { data: { full_name: "Probe User", egov_uniqid: "PROBE" } },
});
show("linkError", linkError);

if (linkError) {
  console.log(
    "\n→ generateLink is the failing call. Common causes:\n" +
      "   • signup_disabled  → Auth > Providers > Email: 'Allow new users to sign up' is OFF\n" +
      "   • email provider disabled entirely\n" +
      "   • service-role key doesn't match this project / is a publishable key\n",
  );
  process.exit(2);
}

console.log(`    ✓ hashed_token: ${linkData?.properties?.hashed_token ? "present" : "MISSING"}`);
console.log(`    ✓ user id:      ${linkData?.user?.id ?? "(none)"}`);

console.log(`\n[2] anonClient.auth.verifyOtp({ type: "email", token_hash })`);
const anonClient = createClient(url, anon, { auth: { persistSession: false } });
const { data: otpData, error: verifyError } = await anonClient.auth.verifyOtp({
  token_hash: linkData.properties.hashed_token,
  type: "email",
});
show("verifyError", verifyError);
if (!verifyError) {
  console.log(`    ✓ session: ${otpData?.session ? "created" : "MISSING"}`);
  console.log("\n✓ Supabase session bridging works with this config.");
}
