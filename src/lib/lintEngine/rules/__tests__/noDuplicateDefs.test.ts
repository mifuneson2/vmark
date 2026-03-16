import { describe, it, expect } from "vitest";
import { lintMarkdown } from "../../linter";

describe("E07 noDuplicateDefs", () => {
  it.each([
    {
      name: "clean: single definition not flagged",
      input: "[ref]: https://example.com",
      expected: 0,
    },
    {
      name: "flagged: two identical definitions",
      input: "[ref]: https://a.com\n[ref]: https://b.com",
      expected: 1,
    },
    {
      name: "flagged: case-insensitive duplicate (REF vs ref)",
      input: "[REF]: https://a.com\n[ref]: https://b.com",
      expected: 1,
    },
    {
      name: "flagged: whitespace-collapsed duplicate",
      input: "[my ref]: https://a.com\n[my  ref]: https://b.com",
      expected: 1,
    },
    {
      name: "flagged: three definitions — second and third flagged",
      input: "[ref]: https://a.com\n[ref]: https://b.com\n[ref]: https://c.com",
      expected: 2,
    },
    {
      name: "clean: different labels are not duplicates",
      input: "[ref-a]: https://a.com\n[ref-b]: https://b.com",
      expected: 0,
    },
    {
      name: "clean: empty document produces no diagnostics",
      input: "",
      expected: 0,
    },
    {
      name: "clean: CJK labels not duplicated",
      input: "[标签一]: https://a.com\n[标签二]: https://b.com",
      expected: 0,
    },
    {
      name: "flagged: CJK label duplicated",
      input: "[标签]: https://a.com\n[标签]: https://b.com",
      expected: 1,
    },
  ])("$name → $expected E07 diagnostic(s)", ({ input, expected }) => {
    const result = lintMarkdown(input);
    const matches = result.filter((d) => d.ruleId === "E07");
    expect(matches.length).toBe(expected);
  });

  it("diagnostic has correct severity, uiHint, messageKey and messageParams", () => {
    const result = lintMarkdown("[ref]: https://a.com\n[ref]: https://b.com");
    const d = result.find((d) => d.ruleId === "E07");
    expect(d).toBeDefined();
    expect(d!.severity).toBe("error");
    expect(d!.uiHint).toBe("exact");
    expect(d!.messageKey).toBe("lint.E07");
    expect(d!.messageParams.ref).toBe("ref");
    expect(d!.line).toBe(2);
  });
});
