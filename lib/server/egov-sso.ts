import "server-only";

/**
 * eGov SSO ("Continue with eGov") — a custom exchange-code flow, not a
 * Supabase-native OAuth provider. See docs pasted from the eGov partner
 * dashboard: POST /api/token exchanges a one-time exchange_code for an
 * access_token; POST /api/partner/sso_authentication resolves the
 * authenticated citizen's full profile using that access_token.
 */

export type EgovEducationEntry = {
  level?: string;
  school?: string;
  from?: string;
  to?: string;
  educational_background?: string;
};

export type EgovProfile = {
  uniqid: string;
  email: string;
  birth_date?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  suffix?: string | null;
  gender?: string;
  nationality?: string;
  photo?: string;
  mobile?: string;
  address?: string;
  street?: string;
  barangay?: string;
  municipality?: string;
  region?: string;
  province?: string;
  country?: string;
  country_alpha_2_code?: string;
  country_alpha_3_code?: string;
  postal?: string | null;
  address_line_2?: string | null;
  barangay_code?: string;
  province_code?: string;
  municipality_code?: string;
  region_code?: string;
  country_id?: number;
  foreign_address?: string | null;
  signature?: string;
  signature_url?: string;
  additional_information?: Record<string, unknown>;
  passport?: Record<string, unknown>;
  national_id?: Record<string, unknown>;
  tin_id?: string | null;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

/** Exchanges a one-time eGov exchange_code for an access_token. */
export async function exchangeEgovCode(exchangeCode: string): Promise<string> {
  const baseUrl = requireEnv("EGOV_SSO_BASE_URL");
  const partnerCode = requireEnv("EGOV_SSO_PARTNER_CODE");
  const partnerSecret = requireEnv("EGOV_SSO_PARTNER_SECRET");

  const res = await fetch(`${baseUrl}/api/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      exchange_code: exchangeCode,
      scope: "SSO_AUTHENTICATION",
      partner_code: partnerCode,
      partner_secret: partnerSecret,
    }),
  });
  if (!res.ok) {
    throw new Error(`eGov token exchange failed (${res.status})`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("eGov token exchange returned no access_token");
  }
  return data.access_token;
}

/** Resolves the authenticated citizen's full profile using an access_token. */
export async function fetchEgovProfile(accessToken: string): Promise<EgovProfile> {
  const baseUrl = requireEnv("EGOV_SSO_BASE_URL");

  const res = await fetch(`${baseUrl}/api/partner/sso_authentication`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`eGov profile fetch failed (${res.status})`);
  }
  const json = (await res.json()) as { data?: EgovProfile };
  if (!json.data) {
    throw new Error("eGov profile fetch returned no data");
  }
  return json.data;
}
