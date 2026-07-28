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
 * resulting `hashed_token` is verified via `auth.verifyOtp` on the
 * cookie-aware SSR client to actually set the session cookie.
 *
 * eGov already supplies full name, email, and mobile number in one profile
 * fetch (unlike Google, which only gives name+email) — so unlike the Google
 * flow, there's no separate "complete your profile" step: this function
 * upserts profiles/egov_profiles directly for both first-time and returning
 * eGov sign-ins.
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
    return { error: "Could not create your session. Please try again." };
  }

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "magiclink",
  });
  if (verifyError) {
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

  const { error: egovProfileError } = await admin.from("egov_profiles").upsert(
    {
      id: userId,
      egov_uniqid: profile.uniqid,
      first_name: profile.first_name,
      middle_name: profile.middle_name,
      last_name: profile.last_name,
      suffix: profile.suffix,
      gender: profile.gender,
      birth_date: profile.birth_date,
      nationality: profile.nationality,
      mobile: profile.mobile,
      photo_url: profile.photo,
      address: profile.address,
      street: profile.street,
      barangay: profile.barangay,
      municipality: profile.municipality,
      region: profile.region,
      province: profile.province,
      country: profile.country,
      country_alpha_2_code: profile.country_alpha_2_code,
      country_alpha_3_code: profile.country_alpha_3_code,
      postal: profile.postal,
      address_line_2: profile.address_line_2,
      barangay_code: profile.barangay_code,
      province_code: profile.province_code,
      municipality_code: profile.municipality_code,
      region_code: profile.region_code,
      country_id: profile.country_id,
      signature: profile.signature,
      signature_url: profile.signature_url,
      additional_information: profile.additional_information,
      passport: profile.passport,
      national_id: profile.national_id,
      tin_id: profile.tin_id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (egovProfileError) {
    return { error: "Signed in, but saving your eGov profile failed. Please contact support." };
  }

  return {};
}
