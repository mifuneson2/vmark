/**
 * Footnote Insertion Tests
 *
 * Tests for insertFootnoteAndOpenPopup including:
 * - Inserting reference + renumbering
 * - Finding nearest reference
 * - Opening popup via store
 * - Edge cases: missing node types, empty doc
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockOpenPopup = vi.fn();
vi.mock("@/stores/footnotePopupStore", () => ({
  useFootnotePopupStore: {
    getState: () => ({
      openPopup: mockOpenPopup,
    }),
  },
}));

// Mock createRenumberTransaction and getDefinitionInfo
const mockCreateRenumberTransaction = vi.fn();
const mockGetDefinitionInfo = vi.fn();
vi.mock("./tiptapCleanup", () => ({
  createRenumberTransaction: (...args: unknown[]) => mockCreateRenumberTransaction(...args),
  getDefinitionInfo: (...args: unknown[]) => mockGetDefinitionInfo(...args),
}));

import { insertFootnoteAndOpenPopup } from "./tiptapInsertFootnote";

function createMockEditor(options: {
  hasRefType?: boolean;
  hasDefType?: boolean;
  selectionTo?: number;
} = {}) {
  const { hasRefType = true, hasDefType = true, selectionTo = 5 } = options;

  const refCreate = vi.fn((attrs: Record<string, unknown>) => ({
    type: { name: "footnote_reference" },
    attrs,
  }));
  const defCreate = vi.fn();

  const schema = {
    nodes: {
      footnote_reference: hasRefType ? { create: refCreate } : undefined,
      footnote_definition: hasDefType ? { create: defCreate } : undefined,
    },
  };

  const insertFn = vi.fn().mockReturnThis();
  const tr = { insert: insertFn };

  const state = {
    schema,
    selection: { to: selectionTo },
    tr,
  };

  const dispatchFn = vi.fn();

  // After dispatch, view.state should be updated for the second read
  const postDispatchDoc = {
    descendants: vi.fn((callback: (node: { type: { name: string }; attrs: Record<string, unknown> }, pos: number) => boolean | void) => {
      // Simulate a doc with a footnote_reference at position near selectionTo
      callback(
        { type: { name: "footnote_reference" }, attrs: { label: "1" } },
        selectionTo
      );
    }),
  };

  const postDispatchState = {
    ...state,
    doc: postDispatchDoc,
  };

  // Track dispatch calls to swap state
  let dispatchCallCount = 0;
  const view = {
    state,
    dispatch: vi.fn(() => {
      dispatchCallCount++;
      // After first dispatch (insert), update view.state
      if (dispatchCallCount === 1) {
        view.state = postDispatchState as typeof view.state;
      }
    }),
    dom: {
      querySelector: vi.fn(() => null),
    },
  };

  return {
    editor: { state, view } as unknown as Parameters<typeof insertFootnoteAndOpenPopup>[0],
    view,
    refCreate,
    dispatchFn,
  };
}

describe("insertFootnoteAndOpenPopup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateRenumberTransaction.mockReturnValue(null);
    mockGetDefinitionInfo.mockReturnValue([]);
  });

  it("does nothing when footnote_reference type is missing", () => {
    const { editor, view } = createMockEditor({ hasRefType: false });
    insertFootnoteAndOpenPopup(editor);
    expect(view.dispatch).not.toHaveBeenCalled();
  });

  it("does nothing when footnote_definition type is missing", () => {
    const { editor, view } = createMockEditor({ hasDefType: false });
    insertFootnoteAndOpenPopup(editor);
    expect(view.dispatch).not.toHaveBeenCalled();
  });

  it("inserts a reference with _new_ label at selection position", () => {
    const { editor, view, refCreate } = createMockEditor();
    insertFootnoteAndOpenPopup(editor);

    expect(refCreate).toHaveBeenCalledWith({ label: "_new_" });
    expect(view.dispatch).toHaveBeenCalled();
  });

  it("dispatches renumber transaction when one is created", () => {
    const mockTr = { docChanged: true };
    mockCreateRenumberTransaction.mockReturnValue(mockTr);

    const { editor, view } = createMockEditor();
    insertFootnoteAndOpenPopup(editor);

    // First dispatch: insert, second dispatch: renumber
    expect(view.dispatch).toHaveBeenCalledTimes(2);
    expect(view.dispatch).toHaveBeenLastCalledWith(mockTr);
  });

  it("skips renumber dispatch when createRenumberTransaction returns null", () => {
    mockCreateRenumberTransaction.mockReturnValue(null);

    const { editor, view } = createMockEditor();
    insertFootnoteAndOpenPopup(editor);

    // Only the insert dispatch
    expect(view.dispatch).toHaveBeenCalledTimes(1);
  });

  it("calls getDefinitionInfo to find definition position", () => {
    mockGetDefinitionInfo.mockReturnValue([{ label: "1", pos: 20, size: 10 }]);

    const { editor } = createMockEditor();
    insertFootnoteAndOpenPopup(editor);

    expect(mockGetDefinitionInfo).toHaveBeenCalled();
  });

  it("uses requestAnimationFrame to open popup after DOM update", () => {
    const rafSpy = vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 0;
    });

    mockGetDefinitionInfo.mockReturnValue([{ label: "1", pos: 20, size: 10 }]);

    const { editor } = createMockEditor();
    insertFootnoteAndOpenPopup(editor);

    expect(rafSpy).toHaveBeenCalled();
    rafSpy.mockRestore();
  });

  it("opens popup when ref element is found in DOM", () => {
    const mockRect = { top: 100, left: 200, width: 20, height: 16 };
    const mockRefEl = {
      getBoundingClientRect: () => mockRect,
    };

    const rafSpy = vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 0;
    });

    mockGetDefinitionInfo.mockReturnValue([{ label: "1", pos: 20, size: 10 }]);

    const { editor, view } = createMockEditor();
    view.dom.querySelector = vi.fn(() => mockRefEl);

    insertFootnoteAndOpenPopup(editor);

    expect(mockOpenPopup).toHaveBeenCalledWith(
      "1",
      "",
      mockRect,
      20,
      5,
      true
    );

    rafSpy.mockRestore();
  });

  it("does not open popup when ref element is not found in DOM", () => {
    const rafSpy = vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 0;
    });

    mockGetDefinitionInfo.mockReturnValue([{ label: "1", pos: 20, size: 10 }]);

    const { editor, view } = createMockEditor();
    view.dom.querySelector = vi.fn(() => null);

    insertFootnoteAndOpenPopup(editor);

    expect(mockOpenPopup).not.toHaveBeenCalled();

    rafSpy.mockRestore();
  });
});
