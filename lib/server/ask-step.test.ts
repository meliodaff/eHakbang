import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    responses: { create },
  })),
}));

import { answerStepQuestion, type AskStepContext } from "./ask-step";

const STEP: AskStepContext = {
  step_title: "Register your baby's birth",
  agency_name: "Philippine Statistics Authority",
  reason: "You need an official birth certificate.",
  documents_required: ["Certificate of Live Birth", "Valid IDs"],
  estimated_time: "1–2 weeks",
  important_note: "Register within 30 days.",
  fee: null,
  required_fields: [],
};

describe("answerStepQuestion", () => {
  beforeEach(() => {
    create.mockReset();
    process.env.OPENAI_API_KEY = "test-key";
    delete process.env.OPENAI_ASK_STEP_MODEL;
  });

  it("returns the trimmed model output", async () => {
    create.mockResolvedValue({ output_text: "  You'll need to bring the certificate.  " });

    const answer = await answerStepQuestion({
      question: "Do I need an appointment?",
      language: "en",
      step: STEP,
    });

    expect(answer).toBe("You'll need to bring the certificate.");
  });

  it("includes the question and step context, and the language instruction", async () => {
    create.mockResolvedValue({ output_text: "answer" });

    await answerStepQuestion({
      question: "Do I need an appointment?",
      language: "fil",
      step: STEP,
    });

    expect(create).toHaveBeenCalledTimes(1);
    const callArgs = create.mock.calls[0][0];
    expect(callArgs.model).toBe("gpt-4.1-mini");
    const userMessage = callArgs.input.find((m: { role: string }) => m.role === "user");
    expect(userMessage.content).toContain("Do I need an appointment?");
    expect(userMessage.content).toContain(STEP.step_title);
    expect(userMessage.content).toContain("Respond in Filipino (Tagalog).");
  });

  it("uses OPENAI_ASK_STEP_MODEL when set", async () => {
    process.env.OPENAI_ASK_STEP_MODEL = "gpt-4.1-nano";
    create.mockResolvedValue({ output_text: "answer" });

    await answerStepQuestion({ question: "q", language: "en", step: STEP });

    expect(create.mock.calls[0][0].model).toBe("gpt-4.1-nano");
  });
});
