import { describe, it, expect } from "vitest";
import {
  eventRequiresVerification,
  getVerificationCopy,
  VERIFICATION_REQUIRED_EVENT_IDS,
} from "./verification";

describe("eventRequiresVerification", () => {
  it("does not require verification for graduated (now uses civil-status flow)", () => {
    expect(eventRequiresVerification("just-graduated")).toBe(false);
  });

  it("does not require verification for moved-residence (now uses civil-status flow)", () => {
    expect(eventRequiresVerification("moved-residence")).toBe(false);
  });

  it("does not require verification for first-job (now uses civil-status flow)", () => {
    expect(eventRequiresVerification("first-job")).toBe(false);
  });

  it("does not require verification for a standard event", () => {
    expect(eventRequiresVerification("got-married")).toBe(false);
  });

  it("returns false for undefined / unknown ids", () => {
    expect(eventRequiresVerification(undefined)).toBe(false);
    expect(eventRequiresVerification("does-not-exist")).toBe(false);
  });

  it("verification required list is empty (all moved to civil-status flow)", () => {
    expect(VERIFICATION_REQUIRED_EVENT_IDS).toHaveLength(0);
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
