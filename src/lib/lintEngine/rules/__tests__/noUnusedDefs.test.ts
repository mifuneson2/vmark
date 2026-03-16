import { describe, it, expect } from "vitest";
import { lintMarkdown } from "../../linter";

describe("W03 noUnusedDefs", () => {
  it.each([
    {
      name: "flagged: definition not referenced",
      input: "[ref]: https://example.com",
      expected: 1,
    },
    {
      name: "clean: definition referenced by linkReference",
      input: "See [this][ref]\n\n[ref]: https://example.com",
      expected: 0,
    },
    {
      name: "clean: definition referenced by imageReference",
      input: "![alt][img]\n\n[img]: image.png",
      expected: 0,
    },
    {
      name: "flagged: one used, one unused",
      input: "[text][used]\n\n[used]: https://a.com\n[unused]: https://b.com",
      expected: 1,
    },
    {
      name: "flagged: case-insensitive match — REF reference uses [ref] def",
      input: "[text][REF]\n\n[ref]: https://example.com",
      expected: 0,
    },
    {
      name: "clean: empty document produces no diagnostics",
      input: "",
      expected: 0,
    },
    {
      name: "flagged: two unused definitions",
      input: "[ref-a]: https://a.com\n[ref-b]: https://b.com",
      expected: 2,
    },
    {
      name: "clean: CJK definition referenced",
      input: "[文本][标签]\n\n[标签]: https://example.com",
      expected: 0,
    },
    {
      name: "flagged: CJK definition unused",
      input: "[标签]: https://example.com",
      expected: 1,
    },
    {
      name: "clean: no definitions in document",
      input: "# Just a heading\n\nSome text.",
      expected: 0,
    },
  ])("$name → $expected W03 diagnostic(s)", ({ input, expected }) => {
    const result = lintMarkdown(input);
    const matches = result.filter((d) => d.ruleId === "W03");
    expect(matches.length).toBe(expected);
  });

  it("diagnostic has correct severity, uiHint, messageKey, and messageParams", () => {
    const result = lintMarkdown("[ref]: https://example.com");
    const d = result.find((d) => d.ruleId === "W03");
    expect(d).toBeDefined();
    expect(d!.severity).toBe("warning");
    expect(d!.uiHint).toBe("block");
    expect(d!.messageKey).toBe("lint.W03");
    expect(d!.messageParams.ref).toBe("ref");
  });
});
