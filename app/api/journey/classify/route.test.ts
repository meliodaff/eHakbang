import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const { classifyLifeEvent } = vi.hoisted(() => ({ classifyLifeEvent: vi.fn() }));
vi.mock("@/lib/server/classify-life-event", () => ({ classifyLifeEvent }));

import { POST } from "./route";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/journey/classify", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/journey/classify", () => {
  beforeEach(() => {
    classifyLifeEvent.mockReset();
  });

  it("returns eventId, canonicalSlug, and isLifeEvent from the classifier", async () => {
    classifyLifeEvent.mockResolvedValue({
      matchedEventId: "lost-a-job",
      canonicalSlug: "lost-a-job",
      isLifeEvent: true,
    });

    const res = await POST(makeRequest({ text: "I just became unemployed" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({
      eventId: "lost-a-job",
      canonicalSlug: "lost-a-job",
      isLifeEvent: true,
    });
  });

  it("surfaces isLifeEvent: false for nonsense input", async () => {
    classifyLifeEvent.mockResolvedValue({
      matchedEventId: null,
      canonicalSlug: "gibberish-input",
      isLifeEvent: false,
    });

    const res = await POST(makeRequest({ text: "asdkjfhaskjdfh" }));
    const data = await res.json();

    expect(data.isLifeEvent).toBe(false);
  });

  it("rejects text shorter than the minimum length", async () => {
    const res = await POST(makeRequest({ text: "ab" }));
    expect(res.status).toBe(400);
    expect(classifyLifeEvent).not.toHaveBeenCalled();
  });
});
