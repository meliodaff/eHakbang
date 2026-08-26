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

/**
 * Why an eGov SSO call failed, in terms the sign-in UI can act on:
 * - `config`      — a required EGOV_SSO_* env var is missing (operator error;
 *                   the citizen can't fix it, so we surface it as unavailable).
 * - `expired`     — eGov rejected the exchange (4xx): the one-time code is
 *                   used/expired/invalid, or partner creds are wrong. The
 *                   actionable path for the citizen is to start again.
 * - `unavailable` — eGov is down or unreachable (5xx / network), retry later.
 */
export type EgovSsoErrorReason = "config" | "expired" | "unavailable";

export class EgovSsoError extends Error {
  readonly reason: EgovSsoErrorReason;
  readonly status?: number;
  constructor(reason: EgovSsoErrorReason, message: string, status?: number) {
    super(message);
    this.name = "EgovSsoError";
    this.reason = reason;
    this.status = status;
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new EgovSsoError("config", `${name} is not configured`);
  return value;
}

/** Classifies an eGov non-2xx HTTP status into a citizen-actionable reason. */
function reasonForStatus(status: number): EgovSsoErrorReason {
  return status >= 500 ? "unavailable" : "expired";
}

/** Exchanges a one-time eGov exchange_code for an access_token. */
export async function exchangeEgovCode(exchangeCode: string): Promise<string> {
  const baseUrl = requireEnv("EGOV_SSO_BASE_URL");
  const partnerCode = requireEnv("EGOV_SSO_PARTNER_CODE");
  const partnerSecret = requireEnv("EGOV_SSO_PARTNER_SECRET");

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exchange_code: exchangeCode,
        scope: "SSO_AUTHENTICATION",
        partner_code: partnerCode,
        partner_secret: partnerSecret,
      }),
    });
  } catch (err) {
    console.error("[egov-sso] token exchange fetch failed (network/DNS/base URL):", err);
    throw new EgovSsoError("unavailable", "eGov token exchange request failed");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "<no body>");
    console.error(`[egov-sso] token exchange non-2xx (${res.status}):`, text);
    throw new EgovSsoError(
      reasonForStatus(res.status),
      `eGov token exchange failed (${res.status}): ${text}`,
      res.status,
    );
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new EgovSsoError("unavailable", "eGov token exchange returned no access_token");
  }
  return data.access_token;
}

/** Resolves the authenticated citizen's full profile using an access_token. */
export async function fetchEgovProfile(accessToken: string): Promise<EgovProfile> {
  const baseUrl = requireEnv("EGOV_SSO_BASE_URL");

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/partner/sso_authentication`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (err) {
    console.error("[egov-sso] profile fetch failed (network/DNS/base URL):", err);
    throw new EgovSsoError("unavailable", "eGov profile fetch request failed");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "<no body>");
    console.error(`[egov-sso] profile fetch non-2xx (${res.status}):`, text);
    throw new EgovSsoError(
      reasonForStatus(res.status),
      `eGov profile fetch failed (${res.status}): ${text}`,
      res.status,
    );
  }
  const json = (await res.json()) as { data?: EgovProfile };
  if (!json.data) {
    throw new EgovSsoError("unavailable", "eGov profile fetch returned no data");
  }
  return json.data;
}
