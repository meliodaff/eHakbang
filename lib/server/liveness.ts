import "server-only";

/**
 * Server-only client for the eGov Face Liveness API (see app/api/liveness/*).
 * Credentials never reach the browser -- callers are Next.js API routes.
 */

interface LivenessConfig {
  baseUrl: string;
  apiKey: string;
}

function getConfig(): LivenessConfig {
  const rawBaseUrl = process.env.EGOV_LIVENESS_BASE_URL;
  const apiKey = process.env.EGOV_LIVENESS_API_KEY;
  if (!rawBaseUrl || !apiKey) {
    throw new Error(
      "Liveness API is not configured (EGOV_LIVENESS_BASE_URL / EGOV_LIVENESS_API_KEY)",
    );
  }

  const baseUrl = rawBaseUrl.trim().replace(/\/+$/, "");
  const parsedBaseUrl = new URL(baseUrl);
  if (parsedBaseUrl.protocol !== "https:" && process.env.NODE_ENV === "production") {
    throw new Error("EGOV_LIVENESS_BASE_URL must use HTTPS in production");
  }

  return { baseUrl, apiKey };
}

/**
 * Dev-only escape hatch for when the (hackathon-provided) eGov liveness API
 * is unavailable. Never active in production, so a real deployment always
 * enforces the actual check even if this flag or the API config is missing.
 * Set LIVENESS_MOCK=true in .env.local to force it on regardless of config.
 */
export function isLivenessMockEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.LIVENESS_MOCK === "true") return true;
  return !process.env.EGOV_LIVENESS_BASE_URL || !process.env.EGOV_LIVENESS_API_KEY;
}

export interface LivenessResult {
  status: string;
  confidence_score: number;
  reference_image_url?: string;
  verified: boolean;
}

/**
 * Fetch a liveness session's result and apply the recommended security
 * thresholds: status must be "SUCCEEDED" and confidence_score >= 95.0.
 */
export async function getLivenessResult(token: string): Promise<LivenessResult> {
  if (isLivenessMockEnabled()) {
    console.warn(
      `[liveness] LIVENESS_MOCK active - auto-approving token ${token} (dev only, never happens in production)`,
    );
    return {
      status: "SUCCEEDED",
      confidence_score: 99.9,
      verified: true,
    };
  }

  const { baseUrl, apiKey } = getConfig();

  const response = await fetch(`${baseUrl}/v1/liveness/result/${encodeURIComponent(token)}`, {
    method: "GET",
    headers: { "x-api-key": apiKey },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Liveness result fetch failed (${response.status}): ${text}`);
  }

  const data: { status: string; confidence_score: number; reference_image_url: string } =
    await response.json();

  const verified = data.status === "SUCCEEDED" && data.confidence_score >= 95.0;

  return { ...data, verified };
}
