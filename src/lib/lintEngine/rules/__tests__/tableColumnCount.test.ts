import { describe, it, expect } from "vitest";
import { lintMarkdown } from "../../linter";

describe("E02 tableColumnCount", () => {
  it.each([
    {
      name: "clean: table with matching column counts",
      input: "| A | B |\n|---|---|\n| 1 | 2 |",
      expected: 0,
    },
    {
      name: "flagged: body row has fewer columns than header",
      input: "| A | B | C |\n|---|---|---|\n| 1 | 2 |",
      expected: 1,
    },
    {
      name: "flagged: body row has more columns than header",
      input: "| A | B |\n|---|---|\n| 1 | 2 | 3 |",
      expected: 1,
    },
    {
      name: "clean: table with only header row (no body rows to check)",
      input: "| A | B |\n|---|---|",
      expected: 0,
    },
    {
      name: "flagged: multiple mismatched rows each produce one diagnostic",
      input: "| A | B |\n|---|---|\n| 1 |\n| 2 |",
      expected: 2,
    },
    {
      name: "clean: multiple tables both correct",
      input: "| A | B |\n|---|---|\n| 1 | 2 |\n\n| X | Y | Z |\n|---|---|---|\n| a | b | c |",
      expected: 0,
    },
    {
      name: "flagged: second table has mismatched row",
      input: "| A | B |\n|---|---|\n| 1 | 2 |\n\n| X | Y | Z |\n|---|---|---|\n| a | b |",
      expected: 1,
    },
    {
      name: "clean: empty document produces no diagnostics",
      input: "",
      expected: 0,
    },
  ])("$name → $expected E02 diagnostic(s)", ({ input, expected }) => {
    const result = lintMarkdown(input);
    const matches = result.filter((d) => d.ruleId === "E02");
    expect(matches.length).toBe(expected);
  });

  it("diagnostic has correct severity, uiHint, and messageParams", () => {
    const result = lintMarkdown("| A | B | C |\n|---|---|---|\n| 1 | 2 |");
    const d = result.find((d) => d.ruleId === "E02");
    expect(d).toBeDefined();
    expect(d!.severity).toBe("error");
    expect(d!.uiHint).toBe("block");
    expect(d!.messageKey).toBe("lint.E02");
    expect(d!.messageParams.expected).toBe("3");
    expect(d!.messageParams.found).toBe("2");
  });
});
