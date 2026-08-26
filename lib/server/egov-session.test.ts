import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  exchangeEgovCode: vi.fn(),
  fetchEgovProfile: vi.fn(),
  createClient: vi.fn(),
  getSupabaseServerClient: vi.fn(),
  generateLink: vi.fn(),
  verifyOtp: vi.fn(),
  from: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("./egov-sso", () => ({
  exchangeEgovCode: mocks.exchangeEgovCode,
  fetchEgovProfile: mocks.fetchEgovProfile,
  EgovSsoError: class EgovSsoError extends Error {
    reason: string;
    status?: number;
    constructor(reason: string, message: string, status?: number) {
      super(message);
      this.name = "EgovSsoError";
      this.reason = reason;
      this.status = status;
    }
  },
}));

vi.mock("@/lib/supabase/server-client", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: mocks.getSupabaseServerClient,
}));

import { completeEgovSignIn } from "./egov-session";

describe("completeEgovSignIn", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.exchangeEgovCode.mockResolvedValue("egov-access-token");
    mocks.fetchEgovProfile.mockResolvedValue({
      uniqid: "MVPCBEUVCGPZR",
      email: "josie@yopmail.com",
      first_name: "JOSIE",
      middle_name: "SANTOS",
      last_name: "DELA CRUZ",
      mobile: "+639090000000",
    });

    mocks.generateLink.mockResolvedValue({
      data: {
        properties: { hashed_token: "fresh-token-hash" },
        user: { id: "user-123" },
      },
      error: null,
    });
    mocks.verifyOtp.mockResolvedValue({ data: { session: {} }, error: null });
    mocks.upsert.mockResolvedValue({ error: null });
    mocks.from.mockReturnValue({ upsert: mocks.upsert });

    mocks.getSupabaseServerClient.mockReturnValue({
      auth: { admin: { generateLink: mocks.generateLink } },
      from: mocks.from,
    });
    mocks.createClient.mockResolvedValue({ auth: { verifyOtp: mocks.verifyOtp } });
  });

  it("verifies a generated magic-link hash with the current email OTP type", async () => {
    await expect(completeEgovSignIn("exchange-code")).resolves.toEqual({});

    expect(mocks.generateLink).toHaveBeenCalledWith({
      type: "magiclink",
      email: "josie@yopmail.com",
      options: {
        data: {
          full_name: "JOSIE SANTOS DELA CRUZ",
          egov_uniqid: "MVPCBEUVCGPZR",
        },
      },
    });
    expect(mocks.verifyOtp).toHaveBeenCalledWith({
      token_hash: "fresh-token-hash",
      type: "email",
    });
    expect(mocks.from).toHaveBeenCalledWith("profiles");
    expect(mocks.upsert).toHaveBeenCalledWith(
      {
        id: "user-123",
        full_name: "JOSIE SANTOS DELA CRUZ",
        phone: "+639090000000",
      },
      { onConflict: "id" },
    );
  });
});
