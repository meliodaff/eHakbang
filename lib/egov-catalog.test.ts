import { describe, it, expect } from "vitest";
import {
  resolveOfficialService,
  resolveOfficialUrl,
  OFFICIAL_FALLBACK_URL,
} from "./egov-catalog";
import type { JourneyStep } from "./types";

const step = (overrides: Partial<JourneyStep> = {}): JourneyStep => ({
  step_number: 1,
  agency_name: "Social Security System",
  agency_code: "SSS",
  step_title: "Update civil status",
  step_type: "record_update",
  reason: "Keep records current.",
  documents_required: ["PSA marriage certificate"],
  estimated_time: "Same day",
  important_note: null,
  egov_service_name: "SSS Member Update",
  egov_search_term: "SSS update civil status",
  ...overrides,
});

describe("resolveOfficialService", () => {
  it("maps a known agency code to its official .gov.ph site with a trust-cue domain", () => {
    const target = resolveOfficialService(step({ agency_code: "SSS" }));
    expect(target).toEqual({
      kind: "link",
      url: "https://www.sss.gov.ph/",
      domain: "sss.gov.ph",
    });
  });

  it("normalizes agency-code aliases (PHIC → PhilHealth, HDMF → Pag-IBIG)", () => {
    expect(resolveOfficialService(step({ agency_code: "PHIC" }))).toMatchObject({
      kind: "link",
      domain: "philhealth.gov.ph",
    });
    expect(resolveOfficialService(step({ agency_code: "HDMF" }))).toMatchObject({
      kind: "link",
      domain: "pagibigfund.gov.ph",
    });
    expect(
      resolveOfficialService(step({ agency_code: "Pag-IBIG" })),
    ).toMatchObject({ domain: "pagibigfund.gov.ph" });
  });

  it("prefers an explicit egov_url when present and derives its domain", () => {
    const target = resolveOfficialService(
      step({ egov_url: "https://www.philhealth.gov.ph/services/" }),
    );
    expect(target).toEqual({
      kind: "link",
      url: "https://www.philhealth.gov.ph/services/",
      domain: "philhealth.gov.ph",
    });
  });

  it("uses a curated service deep link when the service matches (DFA passport)", () => {
    const target = resolveOfficialService(
      step({
        agency_code: "DFA",
        egov_service_name: "Passport Application",
        egov_search_term: "apply renew passport",
      }),
    );
    expect(target).toEqual({
      kind: "link",
      url: "https://www.passport.gov.ph/",
      domain: "passport.gov.ph",
    });
  });

  it("returns a hint (not a link) for non-government steps", () => {
    expect(
      resolveOfficialService(
        step({ agency_name: "Banks and Employer (HR)", agency_code: "BANKS" }),
      ),
    ).toEqual({ kind: "hint" });
  });

  it("falls back to the national portal for an unknown government agency", () => {
    const target = resolveOfficialService(
      step({ agency_name: "Some New Bureau", agency_code: "XYZ" }),
    );
    expect(target).toEqual({
      kind: "link",
      url: OFFICIAL_FALLBACK_URL,
      domain: "gov.ph",
    });
  });
});

describe("resolveOfficialUrl", () => {
  it("returns the resolved URL for a linkable step", () => {
    expect(resolveOfficialUrl(step({ agency_code: "BIR" }))).toBe(
      "https://www.bir.gov.ph/",
    );
  });

  it("returns the national fallback for a non-government step", () => {
    expect(
      resolveOfficialUrl(step({ agency_name: "My Bank", agency_code: "BANK" })),
    ).toBe(OFFICIAL_FALLBACK_URL);
  });
});
