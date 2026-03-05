import { describe, it, expect } from "vitest";
import { requireNumber, requireString, optionalNumber, optionalString, stringWithDefault } from "../validateArgs";

describe("validateArgs", () => {
  describe("requireNumber", () => {
    it("returns number when present and correct type", () => {
      expect(requireNumber({ pos: 42 }, "pos")).toBe(42);
    });

    it("returns 0 (falsy number)", () => {
      expect(requireNumber({ pos: 0 }, "pos")).toBe(0);
    });

    it("throws for missing key", () => {
      expect(() => requireNumber({}, "pos")).toThrow("Missing or invalid 'pos'");
    });

    it("throws for string value", () => {
      expect(() => requireNumber({ pos: "42" }, "pos")).toThrow("expected number, got string");
    });

    it("throws for undefined", () => {
      expect(() => requireNumber({ pos: undefined }, "pos")).toThrow("expected number, got undefined");
    });

    it("throws for null", () => {
      expect(() => requireNumber({ pos: null }, "pos")).toThrow("expected number, got object");
    });
  });

  describe("requireString", () => {
    it("returns string when present", () => {
      expect(requireString({ id: "abc" }, "id")).toBe("abc");
    });

    it("throws for missing key", () => {
      expect(() => requireString({}, "id")).toThrow("Missing or invalid 'id'");
    });
  });

  describe("optionalNumber", () => {
    it("returns number when present", () => {
      expect(optionalNumber({ n: 5 }, "n")).toBe(5);
    });

    it("returns undefined for missing key", () => {
      expect(optionalNumber({}, "n")).toBeUndefined();
    });

    it("returns undefined for null", () => {
      expect(optionalNumber({ n: null }, "n")).toBeUndefined();
    });

    it("throws for wrong type", () => {
      expect(() => optionalNumber({ n: "5" }, "n")).toThrow("expected number");
    });
  });

  describe("optionalString", () => {
    it("returns string when present", () => {
      expect(optionalString({ s: "hi" }, "s")).toBe("hi");
    });

    it("returns undefined for missing key", () => {
      expect(optionalString({}, "s")).toBeUndefined();
    });

    it("throws for wrong type", () => {
      expect(() => optionalString({ s: 123 }, "s")).toThrow("expected string");
    });
  });

  describe("stringWithDefault", () => {
    it("returns value when present", () => {
      expect(stringWithDefault({ s: "custom" }, "s", "default")).toBe("custom");
    });

    it("returns default for missing key", () => {
      expect(stringWithDefault({}, "s", "default")).toBe("default");
    });

    it("throws for wrong type", () => {
      expect(() => stringWithDefault({ s: 42 }, "s", "default")).toThrow("expected string");
    });
  });
});
