/**
 * ProseMirror to MDAST inline conversion tests
 */

import { describe, it, expect } from "vitest";
import { proseMirrorToMdast } from "./proseMirrorToMdast";
import { serializeMdastToMarkdown } from "./serializer";
import { testSchema } from "./testSchema";

const pmToMarkdown = (children: ReturnType<typeof testSchema.node>[]) => {
  const doc = testSchema.node("doc", null, children);
  const mdast = proseMirrorToMdast(testSchema, doc);
  return serializeMdastToMarkdown(mdast);
};

describe("proseMirrorToMdast inline", () => {
  it("serializes wiki links", () => {
    const md = pmToMarkdown([
      testSchema.node("paragraph", null, [
        testSchema.node("wikiLink", { value: "Page" }, [testSchema.text("Alias")]),
      ]),
    ]);

    expect(md).toContain("[[Page|Alias]]");
  });

  it("serializes inline html", () => {
    const md = pmToMarkdown([
      testSchema.node("paragraph", null, [
        testSchema.text("Key "),
        testSchema.node("html_inline", { value: "<kbd>X</kbd>" }),
      ]),
    ]);

    expect(md).toContain("<kbd>X</kbd>");
  });

  it("serializes underline marks", () => {
    const underline = testSchema.mark("underline");
    const md = pmToMarkdown([
      testSchema.node("paragraph", null, [
        testSchema.text("underlined", [underline]),
      ]),
    ]);

    expect(md).toContain("++underlined++");
  });

  it("serializes footnote references", () => {
    const md = pmToMarkdown([
      testSchema.node("paragraph", null, [
        testSchema.text("Hello "),
        testSchema.node("footnote_reference", { label: "1" }),
      ]),
    ]);

    expect(md).toContain("[^1]");
  });

  it("wraps URLs with spaces in angle brackets", () => {
    const md = pmToMarkdown([
      testSchema.node("paragraph", null, [
        testSchema.node("image", {
          src: "/path/with spaces/image file.png",
          alt: "alt text",
        }),
      ]),
    ]);

    // URLs with spaces should use angle bracket syntax (CommonMark standard)
    expect(md).toContain("</path/with spaces/image file.png>");
  });

  it("wraps link URLs with spaces in angle brackets", () => {
    const link = testSchema.mark("link", { href: "/path/with spaces/doc.md" });
    const md = pmToMarkdown([
      testSchema.node("paragraph", null, [testSchema.text("link text", [link])]),
    ]);

    // URLs with spaces should use angle bracket syntax
    expect(md).toContain("</path/with spaces/doc.md>");
  });

  it("serializes wiki links without alias (alias equals value)", () => {
    const md = pmToMarkdown([
      testSchema.node("paragraph", null, [
        testSchema.node("wikiLink", { value: "Page" }, [testSchema.text("Page")]),
      ]),
    ]);

    // When alias equals value, no pipe alias in output
    expect(md).toContain("[[Page]]");
    expect(md).not.toContain("|");
  });

  it("serializes wiki links with empty content", () => {
    const md = pmToMarkdown([
      testSchema.node("paragraph", null, [
        testSchema.node("wikiLink", { value: "EmptyPage" }),
      ]),
    ]);

    expect(md).toContain("[[EmptyPage]]");
  });

  it("serializes hard breaks", () => {
    const md = pmToMarkdown([
      testSchema.node("paragraph", null, [
        testSchema.text("Line 1"),
        testSchema.node("hardBreak"),
        testSchema.text("Line 2"),
      ]),
    ]);

    expect(md).toContain("Line 1");
    expect(md).toContain("Line 2");
  });

  it("serializes images without title", () => {
    const md = pmToMarkdown([
      testSchema.node("paragraph", null, [
        testSchema.node("image", { src: "img.png", alt: "alt" }),
      ]),
    ]);

    expect(md).toContain("![alt](img.png)");
  });

  it("serializes inline math", () => {
    const md = pmToMarkdown([
      testSchema.node("paragraph", null, [
        testSchema.text("Formula "),
        testSchema.node("math_inline", { content: "E=mc^2" }),
      ]),
    ]);

    expect(md).toContain("$E=mc^2$");
  });

  it("serializes bold text", () => {
    const bold = testSchema.mark("bold");
    const md = pmToMarkdown([
      testSchema.node("paragraph", null, [
        testSchema.text("bold text", [bold]),
      ]),
    ]);

    expect(md).toContain("**bold text**");
  });

  it("serializes italic text", () => {
    const italic = testSchema.mark("italic");
    const md = pmToMarkdown([
      testSchema.node("paragraph", null, [
        testSchema.text("italic text", [italic]),
      ]),
    ]);

    expect(md).toContain("*italic text*");
  });

  it("serializes strikethrough text", () => {
    const strike = testSchema.mark("strike");
    const md = pmToMarkdown([
      testSchema.node("paragraph", null, [
        testSchema.text("deleted", [strike]),
      ]),
    ]);

    expect(md).toContain("~~deleted~~");
  });

  it("serializes inline code", () => {
    const code = testSchema.mark("code");
    const md = pmToMarkdown([
      testSchema.node("paragraph", null, [
        testSchema.text("x = 1", [code]),
      ]),
    ]);

    expect(md).toContain("`x = 1`");
  });

  it("serializes subscript text", () => {
    const sub = testSchema.mark("subscript");
    const md = pmToMarkdown([
      testSchema.node("paragraph", null, [
        testSchema.text("H"),
        testSchema.text("2", [sub]),
        testSchema.text("O"),
      ]),
    ]);

    expect(md).toContain("~2~");
  });

  it("serializes superscript text", () => {
    const sup = testSchema.mark("superscript");
    const md = pmToMarkdown([
      testSchema.node("paragraph", null, [
        testSchema.text("x"),
        testSchema.text("2", [sup]),
      ]),
    ]);

    expect(md).toContain("^2^");
  });

  it("serializes highlight text", () => {
    const highlight = testSchema.mark("highlight");
    const md = pmToMarkdown([
      testSchema.node("paragraph", null, [
        testSchema.text("marked", [highlight]),
      ]),
    ]);

    expect(md).toContain("==marked==");
  });

  it("serializes nested marks (bold + italic)", () => {
    const bold = testSchema.mark("bold");
    const italic = testSchema.mark("italic");
    const md = pmToMarkdown([
      testSchema.node("paragraph", null, [
        testSchema.text("both", [bold, italic]),
      ]),
    ]);

    // Should contain both bold and italic markers
    expect(md).toMatch(/\*{3}both\*{3}|\*\*\*both\*\*\*/);
  });
});
