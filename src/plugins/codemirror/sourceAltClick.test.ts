/**
 * Tests for Alt+Click Cursor Management (Source Mode)
 *
 * Tests add/remove/toggle cursor at position and Alt+Click handling.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { EditorState, EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

vi.mock("@/plugins/sourceContextDetection/codeFenceDetection", () => ({
  getCodeFenceInfo: vi.fn(() => null),
}));

import { getCodeFenceInfo } from "@/plugins/sourceContextDetection/codeFenceDetection";
import {
  addCursorAtPosition,
  removeCursorAtPosition,
  toggleCursorAtPosition,
  handleAltClick,
} from "./sourceAltClick";

const views: EditorView[] = [];

afterEach(() => {
  views.forEach((v) => v.destroy());
  views.length = 0;
});

/** Multi-cursor requires this facet to be enabled in CodeMirror. */
const multiCursorExtension = EditorState.allowMultipleSelections.of(true);

function createView(content: string, anchor: number): EditorView {
  const state = EditorState.create({
    doc: content,
    selection: { anchor },
    extensions: [multiCursorExtension],
  });
  const container = document.createElement("div");
  document.body.appendChild(container);
  const view = new EditorView({ state, parent: container });
  views.push(view);
  return view;
}

function createMultiCursorView(
  content: string,
  positions: number[],
  mainIndex = 0
): EditorView {
  const ranges = positions.map((p) => EditorSelection.cursor(p));
  const state = EditorState.create({
    doc: content,
    selection: EditorSelection.create(ranges, mainIndex),
    extensions: [multiCursorExtension],
  });
  const container = document.createElement("div");
  document.body.appendChild(container);
  const view = new EditorView({ state, parent: container });
  views.push(view);
  return view;
}

describe("addCursorAtPosition", () => {
  it("adds a cursor at the given position", () => {
    const view = createView("hello world", 0);
    const result = addCursorAtPosition(view, 5);

    expect(result).toBe(true);
    expect(view.state.selection.ranges).toHaveLength(2);
  });

  it("returns false for negative position", () => {
    const view = createView("hello", 0);
    expect(addCursorAtPosition(view, -1)).toBe(false);
  });

  it("returns false for position beyond document length", () => {
    const view = createView("hello", 0);
    expect(addCursorAtPosition(view, 100)).toBe(false);
  });

  it("makes existing cursor primary if position already has cursor", () => {
    const view = createMultiCursorView("hello world", [0, 5], 0);
    const result = addCursorAtPosition(view, 5);

    expect(result).toBe(true);
    expect(view.state.selection.mainIndex).toBe(1);
  });

  it("returns false if position is already the primary cursor", () => {
    const view = createView("hello", 3);
    expect(addCursorAtPosition(view, 3)).toBe(false);
  });

  it("sorts ranges by position after adding", () => {
    const view = createView("hello world", 10);
    addCursorAtPosition(view, 2);

    const ranges = view.state.selection.ranges;
    expect(ranges[0].from).toBeLessThanOrEqual(ranges[1].from);
  });

  it("adds cursor at position 0 (document start)", () => {
    const view = createView("hello", 5);
    const result = addCursorAtPosition(view, 0);

    expect(result).toBe(true);
    expect(view.state.selection.ranges).toHaveLength(2);
  });

  it("adds cursor at end of document", () => {
    const view = createView("hello", 0);
    const result = addCursorAtPosition(view, 5);

    expect(result).toBe(true);
    expect(view.state.selection.ranges).toHaveLength(2);
  });

  it("handles empty document", () => {
    const view = createView("", 0);
    // Position 0 is the only cursor, adding at 0 is already primary
    expect(addCursorAtPosition(view, 0)).toBe(false);
  });
});

describe("removeCursorAtPosition", () => {
  it("removes cursor at the given position", () => {
    const view = createMultiCursorView("hello world", [0, 5, 10]);
    const result = removeCursorAtPosition(view, 5);

    expect(result).toBe(true);
    expect(view.state.selection.ranges).toHaveLength(2);
  });

  it("returns false when only one cursor exists", () => {
    const view = createView("hello", 0);
    expect(removeCursorAtPosition(view, 0)).toBe(false);
  });

  it("returns false when position has no cursor", () => {
    const view = createMultiCursorView("hello world", [0, 5]);
    expect(removeCursorAtPosition(view, 3)).toBe(false);
  });

  it("adjusts primary index when removing cursor before primary", () => {
    const view = createMultiCursorView("hello world", [0, 5, 10], 2);
    removeCursorAtPosition(view, 0);

    // Primary was at index 2, removed index 0, so new primary should be 1
    expect(view.state.selection.ranges).toHaveLength(2);
  });

  it("resets primary to 0 when removing the primary cursor", () => {
    const view = createMultiCursorView("hello world", [0, 5, 10], 1);
    removeCursorAtPosition(view, 5);

    expect(view.state.selection.ranges).toHaveLength(2);
    expect(view.state.selection.mainIndex).toBe(0);
  });

  it("removes cursor within a selection range", () => {
    // Create a view with a selection range (not just cursor)
    const ranges = [
      EditorSelection.range(0, 5),
      EditorSelection.cursor(10),
    ];
    const state = EditorState.create({
      doc: "hello world",
      selection: EditorSelection.create(ranges, 0),
      extensions: [multiCursorExtension],
    });
    const container = document.createElement("div");
    document.body.appendChild(container);
    const view = new EditorView({ state, parent: container });
    views.push(view);

    // Position 3 is within range [0,5)
    const result = removeCursorAtPosition(view, 3);
    expect(result).toBe(true);
    expect(view.state.selection.ranges).toHaveLength(1);
  });
});

describe("toggleCursorAtPosition", () => {
  it("adds cursor when position has no cursor", () => {
    const view = createView("hello world", 0);
    const result = toggleCursorAtPosition(view, 5);

    expect(result).toBe(true);
    expect(view.state.selection.ranges).toHaveLength(2);
  });

  it("removes cursor when position already has a cursor and multiple exist", () => {
    const view = createMultiCursorView("hello world", [0, 5, 10]);
    const result = toggleCursorAtPosition(view, 5);

    expect(result).toBe(true);
    expect(view.state.selection.ranges).toHaveLength(2);
  });

  it("does not remove cursor when it is the only one", () => {
    const view = createView("hello", 3);
    // Toggling at position 3 with only one cursor — should try to add (but it's already there)
    const result = toggleCursorAtPosition(view, 3);
    // addCursorAtPosition returns false because it's already primary
    expect(result).toBe(false);
  });
});

describe("addCursorAtPosition — code fence boundaries", () => {
  it("rejects cursor outside code fence when primary is inside", () => {
    vi.mocked(getCodeFenceInfo).mockReturnValue({
      fenceStartPos: 4,
      endLine: 3,
    } as ReturnType<typeof getCodeFenceInfo>);

    const content = "abc\n```\ncode\n```\nxyz";
    const view = createView(content, 8); // inside code
    const result = addCursorAtPosition(view, 0); // outside code fence

    expect(result).toBe(false);
    vi.mocked(getCodeFenceInfo).mockReturnValue(null);
  });

  it("allows cursor inside code fence when primary is inside same fence", () => {
    vi.mocked(getCodeFenceInfo).mockReturnValue({
      fenceStartPos: 4,
      endLine: 3,
    } as ReturnType<typeof getCodeFenceInfo>);

    const content = "abc\n```\ncode here\n```\nxyz";
    const view = createView(content, 8); // inside code
    const result = addCursorAtPosition(view, 10); // also inside code

    expect(result).toBe(true);
    vi.mocked(getCodeFenceInfo).mockReturnValue(null);
  });
});

describe("removeCursorAtPosition — non-cursor range, pos outside range", () => {
  it("returns false when pos is outside a non-cursor selection range", () => {
    // positionInRanges line 49 else-if branch: range.from !== range.to but pos NOT in range
    const ranges = [
      EditorSelection.range(0, 5),
      EditorSelection.cursor(10),
    ];
    const state = EditorState.create({
      doc: "hello world",
      selection: EditorSelection.create(ranges, 0),
      extensions: [multiCursorExtension],
    });
    const container = document.createElement("div");
    document.body.appendChild(container);
    const view = new EditorView({ state, parent: container });
    views.push(view);

    // pos=7 is OUTSIDE the range [0,5) and not at cursor 10 → positionInRanges returns -1
    const result = removeCursorAtPosition(view, 7);
    expect(result).toBe(false);
  });
});

describe("handleAltClick", () => {
  it("returns false when altKey is not set", () => {
    const view = createView("hello", 0);
    const event = new MouseEvent("mousedown", {
      altKey: false,
      clientX: 0,
      clientY: 0,
    });

    expect(handleAltClick(view, event)).toBe(false);
  });

  it("returns false when ctrlKey is also pressed", () => {
    const view = createView("hello", 0);
    const event = new MouseEvent("mousedown", {
      altKey: true,
      ctrlKey: true,
      clientX: 0,
      clientY: 0,
    });

    expect(handleAltClick(view, event)).toBe(false);
  });

  it("returns false when metaKey is also pressed", () => {
    const view = createView("hello", 0);
    const event = new MouseEvent("mousedown", {
      altKey: true,
      metaKey: true,
      clientX: 0,
      clientY: 0,
    });

    expect(handleAltClick(view, event)).toBe(false);
  });

  it("returns false when posAtCoords returns null", () => {
    const view = createView("hello", 0);
    vi.spyOn(view, "posAtCoords").mockReturnValue(null);

    const event = new MouseEvent("mousedown", {
      altKey: true,
      clientX: 9999,
      clientY: 9999,
    });

    expect(handleAltClick(view, event)).toBe(false);
  });

  it("toggles cursor when alt-click at valid position", () => {
    const view = createView("hello world", 0);
    vi.spyOn(view, "posAtCoords").mockReturnValue(5);

    const event = new MouseEvent("mousedown", {
      altKey: true,
      clientX: 50,
      clientY: 10,
      bubbles: true,
      cancelable: true,
    });

    const result = handleAltClick(view, event);

    expect(result).toBe(true);
    expect(view.state.selection.ranges).toHaveLength(2);
  });

  it("calls preventDefault on handled event", () => {
    const view = createView("hello world", 0);
    vi.spyOn(view, "posAtCoords").mockReturnValue(5);

    const event = new MouseEvent("mousedown", {
      altKey: true,
      clientX: 50,
      clientY: 10,
      bubbles: true,
      cancelable: true,
    });
    const preventSpy = vi.spyOn(event, "preventDefault");

    handleAltClick(view, event);

    expect(preventSpy).toHaveBeenCalled();
  });

  it("focuses the view after handling", () => {
    const view = createView("hello world", 0);
    vi.spyOn(view, "posAtCoords").mockReturnValue(5);
    const focusSpy = vi.spyOn(view, "focus");

    const event = new MouseEvent("mousedown", {
      altKey: true,
      clientX: 50,
      clientY: 10,
    });

    handleAltClick(view, event);

    expect(focusSpy).toHaveBeenCalled();
  });

  it("returns false and does not call preventDefault when toggleCursor returns false", () => {
    // Line 226 false branch: handled=false, so if(handled) block is skipped
    // toggleCursorAtPosition returns false when clicking on the only existing cursor
    const view = createView("hello", 3);
    // Mock posAtCoords to return position 3 — the primary cursor is already there
    vi.spyOn(view, "posAtCoords").mockReturnValue(3);
    const focusSpy = vi.spyOn(view, "focus");

    const event = new MouseEvent("mousedown", {
      altKey: true,
      clientX: 30,
      clientY: 10,
      bubbles: true,
      cancelable: true,
    });
    const preventSpy = vi.spyOn(event, "preventDefault");

    const result = handleAltClick(view, event);

    // toggleCursorAtPosition(view, 3) → addCursorAtPosition(view, 3) → false (already primary)
    expect(result).toBe(false);
    expect(preventSpy).not.toHaveBeenCalled();
    expect(focusSpy).not.toHaveBeenCalled();
  });
});
