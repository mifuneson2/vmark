/**
 * Tests for CJK-aware bold/italic input and paste rule regexes.
 *
 * Verifies that the lookbehind-based regexes match CJK text, Latin text,
 * start-of-text, and correctly reject malformed patterns (e.g., `***`).
 */

import { describe, it, expect } from "vitest";
import {
  boldStarInputRegex,
  boldStarPasteRegex,
  boldUnderscoreInputRegex,
  boldUnderscorePasteRegex,
  italicStarInputRegex,
  italicStarPasteRegex,
  italicUnderscoreInputRegex,
  italicUnderscorePasteRegex,
} from "../tiptap";

// Helper: test whether regex matches and extract the inner text (capture group 2)
function inputMatch(regex: RegExp, text: string): string | null {
  const m = text.match(regex);
  return m ? m[2] : null;
}

function pasteMatches(regex: RegExp, text: string): string[] {
  // Reset lastIndex for global regexes
  regex.lastIndex = 0;
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    results.push(m[2]);
  }
  return results;
}

// ─── Bold star (**text**) ───

describe("boldStarInputRegex", () => {
  it("matches Latin text with space prefix", () => {
    expect(inputMatch(boldStarInputRegex, "Hello **world**")).toBe("world");
  });

  it("matches CJK text without space", () => {
    expect(inputMatch(boldStarInputRegex, "你好**世界**")).toBe("世界");
  });

  it("matches at start of text", () => {
    expect(inputMatch(boldStarInputRegex, "**hello**")).toBe("hello");
  });

  it("rejects triple star prefix (malformed)", () => {
    expect(inputMatch(boldStarInputRegex, "***world**")).toBeNull();
  });

  it("matches after punctuation", () => {
    expect(inputMatch(boldStarInputRegex, "end.**bold**")).toBe("bold");
  });

  it("rejects content with only spaces", () => {
    expect(inputMatch(boldStarInputRegex, "**   **")).toBeNull();
  });
});

describe("boldStarPasteRegex", () => {
  it("matches CJK text in paste", () => {
    expect(pasteMatches(boldStarPasteRegex, "你好**世界**再见")).toEqual(["世界"]);
  });

  it("matches multiple occurrences", () => {
    expect(pasteMatches(boldStarPasteRegex, "**a** and **b**")).toEqual(["a", "b"]);
  });

  it("matches Latin text with space prefix", () => {
    expect(pasteMatches(boldStarPasteRegex, "Hello **world**")).toEqual(["world"]);
  });
});

// ─── Bold underscore (__text__) ───

describe("boldUnderscoreInputRegex", () => {
  it("matches Latin text with space prefix", () => {
    expect(inputMatch(boldUnderscoreInputRegex, "Hello __world__")).toBe("world");
  });

  it("matches CJK text without space", () => {
    expect(inputMatch(boldUnderscoreInputRegex, "你好__世界__")).toBe("世界");
  });

  it("matches at start of text", () => {
    expect(inputMatch(boldUnderscoreInputRegex, "__hello__")).toBe("hello");
  });

  it("rejects triple underscore prefix", () => {
    expect(inputMatch(boldUnderscoreInputRegex, "___world__")).toBeNull();
  });
});

describe("boldUnderscorePasteRegex", () => {
  it("matches CJK text in paste", () => {
    expect(pasteMatches(boldUnderscorePasteRegex, "你好__世界__再见")).toEqual(["世界"]);
  });

  it("matches multiple occurrences", () => {
    expect(pasteMatches(boldUnderscorePasteRegex, "__a__ and __b__")).toEqual(["a", "b"]);
  });
});

// ─── Italic star (*text*) ───

describe("italicStarInputRegex", () => {
  it("matches Latin text with space prefix", () => {
    expect(inputMatch(italicStarInputRegex, "Hello *world*")).toBe("world");
  });

  it("matches CJK text without space", () => {
    expect(inputMatch(italicStarInputRegex, "你好*世界*")).toBe("世界");
  });

  it("matches at start of text", () => {
    expect(inputMatch(italicStarInputRegex, "*hello*")).toBe("hello");
  });

  it("rejects double star prefix (that's bold)", () => {
    expect(inputMatch(italicStarInputRegex, "**world*")).toBeNull();
  });

  it("matches after punctuation", () => {
    expect(inputMatch(italicStarInputRegex, "end.*italic*")).toBe("italic");
  });
});

describe("italicStarPasteRegex", () => {
  it("matches CJK text in paste", () => {
    expect(pasteMatches(italicStarPasteRegex, "你好*世界*再见")).toEqual(["世界"]);
  });

  it("matches multiple occurrences", () => {
    expect(pasteMatches(italicStarPasteRegex, "*a* and *b*")).toEqual(["a", "b"]);
  });
});

// ─── Italic underscore (_text_) ───

describe("italicUnderscoreInputRegex", () => {
  it("matches Latin text with space prefix", () => {
    expect(inputMatch(italicUnderscoreInputRegex, "Hello _world_")).toBe("world");
  });

  it("matches CJK text without space", () => {
    expect(inputMatch(italicUnderscoreInputRegex, "你好_世界_")).toBe("世界");
  });

  it("matches at start of text", () => {
    expect(inputMatch(italicUnderscoreInputRegex, "_hello_")).toBe("hello");
  });

  it("rejects double underscore prefix (that's bold)", () => {
    expect(inputMatch(italicUnderscoreInputRegex, "__world_")).toBeNull();
  });
});

describe("italicUnderscorePasteRegex", () => {
  it("matches CJK text in paste", () => {
    expect(pasteMatches(italicUnderscorePasteRegex, "你好_世界_再见")).toEqual(["世界"]);
  });

  it("matches multiple occurrences", () => {
    expect(pasteMatches(italicUnderscorePasteRegex, "_a_ and _b_")).toEqual(["a", "b"]);
  });
});
