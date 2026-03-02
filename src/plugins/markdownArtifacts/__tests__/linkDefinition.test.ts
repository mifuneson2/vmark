/**
 * Tests for linkDefinition extension — renderHTML output and edge cases.
 * Extends coverage beyond markdownArtifacts.test.ts which covers parseHTML/getAttrs.
 */

import { describe, it, expect } from "vitest";
import { linkDefinitionExtension } from "../linkDefinition";

describe("linkDefinitionExtension", () => {
  describe("extension config", () => {
    it("has name link_definition", () => {
      expect(linkDefinitionExtension.name).toBe("link_definition");
    });

    it("is not selectable", () => {
      expect(linkDefinitionExtension.config.selectable).toBe(false);
    });

    it("is isolating", () => {
      expect(linkDefinitionExtension.config.isolating).toBe(true);
    });

    it("belongs to block group", () => {
      expect(linkDefinitionExtension.config.group).toBe("block");
    });

    it("is an atom node", () => {
      expect(linkDefinitionExtension.config.atom).toBe(true);
    });
  });

  describe("addAttributes", () => {
    const attrs = linkDefinitionExtension.config.addAttributes!.call({} as never)!;

    it("has identifier attribute with empty string default", () => {
      expect(attrs.identifier).toBeDefined();
      expect(attrs.identifier.default).toBe("");
    });

    it("has label attribute with null default", () => {
      expect(attrs.label).toBeDefined();
      expect(attrs.label.default).toBeNull();
    });

    it("has url attribute with empty string default", () => {
      expect(attrs.url).toBeDefined();
      expect(attrs.url.default).toBe("");
    });

    it("has title attribute with null default", () => {
      expect(attrs.title).toBeDefined();
      expect(attrs.title.default).toBeNull();
    });

    it("has sourceLine attribute", () => {
      expect(attrs.sourceLine).toBeDefined();
      expect(attrs.sourceLine.default).toBeNull();
    });
  });

  describe("renderHTML", () => {
    const renderHTML = linkDefinitionExtension.config.renderHTML!;

    it("renders div with all data attributes", () => {
      const node = {
        attrs: {
          identifier: "example",
          label: "Example",
          url: "https://example.com",
          title: "Example Title",
        },
      } as never;
      const result = renderHTML.call({} as never, { node, HTMLAttributes: {} });
      expect(result).toEqual([
        "div",
        expect.objectContaining({
          "data-type": "link-definition",
          "data-identifier": "example",
          "data-label": "Example",
          "data-url": "https://example.com",
          "data-title": "Example Title",
          contenteditable: "false",
        }),
      ]);
    });

    it("handles null optional attributes", () => {
      const node = {
        attrs: { identifier: "test", label: null, url: "http://test.com", title: null },
      } as never;
      const result = renderHTML.call({} as never, { node, HTMLAttributes: {} });
      const attrs = result[1] as Record<string, string | null>;
      expect(attrs["data-label"]).toBeNull();
      expect(attrs["data-title"]).toBeNull();
    });

    it("handles undefined identifier gracefully", () => {
      const node = {
        attrs: { identifier: undefined, label: null, url: "", title: null },
      } as never;
      const result = renderHTML.call({} as never, { node, HTMLAttributes: {} });
      const attrs = result[1] as Record<string, string | null>;
      expect(attrs["data-identifier"]).toBe("");
    });

    it("handles null identifier gracefully", () => {
      const node = {
        attrs: { identifier: null, label: null, url: null, title: null },
      } as never;
      const result = renderHTML.call({} as never, { node, HTMLAttributes: {} });
      const attrs = result[1] as Record<string, string | null>;
      expect(attrs["data-identifier"]).toBe("");
      expect(attrs["data-url"]).toBe("");
    });

    it("merges additional HTML attributes", () => {
      const node = {
        attrs: { identifier: "id", label: null, url: "url", title: null },
      } as never;
      const result = renderHTML.call({} as never, {
        node,
        HTMLAttributes: { style: "display:none" },
      });
      const attrs = result[1] as Record<string, string>;
      expect(attrs.style).toBe("display:none");
      expect(attrs["data-type"]).toBe("link-definition");
    });

    it("renders no text content (invisible node)", () => {
      const node = {
        attrs: { identifier: "x", label: null, url: "y", title: null },
      } as never;
      const result = renderHTML.call({} as never, { node, HTMLAttributes: {} });
      // renderHTML returns [tag, attrs] with no children
      expect(result.length).toBe(2);
    });

    it("handles URL with special characters", () => {
      const node = {
        attrs: {
          identifier: "special",
          label: null,
          url: "https://example.com/path?q=1&r=2#frag",
          title: 'Title with "quotes"',
        },
      } as never;
      const result = renderHTML.call({} as never, { node, HTMLAttributes: {} });
      const attrs = result[1] as Record<string, string>;
      expect(attrs["data-url"]).toBe("https://example.com/path?q=1&r=2#frag");
      expect(attrs["data-title"]).toBe('Title with "quotes"');
    });
  });

  describe("parseHTML edge cases", () => {
    const parseRules = linkDefinitionExtension.config.parseHTML!.call({} as never)!;
    const rule = parseRules[0];

    it("matches correct tag selector", () => {
      expect(rule.tag).toBe('div[data-type="link-definition"]');
    });

    const getAttrs = rule.getAttrs as (el: HTMLElement) => Record<string, unknown>;

    it("handles all attributes missing from DOM", () => {
      const el = document.createElement("div");
      el.setAttribute("data-type", "link-definition");
      const attrs = getAttrs(el);
      expect(attrs.identifier).toBe("");
      expect(attrs.label).toBeNull();
      expect(attrs.url).toBe("");
      expect(attrs.title).toBeNull();
    });

    it("handles partial attributes", () => {
      const el = document.createElement("div");
      el.setAttribute("data-type", "link-definition");
      el.setAttribute("data-identifier", "partial");
      el.setAttribute("data-url", "https://partial.com");
      const attrs = getAttrs(el);
      expect(attrs.identifier).toBe("partial");
      expect(attrs.url).toBe("https://partial.com");
      expect(attrs.label).toBeNull();
      expect(attrs.title).toBeNull();
    });

    it("handles empty string attributes", () => {
      const el = document.createElement("div");
      el.setAttribute("data-type", "link-definition");
      el.setAttribute("data-identifier", "");
      el.setAttribute("data-url", "");
      el.setAttribute("data-label", "");
      el.setAttribute("data-title", "");
      const attrs = getAttrs(el);
      expect(attrs.identifier).toBe("");
      expect(attrs.url).toBe("");
      expect(attrs.label).toBe("");
      expect(attrs.title).toBe("");
    });
  });
});
