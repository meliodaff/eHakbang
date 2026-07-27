import "server-only";
import type { IdType, JourneyStep, Language } from "@/lib/types";

/**
 * Generates journey requirements with the eGov AI Assistant API (see
 * eGovAI-apidoc.md). Unlike a schema-enforced LLM API, this endpoint takes a
 * single free-text prompt and returns a free-text answer, so the JSON shape
 * we need is requested via the prompt itself and parsed defensively here.
 */

export interface GeneratedJourney {
  summary: string;
  steps: Array<Omit<JourneyStep, "step_number" | "egov_url">>;
  model: string;
}

interface EgovAiConfig {
  baseUrl: string;
  token: string;
}

function getConfig(): EgovAiConfig {
  const baseUrl = process.env.EGOV_AI_BASE_URL;
  const token = process.env.EGOV_AI_API_TOKEN;
  if (!baseUrl || !token) {
    throw new Error(
      "eGov AI Assistant is not configured (EGOV_AI_BASE_URL / EGOV_AI_API_TOKEN)",
    );
  }
  return { baseUrl, token };
}

export function isEgovAiConfigured(): boolean {
  try {
    getConfig();
    return true;
  } catch {
    return false;
  }
}

const MODEL_NAME = "egov-ai-assistant";

const STEP_FEE_SPEC = {
  description: "null when the step has no fee, otherwise an object",
  properties: {
    amount: "string",
    currency: "string",
    how_to_pay: "string",
    official_source_url: "string or null",
  },
};

const REQUIRED_FIELD_SPEC = {
  description:
    "array of citizen-supplied data values not covered by an uploaded document; empty array when unused",
  item_properties: {
    field_key: "string",
    label: "string",
    field_type: '"text" | "number" | "date"',
    hint: "string or null",
    required: "boolean",
  },
};

const JSON_SHAPE_SPEC = `Respond with ONLY a single JSON object -- no prose before or after it, no markdown code fence -- matching exactly this shape:
{
  "summary": "string",
  "steps": [
    {
      "agency_name": "string",
      "agency_code": "string",
      "step_title": "string",
      "step_type": "record_update" | "benefit_claim",
      "reason": "string",
      "documents_required": ["string", ...],
      "estimated_time": "string",
      "important_note": "string or null",
      "fee": ${JSON.stringify(STEP_FEE_SPEC)},
      "egov_service_name": "string",
      "egov_search_term": "string",
      "required_fields": ${JSON.stringify(REQUIRED_FIELD_SPEC)}
    }
  ]
}`;

const INSTRUCTIONS = `You are eHakbang's requirements assistant for Filipino citizens navigating government
agencies. Given a life event, provide the current, accurate list of steps a citizen must take
across Philippine government agencies (SSS, PhilHealth, Pag-IBIG, BIR, PSA, DOLE, GSIS, DSWD,
LGU/barangay, COMELEC, etc.).

Rules:
- Prioritize official .gov.ph sources (e.g. sss.gov.ph, philhealth.gov.ph, pagibigfund.gov.ph,
  bir.gov.ph, psa.gov.ph, dole.gov.ph). Cross-check when sources disagree.
- Never invent a peso amount, fee, or document requirement. If a fee applies, set "fee" with the
  amount/how to pay and cite it in "official_source_url". If a step has no fee, set "fee" to null.
- List every document required to complete the step in "documents_required".
- "documents_required" is only for things the citizen uploads (certificates, IDs, forms). If the
  step also needs a data value only the citizen knows -- one that no document supplies, like a
  proposed business name, a bank account number, or a specific address -- list each such value as
  an entry in "required_fields" instead (field_key, label, field_type, hint, required). Do not
  duplicate an item between the two lists. Leave "required_fields" as an empty array when the
  uploaded evidence document is sufficient on its own, which is true for most steps.
- Keep "reason" a one-sentence, plain-language explanation. Keep "important_note" for deadlines,
  eligibility caveats, or warnings -- null when there are none.
- Write every text field (reason, important_note, documents_required, estimated_time,
  agency_name, step_title) as plain prose. Never include markdown formatting, bracketed
  citations, or raw URLs in these fields -- the only field a URL belongs in is
  "fee.official_source_url".
- Order steps in the sequence a citizen should realistically complete them.`;

function buildUserPrompt(lifeEvent: string, language: Language): string {
  const languageInstruction =
    language === "fil"
      ? "Respond in Filipino (Tagalog)."
      : "Respond in English.";
  return `Life event: ${lifeEvent}\n${languageInstruction}`;
}

function buildPrompt(lifeEvent: string, language: Language): string {
  return `${INSTRUCTIONS}\n\n${JSON_SHAPE_SPEC}\n\n${buildUserPrompt(lifeEvent, language)}`;
}

/** Unwraps a full-string ```json ... ``` (or ``` ... ```) fence, if present. */
function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
  return match ? match[1].trim() : trimmed;
}

function parseJourneyData(data: string): {
  summary: string;
  steps: Array<Omit<JourneyStep, "step_number" | "fulfills_id" | "egov_url">>;
} {
  const parsed = JSON.parse(stripCodeFence(data)) as {
    summary?: unknown;
    steps?: unknown;
  };
  if (typeof parsed.summary !== "string" || !Array.isArray(parsed.steps)) {
    throw new Error(
      "eGov AI Assistant response did not match the expected journey shape",
    );
  }
  return parsed as {
    summary: string;
    steps: Array<Omit<JourneyStep, "step_number" | "fulfills_id" | "egov_url">>;
  };
}

export async function generateJourneyWithEgovAi(input: {
  eventId: string;
  lifeEvent: string;
  language: Language;
}): Promise<GeneratedJourney> {
  const { baseUrl, token } = getConfig();

  const response = await fetch(
    `${baseUrl}/api/v1/egov/integration/ai_assistant/generate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: buildPrompt(input.lifeEvent, input.language),
        category: "PH",
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`eGov AI Assistant generate failed (${response.status}): ${text}`);
  }

  const body: { data: string; session_id: string } = await response.json();
  const parsed = parseJourneyData(body.data);

  return {
    summary: parsed.summary,
    steps: parsed.steps.map((step) => ({
      ...step,
      fulfills_id: inferFulfillsId(step),
    })),
    model: MODEL_NAME,
  };
}

/**
 * The model doesn't reliably assign `fulfills_id` across regenerations, so
 * it's inferred afterward from the agency + step title instead.
 */
function inferFulfillsId(
  step: Pick<JourneyStep, "agency_code" | "step_title">,
): IdType | undefined {
  const title = step.step_title.toLowerCase();
  const agency = step.agency_code.toUpperCase();
  if (agency === "BIR" && /\btin\b/.test(title)) return "tin";
  if (agency === "SSS" && /\bsss\b/.test(title)) return "sss";
  if (agency === "PHILHEALTH" && /philhealth/.test(title)) return "philhealth";
  if (agency === "PAGIBIG" && /pag-ibig/.test(title)) return "pagibig";
  if (agency === "PHILSYS" && /national id/.test(title)) return "philsys";
  return undefined;
}
