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
  const baseUrl = process.env.EGOV_LIVENESS_BASE_URL;
  const apiKey = process.env.EGOV_LIVENESS_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new Error(
      "Liveness API is not configured (EGOV_LIVENESS_BASE_URL / EGOV_LIVENESS_API_KEY)",
    );
  }
  return { baseUrl, apiKey };
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
