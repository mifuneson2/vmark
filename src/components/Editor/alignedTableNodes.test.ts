/**
 * AlignedTableNodes tests
 *
 * Tests parseHTML and renderHTML for the alignment attribute on
 * AlignedTableCell and AlignedTableHeader extensions.
 */

import { describe, expect, it, vi } from "vitest";

// Mock the sourceLineAttr dependency
vi.mock("@/plugins/shared/sourceLineAttr", () => ({
  sourceLineAttr: {
    sourceLine: {
      default: null,
    },
  },
}));

// Mock @tiptap/extension-table to provide extend-able base classes
vi.mock("@tiptap/extension-table", () => {
  function createMockExtension(name: string) {
    return {
      name,
      extend(config: { addAttributes: () => Record<string, unknown> }) {
        // Simulate Tiptap's extend: call addAttributes with parent context
        const parentAttrs = () => ({
          colspan: { default: 1 },
          rowspan: { default: 1 },
        });
        const result = config.addAttributes.call({ parent: parentAttrs });
        return {
          name,
          _attributes: result,
          // Expose for testing
          getAttributes: () => result,
        };
      },
    };
  }

  return {
    TableCell: createMockExtension("tableCell"),
    TableHeader: createMockExtension("tableHeader"),
  };
});

import { AlignedTableCell, AlignedTableHeader } from "./alignedTableNodes";

// Helper: extract the alignment attribute config from the extended node
function getAlignmentConfig(extension: unknown) {
  const ext = extension as { _attributes: Record<string, unknown> };
  return ext._attributes.alignment as {
    default: unknown;
    parseHTML: (el: HTMLElement) => string | null;
    renderHTML: (attrs: Record<string, unknown>) => Record<string, unknown>;
  };
}

describe("AlignedTableCell", () => {
  const alignment = getAlignmentConfig(AlignedTableCell);

  describe("default", () => {
    it("has null as default alignment", () => {
      expect(alignment.default).toBeNull();
    });
  });

  describe("parseHTML", () => {
    it("parses 'left' alignment from style", () => {
      const el = document.createElement("td");
      el.style.textAlign = "left";
      expect(alignment.parseHTML(el)).toBe("left");
    });

    it("parses 'center' alignment from style", () => {
      const el = document.createElement("td");
      el.style.textAlign = "center";
      expect(alignment.parseHTML(el)).toBe("center");
    });

    it("parses 'right' alignment from style", () => {
      const el = document.createElement("td");
      el.style.textAlign = "right";
      expect(alignment.parseHTML(el)).toBe("right");
    });

    it("returns null for no text-align style", () => {
      const el = document.createElement("td");
      expect(alignment.parseHTML(el)).toBeNull();
    });

    it("returns null for unsupported alignment values like 'justify'", () => {
      const el = document.createElement("td");
      el.style.textAlign = "justify";
      expect(alignment.parseHTML(el)).toBeNull();
    });

    it("returns null for empty string text-align", () => {
      const el = document.createElement("td");
      el.style.textAlign = "";
      expect(alignment.parseHTML(el)).toBeNull();
    });
  });

  describe("renderHTML", () => {
    it("renders text-align:left style", () => {
      const result = alignment.renderHTML({ alignment: "left" });
      expect(result).toEqual({ style: "text-align:left" });
    });

    it("renders text-align:center style", () => {
      const result = alignment.renderHTML({ alignment: "center" });
      expect(result).toEqual({ style: "text-align:center" });
    });

    it("renders text-align:right style", () => {
      const result = alignment.renderHTML({ alignment: "right" });
      expect(result).toEqual({ style: "text-align:right" });
    });

    it("returns empty object for null alignment", () => {
      const result = alignment.renderHTML({ alignment: null });
      expect(result).toEqual({});
    });

    it("returns empty object for undefined alignment", () => {
      const result = alignment.renderHTML({ alignment: undefined });
      expect(result).toEqual({});
    });

    it("returns empty object for invalid alignment value", () => {
      const result = alignment.renderHTML({ alignment: "justify" });
      expect(result).toEqual({});
    });

    it("returns empty object for numeric alignment value", () => {
      const result = alignment.renderHTML({ alignment: 42 });
      expect(result).toEqual({});
    });

    it("returns empty object for empty string alignment", () => {
      const result = alignment.renderHTML({ alignment: "" });
      expect(result).toEqual({});
    });
  });

  describe("parent attributes preserved", () => {
    it("includes colspan and rowspan from parent", () => {
      const ext = AlignedTableCell as unknown as { _attributes: Record<string, unknown> };
      expect(ext._attributes.colspan).toEqual({ default: 1 });
      expect(ext._attributes.rowspan).toEqual({ default: 1 });
    });

    it("includes sourceLine from sourceLineAttr", () => {
      const ext = AlignedTableCell as unknown as { _attributes: Record<string, unknown> };
      expect(ext._attributes.sourceLine).toEqual({ default: null });
    });
  });
});

describe("AlignedTableHeader", () => {
  const alignment = getAlignmentConfig(AlignedTableHeader);

  describe("default", () => {
    it("has null as default alignment", () => {
      expect(alignment.default).toBeNull();
    });
  });

  describe("parseHTML", () => {
    it("parses 'left' alignment from style", () => {
      const el = document.createElement("th");
      el.style.textAlign = "left";
      expect(alignment.parseHTML(el)).toBe("left");
    });

    it("parses 'center' alignment from style", () => {
      const el = document.createElement("th");
      el.style.textAlign = "center";
      expect(alignment.parseHTML(el)).toBe("center");
    });

    it("parses 'right' alignment from style", () => {
      const el = document.createElement("th");
      el.style.textAlign = "right";
      expect(alignment.parseHTML(el)).toBe("right");
    });

    it("returns null for no text-align style", () => {
      const el = document.createElement("th");
      expect(alignment.parseHTML(el)).toBeNull();
    });

    it("returns null for unsupported alignment 'start'", () => {
      const el = document.createElement("th");
      el.style.textAlign = "start";
      expect(alignment.parseHTML(el)).toBeNull();
    });
  });

  describe("renderHTML", () => {
    it("renders text-align:left style", () => {
      const result = alignment.renderHTML({ alignment: "left" });
      expect(result).toEqual({ style: "text-align:left" });
    });

    it("renders text-align:center style", () => {
      const result = alignment.renderHTML({ alignment: "center" });
      expect(result).toEqual({ style: "text-align:center" });
    });

    it("renders text-align:right style", () => {
      const result = alignment.renderHTML({ alignment: "right" });
      expect(result).toEqual({ style: "text-align:right" });
    });

    it("returns empty object for null alignment", () => {
      const result = alignment.renderHTML({ alignment: null });
      expect(result).toEqual({});
    });

    it("returns empty object for boolean alignment", () => {
      const result = alignment.renderHTML({ alignment: true });
      expect(result).toEqual({});
    });
  });

  describe("parent attributes preserved", () => {
    it("includes colspan and rowspan from parent", () => {
      const ext = AlignedTableHeader as unknown as { _attributes: Record<string, unknown> };
      expect(ext._attributes.colspan).toEqual({ default: 1 });
      expect(ext._attributes.rowspan).toEqual({ default: 1 });
    });

    it("includes sourceLine from sourceLineAttr", () => {
      const ext = AlignedTableHeader as unknown as { _attributes: Record<string, unknown> };
      expect(ext._attributes.sourceLine).toEqual({ default: null });
    });
  });
});
