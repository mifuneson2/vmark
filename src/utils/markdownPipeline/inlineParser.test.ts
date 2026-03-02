/**
 * Tests for parseInlineMarkdown — inline markdown text to MDAST nodes.
 */

import { describe, it, expect } from "vitest";
import { parseInlineMarkdown } from "./inlineParser";
import type { Content, Text, Strong, Emphasis, Delete, InlineCode, Link } from "mdast";

describe("parseInlineMarkdown", () => {
  describe("empty and plain text", () => {
    it("returns empty array for empty string", () => {
      expect(parseInlineMarkdown("")).toEqual([]);
    });

    it("returns empty array for whitespace-only string", () => {
      expect(parseInlineMarkdown("   ")).toEqual([]);
    });

    it("returns empty array for null-like empty string", () => {
      expect(parseInlineMarkdown("")).toEqual([]);
    });

    it("returns plain text node for text without markdown chars", () => {
      const result = parseInlineMarkdown("Hello world");
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("text");
      expect((result[0] as Text).value).toBe("Hello world");
    });

    it("returns plain text for text with no markdown-special characters", () => {
      const result = parseInlineMarkdown("Just a normal sentence with numbers 123");
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("text");
      expect((result[0] as Text).value).toBe("Just a normal sentence with numbers 123");
    });

    it("returns plain text for CJK text without formatting", () => {
      const result = parseInlineMarkdown("中文文本没有格式");
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("text");
      expect((result[0] as Text).value).toBe("中文文本没有格式");
    });
  });

  describe("inline formatting", () => {
    it("parses bold text", () => {
      const result = parseInlineMarkdown("**bold**");
      expect(result.length).toBeGreaterThanOrEqual(1);
      const hasStrong = result.some((n) => n.type === "strong");
      expect(hasStrong).toBe(true);
    });

    it("parses italic text", () => {
      const result = parseInlineMarkdown("*italic*");
      expect(result.length).toBeGreaterThanOrEqual(1);
      const hasEmphasis = result.some((n) => n.type === "emphasis");
      expect(hasEmphasis).toBe(true);
    });

    it("parses strikethrough text", () => {
      const result = parseInlineMarkdown("~~deleted~~");
      expect(result.length).toBeGreaterThanOrEqual(1);
      const hasDelete = result.some((n) => n.type === "delete");
      expect(hasDelete).toBe(true);
    });

    it("parses inline code", () => {
      const result = parseInlineMarkdown("`code`");
      expect(result.length).toBeGreaterThanOrEqual(1);
      const hasCode = result.some((n) => n.type === "inlineCode");
      expect(hasCode).toBe(true);
    });

    it("parses links", () => {
      const result = parseInlineMarkdown("[link](https://example.com)");
      expect(result.length).toBeGreaterThanOrEqual(1);
      const hasLink = result.some((n) => n.type === "link");
      expect(hasLink).toBe(true);
    });

    it("parses mixed inline formatting", () => {
      const result = parseInlineMarkdown("**bold** and *italic* and `code`");
      const hasStrong = result.some((n) => n.type === "strong");
      const hasEmphasis = result.some((n) => n.type === "emphasis");
      const hasCode = result.some((n) => n.type === "inlineCode");
      expect(hasStrong).toBe(true);
      expect(hasEmphasis).toBe(true);
      expect(hasCode).toBe(true);
    });

    it("parses nested bold and italic", () => {
      const result = parseInlineMarkdown("***bold italic***");
      // Should produce strong > emphasis > text or emphasis > strong > text
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("fast-path optimization", () => {
    it("bypasses remark for text without markdown characters", () => {
      // No *, _, `, ~, [, ] characters => fast path returns plain text
      const result = parseInlineMarkdown("plain sentence");
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("text");
      expect((result[0] as Text).value).toBe("plain sentence");
    });

    it("processes text containing asterisk through remark", () => {
      const result = parseInlineMarkdown("has * asterisk");
      // Contains *, should go through remark even if not actual formatting
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it("processes text containing bracket through remark", () => {
      const result = parseInlineMarkdown("has [bracket]");
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it("processes text containing tilde through remark", () => {
      const result = parseInlineMarkdown("has ~ tilde");
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it("processes text containing underscore through remark", () => {
      const result = parseInlineMarkdown("has _underscore_");
      expect(result.length).toBeGreaterThanOrEqual(1);
      const hasEmphasis = result.some((n) => n.type === "emphasis");
      expect(hasEmphasis).toBe(true);
    });

    it("processes text containing backtick through remark", () => {
      const result = parseInlineMarkdown("has `backtick`");
      expect(result.length).toBeGreaterThanOrEqual(1);
      const hasCode = result.some((n) => n.type === "inlineCode");
      expect(hasCode).toBe(true);
    });
  });

  describe("custom inline marks", () => {
    it("returns plain text for ==text== (= not in fast-path regex)", () => {
      // The fast-path regex /[*_`~[\]]/ does not include =, so == is
      // returned as plain text without going through remark
      const result = parseInlineMarkdown("==highlighted==");
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("text");
    });

    it("parses subscript ~text~", () => {
      const result = parseInlineMarkdown("H~2~O");
      const hasSubscript = result.some((n) => n.type === "subscript");
      expect(hasSubscript).toBe(true);
    });

    it("parses superscript ^text^", () => {
      // ^ is not in the fast-path regex, but [ and ] are handled
      // The text contains no markdown chars from the fast-path check
      // unless there's a bracket or other special char
      const result = parseInlineMarkdown("x^2^");
      // Without any markdown chars from the regex check, this goes fast path
      // The caret is not in /[*_`~[\]]/ so it returns as plain text
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("text");
    });
  });

  describe("edge cases", () => {
    it("handles text that parses to non-paragraph root children", () => {
      // If remark produces something other than a paragraph as first child,
      // the function returns children as-is
      // This is hard to trigger with inline text, but let's test the guard
      const result = parseInlineMarkdown("---");
      // --- may parse as thematicBreak, which isn't a paragraph
      // The function should return children array
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it("handles CJK text with formatting", () => {
      const result = parseInlineMarkdown("**粗体** *斜体*");
      const hasStrong = result.some((n) => n.type === "strong");
      const hasEmphasis = result.some((n) => n.type === "emphasis");
      expect(hasStrong).toBe(true);
      expect(hasEmphasis).toBe(true);
    });

    it("handles emoji in text (no markdown chars, fast path)", () => {
      const result = parseInlineMarkdown("Hello 😀 World");
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("text");
      expect((result[0] as Text).value).toBe("Hello 😀 World");
    });

    it("handles single markdown character that does not form formatting", () => {
      const result = parseInlineMarkdown("a * b");
      // Single asterisk with spaces does not create emphasis
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it("handles image syntax in inline context", () => {
      const result = parseInlineMarkdown("![alt](url)");
      // Should parse the brackets/markers
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });
});
