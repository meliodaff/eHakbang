import "server-only";
import { createClient } from "@/lib/supabase/server-client";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { exchangeEgovCode, fetchEgovProfile, type EgovProfile } from "./egov-sso";

function buildFullName(profile: EgovProfile): string {
  return [profile.first_name, profile.middle_name, profile.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
}

/**
 * Bridges an eGov SSO identity into a real Supabase session. eGov isn't a
 * Supabase-native OAuth provider, so there's no `signInWithOAuth` for it —
 * instead we use the standard "external SSO -> Supabase session" pattern:
 * `admin.generateLink({ type: "magiclink" })` creates the auth.users row if
 * it doesn't exist yet (confirmed via the installed @supabase/auth-js types
 * — magiclink handles creation for signup/invite/magiclink), and the
 * resulting `hashed_token` is verified with `type: "email"` via
 * `auth.verifyOtp` on the cookie-aware SSR client to actually set the session
 * cookie. Supabase still calls the generated link type `magiclink`, but its
 * current verification API deprecates `magiclink` and uses `email` for both
 * email sign-up and sign-in token hashes.
 *
 * eGov already supplies full name, email, and mobile number in one profile
 * fetch (unlike Google, which only gives name+email) — so unlike the Google
 * flow, there's no separate "complete your profile" step: this function
 * upserts `profiles` directly for both first-time and returning eGov
 * sign-ins. `profiles` is the single source of truth for account data
 * regardless of sign-in method — the rest of the eGov profile (address,
 * national ID, passport, signature, etc.) is used only transiently to
 * derive full_name/phone and is not persisted.
 */
export async function completeEgovSignIn(exchangeCode: string): Promise<{ error?: string }> {
  let profile: EgovProfile;
  try {
    const accessToken = await exchangeEgovCode(exchangeCode);
    profile = await fetchEgovProfile(accessToken);
  } catch {
    return { error: "Could not verify your eGov identity. Please try again." };
  }

  if (!profile.email) {
    return { error: "Your eGov account has no email on file, so it can't be used to sign in." };
  }

  const fullName = buildFullName(profile) || profile.email;
  const admin = getSupabaseServerClient();

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: profile.email,
    options: {
      data: { full_name: fullName, egov_uniqid: profile.uniqid },
    },
  });
  if (linkError) {
    console.error("[egov-session] generateLink failed:", {
      message: linkError.message,
      status: linkError.status,
      code: linkError.code,
    });
    return { error: "Could not create your session. Please try again." };
  }

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "email",
  });
  if (verifyError) {
    console.error("[egov-session] verifyOtp failed:", {
      message: verifyError.message,
      status: verifyError.status,
      code: verifyError.code,
    });
    return { error: "Could not create your session. Please try again." };
  }

  const userId = linkData.user.id;

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      full_name: fullName,
      phone: profile.mobile ?? "",
    },
    { onConflict: "id" },
  );
  if (profileError) {
    return { error: "Signed in, but saving your profile failed. Please contact support." };
  }

  return {};
}
