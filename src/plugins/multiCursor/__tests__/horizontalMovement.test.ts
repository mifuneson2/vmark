/**
 * Tests for horizontalMovement module
 *
 * Covers moveRangeHorizontally and handleMultiCursorHorizontal with
 * different units (char, word, line), extend mode, and backward selections.
 */

import { describe, it, expect } from "vitest";
import { Schema } from "@tiptap/pm/model";
import { EditorState, SelectionRange } from "@tiptap/pm/state";
import { multiCursorPlugin } from "../multiCursorPlugin";
import { MultiSelection } from "../MultiSelection";
import { handleMultiCursorHorizontal } from "../horizontalMovement";

const schema = new Schema({
  nodes: {
    doc: { content: "paragraph+" },
    paragraph: { content: "text*" },
    text: { inline: true },
  },
});

function createDoc(text: string) {
  return schema.node("doc", null, [
    schema.node("paragraph", null, text ? [schema.text(text)] : []),
  ]);
}

function createMultiState(
  text: string,
  ranges: Array<{ from: number; to: number }>,
  primaryIndex = 0,
  backward?: boolean[]
) {
  const doc = createDoc(text);
  const state = EditorState.create({
    doc,
    schema,
    plugins: [multiCursorPlugin()],
  });

  const selRanges = ranges.map((r) =>
    new SelectionRange(doc.resolve(r.from), doc.resolve(r.to))
  );
  const multiSel = new MultiSelection(selRanges, primaryIndex, backward);
  return state.apply(state.tr.setSelection(multiSel));
}

describe("handleMultiCursorHorizontal", () => {
  it("returns null for non-MultiSelection", () => {
    const state = EditorState.create({
      doc: createDoc("hello"),
      schema,
      plugins: [multiCursorPlugin()],
    });
    expect(handleMultiCursorHorizontal(state, "ArrowRight", false, "char")).toBeNull();
  });

  describe("char movement", () => {
    it("moves cursors right by one character", () => {
      const state = createMultiState("hello world", [
        { from: 1, to: 1 },
        { from: 7, to: 7 },
      ]);

      const tr = handleMultiCursorHorizontal(state, "ArrowRight", false, "char");
      expect(tr).not.toBeNull();

      if (tr) {
        const newState = state.apply(tr);
        const multiSel = newState.selection as MultiSelection;
        expect(multiSel.ranges[0].$from.pos).toBe(2);
        expect(multiSel.ranges[1].$from.pos).toBe(8);
      }
    });

    it("moves cursors left by one character", () => {
      const state = createMultiState("hello world", [
        { from: 3, to: 3 },
        { from: 9, to: 9 },
      ]);

      const tr = handleMultiCursorHorizontal(state, "ArrowLeft", false, "char");
      expect(tr).not.toBeNull();

      if (tr) {
        const newState = state.apply(tr);
        const multiSel = newState.selection as MultiSelection;
        expect(multiSel.ranges[0].$from.pos).toBe(2);
        expect(multiSel.ranges[1].$from.pos).toBe(8);
      }
    });

    it("collapses non-empty selection to start on ArrowLeft without extend", () => {
      const state = createMultiState("hello world", [
        { from: 1, to: 6 },  // "hello" selected
      ]);

      const tr = handleMultiCursorHorizontal(state, "ArrowLeft", false, "char");
      expect(tr).not.toBeNull();

      if (tr) {
        const newState = state.apply(tr);
        const multiSel = newState.selection as MultiSelection;
        // Should collapse to start of selection
        expect(multiSel.ranges[0].$from.pos).toBe(1);
        expect(multiSel.ranges[0].$to.pos).toBe(1);
      }
    });

    it("collapses non-empty selection to end on ArrowRight without extend", () => {
      const state = createMultiState("hello world", [
        { from: 1, to: 6 },  // "hello" selected
      ]);

      const tr = handleMultiCursorHorizontal(state, "ArrowRight", false, "char");
      expect(tr).not.toBeNull();

      if (tr) {
        const newState = state.apply(tr);
        const multiSel = newState.selection as MultiSelection;
        // Should collapse to end of selection
        expect(multiSel.ranges[0].$from.pos).toBe(6);
        expect(multiSel.ranges[0].$to.pos).toBe(6);
      }
    });

    it("extends selection right with extend=true", () => {
      const state = createMultiState("hello world", [
        { from: 3, to: 3 },
      ]);

      const tr = handleMultiCursorHorizontal(state, "ArrowRight", true, "char");
      expect(tr).not.toBeNull();

      if (tr) {
        const newState = state.apply(tr);
        const multiSel = newState.selection as MultiSelection;
        // Should extend selection from 3 to 4
        expect(multiSel.ranges[0].$from.pos).toBe(3);
        expect(multiSel.ranges[0].$to.pos).toBe(4);
      }
    });
  });

  describe("word movement", () => {
    it("moves cursor to next word boundary", () => {
      const state = createMultiState("hello world", [
        { from: 3, to: 3 },
      ]);

      const tr = handleMultiCursorHorizontal(state, "ArrowRight", false, "word");
      expect(tr).not.toBeNull();

      if (tr) {
        const newState = state.apply(tr);
        const multiSel = newState.selection as MultiSelection;
        // Should move to end of "hello" or start of "world"
        expect(multiSel.ranges[0].$from.pos).toBeGreaterThan(3);
      }
    });

    it("moves cursor to previous word boundary", () => {
      const state = createMultiState("hello world", [
        { from: 9, to: 9 },
      ]);

      const tr = handleMultiCursorHorizontal(state, "ArrowLeft", false, "word");
      expect(tr).not.toBeNull();

      if (tr) {
        const newState = state.apply(tr);
        const multiSel = newState.selection as MultiSelection;
        expect(multiSel.ranges[0].$from.pos).toBeLessThan(9);
      }
    });
  });

  describe("line movement", () => {
    it("moves cursor to start of line", () => {
      const state = createMultiState("hello world", [
        { from: 6, to: 6 },
      ]);

      const tr = handleMultiCursorHorizontal(state, "ArrowLeft", false, "line");
      expect(tr).not.toBeNull();

      if (tr) {
        const newState = state.apply(tr);
        const multiSel = newState.selection as MultiSelection;
        expect(multiSel.ranges[0].$from.pos).toBe(1);
      }
    });

    it("moves cursor to end of line", () => {
      const state = createMultiState("hello world", [
        { from: 3, to: 3 },
      ]);

      const tr = handleMultiCursorHorizontal(state, "ArrowRight", false, "line");
      expect(tr).not.toBeNull();

      if (tr) {
        const newState = state.apply(tr);
        const multiSel = newState.selection as MultiSelection;
        expect(multiSel.ranges[0].$from.pos).toBe(12); // end of "hello world"
      }
    });

    it("extends selection to line start", () => {
      const state = createMultiState("hello world", [
        { from: 6, to: 6 },
      ]);

      const tr = handleMultiCursorHorizontal(state, "ArrowLeft", true, "line");
      expect(tr).not.toBeNull();

      if (tr) {
        const newState = state.apply(tr);
        const multiSel = newState.selection as MultiSelection;
        // Selection should extend from pos 6 to start of line
        expect(multiSel.ranges[0].$from.pos).toBe(1);
        expect(multiSel.ranges[0].$to.pos).toBe(6);
      }
    });
  });

  describe("backward selections", () => {
    it("handles backward selection flags correctly", () => {
      // Create a state with a backward selection (anchor > head)
      const state = createMultiState(
        "hello world",
        [{ from: 1, to: 6 }],
        0,
        [true]  // backward flag
      );

      const tr = handleMultiCursorHorizontal(state, "ArrowRight", true, "char");
      expect(tr).not.toBeNull();
    });
  });
});
