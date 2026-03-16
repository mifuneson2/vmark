import { describe, it, expect } from "vitest";
import { lintMarkdown } from "../../linter";

describe("W04 linkFragments", () => {
  it.each([
    {
      name: "clean: fragment matches heading slug",
      input: "# Hello World\n\n[link](#hello-world)",
      expected: 0,
    },
    {
      name: "flagged: fragment does not match any heading",
      input: "# Hello World\n\n[link](#nonexistent)",
      expected: 1,
    },
    {
      name: "clean: fragment matches CJK heading slug",
      input: "# 你好世界\n\n[link](#你好世界)",
      expected: 0,
    },
    {
      name: "clean: non-fragment links are not flagged",
      input: "# Hello\n\n[link](https://example.com)",
      expected: 0,
    },
    {
      name: "clean: duplicate headings use counter suffixes",
      input: "# Title\n\n# Title\n\n[link1](#title)\n[link2](#title-1)",
      expected: 0,
    },
    {
      name: "flagged: duplicate headings — wrong suffix",
      input: "# Title\n\n# Title\n\n[link](#title-2)",
      expected: 1,
    },
    {
      name: "clean: empty document produces no diagnostics",
      input: "",
      expected: 0,
    },
    {
      name: "clean: bare # (no fragment text) is not flagged",
      input: "# Hello\n\n[top](#)",
      expected: 0,
    },
    {
      name: "flagged: heading has special chars stripped in slug",
      input: "# Hello (World)!\n\n[link](#hello-world-wrong)",
      expected: 1,
    },
    {
      name: "clean: heading special chars stripped correctly",
      input: "# Hello (World)!\n\n[link](#hello-world)",
      expected: 0,
    },
    // Issue 7: inline code nodes in headings
    {
      name: "clean: heading with inline code — fragment matches",
      input: "# Hello `world`\n\n[link](#hello-world)",
      expected: 0,
    },
    {
      name: "flagged: heading with inline code — wrong fragment",
      input: "# Hello `world`\n\n[link](#hello)",
      expected: 1,
    },
  ])("$name → $expected W04 diagnostic(s)", ({ input, expected }) => {
    const result = lintMarkdown(input);
    const matches = result.filter((d) => d.ruleId === "W04");
    expect(matches.length).toBe(expected);
  });

  it("diagnostic has correct severity, uiHint, messageKey, and messageParams", () => {
    const result = lintMarkdown("# Hello\n\n[link](#broken-anchor)");
    const d = result.find((d) => d.ruleId === "W04");
    expect(d).toBeDefined();
    expect(d!.severity).toBe("warning");
    expect(d!.uiHint).toBe("exact");
    expect(d!.messageKey).toBe("lint.W04");
    expect(d!.messageParams.anchor).toBe("broken-anchor");
  });
});
