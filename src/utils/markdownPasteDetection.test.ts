import { describe, it, expect } from "vitest";
import { isMarkdownPasteCandidate } from "./markdownPasteDetection";

describe("markdownPasteDetection", () => {
  it("detects fenced code blocks", () => {
    const text = "```js\nconst a = 1;\n```";
    expect(isMarkdownPasteCandidate(text)).toBe(true);
  });

  it("detects headings with body text", () => {
    const text = "# Title\n\nParagraph text.";
    expect(isMarkdownPasteCandidate(text)).toBe(true);
  });

  it("detects single-line headings", () => {
    const text = "# Title";
    expect(isMarkdownPasteCandidate(text)).toBe(true);
  });

  it("detects list blocks", () => {
    const text = "- first\n- second";
    expect(isMarkdownPasteCandidate(text)).toBe(true);
  });

  it("detects single-line list items", () => {
    const text = "- one item";
    expect(isMarkdownPasteCandidate(text)).toBe(true);
  });

  it("detects markdown tables", () => {
    const text = "| A | B |\n| --- | --- |\n| 1 | 2 |";
    expect(isMarkdownPasteCandidate(text)).toBe(true);
  });

  it("detects links when combined with other markdown", () => {
    const text = "[Link](https://example.com)\n\nNext line";
    expect(isMarkdownPasteCandidate(text)).toBe(true);
  });

  it("detects multi-line emphasis without other signals", () => {
    const text = "This is **important**.\nPlease read *carefully*.";
    expect(isMarkdownPasteCandidate(text)).toBe(true);
  });

  it("detects blockquote markdown when combined with another signal", () => {
    const text = "> # Title\n> Quote line";
    expect(isMarkdownPasteCandidate(text)).toBe(true);
  });

  it("rejects email-style quoted text", () => {
    const text = "On Monday, John wrote:\n> Thanks for your help!\n> Let me know.";
    expect(isMarkdownPasteCandidate(text)).toBe(false);
  });

  it("rejects single-line emphasis", () => {
    expect(isMarkdownPasteCandidate("**bold**")).toBe(false);
  });

  it("rejects raw URLs", () => {
    expect(isMarkdownPasteCandidate("https://example.com")).toBe(false);
  });

  it("rejects ordinary single-line text", () => {
    expect(isMarkdownPasteCandidate("Just a sentence with _underscores_.")).toBe(false);
  });

  it("detects multi-line content with link only (hasLink branch, line 83)", () => {
    // No strong signals, weak < 2, but hasLink is true on multi-line text
    const text = "[My Link](https://example.com)\nSome plain text without emphasis";
    expect(isMarkdownPasteCandidate(text)).toBe(true);
  });

  it("detects blockquote + weak signal combo (hasBlockquote && weakSignals > 0, line 84)", () => {
    // Has blockquote but no strong signals, weak < 2, and no link.
    // hasBlockquote && weakSignals > 0 should return true.
    const text = "> Quote line\nSome *emphasized* text";
    expect(isMarkdownPasteCandidate(text)).toBe(true);
  });

  it("rejects blockquote-only multi-line without weak signals", () => {
    // Has blockquote but no weak signals (no emphasis, no link)
    const text = "> Quote line\nPlain text no markdown signals";
    expect(isMarkdownPasteCandidate(text)).toBe(false);
  });

  it("detects table inside blockquote (line 38: nextLine starts with >, nextStripped is separator)", () => {
    // Line i is a table header inside a blockquote, line i+1 is blockquote + separator
    // BLOCKQUOTE_RE.test(nextLine) → true → nextStripped = separator text
    const text = "> | Column A | Column B |\n> | --- | --- |\n> | val1 | val2 |";
    expect(isMarkdownPasteCandidate(text)).toBe(true);
  });

  it("detects single-line text with link and emphasis (line 89: weakSignals >= 2 on single line)", () => {
    // Single line (no newline): one link (weakSignal) + one emphasis (weakSignal) → weakSignals=2 → true at line 89
    const text = "[Click here](https://example.com) with *important* note";
    expect(isMarkdownPasteCandidate(text)).toBe(true);
  });

  it("rejects empty string", () => {
    expect(isMarkdownPasteCandidate("")).toBe(false);
  });

  it("rejects whitespace-only string", () => {
    expect(isMarkdownPasteCandidate("   \n\t  ")).toBe(false);
  });
});
