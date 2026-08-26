import "server-only";
import OpenAI from "openai";
import type { Language } from "@/lib/types";

/**
 * Answers a citizen's free-text question about a single journey step using
 * OpenAI. Unlike journey generation, this needs no web search or structured JSON --
 * just a short, plain-text, step-scoped answer -- so it uses the simplest
 * correct call and a lighter/faster model by default.
 */

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (client) return client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  client = new OpenAI({ apiKey });
  return client;
}

export interface AskStepContext {
  step_title: string;
  agency_name: string;
  reason: string;
  documents_required: string[];
  estimated_time: string;
  important_note: string | null;
  fee?: { amount: string; how_to_pay: string } | null;
  required_fields?: Array<{ label: string; hint?: string | null }>;
}

const SYSTEM_PROMPT = `You are eHakbang's assistant, answering a Filipino citizen's question about ONE
specific government requirement step they are looking at.

Rules:
- Answer in 2-4 sentences maximum. Be concise and plain-language.
- Only use the step context you are given. Never invent a fee amount, deadline, or
  requirement that isn't present in that context.
- If the question can't be answered from the given context, say so briefly and tell the
  citizen to check the official agency link on the step for authoritative details.
- Do not use markdown formatting.`;

function formatStepContext(step: AskStepContext): string {
  const lines = [
    `Step: ${step.step_title}`,
    `Agency: ${step.agency_name}`,
    `Reason: ${step.reason}`,
    `Documents required: ${step.documents_required.join(", ") || "none listed"}`,
    `Estimated time: ${step.estimated_time}`,
  ];
  if (step.important_note) lines.push(`Important note: ${step.important_note}`);
  if (step.fee) lines.push(`Fee: ${step.fee.amount} — ${step.fee.how_to_pay}`);
  if (step.required_fields?.length) {
    lines.push(
      `Additional info the citizen must provide: ${step.required_fields
        .map((f) => (f.hint ? `${f.label} (${f.hint})` : f.label))
        .join(", ")}`,
    );
  }
  return lines.join("\n");
}

function buildUserPrompt(question: string, language: Language, step: AskStepContext): string {
  const languageInstruction =
    language === "fil" ? "Respond in Filipino (Tagalog)." : "Respond in English.";
  return `${formatStepContext(step)}\n\nCitizen's question: ${question}\n${languageInstruction}`;
}

export async function answerStepQuestion(input: {
  question: string;
  language: Language;
  step: AskStepContext;
}): Promise<string> {
  const model = process.env.OPENAI_ASK_STEP_MODEL ?? "gpt-4.1-mini";
  const response = await getClient().responses.create({
    model,
    input: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(input.question, input.language, input.step) },
    ],
  });

  return response.output_text.trim();
}
