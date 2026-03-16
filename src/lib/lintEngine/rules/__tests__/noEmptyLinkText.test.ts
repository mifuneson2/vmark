import { describe, it, expect } from "vitest";
import { lintMarkdown } from "../../linter";

describe("E06 noEmptyLinkText", () => {
  it.each([
    {
      name: "clean: link with text",
      input: "[click here](https://example.com)",
      expected: 0,
    },
    {
      name: "flagged: link with empty brackets",
      input: "[](https://example.com)",
      expected: 1,
    },
    {
      name: "clean: link with image inside (image counts as content)",
      input: "[![alt](image.png)](https://example.com)",
      expected: 0,
    },
    {
      name: "clean: linkReference is NOT flagged",
      input: "[text][ref]\n\n[ref]: https://example.com",
      expected: 0,
    },
    {
      name: "clean: inline image (not link) not flagged",
      input: "![](image.png)",
      expected: 0,
    },
    {
      name: "flagged: multiple empty link texts",
      input: "[](https://a.com) and [](https://b.com)",
      expected: 2,
    },
    {
      name: "clean: link with only nested inline code",
      input: "[`code`](https://example.com)",
      expected: 0,
    },
    {
      name: "clean: empty document produces no diagnostics",
      input: "",
      expected: 0,
    },
    {
      name: "flagged: link with only whitespace text",
      input: "[ ](https://example.com)",
      expected: 1,
    },
  ])("$name → $expected E06 diagnostic(s)", ({ input, expected }) => {
    const result = lintMarkdown(input);
    const matches = result.filter((d) => d.ruleId === "E06");
    expect(matches.length).toBe(expected);
  });

  it("diagnostic has correct severity, uiHint, and messageKey", () => {
    const result = lintMarkdown("[](https://example.com)");
    const d = result.find((d) => d.ruleId === "E06");
    expect(d).toBeDefined();
    expect(d!.severity).toBe("error");
    expect(d!.uiHint).toBe("exact");
    expect(d!.messageKey).toBe("lint.E06");
    expect(d!.line).toBe(1);
  });
});
