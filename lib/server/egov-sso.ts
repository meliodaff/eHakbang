import "server-only";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

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

/**
 * eGov's API sits behind Cloudflare. Genuine app-level responses carry
 * `x-ratelimit-*` headers; a Cloudflare bot-challenge block does not — it
 * returns an HTML body with a `cf-ray` / `server: cloudflare` header and the
 * request never reaches eGov's origin. Node's `fetch` (undici) from a
 * datacenter IP trips this even with a browser UA (see
 * scripts/egov-sso-smoke.mjs), so it's the expected prod-on-Vercel failure and
 * must NOT be reported to the citizen as an "expired" code.
 */
function isCloudflareEdgeBlock(headers: Headers): boolean {
  const appLevel =
    headers.has("x-ratelimit-limit") || headers.has("x-ratelimit-remaining");
  if (appLevel) return false;
  const server = (headers.get("server") ?? "").toLowerCase();
  return headers.has("cf-ray") || server.includes("cloudflare");
}

/** Logs and throws a typed error for a non-2xx eGov response. Always throws. */
function throwForBadResponse(label: string, res: SsoResponse): never {
  if (isCloudflareEdgeBlock(res.headers)) {
    console.error(
      `[egov-sso] ${label} blocked at the Cloudflare edge (${res.status}) — ` +
        `request never reached eGov. Node fetch/undici from a datacenter IP isn't ` +
        `recognized as a browser. Needs an eGov server-to-server allowlist or a ` +
        `browser-fingerprint transport.`,
    );
    throw new EgovSsoError(
      "unavailable",
      `${label} blocked at Cloudflare edge (${res.status})`,
      res.status,
    );
  }
  console.error(`[egov-sso] ${label} non-2xx (${res.status}):`, res.bodyText || "<no body>");
  throw new EgovSsoError(
    reasonForStatus(res.status),
    `${label} failed (${res.status}): ${res.bodyText}`,
    res.status,
  );
}

/**
 * Normalized HTTP result so callers don't care which transport produced it.
 * `headers` is a real `Headers` so `isCloudflareEdgeBlock` works identically
 * for both the `fetch` and `curl` paths.
 */
interface SsoResponse {
  ok: boolean;
  status: number;
  headers: Headers;
  bodyText: string;
}

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/**
 * eGov sits behind Cloudflare, which fingerprints the TLS/HTTP client and 403s
 * Node's `fetch` (undici) from datacenter IPs before the request reaches eGov
 * (see scripts/egov-sso-smoke.mjs). When `EGOV_SSO_USE_CURL=true` we route the
 * request through the system `curl` instead, which presents a different
 * fingerprint that Cloudflare is more likely to admit. This is an EXPERIMENT
 * flag: it tells us whether the block is fingerprint-based (curl gets through)
 * or IP-reputation-based (curl still blocked → need a browser-impersonating
 * client / residential egress). Off by default; the `fetch` path is unchanged.
 */
async function egovSsoRequest(
  url: string,
  init: { method: string; headers: Record<string, string>; body?: string },
): Promise<SsoResponse> {
  if (process.env.EGOV_SSO_USE_CURL === "true") {
    return curlRequest(url, init);
  }
  const res = await fetch(url, {
    method: init.method,
    headers: init.headers,
    body: init.body,
  });
  const bodyText = await res.text().catch(() => "");
  return { ok: res.ok, status: res.status, headers: res.headers, bodyText };
}

/** Performs the request via the system `curl` binary. Never uses a shell. */
async function curlRequest(
  url: string,
  init: { method: string; headers: Record<string, string>; body?: string },
): Promise<SsoResponse> {
  const args = ["-sS", "-i", "--max-time", "20", "-A", BROWSER_UA, "-X", init.method, url];
  for (const [k, v] of Object.entries(init.headers)) args.push("-H", `${k}: ${v}`);
  if (init.body !== undefined) args.push("--data-raw", init.body);

  let stdout: string;
  try {
    ({ stdout } = await execFileAsync("curl", args, { maxBuffer: 10 * 1024 * 1024 }));
  } catch (err) {
    // ENOENT here means curl isn't on the runtime (e.g. this Vercel image) —
    // that's itself a useful experiment result, so log it distinctly.
    console.error("[egov-sso] curl transport failed to execute (is curl on this runtime?):", err);
    throw new EgovSsoError("unavailable", "eGov request via curl could not run");
  }

  // curl -i emits one header block per response; keep the last (post-redirect).
  const sep = stdout.includes("\r\n\r\n") ? "\r\n\r\n" : "\n\n";
  const splitAt = stdout.lastIndexOf(sep);
  const head = splitAt === -1 ? stdout : stdout.slice(0, splitAt);
  const bodyText = splitAt === -1 ? "" : stdout.slice(splitAt + sep.length).trim();

  const lines = head.split(/\r?\n/);
  const status = Number(lines[0]?.split(" ")[1]) || 0;
  const headers = new Headers();
  for (const line of lines.slice(1)) {
    const idx = line.indexOf(":");
    if (idx > 0) {
      try {
        headers.set(line.slice(0, idx).trim(), line.slice(idx + 1).trim());
      } catch {
        // skip malformed/pseudo header lines
      }
    }
  }
  return { ok: status >= 200 && status < 300, status, headers, bodyText };
}

/** Exchanges a one-time eGov exchange_code for an access_token. */
export async function exchangeEgovCode(exchangeCode: string): Promise<string> {
  const baseUrl = requireEnv("EGOV_SSO_BASE_URL");
  const partnerCode = requireEnv("EGOV_SSO_PARTNER_CODE");
  const partnerSecret = requireEnv("EGOV_SSO_PARTNER_SECRET");

  let res: SsoResponse;
  try {
    res = await egovSsoRequest(`${baseUrl}/api/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        exchange_code: exchangeCode,
        scope: "SSO_AUTHENTICATION",
        partner_code: partnerCode,
        partner_secret: partnerSecret,
      }),
    });
  } catch (err) {
    if (err instanceof EgovSsoError) throw err;
    console.error("[egov-sso] token exchange fetch failed (network/DNS/base URL):", err);
    throw new EgovSsoError("unavailable", "eGov token exchange request failed");
  }
  if (!res.ok) {
    throwForBadResponse("token exchange", res);
  }
  let data: { access_token?: string };
  try {
    data = JSON.parse(res.bodyText) as { access_token?: string };
  } catch {
    throw new EgovSsoError("unavailable", "eGov token exchange returned non-JSON");
  }
  if (!data.access_token) {
    throw new EgovSsoError("unavailable", "eGov token exchange returned no access_token");
  }
  return data.access_token;
}

/** Resolves the authenticated citizen's full profile using an access_token. */
export async function fetchEgovProfile(accessToken: string): Promise<EgovProfile> {
  const baseUrl = requireEnv("EGOV_SSO_BASE_URL");

  let res: SsoResponse;
  try {
    res = await egovSsoRequest(`${baseUrl}/api/partner/sso_authentication`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    });
  } catch (err) {
    if (err instanceof EgovSsoError) throw err;
    console.error("[egov-sso] profile fetch failed (network/DNS/base URL):", err);
    throw new EgovSsoError("unavailable", "eGov profile fetch request failed");
  }
  if (!res.ok) {
    throwForBadResponse("profile fetch", res);
  }
  let json: { data?: EgovProfile };
  try {
    json = JSON.parse(res.bodyText) as { data?: EgovProfile };
  } catch {
    throw new EgovSsoError("unavailable", "eGov profile fetch returned non-JSON");
  }
  if (!json.data) {
    throw new EgovSsoError("unavailable", "eGov profile fetch returned no data");
  }
  return json.data;
}
