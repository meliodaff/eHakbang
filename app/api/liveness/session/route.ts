import { NextRequest, NextResponse } from "next/server";
import { describeError } from "@/lib/describe-error";
import { isLivenessMockEnabled } from "@/lib/server/liveness";

const UPSTREAM_TIMEOUT_MS = 15_000;
const DEFAULT_REDIRECT_DELAY_MS = 3_000;
const MAX_REDIRECT_DELAY_MS = 10_000;

type ErrorCode =
  | "LIVENESS_INVALID_REQUEST"
  | "LIVENESS_NOT_CONFIGURED"
  | "LIVENESS_UPSTREAM_REJECTED"
  | "LIVENESS_UPSTREAM_UNREACHABLE"
  | "LIVENESS_INVALID_UPSTREAM_RESPONSE";

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  requestId: string,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Request-Id": requestId,
    },
  });
}

function errorResponse(
  message: string,
  code: ErrorCode,
  status: number,
  requestId: string,
) {
  return jsonResponse(
    {
      error: `${message} (reference: ${requestId})`,
      code,
      requestId,
    },
    status,
    requestId,
  );
}

function upstreamSessionUrl(rawBaseUrl: string): URL {
  const normalizedBaseUrl = rawBaseUrl.trim().replace(/\/+$/, "");
  const url = new URL(`${normalizedBaseUrl}/v1/liveness/session`);

  if (url.protocol !== "https:" && process.env.NODE_ENV === "production") {
    throw new Error("EGOV_LIVENESS_BASE_URL must use HTTPS in production");
  }

  return url;
}

function safeResponseExcerpt(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 500) || "<empty>";
}

/**
 * POST /api/liveness/session
 *
 * Server-side proxy to the eGov Face Liveness API. Creates a liveness session
 * and returns the verification URL and token to the client. The API key is
 * kept server-side and never exposed to the browser.
 *
 * Request body:
 *   { callback_url: string; delay?: number }
 *
 * Response:
 *   { token: string; url: string }
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const vercelRequestId = request.headers.get("x-vercel-id");

  console.info(`[api/liveness/session] request received`, {
    requestId,
    vercelRequestId,
  });

  let body: { callback_url?: string; delay?: number };
  try {
    body = await request.json();
  } catch {
    console.warn(`[api/liveness/session] invalid JSON body`, { requestId });
    return errorResponse(
      "Invalid request body",
      "LIVENESS_INVALID_REQUEST",
      400,
      requestId,
    );
  }

  if (!body.callback_url || typeof body.callback_url !== "string") {
    console.warn(`[api/liveness/session] callback_url is missing`, { requestId });
    return errorResponse(
      "callback_url is required",
      "LIVENESS_INVALID_REQUEST",
      400,
      requestId,
    );
  }

  let callbackUrl: URL;
  try {
    callbackUrl = new URL(body.callback_url);
    if (callbackUrl.protocol !== "https:" && callbackUrl.hostname !== "localhost") {
      throw new Error("callback_url must use HTTPS");
    }
  } catch (err) {
    console.warn(`[api/liveness/session] invalid callback_url`, {
      requestId,
      error: describeError(err),
    });
    return errorResponse(
      "callback_url must be a valid HTTPS URL",
      "LIVENESS_INVALID_REQUEST",
      400,
      requestId,
    );
  }

  const delay = body.delay ?? DEFAULT_REDIRECT_DELAY_MS;
  if (
    typeof delay !== "number" ||
    !Number.isInteger(delay) ||
    delay < 0 ||
    delay > MAX_REDIRECT_DELAY_MS
  ) {
    console.warn(`[api/liveness/session] invalid redirect delay`, {
      requestId,
      delay,
    });
    return errorResponse(
      `delay must be an integer from 0 to ${MAX_REDIRECT_DELAY_MS}`,
      "LIVENESS_INVALID_REQUEST",
      400,
      requestId,
    );
  }

  if (isLivenessMockEnabled()) {
    const token = `mock_${crypto.randomUUID()}`;
    const mockUrl = new URL("/dev/liveness-mock", request.nextUrl.origin);
    mockUrl.searchParams.set("callback_url", callbackUrl.toString());
    mockUrl.searchParams.set("delay", String(delay));
    console.info(`[api/liveness/session] mock session created`, { requestId });
    return jsonResponse(
      { token, url: mockUrl.toString() },
      201,
      requestId,
    );
  }

  const apiKey = process.env.EGOV_LIVENESS_API_KEY;
  const rawBaseUrl = process.env.EGOV_LIVENESS_BASE_URL;

  if (!apiKey || !rawBaseUrl) {
    console.error(`[api/liveness/session] production configuration missing`, {
      requestId,
      hasApiKey: Boolean(apiKey),
      hasBaseUrl: Boolean(rawBaseUrl),
    });
    return errorResponse(
      "Liveness API is not configured",
      "LIVENESS_NOT_CONFIGURED",
      500,
      requestId,
    );
  }

  let upstreamUrl: URL;
  try {
    upstreamUrl = upstreamSessionUrl(rawBaseUrl);
  } catch (err) {
    console.error(`[api/liveness/session] invalid upstream configuration`, {
      requestId,
      error: describeError(err),
    });
    return errorResponse(
      "Liveness API is not configured correctly",
      "LIVENESS_NOT_CONFIGURED",
      500,
      requestId,
    );
  }

  console.info(`[api/liveness/session] calling upstream`, {
    requestId,
    upstreamOrigin: upstreamUrl.origin,
    upstreamPath: upstreamUrl.pathname,
    callbackOrigin: callbackUrl.origin,
  });

  let response: Response;
  try {
    response = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "redirect",
        callback_url: callbackUrl.toString(),
        delay,
      }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (err) {
    console.error(`[api/liveness/session] upstream request failed`, {
      requestId,
      error: describeError(err),
    });
    return errorResponse(
      "Face verification service is currently unreachable",
      "LIVENESS_UPSTREAM_UNREACHABLE",
      502,
      requestId,
    );
  }

  let responseText: string;
  try {
    responseText = await response.text();
  } catch (err) {
    console.error(`[api/liveness/session] failed to read upstream response`, {
      requestId,
      upstreamStatus: response.status,
      error: describeError(err),
    });
    return errorResponse(
      "Face verification service returned an invalid response",
      "LIVENESS_INVALID_UPSTREAM_RESPONSE",
      502,
      requestId,
    );
  }

  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    const cloudflareEdgeResponse =
      response.headers.has("cf-ray") ||
      (response.headers.get("server") ?? "").toLowerCase().includes("cloudflare");

    console.error(`[api/liveness/session] upstream rejected session creation`, {
      requestId,
      upstreamStatus: response.status,
      contentType,
      cloudflareEdgeResponse,
      cloudflareRay: response.headers.get("cf-ray"),
      upstreamBody: safeResponseExcerpt(responseText),
    });
    return errorResponse(
      "Failed to create liveness session",
      "LIVENESS_UPSTREAM_REJECTED",
      response.status === 429 ? 503 : 502,
      requestId,
    );
  }

  let data: unknown;
  try {
    data = JSON.parse(responseText);
  } catch (err) {
    console.error(`[api/liveness/session] upstream returned non-JSON success`, {
      requestId,
      contentType: response.headers.get("content-type"),
      upstreamBody: safeResponseExcerpt(responseText),
      error: describeError(err),
    });
    return errorResponse(
      "Face verification service returned an invalid response",
      "LIVENESS_INVALID_UPSTREAM_RESPONSE",
      502,
      requestId,
    );
  }

  if (
    !data ||
    typeof data !== "object" ||
    typeof (data as { token?: unknown }).token !== "string" ||
    !(data as { token: string }).token ||
    typeof (data as { url?: unknown }).url !== "string" ||
    !(data as { url: string }).url
  ) {
    console.error(`[api/liveness/session] upstream response is missing token or url`, {
      requestId,
      responseKeys:
        data && typeof data === "object" ? Object.keys(data) : [],
    });
    return errorResponse(
      "Face verification service returned an invalid response",
      "LIVENESS_INVALID_UPSTREAM_RESPONSE",
      502,
      requestId,
    );
  }

  console.info(`[api/liveness/session] session created`, {
    requestId,
    upstreamStatus: response.status,
  });
  return jsonResponse(
    {
      token: (data as { token: string }).token,
      url: (data as { url: string }).url,
    },
    201,
    requestId,
  );
}
