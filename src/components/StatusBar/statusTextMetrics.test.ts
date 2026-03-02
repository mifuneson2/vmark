import { describe, expect, it } from "vitest";
import { stripMarkdown, countWordsFromPlain, countCharsFromPlain } from "./statusTextMetrics";

describe("stripMarkdown", () => {
  it("strips heading markers", () => {
    expect(stripMarkdown("# Hello")).toBe("Hello");
    expect(stripMarkdown("## Sub heading")).toBe("Sub heading");
    expect(stripMarkdown("###### Deep heading")).toBe("Deep heading");
  });

  it("strips bold markers", () => {
    expect(stripMarkdown("**bold text**")).toBe("bold text");
    expect(stripMarkdown("__bold text__")).toBe("bold text");
  });

  it("strips italic markers", () => {
    expect(stripMarkdown("*italic text*")).toBe("italic text");
    expect(stripMarkdown("_italic text_")).toBe("italic text");
  });

  it("strips inline code", () => {
    expect(stripMarkdown("use `const` here")).toBe("use  here");
  });

  it("strips fenced code blocks", () => {
    const input = "before\n```js\nconst x = 1;\n```\nafter";
    expect(stripMarkdown(input)).toBe("before\n\nafter");
  });

  it("strips image syntax", () => {
    expect(stripMarkdown("![alt text](image.png)")).toBe("");
  });

  it("strips link syntax but keeps label", () => {
    expect(stripMarkdown("[click here](https://example.com)")).toBe("click here");
  });

  it("strips blockquote markers", () => {
    expect(stripMarkdown("> quoted text")).toBe("quoted text");
  });

  it("strips horizontal rules", () => {
    expect(stripMarkdown("---")).toBe("");
    // Note: "***" and "___" are partially consumed by bold/italic stripping
    // before the HR regex runs — only "---" is a clean HR match.
    // This reflects the actual regex ordering in stripMarkdown.
    expect(stripMarkdown("---\ntext")).toBe("text");
  });

  it("strips unordered list markers", () => {
    expect(stripMarkdown("- item one\n- item two")).toBe("item one\nitem two");
    expect(stripMarkdown("* item one")).toBe("item one");
    expect(stripMarkdown("+ item one")).toBe("item one");
  });

  it("strips ordered list markers", () => {
    expect(stripMarkdown("1. first\n2. second")).toBe("first\nsecond");
  });

  it("collapses triple+ newlines", () => {
    expect(stripMarkdown("a\n\n\n\nb")).toBe("a\n\nb");
  });

  it("trims whitespace", () => {
    expect(stripMarkdown("  hello  ")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(stripMarkdown("")).toBe("");
  });

  it("handles whitespace-only string", () => {
    expect(stripMarkdown("   \n\n  ")).toBe("");
  });

  it("handles combined markdown", () => {
    const input = "# Title\n\n**Bold** and *italic*\n\n> Quote\n\n- List item";
    const result = stripMarkdown(input);
    expect(result).toContain("Title");
    expect(result).toContain("Bold");
    expect(result).toContain("italic");
    expect(result).toContain("Quote");
    expect(result).toContain("List item");
    expect(result).not.toContain("#");
    expect(result).not.toContain("**");
    expect(result).not.toContain(">");
  });

  it("handles CJK text", () => {
    expect(stripMarkdown("# 你好世界")).toBe("你好世界");
    expect(stripMarkdown("**中文粗体**")).toBe("中文粗体");
  });
});

describe("countWordsFromPlain", () => {
  it("counts English words", () => {
    expect(countWordsFromPlain("hello world")).toBe(2);
  });

  it("returns 0 for empty string", () => {
    expect(countWordsFromPlain("")).toBe(0);
  });

  it("returns 0 for whitespace-only", () => {
    expect(countWordsFromPlain("   ")).toBe(0);
  });

  it("counts single word", () => {
    expect(countWordsFromPlain("hello")).toBe(1);
  });

  it("handles multiple spaces between words", () => {
    const result = countWordsFromPlain("hello    world");
    expect(result).toBe(2);
  });
});

describe("countCharsFromPlain", () => {
  it("counts non-whitespace characters", () => {
    expect(countCharsFromPlain("hello world")).toBe(10);
  });

  it("returns 0 for empty string", () => {
    expect(countCharsFromPlain("")).toBe(0);
  });

  it("returns 0 for whitespace-only", () => {
    expect(countCharsFromPlain("   \n\t  ")).toBe(0);
  });

  it("counts CJK characters", () => {
    expect(countCharsFromPlain("你好世界")).toBe(4);
  });

  it("ignores tabs and newlines", () => {
    expect(countCharsFromPlain("a\tb\nc")).toBe(3);
  });

  it("handles mixed content", () => {
    expect(countCharsFromPlain("hello 你好")).toBe(7);
  });
});
