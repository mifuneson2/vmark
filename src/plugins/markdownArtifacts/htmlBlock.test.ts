import { describe, it, expect } from "vitest";
import { htmlBlockExtension } from "./htmlBlock";

describe("htmlBlockExtension", () => {
  it("has correct name and config", () => {
    expect(htmlBlockExtension.name).toBe("html_block");
    expect(htmlBlockExtension.config.atom).toBe(true);
    expect(htmlBlockExtension.config.selectable).toBe(true);
    expect(htmlBlockExtension.config.isolating).toBe(true);
  });

  describe("parseHTML", () => {
    const rules = htmlBlockExtension.config.parseHTML!.call(htmlBlockExtension);
    const rule = rules[0];

    it("extracts value from data-value attribute", () => {
      const el = document.createElement("div");
      el.setAttribute("data-type", "html-block");
      el.setAttribute("data-value", "<p>Hello</p>");
      expect(rule.getAttrs!(el)).toEqual({ value: "<p>Hello</p>" });
    });

    it("falls back to textContent when data-value is missing", () => {
      const el = document.createElement("div");
      el.setAttribute("data-type", "html-block");
      el.textContent = "<p>Fallback</p>";
      expect(rule.getAttrs!(el)).toEqual({ value: "<p>Fallback</p>" });
    });

    it("returns false when no data-value and empty textContent (line 52-53)", () => {
      const el = document.createElement("div");
      el.setAttribute("data-type", "html-block");
      el.textContent = "";
      expect(rule.getAttrs!(el)).toBe(false);
    });

    it("returns false when textContent is null (line 52 null coalesce)", () => {
      const el = document.createElement("div");
      el.setAttribute("data-type", "html-block");
      Object.defineProperty(el, "textContent", { value: null, writable: false });
      expect(rule.getAttrs!(el)).toBe(false);
    });
  });

  describe("renderHTML", () => {
    it("renders with data-value from node attrs", () => {
      const renderHTML = htmlBlockExtension.config.renderHTML!;
      const result = renderHTML.call(htmlBlockExtension, {
        node: { attrs: { value: "<div>Hi</div>" } } as any,
        HTMLAttributes: {},
      } as any);
      expect(result[1]["data-value"]).toBe("<div>Hi</div>");
      expect(result[2]).toBe("<div>Hi</div>");
    });

    it("handles null value via null coalesce (line 60)", () => {
      const renderHTML = htmlBlockExtension.config.renderHTML!;
      const result = renderHTML.call(htmlBlockExtension, {
        node: { attrs: { value: null } } as any,
        HTMLAttributes: {},
      } as any);
      expect(result[1]["data-value"]).toBe("");
    });
  });
});
