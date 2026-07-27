import "server-only";
import OpenAI from "openai";
import type { IdType, JourneyStep, Language } from "@/lib/types";

/**
 * Generates journey requirements with OpenAI's Responses API + web_search
 * tool, so documents/fees stay current instead of hand-maintained. Output is
 * constrained to a strict JSON schema mirroring `JourneyStep` (minus fields
 * the app assigns itself: `step_number`, `fulfills_id`, `egov_url`).
 */

export interface GeneratedJourney {
  summary: string;
  steps: Array<Omit<JourneyStep, "step_number" | "fulfills_id" | "egov_url">>;
  model: string;
}

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (client) return client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  client = new OpenAI({ apiKey });
  return client;
}

const STEP_FEE_SCHEMA = {
  anyOf: [
    { type: "null" },
    {
      type: "object",
      properties: {
        amount: { type: "string" },
        currency: { type: "string" },
        how_to_pay: { type: "string" },
        official_source_url: { type: ["string", "null"] },
      },
      required: ["amount", "currency", "how_to_pay", "official_source_url"],
      additionalProperties: false,
    },
  ],
};

const REQUIRED_FIELDS_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: {
      field_key: { type: "string" },
      label: { type: "string" },
      field_type: { type: "string", enum: ["text", "number", "date"] },
      hint: { type: ["string", "null"] },
      required: { type: "boolean" },
    },
    required: ["field_key", "label", "field_type", "hint", "required"],
    additionalProperties: false,
  },
};

const JOURNEY_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    steps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          agency_name: { type: "string" },
          agency_code: { type: "string" },
          step_title: { type: "string" },
          step_type: { type: "string", enum: ["record_update", "benefit_claim"] },
          reason: { type: "string" },
          documents_required: { type: "array", items: { type: "string" } },
          estimated_time: { type: "string" },
          important_note: { type: ["string", "null"] },
          fee: STEP_FEE_SCHEMA,
          egov_service_name: { type: "string" },
          egov_search_term: { type: "string" },
          required_fields: REQUIRED_FIELDS_SCHEMA,
        },
        required: [
          "agency_name",
          "agency_code",
          "step_title",
          "step_type",
          "reason",
          "documents_required",
          "estimated_time",
          "important_note",
          "fee",
          "egov_service_name",
          "egov_search_term",
          "required_fields",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "steps"],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `You are eHakbang's requirements assistant for Filipino citizens navigating government
agencies. Given a life event, use web search to find the current, accurate list of steps a citizen
must take across Philippine government agencies (SSS, PhilHealth, Pag-IBIG, BIR, PSA, DOLE, GSIS,
DSWD, LGU/barangay, COMELEC, etc.).

Rules:
- Prioritize official .gov.ph sources (e.g. sss.gov.ph, philhealth.gov.ph, pagibigfund.gov.ph,
  bir.gov.ph, psa.gov.ph, dole.gov.ph). Cross-check when sources disagree.
- Never invent a peso amount, fee, or document requirement you did not find via search. If a fee
  applies, set "fee" with the amount/how to pay found on an official source and cite it in
  "official_source_url". If a step has no fee, set "fee" to null.
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
- Order steps in the sequence a citizen should realistically complete them.
- Output must satisfy the provided JSON schema exactly.`;

function buildUserPrompt(lifeEvent: string, language: Language): string {
  const languageInstruction =
    language === "fil"
      ? "Respond in Filipino (Tagalog)."
      : "Respond in English.";
  return `Life event: ${lifeEvent}\n${languageInstruction}`;
}

export async function generateJourneyWithOpenAI(input: {
  eventId: string;
  lifeEvent: string;
  language: Language;
}): Promise<GeneratedJourney> {
  const model = process.env.OPENAI_JOURNEY_MODEL ?? "gpt-4.1";
  const response = await getClient().responses.create({
    model,
    tools: [{ type: "web_search" }],
    input: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(input.lifeEvent, input.language) },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "journey_requirements",
        strict: true,
        schema: JOURNEY_SCHEMA,
      },
    },
  });

  const parsed = JSON.parse(response.output_text) as {
    summary: string;
    steps: Array<Omit<JourneyStep, "step_number" | "fulfills_id" | "egov_url">>;
  };

  return {
    summary: parsed.summary,
    steps: parsed.steps.map((step) => ({
      ...step,
      fulfills_id: inferFulfillsId(step),
    })),
    model,
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
