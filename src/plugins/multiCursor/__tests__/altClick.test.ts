import { describe, it, expect } from "vitest";
import { Schema } from "@tiptap/pm/model";
import { EditorState, TextSelection, SelectionRange } from "@tiptap/pm/state";
import { multiCursorPlugin } from "../multiCursorPlugin";
import { MultiSelection } from "../MultiSelection";
import {
  addCursorAtPosition,
  removeCursorAtPosition,
  toggleCursorAtPosition,
} from "../altClick";

// Simple schema for testing
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

function createState(
  text: string,
  selection?: { anchor: number; head: number }
) {
  const doc = createDoc(text);
  const state = EditorState.create({
    doc,
    schema,
    plugins: [multiCursorPlugin()],
  });

  if (selection) {
    const tr = state.tr.setSelection(
      TextSelection.create(doc, selection.anchor, selection.head)
    );
    return state.apply(tr);
  }

  return state;
}

function createMultiCursorState(
  text: string,
  positions: Array<{ from: number; to: number }>,
  primaryIndex = 0
) {
  const state = createState(text);
  const doc = state.doc;
  const ranges = positions.map((p) => {
    const $from = doc.resolve(p.from);
    const $to = doc.resolve(p.to);
    return new SelectionRange($from, $to);
  });
  const multiSel = new MultiSelection(ranges, primaryIndex);
  return state.apply(state.tr.setSelection(multiSel));
}

describe("altClick", () => {
  describe("addCursorAtPosition", () => {
    it("creates MultiSelection from single cursor", () => {
      const state = createState("hello world", { anchor: 1, head: 1 });
      const result = addCursorAtPosition(state, 7);

      expect(result).not.toBeNull();
      if (result) {
        const newState = state.apply(result);
        expect(newState.selection).toBeInstanceOf(MultiSelection);

        const multiSel = newState.selection as MultiSelection;
        expect(multiSel.ranges).toHaveLength(2);
        expect(multiSel.ranges[0].$from.pos).toBe(1);
        expect(multiSel.ranges[1].$from.pos).toBe(7);
      }
    });

    it("adds cursor to existing MultiSelection", () => {
      const state = createState("hello world");
      const doc = state.doc;
      const $pos1 = doc.resolve(1);
      const $pos2 = doc.resolve(4);

      const ranges = [
        new SelectionRange($pos1, $pos1),
        new SelectionRange($pos2, $pos2),
      ];
      const multiSel = new MultiSelection(ranges, 0);
      const stateWithMulti = state.apply(state.tr.setSelection(multiSel));

      const result = addCursorAtPosition(stateWithMulti, 7);

      expect(result).not.toBeNull();
      if (result) {
        const newState = stateWithMulti.apply(result);
        const newMultiSel = newState.selection as MultiSelection;
        expect(newMultiSel.ranges).toHaveLength(3);
      }
    });

    it("does not add duplicate cursor at same position", () => {
      const state = createState("hello world", { anchor: 1, head: 1 });
      const result = addCursorAtPosition(state, 1);

      // Should return null or not add duplicate
      if (result) {
        const newState = state.apply(result);
        if (newState.selection instanceof MultiSelection) {
          expect(newState.selection.ranges).toHaveLength(1);
        }
      }
    });

    it("sets new cursor as primary", () => {
      const state = createState("hello world", { anchor: 1, head: 1 });
      const result = addCursorAtPosition(state, 7);

      expect(result).not.toBeNull();
      if (result) {
        const newState = state.apply(result);
        const multiSel = newState.selection as MultiSelection;
        // New cursor at position 7 should be primary (last added)
        expect(multiSel.primaryIndex).toBe(1);
        expect(multiSel.ranges[multiSel.primaryIndex].$from.pos).toBe(7);
      }
    });

    it("works with existing selection (not just cursor)", () => {
      const state = createState("hello world", { anchor: 1, head: 6 });
      const result = addCursorAtPosition(state, 10);

      expect(result).not.toBeNull();
      if (result) {
        const newState = state.apply(result);
        expect(newState.selection).toBeInstanceOf(MultiSelection);

        const multiSel = newState.selection as MultiSelection;
        expect(multiSel.ranges).toHaveLength(2);
        // Original selection preserved
        expect(multiSel.ranges[0].$from.pos).toBe(1);
        expect(multiSel.ranges[0].$to.pos).toBe(6);
      }
    });

    it("returns null for negative position", () => {
      const state = createState("hello world", { anchor: 1, head: 1 });
      const result = addCursorAtPosition(state, -1);
      expect(result).toBeNull();
    });

    it("returns null for position beyond document", () => {
      const state = createState("hello world", { anchor: 1, head: 1 });
      const docSize = state.doc.content.size;
      const result = addCursorAtPosition(state, docSize + 10);
      expect(result).toBeNull();
    });

    it("sets existing cursor as primary when clicking on it in MultiSelection", () => {
      const state = createMultiCursorState(
        "hello world",
        [
          { from: 1, to: 1 },
          { from: 4, to: 4 },
          { from: 7, to: 7 },
        ],
        0
      );

      // Click on cursor at position 7 (index 2) while primary is 0
      const result = addCursorAtPosition(state, 7);
      expect(result).not.toBeNull();
      if (result) {
        const newState = state.apply(result);
        const multiSel = newState.selection as MultiSelection;
        // Should set index 2 as primary
        expect(multiSel.ranges[multiSel.primaryIndex].$from.pos).toBe(7);
      }
    });

    it("returns null when clicking on already-primary cursor in MultiSelection", () => {
      const state = createMultiCursorState(
        "hello world",
        [
          { from: 1, to: 1 },
          { from: 7, to: 7 },
        ],
        0
      );

      // Click on the primary cursor (position 1, index 0)
      const result = addCursorAtPosition(state, 1);
      expect(result).toBeNull();
    });

    it("snaps position to valid text selection for non-textblock positions", () => {
      // With our simple schema all positions are in textblocks,
      // but we can at least verify the function handles edge positions
      const state = createState("hello", { anchor: 1, head: 1 });
      // Position 0 is before the paragraph node
      const result = addCursorAtPosition(state, 0);
      // Should snap to a valid position
      if (result) {
        const newState = state.apply(result);
        expect(newState.selection).toBeInstanceOf(MultiSelection);
      }
    });
  });

  describe("removeCursorAtPosition", () => {
    it("removes cursor from MultiSelection", () => {
      const state = createState("hello world");
      const doc = state.doc;
      const $pos1 = doc.resolve(1);
      const $pos2 = doc.resolve(7);

      const ranges = [
        new SelectionRange($pos1, $pos1),
        new SelectionRange($pos2, $pos2),
      ];
      const multiSel = new MultiSelection(ranges, 0);
      const stateWithMulti = state.apply(state.tr.setSelection(multiSel));

      const result = removeCursorAtPosition(stateWithMulti, 7);

      expect(result).not.toBeNull();
      if (result) {
        const newState = stateWithMulti.apply(result);
        // Should collapse to single selection
        expect(newState.selection).not.toBeInstanceOf(MultiSelection);
        expect(newState.selection.from).toBe(1);
      }
    });

    it("collapses to TextSelection when one cursor remains", () => {
      const state = createState("hello world");
      const doc = state.doc;
      const $pos1 = doc.resolve(1);
      const $pos2 = doc.resolve(7);

      const ranges = [
        new SelectionRange($pos1, $pos1),
        new SelectionRange($pos2, $pos2),
      ];
      const multiSel = new MultiSelection(ranges, 1);
      const stateWithMulti = state.apply(state.tr.setSelection(multiSel));

      // Remove cursor at position 7 (which is primary)
      const result = removeCursorAtPosition(stateWithMulti, 7);

      expect(result).not.toBeNull();
      if (result) {
        const newState = stateWithMulti.apply(result);
        expect(newState.selection.from).toBe(1);
      }
    });

    it("returns null for non-MultiSelection", () => {
      const state = createState("hello world", { anchor: 1, head: 1 });
      const result = removeCursorAtPosition(state, 1);
      expect(result).toBeNull();
    });

    it("adjusts primaryIndex when removing cursor before primary", () => {
      const state = createState("hello world");
      const doc = state.doc;
      const $pos1 = doc.resolve(1);
      const $pos2 = doc.resolve(4);
      const $pos3 = doc.resolve(7);

      const ranges = [
        new SelectionRange($pos1, $pos1),
        new SelectionRange($pos2, $pos2),
        new SelectionRange($pos3, $pos3),
      ];
      const multiSel = new MultiSelection(ranges, 2); // primary at pos 7
      const stateWithMulti = state.apply(state.tr.setSelection(multiSel));

      // Remove cursor at position 1
      const result = removeCursorAtPosition(stateWithMulti, 1);

      expect(result).not.toBeNull();
      if (result) {
        const newState = stateWithMulti.apply(result);
        const newMultiSel = newState.selection as MultiSelection;
        expect(newMultiSel.ranges).toHaveLength(2);
        // Primary should still be at position 7
        expect(newMultiSel.ranges[newMultiSel.primaryIndex].$from.pos).toBe(7);
      }
    });

    it("returns null for position not in any range", () => {
      const state = createMultiCursorState("hello world", [
        { from: 1, to: 1 },
        { from: 7, to: 7 },
      ]);

      const result = removeCursorAtPosition(state, 4);
      expect(result).toBeNull();
    });

    it("removes cursor within a non-empty range (selection)", () => {
      const state = createMultiCursorState("hello world", [
        { from: 1, to: 6 },
        { from: 7, to: 12 },
      ]);

      // Position 3 is within the first range (1-6)
      const result = removeCursorAtPosition(state, 3);
      expect(result).not.toBeNull();
      if (result) {
        const newState = state.apply(result);
        // Should collapse to single selection since only one range remains
        expect(newState.selection).not.toBeInstanceOf(MultiSelection);
        expect(newState.selection.from).toBe(7);
        expect(newState.selection.to).toBe(12);
      }
    });

    it("sets primaryIndex to 0 when removing the primary cursor", () => {
      const state = createMultiCursorState(
        "hello world",
        [
          { from: 1, to: 1 },
          { from: 4, to: 4 },
          { from: 7, to: 7 },
        ],
        1
      );

      // Remove the primary (pos 4, index 1)
      const result = removeCursorAtPosition(state, 4);
      expect(result).not.toBeNull();
      if (result) {
        const newState = state.apply(result);
        const multiSel = newState.selection as MultiSelection;
        expect(multiSel.ranges).toHaveLength(2);
        // Primary should be 0 since the old primary was removed
        expect(multiSel.primaryIndex).toBe(0);
      }
    });

    it("returns null when trying to remove from empty ranges (should not happen)", () => {
      // Edge case: all cursors at the same position still results in > 0 ranges
      const state = createMultiCursorState("hello", [
        { from: 1, to: 1 },
        { from: 3, to: 3 },
      ]);

      // Position 5 is at the end, not in any cursor range
      const result = removeCursorAtPosition(state, 5);
      expect(result).toBeNull();
    });
  });

  describe("toggleCursorAtPosition", () => {
    it("adds cursor when no cursor exists at position", () => {
      const state = createState("hello world", { anchor: 1, head: 1 });
      const result = toggleCursorAtPosition(state, 7);

      expect(result).not.toBeNull();
      if (result) {
        const newState = state.apply(result);
        expect(newState.selection).toBeInstanceOf(MultiSelection);
        const multiSel = newState.selection as MultiSelection;
        expect(multiSel.ranges).toHaveLength(2);
      }
    });

    it("removes cursor when cursor exists at position in MultiSelection", () => {
      const state = createMultiCursorState("hello world", [
        { from: 1, to: 1 },
        { from: 4, to: 4 },
        { from: 7, to: 7 },
      ]);

      // Toggle at position 4 should remove it
      const result = toggleCursorAtPosition(state, 4);
      expect(result).not.toBeNull();
      if (result) {
        const newState = state.apply(result);
        const multiSel = newState.selection as MultiSelection;
        expect(multiSel.ranges).toHaveLength(2);
        // Position 4 should no longer be present
        const positions = multiSel.ranges.map((r) => r.$from.pos);
        expect(positions).not.toContain(4);
      }
    });

    it("adds cursor when only one cursor in MultiSelection and toggling existing pos", () => {
      // With only one range in MultiSelection, toggle should not remove (would leave 0 cursors)
      // Instead it should call addCursorAtPosition
      const state = createState("hello world", { anchor: 1, head: 1 });

      // First toggle adds a second cursor
      const result = toggleCursorAtPosition(state, 7);
      expect(result).not.toBeNull();
    });

    it("calls addCursorAtPosition for non-MultiSelection even when pos matches selection", () => {
      const state = createState("hello world", { anchor: 3, head: 3 });
      // Toggling at the same position as the single cursor
      const result = toggleCursorAtPosition(state, 3);

      // addCursorAtPosition returns null for same position, so toggle returns null
      expect(result).toBeNull();
    });

    it("removes cursor from range selection when toggling within it", () => {
      const state = createMultiCursorState("hello world", [
        { from: 1, to: 6 },
        { from: 7, to: 12 },
      ]);

      // Toggle at position 3, which is within the first range (1-6)
      const result = toggleCursorAtPosition(state, 3);
      expect(result).not.toBeNull();
      if (result) {
        const newState = state.apply(result);
        // Should remove the range containing position 3, leaving one range
        expect(newState.selection).not.toBeInstanceOf(MultiSelection);
      }
    });
  });

  describe("positionInRanges (tested indirectly)", () => {
    it("detects position at exact cursor (empty range)", () => {
      const state = createMultiCursorState("hello world", [
        { from: 1, to: 1 },
        { from: 7, to: 7 },
      ]);

      // removeCursorAtPosition uses positionInRanges internally
      const result = removeCursorAtPosition(state, 1);
      expect(result).not.toBeNull();
    });

    it("detects position within a non-empty range", () => {
      const state = createMultiCursorState("hello world", [
        { from: 1, to: 6 },
        { from: 7, to: 12 },
      ]);

      // Position 3 is within range [1, 6)
      const result = removeCursorAtPosition(state, 3);
      expect(result).not.toBeNull();
    });

    it("does not detect position at end of non-empty range", () => {
      const state = createMultiCursorState("hello world", [
        { from: 1, to: 6 },
        { from: 7, to: 12 },
      ]);

      // Position 6 is the `to` of the first range (exclusive in positionInRanges)
      // positionInRanges checks pos >= from && pos < to
      const result = removeCursorAtPosition(state, 6);
      // Position 6 is exactly at .to, so it should NOT be found
      expect(result).toBeNull();
    });

    it("does not detect position between ranges", () => {
      const state = createMultiCursorState("hello world test", [
        { from: 1, to: 3 },
        { from: 8, to: 10 },
      ]);

      const result = removeCursorAtPosition(state, 5);
      expect(result).toBeNull();
    });
  });

  describe("cursorIndexAtPosition (tested indirectly)", () => {
    it("finds exact cursor match to set as primary", () => {
      // In a MultiSelection, clicking on an existing cursor sets it as primary
      const state = createMultiCursorState(
        "hello world",
        [
          { from: 1, to: 1 },
          { from: 7, to: 7 },
        ],
        0
      );

      const result = addCursorAtPosition(state, 7);
      expect(result).not.toBeNull();
      if (result) {
        const newState = state.apply(result);
        const multiSel = newState.selection as MultiSelection;
        // Position 7 should be the primary
        expect(multiSel.ranges[multiSel.primaryIndex].$from.pos).toBe(7);
        // Still 2 ranges (no new one added)
        expect(multiSel.ranges).toHaveLength(2);
      }
    });

    it("does not match non-empty range as cursor", () => {
      // cursorIndexAtPosition only matches empty ranges (cursor positions)
      const state = createMultiCursorState("hello world", [
        { from: 1, to: 6 },
        { from: 7, to: 7 },
      ]);

      // Position 3 is within range [1,6] but it's not a cursor
      // addCursorAtPosition should add a new cursor at pos 3
      const result = addCursorAtPosition(state, 3);
      expect(result).not.toBeNull();
      if (result) {
        const newState = state.apply(result);
        const multiSel = newState.selection as MultiSelection;
        expect(multiSel.ranges.length).toBeGreaterThanOrEqual(3);
      }
    });
  });
});
