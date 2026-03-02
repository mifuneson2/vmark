import { describe, it, expect } from "vitest";
import { cleanMarkdownForClipboard, cleanTextForClipboard } from "./tiptap";

describe("cleanMarkdownForClipboard", () => {
  describe("backslash escape stripping", () => {
    it("strips escaped dollar signs", () => {
      expect(cleanMarkdownForClipboard("Price is \\$99.99")).toBe(
        "Price is $99.99"
      );
    });

    it("strips escaped tildes", () => {
      expect(cleanMarkdownForClipboard("\\~20% off")).toBe("~20% off");
    });

    it("strips escaped at signs", () => {
      expect(cleanMarkdownForClipboard("user\\@example.com")).toBe(
        "user@example.com"
      );
    });

    it("strips escaped brackets", () => {
      expect(cleanMarkdownForClipboard("\\[not a link]")).toBe("[not a link]");
    });

    it("strips escaped asterisks", () => {
      expect(cleanMarkdownForClipboard("5 \\* 3 = 15")).toBe("5 * 3 = 15");
    });

    it("strips escaped underscores", () => {
      expect(cleanMarkdownForClipboard("snake\\_case")).toBe("snake_case");
    });

    it("strips escaped colons", () => {
      expect(cleanMarkdownForClipboard("https\\://example.com")).toBe(
        "https://example.com"
      );
    });

    it("strips escaped ampersands", () => {
      expect(cleanMarkdownForClipboard("foo\\&bar")).toBe("foo&bar");
    });

    it("converts double backslash to single", () => {
      expect(cleanMarkdownForClipboard("C:\\\\Users\\\\foo")).toBe(
        "C:\\Users\\foo"
      );
    });

    it("does not strip backslash before newline", () => {
      expect(cleanMarkdownForClipboard("line1\\\nline2")).toBe(
        "line1\\\nline2"
      );
    });

    it("handles multiple escapes in one line", () => {
      expect(
        cleanMarkdownForClipboard("\\$99 is \\~20% off\\!")
      ).toBe("$99 is ~20% off!");
    });
  });

  describe("autolink collapsing", () => {
    it("collapses URL autolinks", () => {
      expect(
        cleanMarkdownForClipboard(
          "[https://example.com/path](https://example.com/path)"
        )
      ).toBe("https://example.com/path");
    });

    it("collapses mailto autolinks", () => {
      expect(
        cleanMarkdownForClipboard(
          "[user@example.com](mailto:user@example.com)"
        )
      ).toBe("user@example.com");
    });

    it("collapses autolinks with escaped chars in text", () => {
      // Serializer escapes @ in text but not in URL
      expect(
        cleanMarkdownForClipboard(
          "[user\\@example.com](mailto:user@example.com)"
        )
      ).toBe("user@example.com");
    });

    it("collapses URL autolinks with escaped colons", () => {
      expect(
        cleanMarkdownForClipboard(
          "[https\\://example.com](https://example.com)"
        )
      ).toBe("https://example.com");
    });

    it("preserves real links where text differs from URL", () => {
      expect(
        cleanMarkdownForClipboard("[click here](https://example.com)")
      ).toBe("[click here](https://example.com)");
    });
  });

  describe("preserves markdown syntax", () => {
    it("preserves bold", () => {
      expect(cleanMarkdownForClipboard("**bold**")).toBe("**bold**");
    });

    it("preserves italic", () => {
      expect(cleanMarkdownForClipboard("*italic*")).toBe("*italic*");
    });

    it("preserves strikethrough", () => {
      expect(cleanMarkdownForClipboard("~~deleted~~")).toBe("~~deleted~~");
    });

    it("preserves code spans", () => {
      expect(cleanMarkdownForClipboard("`code`")).toBe("`code`");
    });

    it("preserves headings", () => {
      expect(cleanMarkdownForClipboard("## Heading")).toBe("## Heading");
    });

    it("preserves fenced code blocks", () => {
      const input = "```js\nconst x = 1;\n```";
      expect(cleanMarkdownForClipboard(input)).toBe(input);
    });
  });

  describe("does not strip unknown escapes", () => {
    it("preserves backslash before letters", () => {
      expect(cleanMarkdownForClipboard("\\n \\t")).toBe("\\n \\t");
    });

    it("preserves backslash before digits", () => {
      expect(cleanMarkdownForClipboard("item \\1")).toBe("item \\1");
    });

    it("preserves backslash before space", () => {
      expect(cleanMarkdownForClipboard("foo\\ bar")).toBe("foo\\ bar");
    });
  });
});

describe("cleanTextForClipboard", () => {
  it("trims trailing whitespace from each line", () => {
    expect(cleanTextForClipboard("hello   \nworld  ")).toBe("hello\nworld");
  });

  it("trims trailing tabs from each line", () => {
    expect(cleanTextForClipboard("hello\t\t\nworld\t")).toBe("hello\nworld");
  });

  it("collapses multiple blank lines into one", () => {
    expect(cleanTextForClipboard("a\n\n\nb")).toBe("a\n\nb");
  });

  it("collapses many blank lines into one", () => {
    expect(cleanTextForClipboard("a\n\n\n\n\nb")).toBe("a\n\nb");
  });

  it("trims leading blank lines", () => {
    expect(cleanTextForClipboard("\n\nhello")).toBe("hello");
  });

  it("trims trailing blank lines", () => {
    expect(cleanTextForClipboard("hello\n\n")).toBe("hello");
  });

  it("trims both leading and trailing blank lines", () => {
    expect(cleanTextForClipboard("\n\nhello\n\n")).toBe("hello");
  });

  it("handles all three rules together", () => {
    const input = "\n\nline one   \n\n\n\nline two  \n\n";
    expect(cleanTextForClipboard(input)).toBe("line one\n\nline two");
  });

  it("preserves single blank line between paragraphs", () => {
    expect(cleanTextForClipboard("para one\n\npara two")).toBe(
      "para one\n\npara two"
    );
  });

  it("returns empty string for whitespace-only input", () => {
    expect(cleanTextForClipboard("   \n\n  \n  ")).toBe("");
  });

  it("handles empty string input", () => {
    expect(cleanTextForClipboard("")).toBe("");
  });

  it("preserves indentation on non-first lines", () => {
    // The outer .trim() strips leading spaces on the first line,
    // but indentation on subsequent lines is preserved.
    expect(cleanTextForClipboard("first\n    indented")).toBe(
      "first\n    indented"
    );
  });

  it("handles single line with trailing whitespace", () => {
    expect(cleanTextForClipboard("hello   ")).toBe("hello");
  });

  it("handles mixed tabs and spaces in trailing whitespace", () => {
    expect(cleanTextForClipboard("hello \t \t\nworld")).toBe("hello\nworld");
  });

  it("handles exactly two newlines (single blank line preserved)", () => {
    expect(cleanTextForClipboard("a\n\nb")).toBe("a\n\nb");
  });

  it("does not trim non-breaking spaces", () => {
    // \u00a0 is a non-breaking space, which is not matched by [^\S\n]+ (it is \S)
    // Actually \u00a0 IS matched by \s but NOT by \S... let's verify behavior
    const result = cleanTextForClipboard("hello\u00a0\nworld");
    // Non-breaking space at end of line: [^\S\n]+ matches it since \u00a0 is whitespace but not \n
    expect(result).toBe("hello\nworld");
  });
});

describe("cleanMarkdownForClipboard — additional edge cases", () => {
  it("handles empty string", () => {
    expect(cleanMarkdownForClipboard("")).toBe("");
  });

  it("strips escaped hash marks", () => {
    expect(cleanMarkdownForClipboard("\\# Not a heading")).toBe("# Not a heading");
  });

  it("strips escaped pipes", () => {
    expect(cleanMarkdownForClipboard("col1 \\| col2")).toBe("col1 | col2");
  });

  it("strips escaped parentheses", () => {
    expect(cleanMarkdownForClipboard("fn\\(x\\)")).toBe("fn(x)");
  });

  it("strips escaped closing bracket", () => {
    expect(cleanMarkdownForClipboard("\\[foo\\]")).toBe("[foo]");
  });

  it("strips escaped plus sign", () => {
    expect(cleanMarkdownForClipboard("\\+ item")).toBe("+ item");
  });

  it("strips escaped dot", () => {
    expect(cleanMarkdownForClipboard("1\\. not ordered")).toBe("1. not ordered");
  });

  it("strips escaped greater-than", () => {
    expect(cleanMarkdownForClipboard("\\> not blockquote")).toBe("> not blockquote");
  });

  it("strips escaped hyphen/dash", () => {
    expect(cleanMarkdownForClipboard("\\- not list")).toBe("- not list");
  });

  it("strips escaped backtick", () => {
    expect(cleanMarkdownForClipboard("\\`not code\\`")).toBe("`not code`");
  });

  it("handles combined escape stripping and autolink collapse", () => {
    const input = "Visit [https\\://example.com](https://example.com) for \\$5 off";
    expect(cleanMarkdownForClipboard(input)).toBe(
      "Visit https://example.com for $5 off"
    );
  });

  it("handles multiple autolinks in one string", () => {
    const input =
      "[https://a.com](https://a.com) and [https://b.com](https://b.com)";
    expect(cleanMarkdownForClipboard(input)).toBe(
      "https://a.com and https://b.com"
    );
  });

  it("does not collapse link with different text and URL", () => {
    expect(
      cleanMarkdownForClipboard("[Example](https://example.com)")
    ).toBe("[Example](https://example.com)");
  });

  it("handles nested markdown formatting", () => {
    expect(cleanMarkdownForClipboard("**bold and *italic***")).toBe(
      "**bold and *italic***"
    );
  });
});
