import { describe, it, expect } from "vitest";
import { lintMarkdown } from "../linter";

describe("lintMarkdown", () => {
  it("returns empty array for valid markdown", () => {
    const result = lintMarkdown("# Hello\n\nThis is valid markdown.");
    expect(result).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    const result = lintMarkdown("");
    expect(result).toEqual([]);
  });

  it("returns empty array for whitespace-only string", () => {
    const result = lintMarkdown("   \n  \n  ");
    expect(result).toEqual([]);
  });

  it("returns empty array for frontmatter-only document", () => {
    const result = lintMarkdown("---\ntitle: test\n---");
    expect(result).toEqual([]);
  });

  it("each diagnostic has a unique id", () => {
    // Once rules are added, this will catch id collisions
    const source = "# Title\n\n## Valid\n\nSome text.";
    const result = lintMarkdown(source);
    const ids = result.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("completes in under 3000ms for 5000-line document", () => {
    // CI runners are ~3-5x slower than local; 3s budget accommodates this
    const lines = Array.from({ length: 5000 }, (_, i) => `Line ${i + 1}`);
    lines[0] = "# Title";
    const source = lines.join("\n");
    const start = performance.now();
    lintMarkdown(source);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(3000);
  });
});
