import { describe, it, expect } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { isAtParagraphLineStart } from "./paragraphDetection";

function createView(doc: string, cursor: number): EditorView {
  const state = EditorState.create({
    doc,
    selection: { anchor: cursor },
  });
  return new EditorView({ state, parent: document.createElement("div") });
}

describe("isAtParagraphLineStart", () => {
  describe("returns true for paragraph line starts", () => {
    it("cursor at start of plain text line", () => {
      const view = createView("Hello world", 0);
      expect(isAtParagraphLineStart(view)).toBe(true);
      view.destroy();
    });

    it("cursor at start of second paragraph line", () => {
      const doc = "first line\nsecond line";
      const view = createView(doc, 11); // start of "second line"
      expect(isAtParagraphLineStart(view)).toBe(true);
      view.destroy();
    });

    it("cursor at start of line with CJK text", () => {
      const view = createView("你好世界", 0);
      expect(isAtParagraphLineStart(view)).toBe(true);
      view.destroy();
    });
  });

  describe("returns false when not at line start", () => {
    it("cursor in middle of line", () => {
      const view = createView("Hello world", 5);
      expect(isAtParagraphLineStart(view)).toBe(false);
      view.destroy();
    });

    it("cursor at end of line", () => {
      const view = createView("Hello", 5);
      expect(isAtParagraphLineStart(view)).toBe(false);
      view.destroy();
    });
  });

  describe("returns false for empty/blank lines", () => {
    it("empty line", () => {
      const doc = "text\n\nmore";
      const view = createView(doc, 5); // blank line
      expect(isAtParagraphLineStart(view)).toBe(false);
      view.destroy();
    });

    it("whitespace-only line", () => {
      const doc = "text\n   \nmore";
      const view = createView(doc, 5); // start of "   " line
      expect(isAtParagraphLineStart(view)).toBe(false);
      view.destroy();
    });

    it("empty document", () => {
      const view = createView("", 0);
      expect(isAtParagraphLineStart(view)).toBe(false);
      view.destroy();
    });
  });

  describe("returns false for heading lines", () => {
    it.each([
      { doc: "# Heading 1", label: "h1" },
      { doc: "## Heading 2", label: "h2" },
      { doc: "###### Heading 6", label: "h6" },
    ])("heading line ($label)", ({ doc }) => {
      const view = createView(doc, 0);
      expect(isAtParagraphLineStart(view)).toBe(false);
      view.destroy();
    });
  });

  describe("returns false for list items", () => {
    it("unordered list with -", () => {
      const view = createView("- item", 0);
      expect(isAtParagraphLineStart(view)).toBe(false);
      view.destroy();
    });

    it("unordered list with *", () => {
      const view = createView("* item", 0);
      expect(isAtParagraphLineStart(view)).toBe(false);
      view.destroy();
    });

    it("unordered list with +", () => {
      const view = createView("+ item", 0);
      expect(isAtParagraphLineStart(view)).toBe(false);
      view.destroy();
    });

    it("ordered list", () => {
      const view = createView("1. item", 0);
      expect(isAtParagraphLineStart(view)).toBe(false);
      view.destroy();
    });

    it("indented list", () => {
      const view = createView("  - nested item", 0);
      expect(isAtParagraphLineStart(view)).toBe(false);
      view.destroy();
    });

    it("task list item", () => {
      const view = createView("- [ ] task", 0);
      expect(isAtParagraphLineStart(view)).toBe(false);
      view.destroy();
    });

    it("checked task list item", () => {
      const view = createView("- [x] done", 0);
      expect(isAtParagraphLineStart(view)).toBe(false);
      view.destroy();
    });
  });

  describe("returns false for blockquote lines", () => {
    it("simple blockquote", () => {
      const view = createView("> quote", 0);
      expect(isAtParagraphLineStart(view)).toBe(false);
      view.destroy();
    });

    it("nested blockquote", () => {
      const view = createView(">> nested", 0);
      expect(isAtParagraphLineStart(view)).toBe(false);
      view.destroy();
    });

    it("indented blockquote", () => {
      const view = createView("  > indented quote", 0);
      expect(isAtParagraphLineStart(view)).toBe(false);
      view.destroy();
    });
  });

  describe("returns false for horizontal rules", () => {
    it.each([
      { doc: "---", label: "dashes" },
      { doc: "***", label: "asterisks" },
      { doc: "___", label: "underscores" },
      { doc: "- - -", label: "spaced dashes" },
    ])("horizontal rule ($label)", ({ doc }) => {
      const view = createView(doc, 0);
      expect(isAtParagraphLineStart(view)).toBe(false);
      view.destroy();
    });
  });

  describe("handles text before cursor as whitespace", () => {
    it("only whitespace before cursor on line still counts as line start", () => {
      const doc = "  paragraph text";
      const view = createView(doc, 2); // after two spaces, before "paragraph"
      // textBeforeCursor = "  " which trims to "", so is at "line start"
      expect(isAtParagraphLineStart(view)).toBe(true);
      view.destroy();
    });
  });

  describe("returns false for table lines (line 63)", () => {
    it("cursor at start of a table cell line returns false", () => {
      // A markdown table — getSourceTableInfo returns non-null, so returns false
      const doc = "| Column A | Column B |\n| --- | --- |\n| cell 1 | cell 2 |";
      // Cursor at start of first table row (position 0)
      const view = createView(doc, 0);
      expect(isAtParagraphLineStart(view)).toBe(false);
      view.destroy();
    });
  });

  describe("returns false for code fence content (line 68)", () => {
    it("cursor inside a code fence block returns false", () => {
      // Cursor is inside the content of a code fence
      const doc = "```\nsome code here\n```";
      // Position 4 is inside "some code here"
      const view = createView(doc, 4);
      expect(isAtParagraphLineStart(view)).toBe(false);
      view.destroy();
    });
  });
});
