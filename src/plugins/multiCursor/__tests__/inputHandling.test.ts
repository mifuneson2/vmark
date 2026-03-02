import { describe, it, expect } from "vitest";
import { MultiSelection } from "../MultiSelection";
import {
  handleMultiCursorInput,
  handleMultiCursorBackspace,
  handleMultiCursorDelete,
  handleMultiCursorArrow,
  handleMultiCursorKeyDown,
} from "../inputHandling";
import { createState, createMultiCursorState } from "./testHelpers";

describe("inputHandling", () => {
  describe("handleMultiCursorInput", () => {
    it("inserts text at all cursor positions", () => {
      // "hello world" with cursors at positions 1 and 7
      const state = createMultiCursorState("hello world", [
        { from: 1, to: 1 },
        { from: 7, to: 7 },
      ]);

      const result = handleMultiCursorInput(state, "X");
      expect(result).not.toBeNull();

      if (result) {
        const newState = state.apply(result);
        // Should be "Xhello Xworld"
        expect(newState.doc.textContent).toBe("Xhello Xworld");
      }
    });

    it("replaces selections with typed text", () => {
      // "hello world" with "hello" selected (1-6) and "world" selected (7-12)
      const state = createMultiCursorState("hello world", [
        { from: 1, to: 6 },
        { from: 7, to: 12 },
      ]);

      const result = handleMultiCursorInput(state, "X");
      expect(result).not.toBeNull();

      if (result) {
        const newState = state.apply(result);
        // Should be "X X"
        expect(newState.doc.textContent).toBe("X X");
      }
    });

    it("handles mixed cursors and selections", () => {
      // "abc def ghi" with cursor at 1 and "def" selected (5-8)
      const state = createMultiCursorState("abc def ghi", [
        { from: 1, to: 1 },
        { from: 5, to: 8 },
      ]);

      const result = handleMultiCursorInput(state, "X");
      expect(result).not.toBeNull();

      if (result) {
        const newState = state.apply(result);
        // Should be "Xabc X ghi"
        expect(newState.doc.textContent).toBe("Xabc X ghi");
      }
    });

    it("maintains MultiSelection after input", () => {
      const state = createMultiCursorState("hello world", [
        { from: 1, to: 1 },
        { from: 7, to: 7 },
      ]);

      const result = handleMultiCursorInput(state, "X");
      expect(result).not.toBeNull();

      if (result) {
        const newState = state.apply(result);
        expect(newState.selection).toBeInstanceOf(MultiSelection);
        const multiSel = newState.selection as MultiSelection;
        expect(multiSel.ranges).toHaveLength(2);
      }
    });

    it("returns null for non-MultiSelection", () => {
      const state = createState("hello world");
      const result = handleMultiCursorInput(state, "X");
      expect(result).toBeNull();
    });

    it("returns null when isComposing option is true", () => {
      const state = createMultiCursorState("hello world", [
        { from: 1, to: 1 },
        { from: 7, to: 7 },
      ]);

      const result = handleMultiCursorInput(state, "X", { isComposing: true });
      expect(result).toBeNull();
    });

    it("inserts multi-character text at all cursors", () => {
      const state = createMultiCursorState("hello world", [
        { from: 1, to: 1 },
        { from: 7, to: 7 },
      ]);

      const result = handleMultiCursorInput(state, "XY");
      expect(result).not.toBeNull();

      if (result) {
        const newState = state.apply(result);
        expect(newState.doc.textContent).toBe("XYhello XYworld");
      }
    });

    it("sets addToHistory to true on the transaction", () => {
      const state = createMultiCursorState("hello", [
        { from: 1, to: 1 },
        { from: 3, to: 3 },
      ]);

      const result = handleMultiCursorInput(state, "a");
      expect(result).not.toBeNull();
      expect(result!.getMeta("addToHistory")).toBe(true);
    });

    it("handles adjacent cursors without overlapping", () => {
      const state = createMultiCursorState("abcd", [
        { from: 2, to: 2 },
        { from: 3, to: 3 },
      ]);

      const result = handleMultiCursorInput(state, "X");
      expect(result).not.toBeNull();
      if (result) {
        const newState = state.apply(result);
        expect(newState.doc.textContent).toBe("aXbXcd");
      }
    });
  });

  describe("handleMultiCursorBackspace", () => {
    it("deletes character before each cursor", () => {
      // "hello world" with cursors at positions 2 and 8
      const state = createMultiCursorState("hello world", [
        { from: 2, to: 2 },
        { from: 8, to: 8 },
      ]);

      const result = handleMultiCursorBackspace(state);
      expect(result).not.toBeNull();

      if (result) {
        const newState = state.apply(result);
        // Should be "ello orld"
        expect(newState.doc.textContent).toBe("ello orld");
      }
    });

    it("deletes selected text", () => {
      // "hello world" with "hello" selected
      const state = createMultiCursorState("hello world", [
        { from: 1, to: 6 },
        { from: 7, to: 12 },
      ]);

      const result = handleMultiCursorBackspace(state);
      expect(result).not.toBeNull();

      if (result) {
        const newState = state.apply(result);
        // Should be " " (just the space)
        expect(newState.doc.textContent).toBe(" ");
      }
    });

    it("handles cursor at start of document (no-op for that cursor)", () => {
      const state = createMultiCursorState("hello", [
        { from: 1, to: 1 }, // at start
        { from: 3, to: 3 },
      ]);

      const result = handleMultiCursorBackspace(state);
      expect(result).not.toBeNull();

      if (result) {
        const newState = state.apply(result);
        // Only second cursor should delete
        expect(newState.doc.textContent).toBe("hllo");
      }
    });

    it("returns null for non-MultiSelection", () => {
      const state = createState("hello world");
      const result = handleMultiCursorBackspace(state);
      expect(result).toBeNull();
    });

    it("maintains MultiSelection after backspace", () => {
      const state = createMultiCursorState("hello world", [
        { from: 2, to: 2 },
        { from: 8, to: 8 },
      ]);

      const result = handleMultiCursorBackspace(state);
      expect(result).not.toBeNull();
      if (result) {
        const newState = state.apply(result);
        expect(newState.selection).toBeInstanceOf(MultiSelection);
      }
    });

    it("sets addToHistory to true", () => {
      const state = createMultiCursorState("hello", [
        { from: 2, to: 2 },
        { from: 4, to: 4 },
      ]);

      const result = handleMultiCursorBackspace(state);
      expect(result).not.toBeNull();
      expect(result!.getMeta("addToHistory")).toBe(true);
    });
  });

  describe("handleMultiCursorDelete", () => {
    it("deletes character after each cursor", () => {
      // "hello world" with cursors at positions 1 and 7
      const state = createMultiCursorState("hello world", [
        { from: 1, to: 1 },
        { from: 7, to: 7 },
      ]);

      const result = handleMultiCursorDelete(state);
      expect(result).not.toBeNull();

      if (result) {
        const newState = state.apply(result);
        // Should be "ello orld"
        expect(newState.doc.textContent).toBe("ello orld");
      }
    });

    it("deletes selected text", () => {
      const state = createMultiCursorState("hello world", [
        { from: 1, to: 6 },
        { from: 7, to: 12 },
      ]);

      const result = handleMultiCursorDelete(state);
      expect(result).not.toBeNull();

      if (result) {
        const newState = state.apply(result);
        expect(newState.doc.textContent).toBe(" ");
      }
    });

    it("handles cursor at end of document (no-op for that cursor)", () => {
      const state = createMultiCursorState("hello", [
        { from: 3, to: 3 },
        { from: 6, to: 6 }, // at end
      ]);

      const result = handleMultiCursorDelete(state);
      expect(result).not.toBeNull();

      if (result) {
        const newState = state.apply(result);
        // Only first cursor should delete
        expect(newState.doc.textContent).toBe("helo");
      }
    });

    it("returns null for non-MultiSelection", () => {
      const state = createState("hello world");
      const result = handleMultiCursorDelete(state);
      expect(result).toBeNull();
    });

    it("maintains MultiSelection after delete", () => {
      const state = createMultiCursorState("hello world", [
        { from: 1, to: 1 },
        { from: 7, to: 7 },
      ]);

      const result = handleMultiCursorDelete(state);
      expect(result).not.toBeNull();
      if (result) {
        const newState = state.apply(result);
        expect(newState.selection).toBeInstanceOf(MultiSelection);
      }
    });

    it("sets addToHistory to true", () => {
      const state = createMultiCursorState("hello", [
        { from: 1, to: 1 },
        { from: 3, to: 3 },
      ]);

      const result = handleMultiCursorDelete(state);
      expect(result).not.toBeNull();
      expect(result!.getMeta("addToHistory")).toBe(true);
    });
  });

  describe("handleMultiCursorArrow", () => {
    it("returns null for non-MultiSelection", () => {
      const state = createState("hello");
      const result = handleMultiCursorArrow(state, "ArrowRight", false);
      expect(result).toBeNull();
    });

    it("moves all cursors right", () => {
      const state = createMultiCursorState("hello", [
        { from: 1, to: 1 },
        { from: 3, to: 3 },
      ]);

      const result = handleMultiCursorArrow(state, "ArrowRight", false);
      expect(result).not.toBeNull();
      if (result) {
        const newState = state.apply(result);
        const multiSel = newState.selection as MultiSelection;
        expect(multiSel.ranges[0].$from.pos).toBe(2);
        expect(multiSel.ranges[1].$from.pos).toBe(4);
      }
    });

    it("moves all cursors left", () => {
      const state = createMultiCursorState("hello", [
        { from: 2, to: 2 },
        { from: 4, to: 4 },
      ]);

      const result = handleMultiCursorArrow(state, "ArrowLeft", false);
      expect(result).not.toBeNull();
      if (result) {
        const newState = state.apply(result);
        const multiSel = newState.selection as MultiSelection;
        expect(multiSel.ranges[0].$from.pos).toBe(1);
        expect(multiSel.ranges[1].$from.pos).toBe(3);
      }
    });

    it("moves cursors down", () => {
      const state = createMultiCursorState("hello", [
        { from: 2, to: 2 },
        { from: 4, to: 4 },
      ]);

      const result = handleMultiCursorArrow(state, "ArrowDown", false);
      expect(result).not.toBeNull();
      // ArrowDown in a single paragraph may not move, but it should not crash
    });

    it("moves cursors up", () => {
      const state = createMultiCursorState("hello", [
        { from: 2, to: 2 },
        { from: 4, to: 4 },
      ]);

      const result = handleMultiCursorArrow(state, "ArrowUp", false);
      // ArrowUp in a single paragraph may not move
      // The function should handle this gracefully
    });

    it("collapses non-empty selection to start on ArrowLeft without extend", () => {
      const state = createMultiCursorState("hello world", [
        { from: 1, to: 6 },
        { from: 7, to: 12 },
      ]);

      const result = handleMultiCursorArrow(state, "ArrowLeft", false);
      expect(result).not.toBeNull();
      if (result) {
        const newState = state.apply(result);
        const multiSel = newState.selection as MultiSelection;
        // Should collapse to the from position
        expect(multiSel.ranges[0].$from.pos).toBe(
          multiSel.ranges[0].$to.pos
        );
        expect(multiSel.ranges[0].$from.pos).toBe(1);
      }
    });

    it("collapses non-empty selection to end on ArrowRight without extend", () => {
      const state = createMultiCursorState("hello world", [
        { from: 1, to: 6 },
        { from: 7, to: 12 },
      ]);

      const result = handleMultiCursorArrow(state, "ArrowRight", false);
      expect(result).not.toBeNull();
      if (result) {
        const newState = state.apply(result);
        const multiSel = newState.selection as MultiSelection;
        expect(multiSel.ranges[0].$from.pos).toBe(
          multiSel.ranges[0].$to.pos
        );
        expect(multiSel.ranges[0].$from.pos).toBe(6);
      }
    });

    it("extends selection with Shift+ArrowRight", () => {
      const state = createMultiCursorState("hello", [
        { from: 1, to: 1 },
        { from: 3, to: 3 },
      ]);

      const result = handleMultiCursorArrow(state, "ArrowRight", true);
      expect(result).not.toBeNull();
      if (result) {
        const newState = state.apply(result);
        const multiSel = newState.selection as MultiSelection;
        // Each cursor should now select one character to the right
        expect(multiSel.ranges[0].$from.pos).toBe(1);
        expect(multiSel.ranges[0].$to.pos).toBe(2);
      }
    });

    it("extends selection with Shift+ArrowLeft", () => {
      const state = createMultiCursorState("hello", [
        { from: 2, to: 2 },
        { from: 5, to: 5 },
      ]);

      const result = handleMultiCursorArrow(state, "ArrowLeft", true);
      expect(result).not.toBeNull();
      if (result) {
        const newState = state.apply(result);
        const multiSel = newState.selection as MultiSelection;
        expect(multiSel.ranges[0].$from.pos).toBe(1);
        expect(multiSel.ranges[0].$to.pos).toBe(2);
      }
    });
  });

  describe("handleMultiCursorKeyDown (arrows)", () => {
    it("moves all cursors with ArrowRight", () => {
      const state = createMultiCursorState("hello", [
        { from: 2, to: 2 },
        { from: 4, to: 4 },
      ]);

      const tr = handleMultiCursorKeyDown(state, {
        key: "ArrowRight",
        shiftKey: false,
        isComposing: false,
        keyCode: 0,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
      });

      expect(tr).not.toBeNull();
      if (tr) {
        const newState = state.apply(tr);
        const multiSel = newState.selection as MultiSelection;
        expect(multiSel.ranges[0].$from.pos).toBe(3);
        expect(multiSel.ranges[1].$from.pos).toBe(5);
      }
    });

    it("extends selections with Shift+ArrowRight", () => {
      const state = createMultiCursorState("hello", [
        { from: 2, to: 2 },
        { from: 4, to: 4 },
      ]);

      const tr = handleMultiCursorKeyDown(state, {
        key: "ArrowRight",
        shiftKey: true,
        isComposing: false,
        keyCode: 0,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
      });

      expect(tr).not.toBeNull();
      if (tr) {
        const newState = state.apply(tr);
        const multiSel = newState.selection as MultiSelection;
        expect(multiSel.ranges[0].$from.pos).toBe(2);
        expect(multiSel.ranges[0].$to.pos).toBe(3);
      }
    });

    it("moves cursors by word with Option/Alt+ArrowRight", () => {
      const state = createMultiCursorState("hello world", [
        { from: 2, to: 2 },
        { from: 8, to: 8 },
      ]);

      const tr = handleMultiCursorKeyDown(state, {
        key: "ArrowRight",
        shiftKey: false,
        isComposing: false,
        keyCode: 0,
        altKey: true,
        ctrlKey: false,
        metaKey: false,
      });

      expect(tr).not.toBeNull();
      if (tr) {
        const newState = state.apply(tr);
        const multiSel = newState.selection as MultiSelection;
        expect(multiSel.ranges[0].$from.pos).toBe(6);
        expect(multiSel.ranges[1].$from.pos).toBe(12);
      }
    });

    it("moves cursors to line end with Cmd+ArrowRight", () => {
      const state = createMultiCursorState("hello world", [
        { from: 2, to: 2 },
        { from: 8, to: 8 },
      ]);

      const tr = handleMultiCursorKeyDown(state, {
        key: "ArrowRight",
        shiftKey: false,
        isComposing: false,
        keyCode: 0,
        altKey: false,
        ctrlKey: false,
        metaKey: true,
      });

      expect(tr).not.toBeNull();
      if (tr) {
        const newState = state.apply(tr);
        const multiSel = newState.selection as MultiSelection;
        expect(multiSel.ranges).toHaveLength(1);
        expect(multiSel.ranges[0].$from.pos).toBe(12);
      }
    });

    it("moves cursors by word with Ctrl+ArrowRight", () => {
      const state = createMultiCursorState("hello world", [
        { from: 1, to: 1 },
        { from: 7, to: 7 },
      ]);

      const tr = handleMultiCursorKeyDown(state, {
        key: "ArrowRight",
        shiftKey: false,
        isComposing: false,
        keyCode: 0,
        altKey: false,
        ctrlKey: true,
        metaKey: false,
      });

      expect(tr).not.toBeNull();
      if (tr) {
        const newState = state.apply(tr);
        const multiSel = newState.selection as MultiSelection;
        // Should move by word
        expect(multiSel.ranges[0].$from.pos).toBe(6);
        expect(multiSel.ranges[1].$from.pos).toBe(12);
      }
    });

    it("moves cursors with ArrowLeft", () => {
      const state = createMultiCursorState("hello", [
        { from: 3, to: 3 },
        { from: 5, to: 5 },
      ]);

      const tr = handleMultiCursorKeyDown(state, {
        key: "ArrowLeft",
        shiftKey: false,
        isComposing: false,
        keyCode: 0,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
      });

      expect(tr).not.toBeNull();
      if (tr) {
        const newState = state.apply(tr);
        const multiSel = newState.selection as MultiSelection;
        expect(multiSel.ranges[0].$from.pos).toBe(2);
        expect(multiSel.ranges[1].$from.pos).toBe(4);
      }
    });

    it("moves cursors to line start with Cmd+ArrowLeft", () => {
      const state = createMultiCursorState("hello world", [
        { from: 4, to: 4 },
        { from: 10, to: 10 },
      ]);

      const tr = handleMultiCursorKeyDown(state, {
        key: "ArrowLeft",
        shiftKey: false,
        isComposing: false,
        keyCode: 0,
        altKey: false,
        ctrlKey: false,
        metaKey: true,
      });

      expect(tr).not.toBeNull();
      if (tr) {
        const newState = state.apply(tr);
        const multiSel = newState.selection as MultiSelection;
        // Both should move to line start (pos 1), merging into one
        expect(multiSel.ranges).toHaveLength(1);
        expect(multiSel.ranges[0].$from.pos).toBe(1);
      }
    });

    it("returns null for non-MultiSelection", () => {
      const state = createState("hello world");
      const result = handleMultiCursorKeyDown(state, {
        key: "ArrowRight",
        shiftKey: false,
        isComposing: false,
        keyCode: 0,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
      });
      expect(result).toBeNull();
    });

    it("returns null for IME key events (isComposing)", () => {
      const state = createMultiCursorState("hello", [
        { from: 1, to: 1 },
        { from: 3, to: 3 },
      ]);

      const result = handleMultiCursorKeyDown(state, {
        key: "Process",
        shiftKey: false,
        isComposing: true,
        keyCode: 229,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
      });
      expect(result).toBeNull();
    });

    it("returns null for IME key events (keyCode 229)", () => {
      const state = createMultiCursorState("hello", [
        { from: 1, to: 1 },
        { from: 3, to: 3 },
      ]);

      const result = handleMultiCursorKeyDown(state, {
        key: "a",
        shiftKey: false,
        isComposing: false,
        keyCode: 229,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
      });
      expect(result).toBeNull();
    });

    it("handles Backspace key", () => {
      const state = createMultiCursorState("hello", [
        { from: 2, to: 2 },
        { from: 4, to: 4 },
      ]);

      const result = handleMultiCursorKeyDown(state, {
        key: "Backspace",
        shiftKey: false,
        isComposing: false,
        keyCode: 0,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
      });

      expect(result).not.toBeNull();
      if (result) {
        const newState = state.apply(result);
        expect(newState.doc.textContent).toBe("elo");
      }
    });

    it("handles Delete key", () => {
      const state = createMultiCursorState("hello", [
        { from: 1, to: 1 },
        { from: 3, to: 3 },
      ]);

      const result = handleMultiCursorKeyDown(state, {
        key: "Delete",
        shiftKey: false,
        isComposing: false,
        keyCode: 0,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
      });

      expect(result).not.toBeNull();
      if (result) {
        const newState = state.apply(result);
        expect(newState.doc.textContent).toBe("elo");
      }
    });

    it("handles Enter key (bare, no modifiers)", () => {
      const state = createMultiCursorState("hello world", [
        { from: 3, to: 3 },
        { from: 8, to: 8 },
      ]);

      const result = handleMultiCursorKeyDown(state, {
        key: "Enter",
        shiftKey: false,
        isComposing: false,
        keyCode: 0,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
      });

      expect(result).not.toBeNull();
    });

    it("returns null for Shift+Enter (modified Enter)", () => {
      const state = createMultiCursorState("hello", [
        { from: 2, to: 2 },
        { from: 4, to: 4 },
      ]);

      const result = handleMultiCursorKeyDown(state, {
        key: "Enter",
        shiftKey: true,
        isComposing: false,
        keyCode: 0,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
      });

      expect(result).toBeNull();
    });

    it("returns null for Alt+Enter", () => {
      const state = createMultiCursorState("hello", [
        { from: 2, to: 2 },
        { from: 4, to: 4 },
      ]);

      const result = handleMultiCursorKeyDown(state, {
        key: "Enter",
        shiftKey: false,
        isComposing: false,
        keyCode: 0,
        altKey: true,
        ctrlKey: false,
        metaKey: false,
      });

      expect(result).toBeNull();
    });

    it("returns null for Ctrl+Enter", () => {
      const state = createMultiCursorState("hello", [
        { from: 2, to: 2 },
        { from: 4, to: 4 },
      ]);

      const result = handleMultiCursorKeyDown(state, {
        key: "Enter",
        shiftKey: false,
        isComposing: false,
        keyCode: 0,
        altKey: false,
        ctrlKey: true,
        metaKey: false,
      });

      expect(result).toBeNull();
    });

    it("returns null for Meta+Enter", () => {
      const state = createMultiCursorState("hello", [
        { from: 2, to: 2 },
        { from: 4, to: 4 },
      ]);

      const result = handleMultiCursorKeyDown(state, {
        key: "Enter",
        shiftKey: false,
        isComposing: false,
        keyCode: 0,
        altKey: false,
        ctrlKey: false,
        metaKey: true,
      });

      expect(result).toBeNull();
    });

    it("returns null for ArrowDown with modifier keys", () => {
      const state = createMultiCursorState("hello", [
        { from: 2, to: 2 },
        { from: 4, to: 4 },
      ]);

      // ArrowDown with metaKey should return null (fall through)
      const result = handleMultiCursorKeyDown(state, {
        key: "ArrowDown",
        shiftKey: false,
        isComposing: false,
        keyCode: 0,
        altKey: false,
        ctrlKey: false,
        metaKey: true,
      });

      expect(result).toBeNull();
    });

    it("returns null for ArrowUp with altKey", () => {
      const state = createMultiCursorState("hello", [
        { from: 2, to: 2 },
        { from: 4, to: 4 },
      ]);

      const result = handleMultiCursorKeyDown(state, {
        key: "ArrowUp",
        shiftKey: false,
        isComposing: false,
        keyCode: 0,
        altKey: true,
        ctrlKey: false,
        metaKey: false,
      });

      expect(result).toBeNull();
    });

    it("returns null for ArrowDown with ctrlKey", () => {
      const state = createMultiCursorState("hello", [
        { from: 2, to: 2 },
        { from: 4, to: 4 },
      ]);

      const result = handleMultiCursorKeyDown(state, {
        key: "ArrowDown",
        shiftKey: false,
        isComposing: false,
        keyCode: 0,
        altKey: false,
        ctrlKey: true,
        metaKey: false,
      });

      expect(result).toBeNull();
    });

    it("handles ArrowUp without modifiers", () => {
      const state = createMultiCursorState("hello", [
        { from: 2, to: 2 },
        { from: 4, to: 4 },
      ]);

      const result = handleMultiCursorKeyDown(state, {
        key: "ArrowUp",
        shiftKey: false,
        isComposing: false,
        keyCode: 0,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
      });

      // May return null or a transaction depending on document structure
      // Either way should not throw
    });

    it("handles ArrowDown with Shift (extend)", () => {
      const state = createMultiCursorState("hello", [
        { from: 2, to: 2 },
        { from: 4, to: 4 },
      ]);

      const result = handleMultiCursorKeyDown(state, {
        key: "ArrowDown",
        shiftKey: true,
        isComposing: false,
        keyCode: 0,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
      });

      // Should not throw, returns either null or transaction
    });

    it("returns null for default/unknown key", () => {
      const state = createMultiCursorState("hello", [
        { from: 2, to: 2 },
        { from: 4, to: 4 },
      ]);

      const result = handleMultiCursorKeyDown(state, {
        key: "Tab",
        shiftKey: false,
        isComposing: false,
        keyCode: 0,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
      });

      expect(result).toBeNull();
    });

    it("returns null for alphabetic key (not handled)", () => {
      const state = createMultiCursorState("hello", [
        { from: 2, to: 2 },
        { from: 4, to: 4 },
      ]);

      const result = handleMultiCursorKeyDown(state, {
        key: "a",
        shiftKey: false,
        isComposing: false,
        keyCode: 65,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
      });

      expect(result).toBeNull();
    });
  });

  describe("handleMultiCursorArrow — edge cases (backward flags, findFrom null)", () => {
    it("handles ArrowLeft at start of document (no movement possible)", () => {
      // Cursors at start of paragraph — ArrowLeft with findFrom may return null
      const state = createMultiCursorState("hello", [
        { from: 1, to: 1 },
        { from: 3, to: 3 },
      ]);

      const result = handleMultiCursorArrow(state, "ArrowLeft", false);
      expect(result).not.toBeNull();
      if (result) {
        const newState = state.apply(result);
        const multiSel = newState.selection as MultiSelection;
        // First cursor can't move before pos 1 in the paragraph
        // It either stays or moves to a valid position
        expect(multiSel.ranges.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("handles ArrowRight at end of document (findFrom may return null)", () => {
      const state = createMultiCursorState("hi", [
        { from: 3, to: 3 }, // end of text in paragraph
      ]);

      // Single range in MultiSelection
      const result = handleMultiCursorArrow(state, "ArrowRight", false);
      // May return null or a transaction that doesn't move
    });

    it("handles Shift+ArrowLeft extending selection backward", () => {
      const state = createMultiCursorState("hello world", [
        { from: 3, to: 3 },
        { from: 8, to: 8 },
      ]);

      const result = handleMultiCursorArrow(state, "ArrowLeft", true);
      expect(result).not.toBeNull();
      if (result) {
        const newState = state.apply(result);
        const multiSel = newState.selection as MultiSelection;
        // Each cursor should extend left
        expect(multiSel.ranges[0].$from.pos).toBeLessThanOrEqual(3);
      }
    });

    it("handles Shift+ArrowUp extending selection (vertical)", () => {
      const state = createMultiCursorState("hello world", [
        { from: 3, to: 3 },
        { from: 8, to: 8 },
      ]);

      // ArrowUp in a single paragraph document — may not find anything
      const result = handleMultiCursorArrow(state, "ArrowUp", true);
      // Should not crash
    });

    it("handles ArrowDown collapsing non-empty selection", () => {
      const state = createMultiCursorState("hello world", [
        { from: 1, to: 6 },
        { from: 7, to: 12 },
      ]);

      const result = handleMultiCursorArrow(state, "ArrowDown", false);
      expect(result).not.toBeNull();
      if (result) {
        const newState = state.apply(result);
        const multiSel = newState.selection as MultiSelection;
        // Should collapse to end of each selection (dir = 1)
        expect(multiSel.ranges[0].$from.pos).toBe(multiSel.ranges[0].$to.pos);
      }
    });

    it("handles ArrowUp collapsing non-empty selection", () => {
      const state = createMultiCursorState("hello world", [
        { from: 1, to: 6 },
        { from: 7, to: 12 },
      ]);

      const result = handleMultiCursorArrow(state, "ArrowUp", false);
      expect(result).not.toBeNull();
      if (result) {
        const newState = state.apply(result);
        const multiSel = newState.selection as MultiSelection;
        // Should collapse to start of each selection (dir = -1)
        expect(multiSel.ranges[0].$from.pos).toBe(multiSel.ranges[0].$to.pos);
      }
    });

    it("derives backward flags correctly for extended selection (ArrowLeft + Shift)", () => {
      // Start with cursors, extend left → selections should have backward flag set
      const state = createMultiCursorState("abcdefghij", [
        { from: 5, to: 5 },
        { from: 8, to: 8 },
      ]);

      const result = handleMultiCursorArrow(state, "ArrowLeft", true);
      expect(result).not.toBeNull();
      if (result) {
        const newState = state.apply(result);
        const multiSel = newState.selection as MultiSelection;
        // Selections should be backward since we extended left
        // (anchor at 5, head at 4 → backward)
        expect(multiSel.ranges[0].$from.pos).toBeLessThan(5);
      }
    });
  });
});
