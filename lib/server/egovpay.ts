import "server-only";
import { createHash, createHmac, randomUUID } from "crypto";

/**
 * Server-only client for the eGovPay payment gateway (see eGovPay-apidoc.md).
 * Credentials never reach the browser (NFR-05) -- callers are Next.js API
 * routes under app/api/payment/.
 */

interface EgovPayConfig {
  baseUrl: string;
  token: string;
  settlementTemplateUuid: string;
}

let cachedConfig: EgovPayConfig | null = null;

function cleanEnvValue(raw: string): string {
  const trimmed = raw.trim();
  const quote = trimmed[0];
  if (
    trimmed.length >= 2 &&
    (quote === '"' || quote === "'") &&
    trimmed.at(-1) === quote
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

/**
 * eGovPay expects the API token in the `X-eGovPay-Token` header WITH its
 * environment prefix (e.g. `test_<key>` for sandbox); `computeDigest()` then
 * strips that prefix to recover the HMAC key. If the configured token is the
 * bare portal key, add `test_`. Also repair common secret-manager copy/paste
 * issues (outer quotes/whitespace, uppercase or duplicated test prefixes).
 */
function normalizeEgovPayToken(raw: string): string {
  const cleaned = cleanEnvValue(raw);
  if (!cleaned || /[<>]/.test(cleaned)) {
    throw new Error("EGOVPAY_API_TOKEN is empty or contains placeholder brackets");
  }
  if (/\s/.test(cleaned)) {
    throw new Error("EGOVPAY_API_TOKEN contains whitespace");
  }

  if (/^(?:test_)+/i.test(cleaned)) {
    return `test_${cleaned.replace(/^(?:test_)+/i, "")}`;
  }
  if (/^[a-z]+_/i.test(cleaned)) return cleaned;

  console.warn(
    "[egovpay] EGOVPAY_API_TOKEN has no environment prefix; assuming sandbox and using `test_` prefix for the X-eGovPay-Token header.",
  );
  return `test_${cleaned}`;
}

function getConfig(): EgovPayConfig {
  if (cachedConfig) return cachedConfig;
  const rawBaseUrl = process.env.EGOVPAY_BASE_URL;
  const rawToken = process.env.EGOVPAY_API_TOKEN;
  const rawSettlementTemplateUuid = process.env.EGOVPAY_SETTLEMENT_TEMPLATE_UUID;
  if (!rawBaseUrl || !rawToken || !rawSettlementTemplateUuid) {
    throw new Error(
      "eGovPay is not configured (EGOVPAY_BASE_URL / EGOVPAY_API_TOKEN / EGOVPAY_SETTLEMENT_TEMPLATE_UUID)",
    );
  }

  const baseUrl = cleanEnvValue(rawBaseUrl).replace(/\/+$/, "");
  const parsedBaseUrl = new URL(baseUrl);
  if (parsedBaseUrl.protocol !== "https:" && process.env.NODE_ENV === "production") {
    throw new Error("EGOVPAY_BASE_URL must use HTTPS in production");
  }

  const token = normalizeEgovPayToken(rawToken);
  const settlementTemplateUuid = cleanEnvValue(rawSettlementTemplateUuid);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(settlementTemplateUuid)) {
    throw new Error("EGOVPAY_SETTLEMENT_TEMPLATE_UUID is not a valid UUID");
  }

  cachedConfig = { baseUrl, token, settlementTemplateUuid };
  return cachedConfig;
}

function authenticationMetadata(config: EgovPayConfig) {
  const parsedBaseUrl = new URL(config.baseUrl);
  return {
    baseOrigin: parsedBaseUrl.origin,
    basePath: parsedBaseUrl.pathname,
    tokenMode: config.token.startsWith("test_") ? "test" : "non-test",
    tokenLength: config.token.length,
    tokenFingerprint: createHash("sha256").update(config.token).digest("hex").slice(0, 12),
  };
}

export function isEgovPayConfigured(): boolean {
  try {
    getConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * `hash_hmac('sha256', "$amount|$txnid", $token)` per the eGovPay spec.
 * Verified against the real sandbox: the HMAC key is `$token` WITHOUT its
 * `test_` prefix (the `X-eGovPay-Token` header still sends the full
 * `test_<...>` string), and `$amount` must be the natural/minimal numeric
 * string -- e.g. "155" or "155.5", never forced to 2 decimals like "155.00".
 */
export function computeDigest(amount: string, txnid: string, token: string): string {
  const key = token.startsWith("test_") ? token.slice("test_".length) : token;
  return createHmac("sha256", key).update(`${amount}|${txnid}`).digest("hex");
}

export function generateTxnId(): string {
  return `EHKB-${Date.now()}-${randomUUID().slice(0, 8)}`;
}

export interface EgovPayItem {
  name: string;
  amount: number;
}

export interface CreateTransactionInput {
  items: EgovPayItem[];
  amount: number;
  txnid: string;
  redirectUrl: string;
  callbackUrl: string;
  currency?: string;
  mobile?: string;
  email?: string;
  name?: string;
  expiresAt?: string;
  linkExpiresAt?: string;
  description?: Record<string, unknown>;
}

export interface EgovPayTransaction {
  uuid: string;
  url: string;
  refno: string | null;
}

async function egovPayFetch(
  path: string,
  init: { method: string; body?: unknown },
): Promise<Response> {
  const { baseUrl, token } = getConfig();
  return fetch(`${baseUrl}${path}`, {
    method: init.method,
    headers: {
      "X-eGovPay-Token": token,
      Accept: "application/json",
      "Content-Type": "application/json; charset=utf-8",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
}

export async function createTransaction(
  input: CreateTransactionInput,
): Promise<EgovPayTransaction> {
  const config = getConfig();
  const amountStr = String(input.amount);
  const digest = computeDigest(amountStr, input.txnid, config.token);

  let response: Response;
  try {
    response = await egovPayFetch("/api/v1/transaction", {
      method: "POST",
      body: {
        items: input.items,
        amount: input.amount,
        settlement_template_uuid: config.settlementTemplateUuid,
        redirect_url: input.redirectUrl,
        txnid: input.txnid,
        callback_url: input.callbackUrl,
        digest,
        currency: input.currency,
        mobile: input.mobile,
        email: input.email,
        name: input.name,
        expires_at: input.expiresAt,
        link_expires_at: input.linkExpiresAt,
        description: input.description,
      },
    });
  } catch (err) {
    console.error("[egovpay] fetch to eGovPay failed (network/DNS/base URL issue):", err);
    throw err;
  }

  if (!response.ok) {
    const text = await response.text();
    console.error(`[egovpay] createTransaction non-2xx response (${response.status}):`, text);
    if (response.status === 401) {
      console.error(
        "[egovpay] authentication rejected; compare this metadata with the intended Production credential",
        authenticationMetadata(config),
      );
    }
    throw new Error(`eGovPay createTransaction failed (${response.status}): ${text}`);
  }

  const rawText = await response.text();
  let body: { data: { uuid: string; url: string; channel?: { refno?: string } } };
  try {
    body = JSON.parse(rawText);
  } catch (err) {
    console.error("[egovpay] failed to parse success response as JSON:", rawText, err);
    throw new Error(`eGovPay createTransaction returned non-JSON response: ${rawText}`);
  }

  return {
    uuid: body.data.uuid,
    url: body.data.url,
    refno: body.data.channel?.refno ?? null,
  };
}

export interface EgovPayTransactionDetail {
  uuid: string;
  txnid: string;
  refno: string;
  environmentType: string;
  paymentStatus: string;
  paidAt: string | null;
  amount: string;
  currency: string;
}

export async function getTransaction(uuid: string): Promise<EgovPayTransactionDetail> {
  const response = await egovPayFetch(`/api/v1/transaction/${encodeURIComponent(uuid)}`, {
    method: "GET",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`eGovPay getTransaction failed (${response.status}): ${text}`);
  }

  const body: {
    data: {
      uuid: string;
      txnid: string;
      refno: string;
      environment_type: string;
      payment_status: string;
      paid_at: string | null;
      amount: string;
      currency: string;
    };
  } = await response.json();

  return {
    uuid: body.data.uuid,
    txnid: body.data.txnid,
    refno: body.data.refno,
    environmentType: body.data.environment_type,
    paymentStatus: body.data.payment_status,
    paidAt: body.data.paid_at,
    amount: body.data.amount,
    currency: body.data.currency,
  };
}

export async function voidTransaction(uuid: string): Promise<{ message: string }> {
  const response = await egovPayFetch(`/api/v1/transaction/${encodeURIComponent(uuid)}/void`, {
    method: "PUT",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`eGovPay voidTransaction failed (${response.status}): ${text}`);
  }

  const body: { data: { message: string } } = await response.json();
  return body.data;
}
