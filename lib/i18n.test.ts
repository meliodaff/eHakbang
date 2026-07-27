import { describe, it, expect } from "vitest";
import { translate } from "./i18n";

describe("translate", () => {
  it("returns the source string in English", () => {
    expect(translate("Auto Apply", "en")).toBe("Auto Apply");
    expect(translate("Got Married", "en")).toBe("Got Married");
  });

  it("returns the Filipino translation when available", () => {
    expect(translate("Auto Apply", "fil")).toBe("I-auto Apply");
    expect(translate("Got Married", "fil")).toBe("Bagong Kasal");
  });

  it("falls back to the source string when no translation exists", () => {
    expect(translate("Bureau of Internal Revenue", "fil")).toBe(
      "Bureau of Internal Revenue",
    );
    expect(translate("some未 unknown string", "fil")).toBe(
      "some未 unknown string",
    );
  });

  it("translates every life-event title and summary shown in journeys", () => {
    // Spot-check a couple of journey content strings are covered.
    expect(translate("Just Graduated", "fil")).toBe("Bagong Graduate");
    expect(translate("Get your TIN", "fil")).toBe("Kunin ang iyong TIN");
  });
});
