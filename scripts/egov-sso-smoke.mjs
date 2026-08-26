// eGov SSO smoke test — runs the full exchange-code -> access_token -> profile
// flow against the live gateway, mirroring lib/server/egov-sso.ts but with
// verbose logging.
//
// Usage (Node 20+):
//   node --env-file=.env.local scripts/egov-sso-smoke.mjs <exchange_code>
//
// The exchange_code may also be supplied via EGOV_SSO_EXCHANGE_CODE.
// Requires EGOV_SSO_BASE_URL, EGOV_SSO_PARTNER_CODE, EGOV_SSO_PARTNER_SECRET.
//
// Transport note: the eGov gateway is fronted by Cloudflare, which returns an
// edge-level 403 ("forbidden", no x-ratelimit-* headers) to clients it doesn't
// recognize as a browser. That block keys off BOTH the User-Agent AND the
// TLS/HTTP client fingerprint — Node's built-in fetch (undici) is blocked even
// with a browser UA, while curl gets through. So this script shells out to curl
// (present by default on Windows 10+, macOS, and most Linux). An app-level
// response is identifiable by the presence of x-ratelimit-* headers.

import { execFile } from "node:child_process";
import { writeFileSync, unlinkSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const baseUrl = process.env.EGOV_SSO_BASE_URL;
const partnerCode = process.env.EGOV_SSO_PARTNER_CODE;
const partnerSecret = process.env.EGOV_SSO_PARTNER_SECRET;
const exchangeCode = process.argv[2] ?? process.env.EGOV_SSO_EXCHANGE_CODE;

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function fail(msg) {
  console.error(`\n\u2717 ${msg}\n`);
  process.exit(1);
}

const missing = [
  ["EGOV_SSO_BASE_URL", baseUrl],
  ["EGOV_SSO_PARTNER_CODE", partnerCode],
  ["EGOV_SSO_PARTNER_SECRET", partnerSecret],
]
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missing.length) {
  fail(
    `Missing required env var(s): ${missing.join(", ")}.\n` +
      `  Copy .env.example to .env.local and fill in the eGov SSO values,\n` +
      `  then run: node --env-file=.env.local scripts/egov-sso-smoke.mjs <exchange_code>`,
  );
}
if (!exchangeCode) {
  fail(
    "No exchange_code provided.\n" +
      "  Pass it as an argument or set EGOV_SSO_EXCHANGE_CODE.\n" +
      "  Exchange codes are single-use and short-lived — generate a fresh one if this fails with 4xx.",
  );
}

const redact = (s) => (s ? `${s.slice(0, 3)}\u2026(${s.length} chars)` : "(empty)");

/**
 * Perform an HTTP request via curl and return { status, headers, body }.
 * curl writes the raw status line + headers (via -i) which we parse.
 */
async function curlRequest({ method, url, headers = {}, bodyFile }) {
  const args = ["-sS", "-i", "-X", method, url, "-A", BROWSER_UA];
  for (const [k, v] of Object.entries(headers)) args.push("-H", `${k}: ${v}`);
  if (bodyFile) args.push("--data", `@${bodyFile}`);

  const { stdout } = await execFileAsync("curl", args, { maxBuffer: 10 * 1024 * 1024 });

  // Split the last header block from the body (handles curl's CRLF headers).
  const sep = stdout.indexOf("\r\n\r\n") !== -1 ? "\r\n\r\n" : "\n\n";
  const splitAt = stdout.lastIndexOf(sep);
  const head = splitAt === -1 ? stdout : stdout.slice(0, splitAt);
  const body = splitAt === -1 ? "" : stdout.slice(splitAt + sep.length);

  const lines = head.split(/\r?\n/);
  const statusLine = lines[0] || "";
  const status = Number(statusLine.split(" ")[1]) || 0;
  const headerObj = {};
  for (const line of lines.slice(1)) {
    const idx = line.indexOf(":");
    if (idx > 0) headerObj[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim();
  }
  return { status, statusLine: statusLine.trim(), headers: headerObj, body: body.trim() };
}

const isAppLevel = (h) => "x-ratelimit-limit" in h || "x-ratelimit-remaining" in h;
const layerLabel = (h) => (isAppLevel(h) ? "app" : "edge (Cloudflare)");

console.log("eGov SSO smoke test");
console.log("\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
console.log(`base_url:       ${baseUrl}`);
console.log(`partner_code:   ${partnerCode}`);
console.log(`partner_secret: ${redact(partnerSecret)}`);
console.log(`exchange_code:  ${redact(exchangeCode)}`);

const tmp = mkdtempSync(join(tmpdir(), "egov-sso-"));
const bodyFile = join(tmp, "token-body.json");

try {
  // ── Step 1: exchange_code -> access_token ─────────────────────────────────
  writeFileSync(
    bodyFile,
    JSON.stringify({
      exchange_code: exchangeCode,
      scope: "SSO_AUTHENTICATION",
      partner_code: partnerCode,
      partner_secret: partnerSecret,
    }),
  );

  console.log(`\n[1] POST ${baseUrl}/api/token`);
  const tokenRes = await curlRequest({
    method: "POST",
    url: `${baseUrl}/api/token`,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    bodyFile,
  });
  console.log(`    \u2192 ${tokenRes.statusLine}  [${layerLabel(tokenRes.headers)}]`);
  console.log(`    ${tokenRes.body}`);

  if (tokenRes.status !== 200) {
    if (!isAppLevel(tokenRes.headers)) {
      fail(
        `Blocked at the Cloudflare edge (${tokenRes.status}) before reaching the app. ` +
          `Ensure curl is installed and reachable, and that this host isn't IP/geo-blocked.`,
      );
    }
    fail(
      `Token exchange rejected by the app (${tokenRes.status}). ` +
        `403 = this partner isn't authorized for this exchange_code (wrong partner or bad secret); ` +
        `400/401/422 = the exchange_code is invalid, already used, or expired, or a field is missing. ` +
        `Exchange codes are single-use and short-lived — generate a fresh one for THIS partner.`,
    );
  }

  let accessToken;
  try {
    accessToken = JSON.parse(tokenRes.body).access_token;
  } catch {
    fail("Token response was not valid JSON.");
  }
  if (!accessToken) fail("Token response contained no access_token.");
  console.log(`    \u2713 access_token: ${redact(accessToken)}`);

  // ── Step 2: access_token -> authenticated profile ─────────────────────────
  console.log(`\n[2] POST ${baseUrl}/api/partner/sso_authentication`);
  const profileRes = await curlRequest({
    method: "POST",
    url: `${baseUrl}/api/partner/sso_authentication`,
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  console.log(`    \u2192 ${profileRes.statusLine}  [${layerLabel(profileRes.headers)}]`);

  if (profileRes.status !== 200) {
    console.log(`    ${profileRes.body}`);
    fail(`Profile fetch failed (${profileRes.status}).`);
  }

  let profile;
  try {
    profile = JSON.parse(profileRes.body).data;
  } catch {
    fail("Profile response was not valid JSON.");
  }

  console.log("    \u2713 Authenticated profile:");
  console.log(JSON.stringify(profile, null, 2));
  console.log("\n\u2713 SSO flow completed successfully.\n");
} finally {
  try {
    unlinkSync(bodyFile);
  } catch {}
}
