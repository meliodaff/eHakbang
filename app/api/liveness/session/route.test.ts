import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

import { POST } from "./route";

function request(body: unknown = { callback_url: "https://ehakbang.example/callback" }) {
  return new NextRequest("https://ehakbang.example/api/liveness/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-vercel-id": "sin1::test-request",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/liveness/session", () => {
  const fetchMock = vi.fn<typeof fetch>();
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.stubEnv("EGOV_LIVENESS_BASE_URL", "https://platforms-api.e.gov.ph/face-liveness/");
    vi.stubEnv("EGOV_LIVENESS_API_KEY", "test-api-key");
    vi.stubEnv("LIVENESS_MOCK", "false");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("normalizes a trailing slash and returns a validated session", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          token: "session-token",
          url: "https://liveness.e.gov.ph/session-token",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({
      token: "session-token",
      url: "https://liveness.e.gov.ph/session-token",
    });
    expect(response.headers.get("x-request-id")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url.toString()).toBe(
      "https://platforms-api.e.gov.ph/face-liveness/v1/liveness/session",
    );
    expect(init).toEqual(
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-api-key": "test-api-key",
          Accept: "application/json",
        }),
      }),
    );
    expect(JSON.parse(String(init?.body))).toEqual({
      action: "redirect",
      callback_url: "https://ehakbang.example/callback",
      delay: 3000,
    });
    expect(infoSpy).toHaveBeenCalledWith(
      "[api/liveness/session] session created",
      expect.objectContaining({ requestId: expect.any(String), upstreamStatus: 200 }),
    );
  });

  it("logs Cloudflare/upstream diagnostics and returns a safe correlated error", async () => {
    fetchMock.mockResolvedValue(
      new Response("<html>Forbidden</html>", {
        status: 403,
        headers: {
          "Content-Type": "text/html",
          Server: "cloudflare",
          "CF-Ray": "test-ray",
        },
      }),
    );

    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual(
      expect.objectContaining({
        code: "LIVENESS_UPSTREAM_REJECTED",
        requestId: expect.any(String),
        error: expect.stringContaining("reference:"),
      }),
    );
    expect(JSON.stringify(body)).not.toContain("Forbidden");
    expect(errorSpy).toHaveBeenCalledWith(
      "[api/liveness/session] upstream rejected session creation",
      expect.objectContaining({
        requestId: body.requestId,
        upstreamStatus: 403,
        cloudflareEdgeResponse: true,
        cloudflareRay: "test-ray",
        upstreamBody: "<html>Forbidden</html>",
      }),
    );
  });

  it("logs and classifies a network failure", async () => {
    fetchMock.mockRejectedValue(new Error("fetch failed"));

    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.code).toBe("LIVENESS_UPSTREAM_UNREACHABLE");
    expect(errorSpy).toHaveBeenCalledWith(
      "[api/liveness/session] upstream request failed",
      expect.objectContaining({
        requestId: body.requestId,
        error: "fetch failed",
      }),
    );
  });

  it("reports missing production configuration without exposing secrets", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("EGOV_LIVENESS_BASE_URL", "");
    vi.stubEnv("EGOV_LIVENESS_API_KEY", "");

    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.code).toBe("LIVENESS_NOT_CONFIGURED");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      "[api/liveness/session] production configuration missing",
      expect.objectContaining({
        requestId: body.requestId,
        hasApiKey: false,
        hasBaseUrl: false,
      }),
    );
  });

  it("rejects a success response that does not contain token and url", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.code).toBe("LIVENESS_INVALID_UPSTREAM_RESPONSE");
    expect(errorSpy).toHaveBeenCalledWith(
      "[api/liveness/session] upstream response is missing token or url",
      expect.objectContaining({
        requestId: body.requestId,
        responseKeys: ["message"],
      }),
    );
  });
});
