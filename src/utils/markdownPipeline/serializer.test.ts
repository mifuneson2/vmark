/**
 * Serializer tests for remark-based markdown pipeline
 *
 * Tests serializeMdastToMarkdown function.
 * TDD: Write tests first, then implement.
 */

import { describe, it, expect } from "vitest";
import { parseMarkdownToMdast } from "./parser";
import { serializeMdastToMarkdown } from "./serializer";

describe("serializeMdastToMarkdown", () => {
  describe("round-trip basics", () => {
    it("round-trips a simple paragraph", () => {
      const input = "Hello world";
      const mdast = parseMarkdownToMdast(input);
      const output = serializeMdastToMarkdown(mdast);
      expect(output.trim()).toBe(input);
    });

    it("round-trips headings", () => {
      const input = "# Heading 1";
      const mdast = parseMarkdownToMdast(input);
      const output = serializeMdastToMarkdown(mdast);
      expect(output.trim()).toBe(input);
    });

    it("round-trips code fences", () => {
      const input = "```js\nconst x = 1;\n```";
      const mdast = parseMarkdownToMdast(input);
      const output = serializeMdastToMarkdown(mdast);
      expect(output.trim()).toBe(input);
    });

    it("round-trips blockquotes", () => {
      const input = "> Quote text";
      const mdast = parseMarkdownToMdast(input);
      const output = serializeMdastToMarkdown(mdast);
      expect(output.trim()).toBe(input);
    });
  });

  describe("GFM round-trip", () => {
    it("round-trips strikethrough", () => {
      const input = "~~deleted~~";
      const mdast = parseMarkdownToMdast(input);
      const output = serializeMdastToMarkdown(mdast);
      expect(output.trim()).toBe(input);
    });

    it("round-trips tables", () => {
      const input = `| A | B |
| - | - |
| 1 | 2 |`;
      const mdast = parseMarkdownToMdast(input);
      const output = serializeMdastToMarkdown(mdast);
      // Table output may have slight formatting differences
      expect(output).toContain("| A | B |");
      expect(output).toContain("| 1 | 2 |");
    });

    it("round-trips task lists", () => {
      const input = `- [ ] unchecked
- [x] checked`;
      const mdast = parseMarkdownToMdast(input);
      const output = serializeMdastToMarkdown(mdast);
      expect(output).toContain("[ ]");
      expect(output).toContain("[x]");
    });
  });

  describe("frontmatter round-trip", () => {
    it("round-trips YAML frontmatter", () => {
      const input = `---
title: Test
---

Content`;
      const mdast = parseMarkdownToMdast(input);
      const output = serializeMdastToMarkdown(mdast);
      expect(output).toContain("---");
      expect(output).toContain("title: Test");
    });
  });

  describe("math round-trip", () => {
    it("round-trips inline math", () => {
      const input = "Equation: $E = mc^2$";
      const mdast = parseMarkdownToMdast(input);
      const output = serializeMdastToMarkdown(mdast);
      expect(output).toContain("$E = mc^2$");
    });

    it("round-trips block math", () => {
      const input = `$$
x^2 + y^2 = z^2
$$`;
      const mdast = parseMarkdownToMdast(input);
      const output = serializeMdastToMarkdown(mdast);
      expect(output).toContain("$$");
      expect(output).toContain("x^2 + y^2 = z^2");
    });
  });

  describe("wiki link round-trip", () => {
    it("round-trips wiki links", () => {
      const input = "See [[Page|Alias]]";
      const mdast = parseMarkdownToMdast(input);
      const output = serializeMdastToMarkdown(mdast);
      expect(output).toContain("[[Page|Alias]]");
    });
  });

  describe("details round-trip", () => {
    it("round-trips details blocks", () => {
      const input = "<details>\\n<summary>Info</summary>\\n\\nBody\\n</details>";
      const mdast = parseMarkdownToMdast(input);
      const output = serializeMdastToMarkdown(mdast);
      expect(output).toContain("<details");
      expect(output).toContain("<summary>Info</summary>");
      expect(output).toContain("Body");
    });
  });

  describe("custom inline round-trip", () => {
    it("round-trips highlight ==text==", () => {
      const input = "==highlighted==";
      const mdast = parseMarkdownToMdast(input);
      const output = serializeMdastToMarkdown(mdast);
      expect(output.trim()).toBe(input);
    });

    it("round-trips subscript ~text~", () => {
      const input = "H~2~O";
      const mdast = parseMarkdownToMdast(input);
      const output = serializeMdastToMarkdown(mdast);
      expect(output.trim()).toBe(input);
    });

    it("round-trips superscript ^text^", () => {
      const input = "x^2^";
      const mdast = parseMarkdownToMdast(input);
      const output = serializeMdastToMarkdown(mdast);
      expect(output.trim()).toBe(input);
    });

    it("round-trips underline ++text++", () => {
      const input = "++underlined++";
      const mdast = parseMarkdownToMdast(input);
      const output = serializeMdastToMarkdown(mdast);
      expect(output.trim()).toBe(input);
    });
  });

  describe("hardBreakStyle option", () => {
    it("converts backslash breaks to two-space breaks", () => {
      // Parse content with hard breaks
      const mdast = parseMarkdownToMdast("Line 1\\\nLine 2", { preserveLineBreaks: false });
      const output = serializeMdastToMarkdown(mdast, { hardBreakStyle: "twoSpaces" });
      // Should have two spaces before newline instead of backslash
      expect(output).toContain("  \n");
      expect(output).not.toContain("\\\n");
    });

    it("preserves backslash breaks by default", () => {
      const mdast = parseMarkdownToMdast("Line 1\\\nLine 2");
      const output = serializeMdastToMarkdown(mdast);
      expect(output).toContain("\\\n");
    });
  });

  describe("URL with whitespace", () => {
    it("wraps image URLs with spaces in angle brackets", () => {
      const mdast = parseMarkdownToMdast("![alt](</path/with spaces/img.png>)");
      const output = serializeMdastToMarkdown(mdast);
      expect(output).toContain("</path/with spaces/img.png>");
    });

    it("wraps link URLs with spaces in angle brackets", () => {
      const mdast = parseMarkdownToMdast("[text](</path/with spaces/doc.md>)");
      const output = serializeMdastToMarkdown(mdast);
      expect(output).toContain("</path/with spaces/doc.md>");
    });

    it("does not wrap URLs without spaces", () => {
      const mdast = parseMarkdownToMdast("[text](https://example.com)");
      const output = serializeMdastToMarkdown(mdast);
      expect(output).not.toContain("<https://example.com>");
      expect(output).toContain("(https://example.com)");
    });

    it("handles image with title and spaces in URL", () => {
      const mdast = parseMarkdownToMdast('![alt](</path/with spaces/img.png> "title")');
      const output = serializeMdastToMarkdown(mdast);
      expect(output).toContain("title");
    });

    it("handles link with title and spaces in URL", () => {
      const mdast = parseMarkdownToMdast('[text](</path/with spaces/doc.md> "title")');
      const output = serializeMdastToMarkdown(mdast);
      expect(output).toContain("title");
    });
  });

  describe("entity replacement", () => {
    it("replaces &#x20; entities back to spaces", () => {
      // This tests the post-processing step
      const mdast = parseMarkdownToMdast("Hello world");
      const output = serializeMdastToMarkdown(mdast);
      expect(output).not.toContain("&#x20;");
    });
  });

  describe("list formatting", () => {
    it("uses dash for bullet lists", () => {
      const mdast = parseMarkdownToMdast("- item 1\n- item 2");
      const output = serializeMdastToMarkdown(mdast);
      expect(output).toContain("- item 1");
      expect(output).toContain("- item 2");
    });

    it("uses dot for ordered lists", () => {
      const mdast = parseMarkdownToMdast("1. first\n2. second");
      const output = serializeMdastToMarkdown(mdast);
      expect(output).toContain("1.");
      expect(output).toContain("2.");
    });
  });

  describe("CJK round-trip", () => {
    it("round-trips CJK text", () => {
      const input = "中文文本 **粗体** *斜体*";
      const mdast = parseMarkdownToMdast(input);
      const output = serializeMdastToMarkdown(mdast);
      expect(output).toContain("中文文本");
      expect(output).toContain("**粗体**");
      expect(output).toContain("*斜体*");
    });
  });

  describe("nested structures round-trip", () => {
    it("round-trips blockquote with paragraph", () => {
      const input = "> quoted text";
      const mdast = parseMarkdownToMdast(input);
      const output = serializeMdastToMarkdown(mdast);
      expect(output.trim()).toBe(input);
    });

    it("round-trips horizontal rules", () => {
      const input = "---";
      const mdast = parseMarkdownToMdast(input);
      const output = serializeMdastToMarkdown(mdast);
      expect(output.trim()).toBe(input);
    });
  });
});
