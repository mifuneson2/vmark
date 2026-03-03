import { describe, it, expect } from "vitest";
import { frontmatterExtension } from "./frontmatter";

describe("frontmatterExtension", () => {
  it("has correct name and config", () => {
    expect(frontmatterExtension.name).toBe("frontmatter");
    expect(frontmatterExtension.config.atom).toBe(true);
    expect(frontmatterExtension.config.selectable).toBe(false);
    expect(frontmatterExtension.config.isolating).toBe(true);
    expect(frontmatterExtension.config.group).toBe("block");
  });

  describe("addAttributes", () => {
    it("includes value attribute with empty default", () => {
      const attrs = frontmatterExtension.config.addAttributes!.call(frontmatterExtension);
      expect(attrs.value).toEqual({ default: "" });
    });
  });

  describe("parseHTML", () => {
    const rules = frontmatterExtension.config.parseHTML!.call(frontmatterExtension);
    const rule = rules[0];

    it("matches div[data-type='frontmatter']", () => {
      expect(rule.tag).toBe('div[data-type="frontmatter"]');
    });

    it("extracts value from data-value attribute", () => {
      const el = document.createElement("div");
      el.setAttribute("data-type", "frontmatter");
      el.setAttribute("data-value", "title: Hello");
      const result = rule.getAttrs!(el);
      expect(result).toEqual({ value: "title: Hello" });
    });

    it("falls back to textContent when data-value is missing", () => {
      const el = document.createElement("div");
      el.setAttribute("data-type", "frontmatter");
      el.textContent = "title: Fallback";
      const result = rule.getAttrs!(el);
      expect(result).toEqual({ value: "title: Fallback" });
    });

    it("returns false when no data-value and empty textContent", () => {
      const el = document.createElement("div");
      el.setAttribute("data-type", "frontmatter");
      el.textContent = "";
      const result = rule.getAttrs!(el);
      expect(result).toBe(false);
    });

    it("returns false when no data-value and whitespace-only textContent", () => {
      const el = document.createElement("div");
      el.setAttribute("data-type", "frontmatter");
      el.textContent = "   ";
      const result = rule.getAttrs!(el);
      expect(result).toBe(false);
    });

    it("returns false when textContent is null (line 54 optional chaining)", () => {
      const el = document.createElement("div");
      el.setAttribute("data-type", "frontmatter");
      Object.defineProperty(el, "textContent", { value: null, writable: false });
      const result = rule.getAttrs!(el);
      expect(result).toBe(false);
    });
  });

  describe("renderHTML", () => {
    it("renders div with data-type and data-value", () => {
      const renderHTML = frontmatterExtension.config.renderHTML!;
      const result = renderHTML.call(frontmatterExtension, {
        node: { attrs: { value: "title: Test" } } as any,
        HTMLAttributes: {},
      } as any);
      expect(result[0]).toBe("div");
      expect(result[1]["data-type"]).toBe("frontmatter");
      expect(result[1]["data-value"]).toBe("title: Test");
      expect(result[1].contenteditable).toBe("false");
    });

    it("renders empty string when value is null (line 66 null coalesce)", () => {
      const renderHTML = frontmatterExtension.config.renderHTML!;
      const result = renderHTML.call(frontmatterExtension, {
        node: { attrs: { value: null } } as any,
        HTMLAttributes: {},
      } as any);
      expect(result[1]["data-value"]).toBe("");
    });

    it("renders empty string when value is undefined", () => {
      const renderHTML = frontmatterExtension.config.renderHTML!;
      const result = renderHTML.call(frontmatterExtension, {
        node: { attrs: { value: undefined } } as any,
        HTMLAttributes: {},
      } as any);
      expect(result[1]["data-value"]).toBe("");
    });
  });
});
