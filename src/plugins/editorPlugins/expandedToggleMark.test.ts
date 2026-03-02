/**
 * Tests for expandedToggleMark — mark toggling with word expansion,
 * opposing marks, and edge cases.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Schema } from "@tiptap/pm/model";
import { EditorState, TextSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

// Mock the dependencies
const mockFindMarkRange = vi.fn(() => null);
const mockFindAnyMarkRangeAtCursor = vi.fn(() => null);
const mockFindWordAtCursor = vi.fn(() => null);

vi.mock("@/plugins/syntaxReveal/marks", () => ({
  findMarkRange: (...args: unknown[]) => mockFindMarkRange(...args),
  findAnyMarkRangeAtCursor: (...args: unknown[]) => mockFindAnyMarkRangeAtCursor(...args),
  findWordAtCursor: (...args: unknown[]) => mockFindWordAtCursor(...args),
}));

vi.mock("@/plugins/multiCursor", () => ({
  MultiSelection: class MultiSelection {},
}));

import { expandedToggleMark } from "./expandedToggleMark";

// Minimal schema with marks for testing
const schema = new Schema({
  nodes: {
    doc: { content: "paragraph+" },
    paragraph: { content: "text*", group: "block" },
    text: { inline: true },
  },
  marks: {
    bold: {},
    italic: {},
    code: {},
    strike: {},
    underline: {},
    highlight: {},
    subscript: { excludes: "superscript" },
    superscript: { excludes: "subscript" },
  },
});

function createState(text: string, from?: number, to?: number): EditorState {
  const doc = schema.node("doc", null, [
    schema.node("paragraph", null, text ? [schema.text(text)] : []),
  ]);
  const state = EditorState.create({ doc, schema });
  if (from !== undefined && to !== undefined) {
    return state.apply(
      state.tr.setSelection(TextSelection.create(state.doc, from, to))
    );
  }
  return state;
}

function createView(state: EditorState): EditorView {
  const dispatched: { tr: unknown }[] = [];
  return {
    state,
    dispatch: vi.fn((tr) => {
      dispatched.push({ tr });
    }),
  } as unknown as EditorView;
}

describe("expandedToggleMark", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMarkRange.mockReturnValue(null);
    mockFindAnyMarkRangeAtCursor.mockReturnValue(null);
    mockFindWordAtCursor.mockReturnValue(null);
  });

  it("returns false when mark type does not exist in schema", () => {
    const state = createState("hello");
    const view = createView(state);
    expect(expandedToggleMark(view, "nonexistent")).toBe(false);
  });

  describe("non-empty selection", () => {
    it("adds mark to selected range", () => {
      // "hello" with selection from pos 1 to 6 (the full word)
      const state = createState("hello", 1, 6);
      const view = createView(state);

      const result = expandedToggleMark(view, "bold");
      expect(result).toBe(true);
      expect(view.dispatch).toHaveBeenCalled();
    });

    it("removes mark from selected range if already present", () => {
      // Create a state with bold already applied
      const boldMark = schema.marks.bold.create();
      const doc = schema.node("doc", null, [
        schema.node("paragraph", null, [
          schema.text("hello", [boldMark]),
        ]),
      ]);
      let state = EditorState.create({ doc, schema });
      state = state.apply(
        state.tr.setSelection(TextSelection.create(state.doc, 1, 6))
      );
      const view = createView(state);

      const result = expandedToggleMark(view, "bold");
      expect(result).toBe(true);
      expect(view.dispatch).toHaveBeenCalled();
    });

    it("removes opposing mark (subscript/superscript) on selection", () => {
      const superMark = schema.marks.superscript.create();
      const doc = schema.node("doc", null, [
        schema.node("paragraph", null, [
          schema.text("hello", [superMark]),
        ]),
      ]);
      let state = EditorState.create({ doc, schema });
      state = state.apply(
        state.tr.setSelection(TextSelection.create(state.doc, 1, 6))
      );
      const view = createView(state);

      const result = expandedToggleMark(view, "subscript");
      expect(result).toBe(true);
      expect(view.dispatch).toHaveBeenCalled();
    });
  });

  describe("collapsed cursor — mark range found", () => {
    it("removes existing mark range at cursor", () => {
      const boldMark = schema.marks.bold.create();
      const doc = schema.node("doc", null, [
        schema.node("paragraph", null, [
          schema.text("hello", [boldMark]),
        ]),
      ]);
      const state = EditorState.create({ doc, schema });
      const view = createView(state);

      // findMarkRange returns a range covering the bold mark
      mockFindMarkRange.mockReturnValue({ from: 1, to: 6 });

      const result = expandedToggleMark(view, "bold");
      expect(result).toBe(true);
      expect(view.dispatch).toHaveBeenCalled();
    });
  });

  describe("collapsed cursor — no mark range, word found", () => {
    it("applies mark to word at cursor", () => {
      const state = createState("hello world");
      // Cursor at position 3 (inside "hello")
      const stateWithCursor = state.apply(
        state.tr.setSelection(TextSelection.create(state.doc, 3))
      );
      const view = createView(stateWithCursor);

      mockFindWordAtCursor.mockReturnValue({ from: 1, to: 6 });

      const result = expandedToggleMark(view, "bold");
      expect(result).toBe(true);
      expect(view.dispatch).toHaveBeenCalled();
    });

    it("removes mark from word if word already has the mark", () => {
      const boldMark = schema.marks.bold.create();
      const doc = schema.node("doc", null, [
        schema.node("paragraph", null, [
          schema.text("hello", [boldMark]),
          schema.text(" world"),
        ]),
      ]);
      let state = EditorState.create({ doc, schema });
      state = state.apply(
        state.tr.setSelection(TextSelection.create(state.doc, 3))
      );
      const view = createView(state);

      mockFindWordAtCursor.mockReturnValue({ from: 1, to: 6 });

      const result = expandedToggleMark(view, "bold");
      expect(result).toBe(true);
      expect(view.dispatch).toHaveBeenCalled();
    });
  });

  describe("collapsed cursor — no mark, no word (stored marks fallback)", () => {
    it("adds stored mark when no word found", () => {
      const state = createState("hello");
      const view = createView(state);

      const result = expandedToggleMark(view, "bold");
      expect(result).toBe(true);
      expect(view.dispatch).toHaveBeenCalled();
    });

    it("removes stored mark if already set", () => {
      const state = createState("hello");
      const boldMark = schema.marks.bold.create();
      const stateWithStoredMark = state.apply(
        state.tr.addStoredMark(boldMark)
      );
      const view = createView(stateWithStoredMark);

      const result = expandedToggleMark(view, "bold");
      expect(result).toBe(true);
      expect(view.dispatch).toHaveBeenCalled();
    });

    it("removes opposing stored mark (subscript removes superscript)", () => {
      const state = createState("hello");
      const superMark = schema.marks.superscript.create();
      const stateWithStoredMark = state.apply(
        state.tr.addStoredMark(superMark)
      );
      const view = createView(stateWithStoredMark);

      const result = expandedToggleMark(view, "subscript");
      expect(result).toBe(true);
      expect(view.dispatch).toHaveBeenCalled();
    });
  });

  describe("opposing marks", () => {
    it("subscript and superscript are opposing", () => {
      const state = createState("hello", 1, 6);
      const view = createView(state);

      const result = expandedToggleMark(view, "subscript");
      expect(result).toBe(true);
    });

    it("bold has no opposing mark", () => {
      const state = createState("hello", 1, 6);
      const view = createView(state);

      const result = expandedToggleMark(view, "bold");
      expect(result).toBe(true);
    });
  });

  describe("inherited mark range", () => {
    it("applies mark to inherited range when found", () => {
      const state = createState("hello");
      const view = createView(state);

      // No mark range for bold, but there's an inherited range (e.g., italic)
      mockFindAnyMarkRangeAtCursor.mockReturnValue({ from: 1, to: 6, isLink: false });

      const result = expandedToggleMark(view, "bold");
      expect(result).toBe(true);
      expect(view.dispatch).toHaveBeenCalled();
    });

    it("skips inherited range for code when range is a link", () => {
      const state = createState("hello");
      const view = createView(state);

      mockFindAnyMarkRangeAtCursor.mockReturnValue({ from: 1, to: 6, isLink: true });
      // Should fall through to word/stored marks
      const result = expandedToggleMark(view, "code");
      expect(result).toBe(true);
    });

    it("uses inherited range for non-code marks even when isLink", () => {
      const state = createState("hello");
      const view = createView(state);

      mockFindAnyMarkRangeAtCursor.mockReturnValue({ from: 1, to: 6, isLink: true });

      const result = expandedToggleMark(view, "bold");
      expect(result).toBe(true);
      expect(view.dispatch).toHaveBeenCalled();
    });
  });
});
