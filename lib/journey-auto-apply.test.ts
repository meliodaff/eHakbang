import { describe, it, expect } from "vitest";
import { stepSupportsAutoApply } from "./journey-auto-apply";

describe("stepSupportsAutoApply", () => {
  it("returns true for a normal record-update/benefit-claim step", () => {
    expect(
      stepSupportsAutoApply({
        step_title: "Update your civil status with SSS",
        reason: "Your marriage changes your SSS beneficiary records.",
      }),
    ).toBe(true);
  });

  it("returns false for a step that's just a physical visit", () => {
    expect(
      stepSupportsAutoApply({
        step_title: "Go to the barangay hall",
        reason: "Pick up your barangay clearance in person.",
      }),
    ).toBe(false);
  });

  it("returns false for 'visit the nearest branch' phrasing", () => {
    expect(
      stepSupportsAutoApply({
        step_title: "Visit the nearest LTO branch",
        reason: "Have your biometrics captured for your license.",
      }),
    ).toBe(false);
  });

  it("returns false for walk-in / in-person / present-yourself phrasing", () => {
    expect(
      stepSupportsAutoApply({
        step_title: "Walk-in application",
        reason: "You must present yourself at the DFA office for biometrics.",
      }),
    ).toBe(false);
  });

  it("returns true when an online destination is mentioned alongside visit wording", () => {
    expect(
      stepSupportsAutoApply({
        step_title: "Apply online or visit the SSS website",
        reason: "Submit your application through the SSS online portal.",
      }),
    ).toBe(true);
  });

  it("returns false for a step that's just signing a claim form/ticket", () => {
    expect(
      stepSupportsAutoApply({
        step_title: "Sign your winning lotto ticket",
        reason: "Sign the back of the ticket before claiming your prize at PCSO.",
      }),
    ).toBe(false);
  });

  it("returns false for 'affix your signature' phrasing", () => {
    expect(
      stepSupportsAutoApply({
        step_title: "Claim form",
        reason: "Affix your signature on the claim form.",
      }),
    ).toBe(false);
  });

  it("returns true for 'sign up' / 'sign in' phrasing (legitimate online registration)", () => {
    expect(
      stepSupportsAutoApply({
        step_title: "Sign up for a PhilHealth account",
        reason: "Register as a new member and sign in with your credentials.",
      }),
    ).toBe(true);
  });
});
