import { createHash, createHmac } from "crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const INPUT = {
  items: [{ name: "PSA Birth Certificate", amount: 365 }],
  amount: 365,
  txnid: "EHKB-TEST-1",
  redirectUrl: "https://ehakbang.example/journey/pay/callback",
  callbackUrl: "https://ehakbang.example/api/payment/webhook",
  currency: "PHP",
};

async function loadClient() {
  vi.resetModules();
  return import("./egovpay");
}

function successResponse() {
  return new Response(
    JSON.stringify({
      data: {
        uuid: "a23977c3-f2f2-4e5c-bf53-94bcff48e49c",
        url: "https://egovpay.example/transaction",
        channel: { refno: "TESTREF" },
      },
    }),
    { status: 201, headers: { "Content-Type": "application/json" } },
  );
}

describe("eGovPay authentication handling", () => {
  const fetchMock = vi.fn<typeof fetch>();
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.stubEnv("EGOVPAY_BASE_URL", "https://platforms-api.e.gov.ph/egovpay/");
    vi.stubEnv("EGOVPAY_API_TOKEN", "0123456789abcdef0123456789abcdef");
    vi.stubEnv("EGOVPAY_SETTLEMENT_TEMPLATE_UUID", "123e4567-e89b-42d3-a456-426614174000");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("adds test_ to a bare portal key and uses the bare key for the digest", async () => {
    fetchMock.mockResolvedValue(successResponse());
    const { createTransaction } = await loadClient();

    await createTransaction(INPUT);

    const [url, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);
    const requestBody = JSON.parse(String(init?.body));
    const bareKey = "0123456789abcdef0123456789abcdef";

    expect(url).toBe("https://platforms-api.e.gov.ph/egovpay/api/v1/transaction");
    expect(headers.get("x-egovpay-token")).toBe(`test_${bareKey}`);
    expect(requestBody.digest).toBe(
      createHmac("sha256", bareKey).update("365|EHKB-TEST-1").digest("hex"),
    );
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("has no environment prefix"));
  });

  it("repairs outer quotes, whitespace, uppercase, and a duplicated test prefix", async () => {
    vi.stubEnv(
      "EGOVPAY_API_TOKEN",
      '  "TEST_test_0123456789abcdef0123456789abcdef"  ',
    );
    vi.stubEnv(
      "EGOVPAY_SETTLEMENT_TEMPLATE_UUID",
      ' "123e4567-e89b-42d3-a456-426614174000" ',
    );
    fetchMock.mockResolvedValue(successResponse());
    const { createTransaction } = await loadClient();

    await createTransaction(INPUT);

    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(headers.get("x-egovpay-token")).toBe(
      "test_0123456789abcdef0123456789abcdef",
    );
  });

  it("logs only safe token metadata when eGovPay rejects authentication", async () => {
    const responseBody = JSON.stringify({
      error: "invalid_api_header",
      message: "Invalid API Header",
    });
    fetchMock.mockResolvedValue(
      new Response(responseBody, {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const { createTransaction } = await loadClient();

    await expect(createTransaction(INPUT)).rejects.toThrow(
      "eGovPay createTransaction failed (401)",
    );

    const normalizedToken = "test_0123456789abcdef0123456789abcdef";
    expect(errorSpy).toHaveBeenCalledWith(
      "[egovpay] authentication rejected; compare this metadata with the intended Production credential",
      {
        baseOrigin: "https://platforms-api.e.gov.ph",
        basePath: "/egovpay",
        tokenMode: "test",
        tokenLength: 37,
        tokenFingerprint: createHash("sha256")
          .update(normalizedToken)
          .digest("hex")
          .slice(0, 12),
      },
    );
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(normalizedToken);
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain(
      "0123456789abcdef0123456789abcdef",
    );
  });

  it("rejects a placeholder token before making a network request", async () => {
    vi.stubEnv("EGOVPAY_API_TOKEN", "test_<TOKEN_KEY>");
    const { createTransaction } = await loadClient();

    await expect(createTransaction(INPUT)).rejects.toThrow("placeholder brackets");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
