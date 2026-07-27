import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// The module under test imports "server-only", which throws when it detects
// a DOM global (jsdom, the default test environment, has `window`). Stub it
// out so this server-side module can still be unit tested here.
vi.mock("server-only", () => ({}));

import { generateJourneyWithEgovAi, isEgovAiConfigured } from "./egov-ai";

const VALID_DATA = {
  summary: "Update your civil status across agencies.",
  steps: [
    {
      agency_name: "Social Security System",
      agency_code: "SSS",
      step_title: "Update civil status & beneficiaries",
      step_type: "record_update" as const,
      reason: "Ensures your spouse is recognized as a beneficiary.",
      documents_required: ["PSA marriage certificate"],
      estimated_time: "Same day",
      important_note: null,
      fee: null,
      egov_service_name: "SSS Member Update",
      egov_search_term: "SSS update civil status",
      required_fields: [],
    },
    {
      agency_name: "Bureau of Internal Revenue",
      agency_code: "BIR",
      step_title: "Get your TIN",
      step_type: "record_update" as const,
      reason: "A Tax Identification Number is required for employment.",
      documents_required: ["PSA birth certificate"],
      estimated_time: "1-2 days",
      important_note: null,
      fee: null,
      egov_service_name: "BIR TIN Registration",
      egov_search_term: "BIR TIN registration",
      required_fields: [],
    },
  ],
};

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

describe("egov-ai", () => {
  beforeEach(() => {
    vi.stubEnv("EGOV_AI_BASE_URL", "https://example.test");
    vi.stubEnv("EGOV_AI_API_TOKEN", "test-token");
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe("isEgovAiConfigured", () => {
    it("is true when both env vars are set", () => {
      expect(isEgovAiConfigured()).toBe(true);
    });

    it("is false when a var is missing", () => {
      vi.stubEnv("EGOV_AI_API_TOKEN", "");
      expect(isEgovAiConfigured()).toBe(false);
    });
  });

  describe("generateJourneyWithEgovAi", () => {
    it("throws a descriptive error when not configured", async () => {
      vi.stubEnv("EGOV_AI_BASE_URL", "");
      vi.stubEnv("EGOV_AI_API_TOKEN", "");
      await expect(
        generateJourneyWithEgovAi({ eventId: "got-married", lifeEvent: "Got married", language: "en" }),
      ).rejects.toThrow("EGOV_AI_BASE_URL / EGOV_AI_API_TOKEN");
    });

    it("parses a plain JSON response and infers fulfills_id", async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ data: JSON.stringify(VALID_DATA), session_id: "s1" }),
      );

      const result = await generateJourneyWithEgovAi({
        eventId: "got-married",
        lifeEvent: "Got married",
        language: "en",
      });

      expect(result.summary).toBe(VALID_DATA.summary);
      expect(result.model).toBe("egov-ai-assistant");
      expect(result.steps[0].fulfills_id).toBeUndefined();
      expect(result.steps[1].fulfills_id).toBe("tin");
    });

    it("sends the request with the expected auth header and body", async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ data: JSON.stringify(VALID_DATA), session_id: "s1" }),
      );

      await generateJourneyWithEgovAi({
        eventId: "got-married",
        lifeEvent: "Got married",
        language: "fil",
      });

      const [url, init] = vi.mocked(fetch).mock.calls[0];
      expect(url).toBe("https://example.test/api/v1/egov/integration/ai_assistant/generate");
      expect(init?.headers).toMatchObject({ Authorization: "Bearer test-token" });
      const body = JSON.parse(init?.body as string);
      expect(body.category).toBe("PH");
      expect(body.prompt).toContain("Filipino (Tagalog)");
    });

    it("unwraps a full-string ```json fence before parsing", async () => {
      const fenced = "```json\n" + JSON.stringify(VALID_DATA) + "\n```";
      vi.mocked(fetch).mockResolvedValue(jsonResponse({ data: fenced, session_id: "s1" }));

      const result = await generateJourneyWithEgovAi({
        eventId: "got-married",
        lifeEvent: "Got married",
        language: "en",
      });

      expect(result.summary).toBe(VALID_DATA.summary);
      expect(result.steps).toHaveLength(2);
    });

    it("throws when the upstream response is non-2xx", async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse({ error: "unauthorized" }, 401));

      await expect(
        generateJourneyWithEgovAi({ eventId: "got-married", lifeEvent: "Got married", language: "en" }),
      ).rejects.toThrow("eGov AI Assistant generate failed (401)");
    });

    it("throws when data is not valid JSON", async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ data: "Sure, here are the steps you need...", session_id: "s1" }),
      );

      await expect(
        generateJourneyWithEgovAi({ eventId: "got-married", lifeEvent: "Got married", language: "en" }),
      ).rejects.toThrow();
    });

    it("throws when data is valid JSON but missing the expected shape", async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ data: JSON.stringify({ foo: "bar" }), session_id: "s1" }),
      );

      await expect(
        generateJourneyWithEgovAi({ eventId: "got-married", lifeEvent: "Got married", language: "en" }),
      ).rejects.toThrow("did not match the expected journey shape");
    });
  });
});
