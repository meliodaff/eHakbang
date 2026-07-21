import "server-only";
import { createHmac, randomUUID } from "crypto";

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

function getConfig(): EgovPayConfig {
  if (cachedConfig) return cachedConfig;
  const baseUrl = process.env.EGOVPAY_BASE_URL;
  const token = process.env.EGOVPAY_API_TOKEN;
  const settlementTemplateUuid = process.env.EGOVPAY_SETTLEMENT_TEMPLATE_UUID;
  if (!baseUrl || !token || !settlementTemplateUuid) {
    throw new Error(
      "eGovPay is not configured (EGOVPAY_BASE_URL / EGOVPAY_API_TOKEN / EGOVPAY_SETTLEMENT_TEMPLATE_UUID)",
    );
  }
  cachedConfig = { baseUrl, token, settlementTemplateUuid };
  return cachedConfig;
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
      "Content-Type": "application/json; charset=utf-8",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
}

export async function createTransaction(
  input: CreateTransactionInput,
): Promise<EgovPayTransaction> {
  const { token, settlementTemplateUuid } = getConfig();
  const amountStr = String(input.amount);
  const digest = computeDigest(amountStr, input.txnid, token);

  let response: Response;
  try {
    response = await egovPayFetch("/api/v1/transaction", {
      method: "POST",
      body: {
        items: input.items,
        amount: input.amount,
        settlement_template_uuid: settlementTemplateUuid,
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
