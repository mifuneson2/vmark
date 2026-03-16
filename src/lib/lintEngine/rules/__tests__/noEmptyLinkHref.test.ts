import { describe, it, expect } from "vitest";
import { lintMarkdown } from "../../linter";

describe("W05 noEmptyLinkHref", () => {
  it.each([
    {
      name: "clean: link with URL",
      input: "[text](https://example.com)",
      expected: 0,
    },
    {
      name: "flagged: link with empty href",
      input: "[text]()",
      expected: 1,
    },
    {
      name: "clean: link with fragment-only href",
      input: "[text](#section)",
      expected: 0,
    },
    {
      name: "clean: link with relative path",
      input: "[text](./file.md)",
      expected: 0,
    },
    {
      name: "flagged: multiple empty-href links",
      input: "[a]() and [b]()",
      expected: 2,
    },
    {
      name: "clean: linkReference is not checked",
      input: "[text][ref]\n\n[ref]: https://example.com",
      expected: 0,
    },
    {
      name: "clean: empty document produces no diagnostics",
      input: "",
      expected: 0,
    },
    {
      name: "clean: image with URL is not flagged",
      input: "![alt](image.png)",
      expected: 0,
    },
    {
      name: "clean: bare hash href is not empty",
      input: "[top](#)",
      expected: 0,
    },
  ])("$name → $expected W05 diagnostic(s)", ({ input, expected }) => {
    const result = lintMarkdown(input);
    const matches = result.filter((d) => d.ruleId === "W05");
    expect(matches.length).toBe(expected);
  });

  it("diagnostic has correct severity, uiHint, and messageKey", () => {
    const result = lintMarkdown("[text]()");
    const d = result.find((d) => d.ruleId === "W05");
    expect(d).toBeDefined();
    expect(d!.severity).toBe("warning");
    expect(d!.uiHint).toBe("exact");
    expect(d!.messageKey).toBe("lint.W05");
    expect(d!.line).toBe(1);
  });
});
