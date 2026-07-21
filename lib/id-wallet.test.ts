import { beforeEach, describe, expect, it } from "vitest";
import {
  ID_CATALOG,
  clearWallet,
  getHeldIds,
  hasId,
  setId,
  stepFulfilledByWallet,
  toggleId,
} from "./id-wallet";
import { EVENT_JOURNEYS } from "./event-journeys";

describe("id-wallet persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts empty", () => {
    expect(getHeldIds()).toEqual([]);
    expect(hasId("tin")).toBe(false);
  });

  it("adds and removes an ID", () => {
    setId("tin", true);
    expect(hasId("tin")).toBe(true);
    expect(getHeldIds()).toEqual(["tin"]);

    setId("tin", false);
    expect(hasId("tin")).toBe(false);
    expect(getHeldIds()).toEqual([]);
  });

  it("de-dupes repeated adds", () => {
    setId("sss", true);
    setId("sss", true);
    expect(getHeldIds()).toEqual(["sss"]);
  });

  it("toggles an ID on and off", () => {
    toggleId("philhealth");
    expect(hasId("philhealth")).toBe(true);
    toggleId("philhealth");
    expect(hasId("philhealth")).toBe(false);
  });

  it("ignores unknown/tampered values in storage", () => {
    window.localStorage.setItem(
      "ehakbang:id-wallet",
      JSON.stringify(["tin", "not-a-real-id", 42]),
    );
    expect(getHeldIds()).toEqual(["tin"]);
  });

  it("clears the whole wallet", () => {
    setId("tin", true);
    setId("sss", true);
    clearWallet();
    expect(getHeldIds()).toEqual([]);
  });
});

describe("stepFulfilledByWallet", () => {
  it("is true only when the step's fulfilled ID is held", () => {
    const tinStep = { fulfills_id: "tin" as const };
    expect(stepFulfilledByWallet(tinStep, ["tin"])).toBe(true);
    expect(stepFulfilledByWallet(tinStep, ["sss"])).toBe(false);
  });

  it("is false for steps that do not fulfill any ID", () => {
    expect(stepFulfilledByWallet({ fulfills_id: undefined }, ["tin"])).toBe(false);
  });

  it("matches the TIN step in the first-job journey", () => {
    const firstJob = EVENT_JOURNEYS["first-job"];
    const tinStep = firstJob.steps.find((s) => s.fulfills_id === "tin");
    expect(tinStep).toBeDefined();
    expect(stepFulfilledByWallet(tinStep!, ["tin"])).toBe(true);
    expect(stepFulfilledByWallet(tinStep!, [])).toBe(false);
  });
});

describe("catalog integrity", () => {
  it("has a unique entry per ID type", () => {
    const ids = ID_CATALOG.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
