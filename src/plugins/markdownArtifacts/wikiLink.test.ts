import { describe, it, expect } from "vitest";
import { wikiLinkExtension } from "./wikiLink";

describe("wikiLinkExtension", () => {
  it("has correct name and inline config", () => {
    expect(wikiLinkExtension.name).toBe("wikiLink");
    expect(wikiLinkExtension.config.inline).toBe(true);
    expect(wikiLinkExtension.config.content).toBe("text*");
  });

  describe("parseHTML", () => {
    const rules = wikiLinkExtension.config.parseHTML!.call(wikiLinkExtension);
    const rule = rules[0];

    it("extracts value from data-value attribute", () => {
      const el = document.createElement("span");
      el.setAttribute("data-type", "wiki-link");
      el.setAttribute("data-value", "my-page");
      expect(rule.getAttrs!(el)).toEqual({ value: "my-page" });
    });

    it("falls back to textContent when data-value is missing", () => {
      const el = document.createElement("span");
      el.setAttribute("data-type", "wiki-link");
      el.textContent = "fallback page";
      expect(rule.getAttrs!(el)).toEqual({ value: "fallback page" });
    });

    it("returns false when no data-value and empty textContent (line 40-41)", () => {
      const el = document.createElement("span");
      el.setAttribute("data-type", "wiki-link");
      el.textContent = "";
      expect(rule.getAttrs!(el)).toBe(false);
    });

    it("returns false when data-value is empty string (falsy check line 36)", () => {
      const el = document.createElement("span");
      el.setAttribute("data-type", "wiki-link");
      el.setAttribute("data-value", "");
      // data-value is "" which is falsy, falls through to textContent
      el.textContent = "";
      expect(rule.getAttrs!(el)).toBe(false);
    });

    it("returns false when textContent is null (line 40 optional chaining)", () => {
      const el = document.createElement("span");
      el.setAttribute("data-type", "wiki-link");
      Object.defineProperty(el, "textContent", { value: null, writable: false });
      expect(rule.getAttrs!(el)).toBe(false);
    });

    it("falls back when data-value is empty but textContent has value", () => {
      const el = document.createElement("span");
      el.setAttribute("data-type", "wiki-link");
      el.setAttribute("data-value", "");
      el.textContent = "backup";
      expect(rule.getAttrs!(el)).toEqual({ value: "backup" });
    });
  });

  describe("renderHTML", () => {
    it("renders with class wiki-link", () => {
      const renderHTML = wikiLinkExtension.config.renderHTML!;
      const result = renderHTML.call(wikiLinkExtension, {
        node: { attrs: { value: "target" } } as any,
        HTMLAttributes: {},
      } as any);
      expect(result[0]).toBe("span");
      expect(result[1]["data-type"]).toBe("wiki-link");
      expect(result[1].class).toBe("wiki-link");
      expect(result[2]).toBe(0); // content hole
    });

    it("handles null value via null coalesce (line 48)", () => {
      const renderHTML = wikiLinkExtension.config.renderHTML!;
      const result = renderHTML.call(wikiLinkExtension, {
        node: { attrs: { value: null } } as any,
        HTMLAttributes: {},
      } as any);
      expect(result[1]["data-value"]).toBe("");
    });
  });
});
