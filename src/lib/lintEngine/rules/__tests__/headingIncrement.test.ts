import { describe, it, expect } from "vitest";
import { lintMarkdown } from "../../linter";

describe("W01 headingIncrement", () => {
  it.each([
    {
      name: "clean: sequential h1 → h2 → h3",
      input: "# Heading 1\n\n## Heading 2\n\n### Heading 3",
      expected: 0,
    },
    {
      name: "flagged: h1 → h3 skip",
      input: "# Heading 1\n\n### Heading 3",
      expected: 1,
    },
    {
      name: "clean: decrease from h3 → h2 is fine (no skip in decrease)",
      input: "## Section\n\n### Sub\n\n## Back to H2",
      expected: 0,
    },
    {
      name: "clean: first heading is h3 (no prior context to compare)",
      input: "### Starting at H3",
      expected: 0,
    },
    {
      name: "flagged: h1 → h4 skip",
      input: "# Title\n\n#### Way too deep",
      expected: 1,
    },
    {
      name: "flagged: multiple skips produce multiple diagnostics",
      input: "# H1\n\n### H3\n\n##### H5",
      expected: 2,
    },
    {
      name: "clean: h2 → h3 is fine (increment by 1)",
      input: "## Heading 2\n\n### Heading 3",
      expected: 0,
    },
    {
      name: "clean: empty document produces no diagnostics",
      input: "",
      expected: 0,
    },
    {
      name: "clean: same level repeated (h2 → h2) is fine",
      input: "## First\n\n## Second",
      expected: 0,
    },
  ])("$name → $expected W01 diagnostic(s)", ({ input, expected }) => {
    const result = lintMarkdown(input);
    const matches = result.filter((d) => d.ruleId === "W01");
    expect(matches.length).toBe(expected);
  });

  it("diagnostic has correct severity, uiHint, and messageParams", () => {
    const result = lintMarkdown("# H1\n\n### H3");
    const d = result.find((d) => d.ruleId === "W01");
    expect(d).toBeDefined();
    expect(d!.severity).toBe("warning");
    expect(d!.uiHint).toBe("exact");
    expect(d!.messageKey).toBe("lint.W01");
    expect(d!.messageParams.from).toBe("1");
    expect(d!.messageParams.to).toBe("3");
    expect(d!.line).toBe(3);
  });
});
