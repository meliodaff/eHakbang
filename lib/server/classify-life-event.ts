import "server-only";
import OpenAI from "openai";
import { LIFE_EVENTS } from "@/lib/events";
import type { Language } from "@/lib/types";

/**
 * Cheap, fast classification of free-text life-event input against the 12
 * preset catalog events (`lib/events.ts`), so paraphrased/semantic matches
 * (e.g. "I just became a parent" -> had-a-baby) route into the same
 * confirm/verify-gated flow as tapping that preset card, instead of
 * generating a separate AI journey for what's really a known event.
 * No web search -- this only needs to compare against the fixed catalog.
 *
 * Also returns a `canonicalSlug` -- a short kebab-case label for the
 * underlying situation regardless of exact wording (e.g. both "I got
 * accepted as a PH rep for a tournament in the US" and "I'll represent the
 * Philippines in a US tournament" should canonicalize to the same slug).
 * `lib/server/journey-requirements.ts` hashes this (instead of the raw
 * text) as the custom-journey cache key, so two different phrasings of the
 * same context reuse the same cached AI-generated journey.
 *
 * Also returns `isLifeEvent` -- whether the text plausibly describes a real
 * personal situation at all, as opposed to gibberish, spam, a random test
 * string, or something unrelated (a question, a command, off-topic chat).
 * `components/input/SearchInput.tsx` blocks submission on a confident
 * `false` instead of wasting a full AI generation call on nonsense input.
 */

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (client) return client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  client = new OpenAI({ apiKey });
  return client;
}

const EVENT_IDS = LIFE_EVENTS.map((e) => e.id) as [string, ...string[]];

const CLASSIFY_SCHEMA = {
  type: "object",
  properties: {
    matchedEventId: {
      anyOf: [{ type: "null" }, { type: "string", enum: EVENT_IDS }],
    },
    canonicalSlug: { type: "string" },
    isLifeEvent: { type: "boolean" },
  },
  required: ["matchedEventId", "canonicalSlug", "isLifeEvent"],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = `You classify a Filipino citizen's free-text description of a life event
(in English, Filipino, or Taglish) against a fixed catalog of preset life events for eHakbang.

Catalog:
${LIFE_EVENTS.map((e) => `- id: "${e.id}" -- ${e.sublabel} (${e.label}): ${e.description}`).join("\n")}

Rules:
- If the text clearly describes the same real-world situation as one catalog entry -- even if
  phrased differently, paraphrased, or in another language/register -- return that entry's "id" as
  matchedEventId.
- If the text describes something genuinely different from every catalog entry, or is too vague/
  ambiguous to confidently pick one, return null for matchedEventId.
- Do not guess. Only match when you are confident it is the same life event.
- Always also return "canonicalSlug": a short (2-5 word) kebab-case slug (lowercase, hyphen-
  separated, no punctuation) that identifies the underlying real-world situation regardless of
  exact wording -- e.g. "I got accepted as a PH rep for a tournament in the US" and "I'll
  represent the Philippines in a US tournament" should produce the same slug, such as
  "representing-ph-international-tournament". Produce this even when matchedEventId is set.
- Always also return "isLifeEvent": true when the text describes a genuine personal situation or
  circumstance a Filipino citizen might realistically need government help with -- even when it
  doesn't match any catalog entry (e.g. "I'm adopting a rescue dog", "I got accepted as a PH rep
  for a tournament in the US"). Return false when the text is gibberish/random characters, a test
  string, a question, an instruction/command, spam, or otherwise not a real personal situation --
  there is nothing to build a government checklist for. When matchedEventId is set, isLifeEvent
  must be true. Give the citizen the benefit of the doubt on anything plausible; only return false
  when you are confident there is no real situation described.`;

export interface ClassifyResult {
  matchedEventId: string | null;
  canonicalSlug: string;
  isLifeEvent: boolean;
}

export async function classifyLifeEvent(
  text: string,
  language: Language = "en",
): Promise<ClassifyResult> {
  const model = process.env.OPENAI_CLASSIFY_MODEL ?? "gpt-4.1-mini";
  const response = await getClient().responses.create({
    model,
    input: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Text: ${text}\nLanguage hint: ${language}` },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "life_event_classification",
        strict: true,
        schema: CLASSIFY_SCHEMA,
      },
    },
  });

  const parsed = JSON.parse(response.output_text) as ClassifyResult;
  return {
    matchedEventId: parsed.matchedEventId,
    canonicalSlug: parsed.canonicalSlug,
    isLifeEvent: parsed.isLifeEvent,
  };
}
