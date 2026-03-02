/**
 * Tests for headingIdAttr — attribute config and withHeadingId extension helper.
 */

import { describe, it, expect, vi } from "vitest";
import { headingIdAttr, withHeadingId } from "../headingIdAttr";

/* ================================================================== */
/*  headingIdAttr                                                      */
/* ================================================================== */

describe("headingIdAttr", () => {
  describe("id.default", () => {
    it("has null default", () => {
      expect(headingIdAttr.id.default).toBeNull();
    });
  });

  describe("id.parseHTML", () => {
    it("reads id attribute from HTML element", () => {
      const el = document.createElement("h1");
      el.setAttribute("id", "my-heading");

      expect(headingIdAttr.id.parseHTML(el)).toBe("my-heading");
    });

    it("returns null when no id attribute", () => {
      const el = document.createElement("h1");

      expect(headingIdAttr.id.parseHTML(el)).toBeNull();
    });

    it("returns empty string for empty id attribute", () => {
      const el = document.createElement("h1");
      el.setAttribute("id", "");

      expect(headingIdAttr.id.parseHTML(el)).toBe("");
    });
  });

  describe("id.renderHTML", () => {
    it("returns object with id when id is set", () => {
      expect(headingIdAttr.id.renderHTML({ id: "my-heading" })).toEqual({
        id: "my-heading",
      });
    });

    it("returns empty object when id is null", () => {
      expect(headingIdAttr.id.renderHTML({ id: null })).toEqual({});
    });

    it("returns empty object when id is undefined", () => {
      expect(headingIdAttr.id.renderHTML({})).toEqual({});
    });

    it("returns id for empty string (truthy check)", () => {
      // Empty string is falsy, so renderHTML returns {}
      expect(headingIdAttr.id.renderHTML({ id: "" })).toEqual({});
    });
  });
});

/* ================================================================== */
/*  withHeadingId                                                      */
/* ================================================================== */

describe("withHeadingId", () => {
  it("calls extend on the extension with addAttributes", () => {
    const extendedExtension = { name: "extended" };
    const mockExtension = {
      extend: vi.fn().mockReturnValue(extendedExtension),
    };

    const result = withHeadingId(mockExtension);

    expect(result).toBe(extendedExtension);
    expect(mockExtension.extend).toHaveBeenCalledWith({
      addAttributes: expect.any(Function),
    });
  });

  it("addAttributes merges parent attributes with headingIdAttr", () => {
    let capturedAddAttributes: (() => Record<string, unknown>) | null = null;

    const mockExtension = {
      extend: vi.fn((config: { addAttributes: () => Record<string, unknown> }) => {
        capturedAddAttributes = config.addAttributes;
        return mockExtension;
      }),
    };

    withHeadingId(mockExtension);

    expect(capturedAddAttributes).not.toBeNull();

    // Call addAttributes with a context that has parent()
    const parentAttrs = { level: { default: 1 } };
    const context = { parent: () => parentAttrs };
    const result = capturedAddAttributes!.call(context);

    expect(result).toEqual({
      ...parentAttrs,
      ...headingIdAttr,
    });
  });

  it("addAttributes works when parent is undefined", () => {
    let capturedAddAttributes: (() => Record<string, unknown>) | null = null;

    const mockExtension = {
      extend: vi.fn((config: { addAttributes: () => Record<string, unknown> }) => {
        capturedAddAttributes = config.addAttributes;
        return mockExtension;
      }),
    };

    withHeadingId(mockExtension);

    // Call with no parent
    const context = {};
    const result = capturedAddAttributes!.call(context);

    expect(result).toEqual({
      ...headingIdAttr,
    });
  });
});
