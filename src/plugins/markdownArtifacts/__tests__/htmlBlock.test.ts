/**
 * Tests for htmlBlock extension — renderHTML output and edge cases.
 * Extends coverage beyond markdownArtifacts.test.ts which covers parseHTML/getAttrs.
 */

import { describe, it, expect } from "vitest";
import { htmlBlockExtension } from "../htmlBlock";

describe("htmlBlockExtension", () => {
  describe("extension config", () => {
    it("has name html_block", () => {
      expect(htmlBlockExtension.name).toBe("html_block");
    });

    it("is selectable", () => {
      expect(htmlBlockExtension.config.selectable).toBe(true);
    });

    it("belongs to block group", () => {
      expect(htmlBlockExtension.config.group).toBe("block");
    });

    it("is isolating", () => {
      expect(htmlBlockExtension.config.isolating).toBe(true);
    });

    it("is an atom node", () => {
      expect(htmlBlockExtension.config.atom).toBe(true);
    });
  });

  describe("addAttributes", () => {
    const attrs = htmlBlockExtension.config.addAttributes!.call({} as never)!;

    it("has value attribute with empty string default", () => {
      expect(attrs.value).toBeDefined();
      expect(attrs.value.default).toBe("");
    });

    it("has sourceLine attribute", () => {
      expect(attrs.sourceLine).toBeDefined();
      expect(attrs.sourceLine.default).toBeNull();
    });
  });

  describe("renderHTML", () => {
    const renderHTML = htmlBlockExtension.config.renderHTML!;

    it("renders div with data-type and data-value", () => {
      const node = { attrs: { value: "<div>hello</div>" } } as never;
      const result = renderHTML.call({} as never, { node, HTMLAttributes: {} });
      expect(result).toEqual([
        "div",
        expect.objectContaining({
          "data-type": "html-block",
          "data-value": "<div>hello</div>",
          contenteditable: "false",
        }),
        "<div>hello</div>",
      ]);
    });

    it("handles null value attribute gracefully", () => {
      const node = { attrs: { value: null } } as never;
      const result = renderHTML.call({} as never, { node, HTMLAttributes: {} });
      expect(result[2]).toBe("");
      expect((result[1] as Record<string, string>)["data-value"]).toBe("");
    });

    it("handles undefined value attribute gracefully", () => {
      const node = { attrs: { value: undefined } } as never;
      const result = renderHTML.call({} as never, { node, HTMLAttributes: {} });
      expect(result[2]).toBe("");
    });

    it("merges additional HTML attributes", () => {
      const node = { attrs: { value: "test" } } as never;
      const result = renderHTML.call({} as never, {
        node,
        HTMLAttributes: { class: "custom" },
      });
      expect((result[1] as Record<string, string>).class).toBe("custom");
      expect((result[1] as Record<string, string>)["data-type"]).toBe("html-block");
    });

    it("renders complex HTML content as-is", () => {
      const complex = '<details><summary>Click</summary><p>Content</p></details>';
      const node = { attrs: { value: complex } } as never;
      const result = renderHTML.call({} as never, { node, HTMLAttributes: {} });
      expect(result[2]).toBe(complex);
    });

    it("handles empty string value", () => {
      const node = { attrs: { value: "" } } as never;
      const result = renderHTML.call({} as never, { node, HTMLAttributes: {} });
      expect(result[2]).toBe("");
      expect((result[1] as Record<string, string>)["data-value"]).toBe("");
    });
  });

  describe("parseHTML edge cases", () => {
    const parseRules = htmlBlockExtension.config.parseHTML!.call({} as never)!;
    const rule = parseRules[0];

    it("matches correct tag selector", () => {
      expect(rule.tag).toBe('div[data-type="html-block"]');
    });

    const getAttrs = rule.getAttrs as (el: HTMLElement) => Record<string, unknown> | false;

    it("prefers data-value over textContent", () => {
      const el = document.createElement("div");
      el.setAttribute("data-type", "html-block");
      el.setAttribute("data-value", "<p>from-attr</p>");
      el.textContent = "from-text";
      expect(getAttrs(el)).toEqual({ value: "<p>from-attr</p>" });
    });

    it("handles data-value with empty string (attribute exists)", () => {
      const el = document.createElement("div");
      el.setAttribute("data-type", "html-block");
      el.setAttribute("data-value", "");
      expect(getAttrs(el)).toEqual({ value: "" });
    });

    it("handles special characters in data-value", () => {
      const el = document.createElement("div");
      el.setAttribute("data-type", "html-block");
      el.setAttribute("data-value", '<div class="test">&amp;</div>');
      expect(getAttrs(el)).toEqual({ value: '<div class="test">&amp;</div>' });
    });

    it("handles Unicode content in textContent fallback", () => {
      const el = document.createElement("div");
      el.setAttribute("data-type", "html-block");
      el.textContent = "<p>Unicode test</p>";
      expect(getAttrs(el)).toEqual({ value: "<p>Unicode test</p>" });
    });

    it("returns false for whitespace-only textContent without data-value", () => {
      const el = document.createElement("div");
      el.setAttribute("data-type", "html-block");
      el.textContent = "";
      expect(getAttrs(el)).toBe(false);
    });
  });
});
