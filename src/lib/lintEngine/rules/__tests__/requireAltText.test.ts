import { describe, it, expect } from "vitest";
import { lintMarkdown } from "../../linter";

describe("W02 requireAltText", () => {
  it.each([
    {
      name: "clean: image with alt text",
      input: "![a photo of a cat](cat.png)",
      expected: 0,
    },
    {
      name: "flagged: image with empty alt",
      input: "![](image.png)",
      expected: 1,
    },
    {
      name: "clean: image with CJK alt text",
      input: "![一只猫的照片](cat.png)",
      expected: 0,
    },
    {
      name: "flagged: multiple images with empty alt",
      input: "![](a.png) and ![](b.png)",
      expected: 2,
    },
    {
      name: "clean: inline link with text is not flagged",
      input: "[text](https://example.com)",
      expected: 0,
    },
    {
      name: "clean: empty document produces no diagnostics",
      input: "",
      expected: 0,
    },
    {
      name: "clean: imageReference with alt is not flagged",
      input: "![alt text][img-ref]\n\n[img-ref]: image.png",
      expected: 0,
    },
    {
      name: "flagged: whitespace-only alt treated as empty",
      input: "![ ](image.png)",
      expected: 1,
    },
    {
      name: "clean: image with spaces in alt text",
      input: "![my alt text](image.png)",
      expected: 0,
    },
  ])("$name → $expected W02 diagnostic(s)", ({ input, expected }) => {
    const result = lintMarkdown(input);
    const matches = result.filter((d) => d.ruleId === "W02");
    expect(matches.length).toBe(expected);
  });

  it("diagnostic has correct severity, uiHint, and messageKey", () => {
    const result = lintMarkdown("![](image.png)");
    const d = result.find((d) => d.ruleId === "W02");
    expect(d).toBeDefined();
    expect(d!.severity).toBe("warning");
    expect(d!.uiHint).toBe("exact");
    expect(d!.messageKey).toBe("lint.W02");
    expect(d!.line).toBe(1);
  });
});
