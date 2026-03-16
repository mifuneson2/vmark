import { describe, it, expect } from "vitest";
import { lintMarkdown } from "../../linter";

describe("E05 noSpaceInEmphasis", () => {
  it("flags ** bold ** with spaces", () => {
    const result = lintMarkdown("** bold **");
    expect(result.some((d) => d.ruleId === "E05")).toBe(true);
  });

  it("does NOT flag **bold** without spaces", () => {
    const result = lintMarkdown("**bold**");
    expect(result.some((d) => d.ruleId === "E05")).toBe(false);
  });

  it("flags * italic * with spaces", () => {
    const result = lintMarkdown("* italic *");
    expect(result.some((d) => d.ruleId === "E05")).toBe(true);
  });

  it("does NOT flag *italic* without spaces", () => {
    const result = lintMarkdown("*italic*");
    expect(result.some((d) => d.ruleId === "E05")).toBe(false);
  });

  it("flags __ bold __ with spaces", () => {
    const result = lintMarkdown("__ bold __");
    expect(result.some((d) => d.ruleId === "E05")).toBe(true);
  });

  it("does NOT flag __bold__ without spaces", () => {
    const result = lintMarkdown("__bold__");
    expect(result.some((d) => d.ruleId === "E05")).toBe(false);
  });

  it("does NOT flag emphasis inside a fenced code block", () => {
    const source = "```\n** bold **\n```";
    const result = lintMarkdown(source);
    expect(result.some((d) => d.ruleId === "E05")).toBe(false);
  });

  it("does NOT flag emphasis inside inline code", () => {
    const result = lintMarkdown("Use `** bold **` to show example");
    expect(result.some((d) => d.ruleId === "E05")).toBe(false);
  });

  it("sets uiHint to sourceOnly", () => {
    const result = lintMarkdown("** bold **");
    const d = result.find((d) => d.ruleId === "E05");
    expect(d?.uiHint).toBe("sourceOnly");
  });

  it("reports correct line (1-based)", () => {
    const source = "Normal text\n** bold **";
    const result = lintMarkdown(source);
    const d = result.find((d) => d.ruleId === "E05");
    expect(d?.line).toBe(2);
  });

  it("does NOT flag * used as list bullet", () => {
    const result = lintMarkdown("* list item one\n* list item two");
    expect(result.some((d) => d.ruleId === "E05")).toBe(false);
  });

  it("flags _ italic _ with underscore and spaces", () => {
    const result = lintMarkdown("_ italic _");
    expect(result.some((d) => d.ruleId === "E05")).toBe(true);
  });
});
