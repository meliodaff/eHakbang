import { describe, it, expect } from "vitest";
import {
  eventRequiresVerification,
  getVerificationCopy,
  VERIFICATION_REQUIRED_EVENT_IDS,
} from "./verification";

describe("eventRequiresVerification", () => {
  it("requires verification for the graduated event", () => {
    expect(eventRequiresVerification("just-graduated")).toBe(true);
  });

  it("requires verification for the moved-residence event", () => {
    expect(eventRequiresVerification("moved-residence")).toBe(true);
  });

  it("requires verification for the first-job event", () => {
    expect(eventRequiresVerification("first-job")).toBe(true);
  });

  it("does not require verification for a standard event", () => {
    expect(eventRequiresVerification("got-married")).toBe(false);
  });

  it("returns false for undefined / unknown ids", () => {
    expect(eventRequiresVerification(undefined)).toBe(false);
    expect(eventRequiresVerification("does-not-exist")).toBe(false);
  });

  it("keeps both gated events in the required list", () => {
    expect(VERIFICATION_REQUIRED_EVENT_IDS).toContain("just-graduated");
    expect(VERIFICATION_REQUIRED_EVENT_IDS).toContain("moved-residence");
  });
});

describe("getVerificationCopy", () => {
  it("returns graduation-specific copy for the graduated event", () => {
    expect(getVerificationCopy("just-graduated").documentTitle).toMatch(
      /graduation/i,
    );
  });

  it("returns address-specific copy for the moved event", () => {
    expect(getVerificationCopy("moved-residence").documentTitle).toMatch(
      /residence/i,
    );
  });

  it("returns job-specific copy for the first-job event", () => {
    expect(getVerificationCopy("first-job").documentTitle).toMatch(
      /employment/i,
    );
  });

  it("falls back to generic copy for unknown / missing ids", () => {
    const fallback = getVerificationCopy(undefined);
    expect(fallback.documentTitle).toBeTruthy();
    expect(getVerificationCopy("does-not-exist")).toEqual(fallback);
  });
});
