import { NextRequest, NextResponse } from "next/server";
import { answerStepQuestion, type AskStepContext } from "@/lib/server/ask-step";
import type { Language } from "@/lib/types";

/**
 * POST /api/ask-step
 *
 * Answers a citizen's free-text question about a single journey step via
 * OpenAI (see lib/server/ask-step.ts). Kept deliberately concise -- this is
 * for a quick "what does this mean" answer, not a research assistant.
 *
 * Request body:
 *   { question: string; language?: "en" | "fil"; step: AskStepContext }
 *
 * Response:
 *   { answer: string }
 */
export async function POST(request: NextRequest) {
  let body: { question?: string; language?: Language; step?: Partial<AskStepContext> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.question || typeof body.question !== "string" || !body.question.trim()) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }
  const step = body.step;
  if (
    !step ||
    typeof step.step_title !== "string" ||
    !step.step_title ||
    typeof step.agency_name !== "string" ||
    !step.agency_name ||
    typeof step.reason !== "string" ||
    !step.reason
  ) {
    return NextResponse.json(
      { error: "step (step_title, agency_name, reason) is required" },
      { status: 400 },
    );
  }

  try {
    const answer = await answerStepQuestion({
      question: body.question,
      language: body.language ?? "en",
      step: {
        step_title: step.step_title,
        agency_name: step.agency_name,
        reason: step.reason,
        documents_required: step.documents_required ?? [],
        estimated_time: step.estimated_time ?? "",
        important_note: step.important_note ?? null,
        fee: step.fee ?? null,
        required_fields: step.required_fields ?? [],
      },
    });
    return NextResponse.json({ answer }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to answer question", details: String(err) },
      { status: 500 },
    );
  }
}
