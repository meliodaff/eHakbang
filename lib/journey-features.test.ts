import { describe, it, expect } from "vitest";
import {
  eventSupportsApplyAll,
  APPLY_ALL_EVENT_IDS,
} from "./journey-features";

describe("eventSupportsApplyAll", () => {
  it("enables Apply All for the graduated event", () => {
    expect(eventSupportsApplyAll("just-graduated")).toBe(true);
  });

  it("enables Apply All for the first-job event", () => {
    expect(eventSupportsApplyAll("first-job")).toBe(true);
  });

  it("does not enable Apply All for a standard event", () => {
    expect(eventSupportsApplyAll("got-married")).toBe(false);
  });

  it("returns false for undefined / unknown ids", () => {
    expect(eventSupportsApplyAll(undefined)).toBe(false);
    expect(eventSupportsApplyAll("does-not-exist")).toBe(false);
  });

  it("lists both graduated and first-job", () => {
    expect(APPLY_ALL_EVENT_IDS).toContain("just-graduated");
    expect(APPLY_ALL_EVENT_IDS).toContain("first-job");
  });
});
