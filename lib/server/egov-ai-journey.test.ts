import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  generateJourneyWithEgovAI,
  inferFulfillsId,
  inferPrerequisite,
  resetEgovAiClientForTests,
} from "./egov-ai-journey";
import type { JourneyStep } from "@/lib/types";

const fetchMock = vi.fn<typeof fetch>();

const JOURNEY = {
  summary: "Update your government records after marriage.",
  title: "Updating Records After Marriage",
  requires_evidence: true,
  evidence_title: "Attach proof of marriage",
  evidence_description: "Upload your PSA marriage certificate.",
  steps: [
    {
      agency_name: "Social Security System",
      agency_code: "SSS",
      step_title: "Update your SSS civil status",
      step_type: "record_update",
      reason: "Keep your SSS member record accurate.",
      documents_required: ["Valid government ID"],
      estimated_time: "One working day",
      important_note: null,
      fee: null,
      egov_service_name: "SSS Member Data Change",
      egov_search_term: "SSS member data change civil status",
      required_fields: [],
    },
  ],
};

const COMPACT_JOURNEY = {
  s: "Prepare your first-job government records.",
  t: "Starting After Graduation",
  e: false,
  et: null,
  ed: null,
  x: [
    {
      a: "Bureau of Internal Revenue",
      c: "BIR",
      t: "Apply for your TIN",
      y: "r",
      r: "Employers need your TIN for payroll.",
      d: ["Valid government ID"],
      z: "Check with agency",
      n: null,
      f: { a: "Free", c: "PHP", h: "No payment required", u: null },
      v: "BIR TIN Registration",
      q: "BIR first-time TIN registration",
      i: [{ k: "employment_start", l: "Employment start date", t: "date", h: null, r: true }],
    },
  ],
};

const TUPLE_JOURNEY = [
  "Register your business with essential agencies.",
  "Starting a Business",
  false,
  null,
  null,
  [
    [
      "Bureau of Internal Revenue",
      "BIR",
      "r",
      "Register your business",
      "Obtain tax registration before operating.",
      ["Valid government ID"],
      "Check with agency",
      null,
      ["Free", "PHP", "No payment required", null],
      "BIR Business Registration",
      "BIR business registration",
      [["business_name", "Business name", "text", null, true]],
    ],
  ],
];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mockSuccessfulRequest(data = JSON.stringify(JOURNEY)): void {
  fetchMock
    .mockResolvedValueOnce(
      jsonResponse({
        access_token: "egov-token",
        expires_in_seconds: 28_800,
        credits_total: 200,
        credits_remaining: 199,
      }),
    )
    .mockResolvedValueOnce(jsonResponse({ data, session_id: "session-1" }));
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  resetEgovAiClientForTests();
  process.env.EGOV_AI_BASE_URL = "https://egov.example.test";
  process.env.EGOV_AI_ACCESS_CODE = "team-access-code";
});

describe("generateJourneyWithEgovAI", () => {
  it("mints a token and calls the PH AI Assistant with the citizen context", async () => {
    mockSuccessfulRequest();

    const result = await generateJourneyWithEgovAI({
      eventId: "got-married",
      lifeEvent: "Got married",
      language: "en",
      heldIds: ["sss", "philhealth"],
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://egov.example.test/api/v1/egov/integration/token",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ access_code: "team-access-code" }),
      }),
    );

    const [assistantUrl, assistantInit] = fetchMock.mock.calls[1];
    expect(assistantUrl).toBe(
      "https://egov.example.test/api/v1/egov/integration/ai_assistant/generate",
    );
    expect(assistantInit?.headers).toEqual(
      expect.objectContaining({ Authorization: "Bearer egov-token" }),
    );
    const assistantBody = JSON.parse(String(assistantInit?.body));
    expect(assistantBody.category).toBe("PH");
    expect(assistantBody.prompt).toContain("Life event: Got married");
    expect(assistantBody.prompt).toContain(
      "Citizen's currently held government IDs/memberships: sss, philhealth.",
    );
    expect(assistantBody.prompt).toContain("at most 4 essential steps");
    expect(assistantBody.prompt).toContain('["summary","title",false');
    expect(result).toEqual(
      expect.objectContaining({
        summary: JOURNEY.summary,
        title: JOURNEY.title,
        requires_evidence: true,
        model: "egov-ai-assistant",
      }),
    );
  });

  it("expands the tuple wire format into the full journey model", async () => {
    mockSuccessfulRequest(JSON.stringify(TUPLE_JOURNEY));

    const result = await generateJourneyWithEgovAI({
      eventId: "started-a-business",
      lifeEvent: "Started a business",
      language: "en",
      heldIds: [],
    });

    expect(result).toEqual(
      expect.objectContaining({
        summary: TUPLE_JOURNEY[0],
        title: TUPLE_JOURNEY[1],
        requires_evidence: false,
      }),
    );
    expect(result.steps[0]).toEqual(
      expect.objectContaining({
        agency_name: "Bureau of Internal Revenue",
        agency_code: "BIR",
        step_type: "record_update",
        step_title: "Register your business",
        documents_required: ["Valid government ID"],
        fee: {
          amount: "Free",
          currency: "PHP",
          how_to_pay: "No payment required",
          official_source_url: null,
        },
        required_fields: [
          {
            field_key: "business_name",
            label: "Business name",
            field_type: "text",
            hint: null,
            required: true,
          },
        ],
      }),
    );
  });

  it("continues to expand the compact keyed format for compatibility", async () => {
    mockSuccessfulRequest(JSON.stringify(COMPACT_JOURNEY));

    const result = await generateJourneyWithEgovAI({
      eventId: "just-graduated",
      lifeEvent: "Just graduated",
      language: "en",
      heldIds: [],
    });

    expect(result).toEqual(
      expect.objectContaining({
        summary: COMPACT_JOURNEY.s,
        title: COMPACT_JOURNEY.t,
        requires_evidence: false,
      }),
    );
    expect(result.steps[0]).toEqual(
      expect.objectContaining({
        agency_name: "Bureau of Internal Revenue",
        agency_code: "BIR",
        step_title: "Apply for your TIN",
        step_type: "record_update",
        documents_required: ["Valid government ID"],
        fee: {
          amount: "Free",
          currency: "PHP",
          how_to_pay: "No payment required",
          official_source_url: null,
        },
        required_fields: [
          {
            field_key: "employment_start",
            label: "Employment start date",
            field_type: "date",
            hint: null,
            required: true,
          },
        ],
      }),
    );
  });

  it("extracts JSON when eGov AI wraps the response in a Markdown fence", async () => {
    mockSuccessfulRequest(`Here is the result:\n\`\`\`json\n${JSON.stringify(JOURNEY)}\n\`\`\``);

    const result = await generateJourneyWithEgovAI({
      eventId: "got-married",
      lifeEvent: "Got married",
      language: "fil",
      heldIds: [],
    });

    expect(result.steps).toHaveLength(1);
    const assistantBody = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    expect(assistantBody.prompt).toContain(
      "Citizen's currently held government IDs/memberships: none.",
    );
    expect(assistantBody.prompt).toContain("Filipino (Tagalog)");
  });

  it("reuses an unexpired access token across generations", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ access_token: "cached-token", expires_in_seconds: 28_800 }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: JSON.stringify(JOURNEY) }))
      .mockResolvedValueOnce(jsonResponse({ data: JSON.stringify(JOURNEY) }));

    const input = {
      eventId: "got-married",
      lifeEvent: "Got married",
      language: "en" as const,
      heldIds: [],
    };
    await generateJourneyWithEgovAI(input);
    await generateJourneyWithEgovAI(input);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[2][0])).toContain("ai_assistant/generate");
  });

  it("refreshes the token once when the assistant returns 401", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ access_token: "expired-token", expires_in_seconds: 300 }))
      .mockResolvedValueOnce(jsonResponse({ message: "Unauthorized" }, 401))
      .mockResolvedValueOnce(jsonResponse({ access_token: "fresh-token", expires_in_seconds: 300 }))
      .mockResolvedValueOnce(jsonResponse({ data: JSON.stringify(JOURNEY) }));

    const result = await generateJourneyWithEgovAI({
      eventId: "got-married",
      lifeEvent: "Got married",
      language: "en",
      heldIds: [],
    });

    expect(result.summary).toBe(JOURNEY.summary);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls[3][1]?.headers).toEqual(
      expect.objectContaining({ Authorization: "Bearer fresh-token" }),
    );
  });

  it("converts a natural-language eGov answer with one formatting retry", async () => {
    const prose =
      "After graduating, register with PhilHealth if you are not yet a member and update your employment details once hired.";
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ access_token: "egov-token", expires_in_seconds: 28_800 }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: prose, session_id: "source-session" }))
      .mockResolvedValueOnce(
        jsonResponse({ data: JSON.stringify(JOURNEY), session_id: "format-session" }),
      );

    const result = await generateJourneyWithEgovAI({
      eventId: "just-graduated",
      lifeEvent: "Just graduated",
      language: "en",
      heldIds: [],
    });

    expect(result.summary).toBe(JOURNEY.summary);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const formattingBody = JSON.parse(String(fetchMock.mock.calls[2][1]?.body));
    expect(formattingBody.category).toBe("PH");
    expect(formattingBody.prompt).toContain(prose);
    expect(formattingBody.prompt).toContain("Do not add facts");
    expect(formattingBody.prompt).toContain("Return only this positional tuple");
    expect(formattingBody.prompt).toContain("Keep at most 4 essential steps");
    expect(fetchMock.mock.calls[2][1]?.headers).toEqual(
      expect.objectContaining({ Authorization: "Bearer egov-token" }),
    );
  });

  it("fails after one formatting retry with truncated, redacted diagnostics", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ access_token: "egov-token", expires_in_seconds: 28_800 }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          data: "Contact josie@yopmail.com or +639090000000. This answer has no JSON.",
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: "Still prose without a JSON object." }));

    let failure: unknown;
    try {
      await generateJourneyWithEgovAI({
        eventId: "just-graduated",
        lifeEvent: "Just graduated",
        language: "en",
        heldIds: [],
      });
    } catch (error) {
      failure = error;
    }

    expect(failure).toBeInstanceOf(Error);
    const message = (failure as Error).message;
    expect(message).toContain("eGov AI journey formatting failed");
    expect(message).toContain("[redacted-email]");
    expect(message).toContain("[redacted-number]");
    expect(message).not.toContain("josie@yopmail.com");
    expect(message).not.toContain("+639090000000");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("rejects an empty step list after one formatting retry", async () => {
    const emptyJourney = JSON.stringify(["Summary", "Title", false, null, null, []]);
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ access_token: "egov-token", expires_in_seconds: 28_800 }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: emptyJourney }))
      .mockResolvedValueOnce(jsonResponse({ data: emptyJourney }));

    await expect(
      generateJourneyWithEgovAI({
        eventId: "started-a-business",
        lifeEvent: "Started a business",
        language: "en",
        heldIds: [],
      }),
    ).rejects.toThrow("contains no usable steps");
  });

  it("recovers truncated output with a tiny step-only eGov request", async () => {
    const incomplete =
      '```json\n["Registering a business involves government agencies","Register Business",false,null,null,[[';
    const recovered = JSON.stringify([
      ["Department of Trade and Industry", "DTI", "r", "Register business name"],
      ["Bureau of Internal Revenue", "BIR", "r", "Register for taxes"],
      ["Local Government Unit", "LGU", "r", "Get business permit"],
    ]);
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ access_token: "egov-token", expires_in_seconds: 28_800 }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: incomplete }))
      .mockResolvedValueOnce(jsonResponse({ data: recovered }));

    const result = await generateJourneyWithEgovAI({
      eventId: "started-a-business",
      lifeEvent: "Started a business",
      language: "en",
      heldIds: [],
    });

    expect(result.steps).toHaveLength(3);
    expect(result.steps[0]).toEqual(
      expect.objectContaining({
        agency_name: "Department of Trade and Industry",
        agency_code: "DTI",
        step_type: "record_update",
        step_title: "Register business name",
        documents_required: [],
        estimated_time: "Check with agency",
        fee: null,
        required_fields: [],
      }),
    );
    expect(result.summary).toBe("Key government steps for Started a business.");
    expect(result.requires_evidence).toBe(false);

    const recoveryBody = JSON.parse(String(fetchMock.mock.calls[2][1]?.body));
    expect(recoveryBody.prompt).toContain("Life event: Started a business");
    expect(recoveryBody.prompt).toContain(
      '[["agency name","CODE","r","action title"]]',
    );
    expect(recoveryBody.prompt).not.toContain(incomplete);
  });

  it("identifies JSON cut off before its final closing brace as truncation", async () => {
    const incomplete = '```json\n["partial","Starting a Business",false,null,null,[[';
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ access_token: "egov-token", expires_in_seconds: 28_800 }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: incomplete }))
      .mockResolvedValueOnce(jsonResponse({ data: incomplete }));

    await expect(
      generateJourneyWithEgovAI({
        eventId: "just-graduated",
        lifeEvent: "Just graduated",
        language: "en",
        heldIds: [],
      }),
    ).rejects.toThrow("incomplete JSON (likely response truncation)");
  });
});

type StepInput = Pick<JourneyStep, "step_type" | "agency_code" | "step_title">;
const benefit = (agency_code: string, step_title = "Claim a benefit"): StepInput => ({
  step_type: "benefit_claim",
  agency_code,
  step_title,
});

describe("journey relationship inference", () => {
  it("maps known benefit agencies to their membership prerequisites", () => {
    expect(inferPrerequisite(benefit("PHILHEALTH"))).toEqual({
      required_id: "philhealth",
      prerequisite_type: "membership",
    });
    expect(inferPrerequisite(benefit("SSS"))).toEqual({
      required_id: "sss",
      prerequisite_type: "contribution",
    });
    expect(inferPrerequisite(benefit("PAGIBIG"))).toEqual({
      required_id: "pagibig",
      prerequisite_type: "membership",
    });
  });

  it("tags only record-update steps that obtain a known ID", () => {
    expect(
      inferFulfillsId({
        step_type: "record_update",
        agency_code: "SSS",
        step_title: "Get your SSS number",
      }),
    ).toBe("sss");
    expect(inferFulfillsId(benefit("SSS", "Claim your SSS maternity benefit"))).toBeUndefined();
  });
});
