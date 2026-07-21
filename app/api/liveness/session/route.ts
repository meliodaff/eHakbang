import { NextRequest, NextResponse } from "next/server";

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
  const apiKey = process.env.EGOV_LIVENESS_API_KEY;
  const baseUrl = process.env.EGOV_LIVENESS_BASE_URL;

  if (!apiKey || !baseUrl) {
    return NextResponse.json(
      { error: "Liveness API not configured" },
      { status: 500 },
    );
  }

  let body: { callback_url?: string; delay?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (!body.callback_url || typeof body.callback_url !== "string") {
    return NextResponse.json(
      { error: "callback_url is required" },
      { status: 400 },
    );
  }

  const response = await fetch(`${baseUrl}/v1/liveness/session`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "redirect",
      callback_url: body.callback_url,
      delay: body.delay ?? 3000,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json(
      { error: "Failed to create liveness session", details: text },
      { status: response.status },
    );
  }

  const data: { token: string; url: string } = await response.json();
  return NextResponse.json(data, { status: 201 });
}
