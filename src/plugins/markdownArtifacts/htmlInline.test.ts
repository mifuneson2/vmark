import { describe, it, expect } from "vitest";
import { htmlInlineExtension } from "./htmlInline";

describe("htmlInlineExtension", () => {
  it("has correct name and inline config", () => {
    expect(htmlInlineExtension.name).toBe("html_inline");
    expect(htmlInlineExtension.config.atom).toBe(true);
    expect(htmlInlineExtension.config.inline).toBe(true);
  });

  describe("parseHTML", () => {
    const rules = htmlInlineExtension.config.parseHTML!.call(htmlInlineExtension);
    const rule = rules[0];

    it("extracts value from data-value attribute", () => {
      const el = document.createElement("span");
      el.setAttribute("data-type", "html");
      el.setAttribute("data-value", "<kbd>Ctrl</kbd>");
      expect(rule.getAttrs!(el)).toEqual({ value: "<kbd>Ctrl</kbd>" });
    });

    it("falls back to textContent when data-value is missing", () => {
      const el = document.createElement("span");
      el.setAttribute("data-type", "html");
      el.textContent = "<abbr>HTML</abbr>";
      expect(rule.getAttrs!(el)).toEqual({ value: "<abbr>HTML</abbr>" });
    });

    it("returns false when no data-value and empty textContent (line 40-41)", () => {
      const el = document.createElement("span");
      el.setAttribute("data-type", "html");
      el.textContent = "";
      expect(rule.getAttrs!(el)).toBe(false);
    });

    it("returns false when textContent is null (line 40 null coalesce)", () => {
      const el = document.createElement("span");
      el.setAttribute("data-type", "html");
      Object.defineProperty(el, "textContent", { value: null, writable: false });
      expect(rule.getAttrs!(el)).toBe(false);
    });
  });

  describe("renderHTML", () => {
    it("renders with data-value", () => {
      const renderHTML = htmlInlineExtension.config.renderHTML!;
      const result = renderHTML.call(htmlInlineExtension, {
        node: { attrs: { value: "<kbd>A</kbd>" } } as any,
        HTMLAttributes: {},
      } as any);
      expect(result[1]["data-value"]).toBe("<kbd>A</kbd>");
      expect(result[2]).toBe("<kbd>A</kbd>");
    });

    it("handles null value via null coalesce (line 48)", () => {
      const renderHTML = htmlInlineExtension.config.renderHTML!;
      const result = renderHTML.call(htmlInlineExtension, {
        node: { attrs: { value: null } } as any,
        HTMLAttributes: {},
      } as any);
      expect(result[1]["data-value"]).toBe("");
    });
  });
});
