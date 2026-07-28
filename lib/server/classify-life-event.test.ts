import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    responses: { create },
  })),
}));

import { classifyLifeEvent } from "./classify-life-event";

describe("classifyLifeEvent", () => {
  beforeEach(() => {
    create.mockReset();
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("returns the matched preset, slug, and isLifeEvent from the model", async () => {
    create.mockResolvedValue({
      output_text: JSON.stringify({
        matchedEventId: "lost-a-job",
        canonicalSlug: "lost-a-job",
        isLifeEvent: true,
      }),
    });

    const result = await classifyLifeEvent("I just became unemployed");

    expect(result).toEqual({
      matchedEventId: "lost-a-job",
      canonicalSlug: "lost-a-job",
      isLifeEvent: true,
    });
  });

  it("returns isLifeEvent: false for text that isn't a real situation", async () => {
    create.mockResolvedValue({
      output_text: JSON.stringify({
        matchedEventId: null,
        canonicalSlug: "gibberish-input",
        isLifeEvent: false,
      }),
    });

    const result = await classifyLifeEvent("asdkjfhaskjdfh");

    expect(result.isLifeEvent).toBe(false);
    expect(result.matchedEventId).toBeNull();
  });

  it("returns isLifeEvent: true for a genuine but uncatalogued situation", async () => {
    create.mockResolvedValue({
      output_text: JSON.stringify({
        matchedEventId: null,
        canonicalSlug: "adopting-a-rescue-dog",
        isLifeEvent: true,
      }),
    });

    const result = await classifyLifeEvent("I am adopting a rescue dog");

    expect(result.isLifeEvent).toBe(true);
    expect(result.matchedEventId).toBeNull();
  });
});
