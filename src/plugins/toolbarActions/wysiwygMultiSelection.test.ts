import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@tiptap/pm/state", () => ({
  TextSelection: {
    create: vi.fn((_doc: unknown, from: number, to: number) => ({
      type: "TextSelection",
      from,
      to,
    })),
  },
}));

const mockHandleToBulletList = vi.fn();
const mockHandleToOrderedList = vi.fn();
const mockHandleListIndent = vi.fn();
const mockHandleListOutdent = vi.fn();
const mockHandleRemoveList = vi.fn();
const mockHandleBlockquoteNest = vi.fn();
const mockHandleBlockquoteUnnest = vi.fn();
const mockHandleRemoveBlockquote = vi.fn();

vi.mock("@/plugins/formatToolbar/nodeActions.tiptap", () => ({
  handleToBulletList: (...args: unknown[]) => mockHandleToBulletList(...args),
  handleToOrderedList: (...args: unknown[]) => mockHandleToOrderedList(...args),
  handleListIndent: (...args: unknown[]) => mockHandleListIndent(...args),
  handleListOutdent: (...args: unknown[]) => mockHandleListOutdent(...args),
  handleRemoveList: (...args: unknown[]) => mockHandleRemoveList(...args),
  handleBlockquoteNest: (...args: unknown[]) => mockHandleBlockquoteNest(...args),
  handleBlockquoteUnnest: (...args: unknown[]) => mockHandleBlockquoteUnnest(...args),
  handleRemoveBlockquote: (...args: unknown[]) => mockHandleRemoveBlockquote(...args),
}));

vi.mock("@/plugins/taskToggle/tiptapTaskListUtils", () => ({
  convertSelectionToTaskList: vi.fn(),
}));

// We need to mock MultiSelection as a class that instanceof checks work with
const { MockMultiSelection } = vi.hoisted(() => {
  const MockMultiSelection = class MockMultiSelection {};
  return { MockMultiSelection };
});

vi.mock("@/plugins/multiCursor", () => ({
  MultiSelection: MockMultiSelection,
}));

import {
  applyMultiSelectionHeading,
  applyMultiSelectionListAction,
  applyMultiSelectionBlockquoteAction,
} from "./wysiwygMultiSelection";
import { convertSelectionToTaskList } from "@/plugins/taskToggle/tiptapTaskListUtils";
import type { Editor as TiptapEditor } from "@tiptap/core";
import type { EditorView } from "@tiptap/pm/view";

function createMultiSelectionView(ranges: Array<{ from: number; to: number }>): EditorView {
  const selectionRanges = ranges.map((r) => ({
    $from: { pos: r.from },
    $to: { pos: r.to },
  }));

  // Create a selection object that passes instanceof MultiSelection check
  const selection = Object.create(MockMultiSelection.prototype);
  selection.ranges = selectionRanges;

  const dispatch = vi.fn();

  return {
    state: {
      selection,
      doc: { nodeSize: 200 },
      tr: {
        setSelection: vi.fn().mockReturnThis(),
      },
    },
    dispatch,
  } as unknown as EditorView;
}

function createNonMultiView(): EditorView {
  return {
    state: {
      selection: { from: 5, to: 10 }, // Plain selection, not MultiSelection
      doc: { nodeSize: 200 },
      tr: { setSelection: vi.fn().mockReturnThis() },
    },
    dispatch: vi.fn(),
  } as unknown as EditorView;
}

describe("applyMultiSelectionHeading", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when selection is not MultiSelection", () => {
    const view = createNonMultiView();
    const editor = { chain: vi.fn() } as unknown as TiptapEditor;
    expect(applyMultiSelectionHeading(view, editor, 2)).toBe(false);
  });

  it("returns false when editor is null", () => {
    const view = createMultiSelectionView([{ from: 5, to: 10 }]);
    expect(applyMultiSelectionHeading(view, null, 2)).toBe(false);
  });

  it("sets heading for each range in descending order", () => {
    const view = createMultiSelectionView([
      { from: 5, to: 10 },
      { from: 20, to: 25 },
    ]);

    const run = vi.fn();
    const setHeading = vi.fn(() => ({ run }));
    const focus = vi.fn(() => ({ setHeading, setParagraph: vi.fn(() => ({ run })) }));
    const chain = vi.fn(() => ({ focus }));
    const editor = { chain } as unknown as TiptapEditor;

    const result = applyMultiSelectionHeading(view, editor, 2);
    expect(result).toBe(true);
    // Should process ranges in descending order (pos 20 first, then 5)
    expect(chain).toHaveBeenCalledTimes(2);
  });

  it("sets paragraph when level is 0", () => {
    const view = createMultiSelectionView([{ from: 5, to: 10 }]);

    const run = vi.fn();
    const setParagraph = vi.fn(() => ({ run }));
    const focus = vi.fn(() => ({ setHeading: vi.fn(() => ({ run })), setParagraph }));
    const chain = vi.fn(() => ({ focus }));
    const editor = { chain } as unknown as TiptapEditor;

    const result = applyMultiSelectionHeading(view, editor, 0);
    expect(result).toBe(true);
    expect(setParagraph).toHaveBeenCalled();
  });
});

describe("applyMultiSelectionListAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when selection is not MultiSelection", () => {
    const view = createNonMultiView();
    expect(applyMultiSelectionListAction(view, "bulletList")).toBe(false);
  });

  it("calls handleToBulletList for bulletList action", () => {
    const view = createMultiSelectionView([{ from: 5, to: 10 }]);
    const result = applyMultiSelectionListAction(view, "bulletList");
    expect(result).toBe(true);
    expect(mockHandleToBulletList).toHaveBeenCalledWith(view);
  });

  it("calls handleToOrderedList for orderedList action", () => {
    const view = createMultiSelectionView([{ from: 5, to: 10 }]);
    const result = applyMultiSelectionListAction(view, "orderedList");
    expect(result).toBe(true);
    expect(mockHandleToOrderedList).toHaveBeenCalledWith(view);
  });

  it("calls convertSelectionToTaskList for taskList action", () => {
    const view = createMultiSelectionView([{ from: 5, to: 10 }]);
    const editor = {} as TiptapEditor;
    const result = applyMultiSelectionListAction(view, "taskList", editor);
    expect(result).toBe(true);
    expect(convertSelectionToTaskList).toHaveBeenCalledWith(editor);
  });

  it("returns false for taskList when editor is null", () => {
    const view = createMultiSelectionView([{ from: 5, to: 10 }]);
    const result = applyMultiSelectionListAction(view, "taskList", null);
    // forEachRangeDescending returns false for the handler that returns false
    expect(result).toBe(false);
  });

  it("calls handleListIndent for indent action", () => {
    const view = createMultiSelectionView([{ from: 5, to: 10 }]);
    const result = applyMultiSelectionListAction(view, "indent");
    expect(result).toBe(true);
    expect(mockHandleListIndent).toHaveBeenCalled();
  });

  it("calls handleListOutdent for outdent action", () => {
    const view = createMultiSelectionView([{ from: 5, to: 10 }]);
    const result = applyMultiSelectionListAction(view, "outdent");
    expect(result).toBe(true);
    expect(mockHandleListOutdent).toHaveBeenCalled();
  });

  it("calls handleRemoveList for removeList action", () => {
    const view = createMultiSelectionView([{ from: 5, to: 10 }]);
    const result = applyMultiSelectionListAction(view, "removeList");
    expect(result).toBe(true);
    expect(mockHandleRemoveList).toHaveBeenCalled();
  });

  it("returns false for unknown action", () => {
    const view = createMultiSelectionView([{ from: 5, to: 10 }]);
    const result = applyMultiSelectionListAction(view, "unknownAction");
    expect(result).toBe(false);
  });

  it("processes multiple ranges in descending order", () => {
    const view = createMultiSelectionView([
      { from: 5, to: 10 },
      { from: 30, to: 35 },
      { from: 15, to: 20 },
    ]);

    applyMultiSelectionListAction(view, "bulletList");

    // dispatch is called for each setSelection (3 ranges)
    expect(view.dispatch).toHaveBeenCalledTimes(3);
    expect(mockHandleToBulletList).toHaveBeenCalledTimes(3);
  });
});

describe("applyMultiSelectionBlockquoteAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when selection is not MultiSelection", () => {
    const view = createNonMultiView();
    expect(applyMultiSelectionBlockquoteAction(view, "nestBlockquote")).toBe(false);
  });

  it("calls handleBlockquoteNest for nestBlockquote action", () => {
    const view = createMultiSelectionView([{ from: 5, to: 10 }]);
    const result = applyMultiSelectionBlockquoteAction(view, "nestBlockquote");
    expect(result).toBe(true);
    expect(mockHandleBlockquoteNest).toHaveBeenCalledWith(view);
  });

  it("calls handleBlockquoteUnnest for unnestBlockquote action", () => {
    const view = createMultiSelectionView([{ from: 5, to: 10 }]);
    const result = applyMultiSelectionBlockquoteAction(view, "unnestBlockquote");
    expect(result).toBe(true);
    expect(mockHandleBlockquoteUnnest).toHaveBeenCalledWith(view);
  });

  it("calls handleRemoveBlockquote for removeBlockquote action", () => {
    const view = createMultiSelectionView([{ from: 5, to: 10 }]);
    const result = applyMultiSelectionBlockquoteAction(view, "removeBlockquote");
    expect(result).toBe(true);
    expect(mockHandleRemoveBlockquote).toHaveBeenCalledWith(view);
  });

  it("returns false for unknown action", () => {
    const view = createMultiSelectionView([{ from: 5, to: 10 }]);
    const result = applyMultiSelectionBlockquoteAction(view, "unknownAction");
    expect(result).toBe(false);
  });
});
