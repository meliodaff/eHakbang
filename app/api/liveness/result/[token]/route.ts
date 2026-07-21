import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/liveness/result/[token]
 *
 * Server-side proxy to fetch the liveness verification result from the eGov
 * Face Liveness API. The API key is kept server-side.
 *
 * Response:
 *   { status: string; confidence_score: number; reference_image_url: string; verified: boolean }
 *
 * `verified` is true when status === "SUCCEEDED" and confidence_score >= 95.0
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const apiKey = process.env.EGOV_LIVENESS_API_KEY;
  const baseUrl = process.env.EGOV_LIVENESS_BASE_URL;

  if (!apiKey || !baseUrl) {
    return NextResponse.json(
      { error: "Liveness API not configured" },
      { status: 500 },
    );
  }

  if (!token) {
    return NextResponse.json(
      { error: "Session token is required" },
      { status: 400 },
    );
  }

  const response = await fetch(
    `${baseUrl}/v1/liveness/result/${encodeURIComponent(token)}`,
    {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
      },
    },
  );

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json(
      { error: "Failed to fetch liveness result", details: text },
      { status: response.status },
    );
  }

  const data: {
    status: string;
    confidence_score: number;
    reference_image_url: string;
  } = await response.json();

  // Apply recommended security thresholds:
  // - status must be "SUCCEEDED"
  // - confidence_score must be >= 95.0
  const verified =
    data.status === "SUCCEEDED" && data.confidence_score >= 95.0;

  return NextResponse.json({
    ...data,
    verified,
  });
}
