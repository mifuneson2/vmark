/**
 * Tests for htmlInline extension — renderHTML output and edge cases.
 * Extends coverage beyond markdownArtifacts.test.ts which covers parseHTML/getAttrs.
 */

import { describe, it, expect } from "vitest";
import { htmlInlineExtension } from "../htmlInline";

describe("htmlInlineExtension", () => {
  describe("extension config", () => {
    it("has name html_inline", () => {
      expect(htmlInlineExtension.name).toBe("html_inline");
    });

    it("is selectable", () => {
      expect(htmlInlineExtension.config.selectable).toBe(true);
    });

    it("is inline", () => {
      expect(htmlInlineExtension.config.inline).toBe(true);
    });

    it("belongs to inline group", () => {
      expect(htmlInlineExtension.config.group).toBe("inline");
    });

    it("is an atom node", () => {
      expect(htmlInlineExtension.config.atom).toBe(true);
    });
  });

  describe("addAttributes", () => {
    const attrs = htmlInlineExtension.config.addAttributes!.call({} as never)!;

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
    const renderHTML = htmlInlineExtension.config.renderHTML!;

    it("renders span with data-type html and data-value", () => {
      const node = { attrs: { value: "<kbd>K</kbd>" } } as never;
      const result = renderHTML.call({} as never, { node, HTMLAttributes: {} });
      expect(result).toEqual([
        "span",
        expect.objectContaining({
          "data-type": "html",
          "data-value": "<kbd>K</kbd>",
          contenteditable: "false",
        }),
        "<kbd>K</kbd>",
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
      const node = { attrs: { value: "<abbr>HTML</abbr>" } } as never;
      const result = renderHTML.call({} as never, {
        node,
        HTMLAttributes: { id: "my-inline" },
      });
      expect((result[1] as Record<string, string>).id).toBe("my-inline");
      expect((result[1] as Record<string, string>)["data-type"]).toBe("html");
    });

    it("renders empty string value", () => {
      const node = { attrs: { value: "" } } as never;
      const result = renderHTML.call({} as never, { node, HTMLAttributes: {} });
      expect(result[2]).toBe("");
      expect((result[1] as Record<string, string>)["data-value"]).toBe("");
    });

    it("handles nested HTML tags", () => {
      const nested = "<span><strong>bold</strong></span>";
      const node = { attrs: { value: nested } } as never;
      const result = renderHTML.call({} as never, { node, HTMLAttributes: {} });
      expect(result[2]).toBe(nested);
    });
  });

  describe("parseHTML edge cases", () => {
    const parseRules = htmlInlineExtension.config.parseHTML!.call({} as never)!;
    const rule = parseRules[0];

    it("matches correct tag selector", () => {
      expect(rule.tag).toBe('span[data-type="html"]');
    });

    const getAttrs = rule.getAttrs as (el: HTMLElement) => Record<string, unknown> | false;

    it("prefers data-value over textContent", () => {
      const el = document.createElement("span");
      el.setAttribute("data-type", "html");
      el.setAttribute("data-value", "<kbd>X</kbd>");
      el.textContent = "some fallback";
      expect(getAttrs(el)).toEqual({ value: "<kbd>X</kbd>" });
    });

    it("data-value empty string returns { value: '' } (attribute exists)", () => {
      const el = document.createElement("span");
      el.setAttribute("data-type", "html");
      el.setAttribute("data-value", "");
      // data-value="" => getAttribute returns "" which is not null
      expect(getAttrs(el)).toEqual({ value: "" });
    });

    it("handles CJK content in textContent", () => {
      const el = document.createElement("span");
      el.setAttribute("data-type", "html");
      el.textContent = "<ruby>Ruby</ruby>";
      expect(getAttrs(el)).toEqual({ value: "<ruby>Ruby</ruby>" });
    });

    it("returns false for empty textContent when no data-value", () => {
      const el = document.createElement("span");
      el.setAttribute("data-type", "html");
      el.textContent = "";
      expect(getAttrs(el)).toBe(false);
    });

    it("handles whitespace-only textContent as truthy", () => {
      const el = document.createElement("span");
      el.setAttribute("data-type", "html");
      el.textContent = "   ";
      // "   " is truthy, so returns value
      expect(getAttrs(el)).toEqual({ value: "   " });
    });
  });
});
