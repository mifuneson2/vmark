import { describe, it, expect } from "vitest";
import { requireString, optionalString, optionalNumber, stringWithDefault } from "./validateArgs";

describe("requireString", () => {
  it.each([
    { args: { key: "hello" }, expected: "hello" },
    { args: { key: "" }, expected: "" },
    { args: { key: "with spaces" }, expected: "with spaces" },
  ])("returns $expected for valid string", ({ args, expected }) => {
    expect(requireString(args, "key")).toBe(expected);
  });

  it("throws for missing key", () => {
    expect(() => requireString({}, "key")).toThrow("Missing or invalid 'key'");
  });

  it("throws for undefined value", () => {
    expect(() => requireString({ key: undefined }, "key")).toThrow("expected string, got undefined");
  });

  it("throws for null value", () => {
    expect(() => requireString({ key: null }, "key")).toThrow("expected string, got object");
  });

  it("throws for number value", () => {
    expect(() => requireString({ key: 42 }, "key")).toThrow("expected string, got number");
  });

  it("throws for boolean value", () => {
    expect(() => requireString({ key: true }, "key")).toThrow("expected string, got boolean");
  });
});

describe("optionalString", () => {
  it("returns string when present", () => {
    expect(optionalString({ key: "value" }, "key")).toBe("value");
  });

  it("returns empty string when present", () => {
    expect(optionalString({ key: "" }, "key")).toBe("");
  });

  it("returns undefined for missing key", () => {
    expect(optionalString({}, "key")).toBeUndefined();
  });

  it("returns undefined for undefined value", () => {
    expect(optionalString({ key: undefined }, "key")).toBeUndefined();
  });

  it("returns undefined for null value", () => {
    expect(optionalString({ key: null }, "key")).toBeUndefined();
  });

  it("throws for non-string value", () => {
    expect(() => optionalString({ key: 42 }, "key")).toThrow("expected string, got number");
  });
});

describe("optionalNumber", () => {
  it("returns number when present", () => {
    expect(optionalNumber({ key: 42 }, "key")).toBe(42);
  });

  it("returns 0 when present", () => {
    expect(optionalNumber({ key: 0 }, "key")).toBe(0);
  });

  it("returns NaN when passed NaN", () => {
    expect(optionalNumber({ key: NaN }, "key")).toBeNaN();
  });

  it("returns undefined for missing key", () => {
    expect(optionalNumber({}, "key")).toBeUndefined();
  });

  it("returns undefined for undefined value", () => {
    expect(optionalNumber({ key: undefined }, "key")).toBeUndefined();
  });

  it("returns undefined for null value", () => {
    expect(optionalNumber({ key: null }, "key")).toBeUndefined();
  });

  it("throws for non-number value", () => {
    expect(() => optionalNumber({ key: "42" }, "key")).toThrow("expected number, got string");
  });
});

describe("stringWithDefault", () => {
  it("returns string when present", () => {
    expect(stringWithDefault({ key: "value" }, "key", "default")).toBe("value");
  });

  it("returns empty string when present (not default)", () => {
    expect(stringWithDefault({ key: "" }, "key", "default")).toBe("");
  });

  it("returns default for missing key", () => {
    expect(stringWithDefault({}, "key", "fallback")).toBe("fallback");
  });

  it("returns default for undefined value", () => {
    expect(stringWithDefault({ key: undefined }, "key", "fallback")).toBe("fallback");
  });

  it("returns default for null value", () => {
    expect(stringWithDefault({ key: null }, "key", "fallback")).toBe("fallback");
  });

  it("throws for non-string value", () => {
    expect(() => stringWithDefault({ key: 123 }, "key", "default")).toThrow("expected string, got number");
  });
});
