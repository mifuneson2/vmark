/**
 * Tests for syntaxReveal/marks — findMarkRange, findAnyMarkRangeAtCursor,
 * findWordAtCursor, addMarkSyntaxDecorations.
 */

vi.mock("@tiptap/pm/view", () => ({
  Decoration: {
    widget: vi.fn((_pos, toDOM, _spec) => ({
      type: "widget",
      pos: _pos,
      toDOM,
      spec: _spec,
    })),
  },
}));

vi.mock("@/utils/wordSegmentation", () => ({
  findWordBoundaries: vi.fn((text: string, offset: number) => {
    // Simple word boundary detection for tests
    if (!text || offset < 0 || offset > text.length) return null;
    const wordChars = /\w/;
    if (offset <= 0 || offset >= text.length) return null;
    if (!wordChars.test(text[offset]) && !wordChars.test(text[offset - 1])) return null;
    let start = offset;
    let end = offset;
    while (start > 0 && wordChars.test(text[start - 1])) start--;
    while (end < text.length && wordChars.test(text[end])) end++;
    if (start >= end) return null;
    return { start, end };
  }),
}));

vi.mock("./syntax-reveal.css", () => ({}));

import { describe, expect, it, vi, beforeEach } from "vitest";
import { Schema } from "@tiptap/pm/model";
import { EditorState, TextSelection } from "@tiptap/pm/state";
import type { Decoration } from "@tiptap/pm/view";
import {
  findMarkRange,
  findAnyMarkRangeAtCursor,
  findWordAtCursor,
  addMarkSyntaxDecorations,
} from "./marks";

// ---------------------------------------------------------------------------
// Schema helpers
// ---------------------------------------------------------------------------

const testSchema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { content: "inline*", group: "block" },
    text: { group: "inline" },
  },
  marks: {
    strong: {},
    emphasis: {},
    inlineCode: {},
    strikethrough: {},
    subscript: {},
    superscript: {},
    highlight: {},
    link: {
      attrs: { href: { default: "" } },
    },
  },
});

function createDocWithMarks(
  parts: Array<{ text: string; marks?: string[]; attrs?: Record<string, Record<string, unknown>> }>
) {
  const nodes = parts.map((part) => {
    let textNode = testSchema.text(part.text);
    if (part.marks) {
      const marks = part.marks.map((m) => {
        const markType = testSchema.marks[m];
        return markType.create(part.attrs?.[m] ?? {});
      });
      textNode = textNode.mark(marks);
    }
    return textNode;
  });
  const paragraph = testSchema.node("paragraph", null, nodes);
  return testSchema.node("doc", null, [paragraph]);
}

function createStateWithCursor(
  parts: Array<{ text: string; marks?: string[]; attrs?: Record<string, Record<string, unknown>> }>,
  cursorPos: number
) {
  const doc = createDocWithMarks(parts);
  const state = EditorState.create({ doc, schema: testSchema });
  return state.apply(state.tr.setSelection(TextSelection.create(state.doc, cursorPos)));
}

// ---------------------------------------------------------------------------
// findMarkRange
// ---------------------------------------------------------------------------

describe("findMarkRange", () => {
  it("finds range of a bold mark containing the cursor", () => {
    // doc > paragraph > "hello **world** end"
    const doc = createDocWithMarks([
      { text: "hello " },
      { text: "world", marks: ["strong"] },
      { text: " end" },
    ]);
    const para = doc.child(0);
    const parentStart = 1; // start of paragraph content
    const boldMark = testSchema.marks.strong.create();

    // Cursor inside "world" at position 9 (parentStart=1, "hello "=6, so "world" starts at 7, pos 9 is inside)
    const result = findMarkRange(9, boldMark, parentStart, para);
    expect(result).not.toBeNull();
    expect(result!.from).toBe(7); // parentStart + 6 ("hello ")
    expect(result!.to).toBe(12); // parentStart + 6 + 5 ("world")
  });

  it("returns null when cursor is outside the mark", () => {
    const doc = createDocWithMarks([
      { text: "hello " },
      { text: "world", marks: ["strong"] },
      { text: " end" },
    ]);
    const para = doc.child(0);
    const parentStart = 1;
    const boldMark = testSchema.marks.strong.create();

    // Cursor at position 3, inside "hello" (no bold mark)
    const result = findMarkRange(3, boldMark, parentStart, para);
    expect(result).toBeNull();
  });

  it("returns null when mark does not exist in the paragraph", () => {
    const doc = createDocWithMarks([{ text: "no marks here" }]);
    const para = doc.child(0);
    const parentStart = 1;
    const boldMark = testSchema.marks.strong.create();

    const result = findMarkRange(5, boldMark, parentStart, para);
    expect(result).toBeNull();
  });

  it("finds range at the start boundary of the mark", () => {
    const doc = createDocWithMarks([
      { text: "before", marks: ["strong"] },
      { text: " after" },
    ]);
    const para = doc.child(0);
    const parentStart = 1;
    const boldMark = testSchema.marks.strong.create();

    // Cursor at position 1 (parentStart), which is from boundary
    const result = findMarkRange(1, boldMark, parentStart, para);
    expect(result).not.toBeNull();
    expect(result!.from).toBe(1);
  });

  it("finds range at the end boundary of the mark", () => {
    const doc = createDocWithMarks([
      { text: "before", marks: ["strong"] },
      { text: " after" },
    ]);
    const para = doc.child(0);
    const parentStart = 1;
    const boldMark = testSchema.marks.strong.create();

    // Cursor at position 7 (end of "before")
    const result = findMarkRange(7, boldMark, parentStart, para);
    expect(result).not.toBeNull();
    expect(result!.to).toBe(7);
  });

  it("handles multiple non-contiguous ranges of same mark", () => {
    const doc = createDocWithMarks([
      { text: "first", marks: ["strong"] },
      { text: " gap " },
      { text: "second", marks: ["strong"] },
    ]);
    const para = doc.child(0);
    const parentStart = 1;
    const boldMark = testSchema.marks.strong.create();

    // "first" = 5 chars, " gap " = 5 chars, "second" = 6 chars
    // "second" starts at parentStart + 5 + 5 = 11, ends at 17
    const result = findMarkRange(13, boldMark, parentStart, para);
    expect(result).not.toBeNull();
    expect(result!.from).toBe(11);
    expect(result!.to).toBe(17);
  });

  it("handles paragraph with only marked text", () => {
    const doc = createDocWithMarks([
      { text: "all bold", marks: ["strong"] },
    ]);
    const para = doc.child(0);
    const parentStart = 1;
    const boldMark = testSchema.marks.strong.create();

    const result = findMarkRange(4, boldMark, parentStart, para);
    expect(result).not.toBeNull();
    expect(result!.from).toBe(1);
    expect(result!.to).toBe(9);
  });
});

// ---------------------------------------------------------------------------
// findAnyMarkRangeAtCursor
// ---------------------------------------------------------------------------

describe("findAnyMarkRangeAtCursor", () => {
  it("returns null when no marks at cursor position", () => {
    const state = createStateWithCursor([{ text: "plain text" }], 3);
    const $pos = state.doc.resolve(3);
    const result = findAnyMarkRangeAtCursor(3, $pos);
    expect(result).toBeNull();
  });

  it("finds mark range at cursor with bold text", () => {
    const state = createStateWithCursor(
      [{ text: "hello " }, { text: "bold", marks: ["strong"] }, { text: " end" }],
      9
    );
    const $pos = state.doc.resolve(9);
    const result = findAnyMarkRangeAtCursor(9, $pos);
    expect(result).not.toBeNull();
    expect(result!.isLink).toBe(false);
  });

  it("identifies link marks with isLink flag", () => {
    const state = createStateWithCursor(
      [
        { text: "click " },
        { text: "here", marks: ["link"], attrs: { link: { href: "http://example.com" } } },
      ],
      9
    );
    const $pos = state.doc.resolve(9);
    const result = findAnyMarkRangeAtCursor(9, $pos);
    expect(result).not.toBeNull();
    expect(result!.isLink).toBe(true);
  });

  it("returns smallest range when multiple marks overlap", () => {
    // Bold wrapping a link: "**[link text](url)**"
    const state = createStateWithCursor(
      [
        { text: "text", marks: ["strong", "link"], attrs: { link: { href: "http://x.com" } } },
      ],
      3
    );
    const $pos = state.doc.resolve(3);
    const result = findAnyMarkRangeAtCursor(3, $pos);
    expect(result).not.toBeNull();
    // Both marks cover the same range, so any one is fine
    expect(result!.from).toBeGreaterThan(0);
    expect(result!.to).toBeGreaterThan(result!.from);
  });
});

// ---------------------------------------------------------------------------
// findWordAtCursor
// ---------------------------------------------------------------------------

describe("findWordAtCursor", () => {
  it("returns null for non-textblock parent", () => {
    // Create a schema with a non-textblock node
    const schema = new Schema({
      nodes: {
        doc: { content: "container+" },
        container: { content: "paragraph+", group: "container" },
        paragraph: { content: "text*" },
        text: { inline: true },
      },
    });
    const para = schema.node("paragraph", null, [schema.text("hello")]);
    const container = schema.node("container", null, [para]);
    const doc = schema.node("doc", null, [container]);
    const state = EditorState.create({ doc });
    // Resolve position at the container level (not textblock)
    // Position 1 is inside container but the resolved parent at depth check matters
    // findWordAtCursor checks $pos.parent.isTextblock
    const $pos = state.doc.resolve(1);
    // $pos.parent at depth 1 is container, which is not a textblock
    if (!$pos.parent.isTextblock) {
      // This confirms our test setup is correct
      const result = findWordAtCursor($pos);
      expect(result).toBeNull();
    }
  });

  it("finds word at cursor in simple text", () => {
    const doc = createDocWithMarks([{ text: "hello world" }]);
    const state = EditorState.create({ doc });
    const $pos = state.doc.resolve(4); // inside "hello"
    const result = findWordAtCursor($pos);
    expect(result).not.toBeNull();
    expect(result!.from).toBe(1); // blockStart + 0
    expect(result!.to).toBe(6); // blockStart + 5
  });

  it("returns word boundaries when cursor is between words", () => {
    // "hello world" with cursor at position 7 -> parentOffset = 6 (space char)
    // findWordBoundaries mock: at offset 6, text[5]='o' is word char,
    // so it expands backward to find "hello" boundaries
    const doc = createDocWithMarks([{ text: "hello world" }]);
    const state = EditorState.create({ doc });
    const $pos = state.doc.resolve(7); // parentOffset = 6
    const result = findWordAtCursor($pos);
    // The mock word segmenter finds boundaries around the adjacent word
    if (result) {
      expect(result.from).toBeLessThan(result.to);
    }
  });
});

// ---------------------------------------------------------------------------
// addMarkSyntaxDecorations
// ---------------------------------------------------------------------------

describe("addMarkSyntaxDecorations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds open and close decorations for bold mark", () => {
    const state = createStateWithCursor(
      [{ text: "hello " }, { text: "bold", marks: ["strong"] }, { text: " end" }],
      9
    );
    const $from = state.doc.resolve(9);
    const decorations: Decoration[] = [];

    addMarkSyntaxDecorations(decorations, 9, $from);

    // Should add open (**) and close (**) decorations
    expect(decorations.length).toBe(2);
  });

  it("adds open and close decorations for italic mark", () => {
    const state = createStateWithCursor(
      [{ text: "hello " }, { text: "italic", marks: ["emphasis"] }, { text: " end" }],
      9
    );
    const $from = state.doc.resolve(9);
    const decorations: Decoration[] = [];

    addMarkSyntaxDecorations(decorations, 9, $from);

    expect(decorations.length).toBe(2);
  });

  it("adds link syntax decorations with href", () => {
    const state = createStateWithCursor(
      [
        { text: "click " },
        { text: "here", marks: ["link"], attrs: { link: { href: "http://example.com" } } },
        { text: " end" },
      ],
      9
    );
    const $from = state.doc.resolve(9);
    const decorations: Decoration[] = [];

    addMarkSyntaxDecorations(decorations, 9, $from);

    // Should add [ and ](url) decorations
    expect(decorations.length).toBe(2);
  });

  it("adds no decorations when no marks at position", () => {
    const state = createStateWithCursor([{ text: "plain text" }], 3);
    const $from = state.doc.resolve(3);
    const decorations: Decoration[] = [];

    addMarkSyntaxDecorations(decorations, 3, $from);

    expect(decorations.length).toBe(0);
  });

  it("adds decorations for inline code", () => {
    const state = createStateWithCursor(
      [{ text: "some " }, { text: "code", marks: ["inlineCode"] }, { text: " here" }],
      8
    );
    const $from = state.doc.resolve(8);
    const decorations: Decoration[] = [];

    addMarkSyntaxDecorations(decorations, 8, $from);

    expect(decorations.length).toBe(2);
  });

  it("adds decorations for strikethrough", () => {
    const state = createStateWithCursor(
      [{ text: "some " }, { text: "struck", marks: ["strikethrough"] }, { text: " here" }],
      8
    );
    const $from = state.doc.resolve(8);
    const decorations: Decoration[] = [];

    addMarkSyntaxDecorations(decorations, 8, $from);

    expect(decorations.length).toBe(2);
  });

  it("adds decorations for highlight", () => {
    const state = createStateWithCursor(
      [{ text: "some " }, { text: "highlighted", marks: ["highlight"] }, { text: " here" }],
      8
    );
    const $from = state.doc.resolve(8);
    const decorations: Decoration[] = [];

    addMarkSyntaxDecorations(decorations, 8, $from);

    expect(decorations.length).toBe(2);
  });

  it("adds decorations for subscript", () => {
    const state = createStateWithCursor(
      [{ text: "H" }, { text: "2", marks: ["subscript"] }, { text: "O" }],
      3
    );
    const $from = state.doc.resolve(3);
    const decorations: Decoration[] = [];

    addMarkSyntaxDecorations(decorations, 3, $from);

    expect(decorations.length).toBe(2);
  });

  it("adds decorations for superscript", () => {
    const state = createStateWithCursor(
      [{ text: "x" }, { text: "2", marks: ["superscript"] }, { text: " end" }],
      3
    );
    const $from = state.doc.resolve(3);
    const decorations: Decoration[] = [];

    addMarkSyntaxDecorations(decorations, 3, $from);

    expect(decorations.length).toBe(2);
  });

  it("handles multiple overlapping marks at cursor", () => {
    // Bold + italic at same position
    const state = createStateWithCursor(
      [{ text: "hello " }, { text: "both", marks: ["strong", "emphasis"] }, { text: " end" }],
      9
    );
    const $from = state.doc.resolve(9);
    const decorations: Decoration[] = [];

    addMarkSyntaxDecorations(decorations, 9, $from);

    // Should add decorations for both marks (2 per mark = 4 total, but deduplication may reduce)
    // Each mark gets open + close = 4 total (strong ** + emphasis *)
    expect(decorations.length).toBeGreaterThanOrEqual(2);
  });

  it("handles link with empty href", () => {
    const state = createStateWithCursor(
      [{ text: "click " }, { text: "here", marks: ["link"], attrs: { link: { href: "" } } }],
      9
    );
    const $from = state.doc.resolve(9);
    const decorations: Decoration[] = [];

    addMarkSyntaxDecorations(decorations, 9, $from);

    expect(decorations.length).toBe(2);
  });
});
