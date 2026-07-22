import { NextRequest, NextResponse } from "next/server";
import { getLivenessResult } from "@/lib/server/liveness";

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

  if (!token) {
    return NextResponse.json(
      { error: "Session token is required" },
      { status: 400 },
    );
  }

  try {
    const result = await getLivenessResult(token);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/liveness/result] fetch failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch liveness result", details: String(err) },
      { status: 500 },
    );
  }
}
