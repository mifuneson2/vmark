/**
 * Tests for useOutlineSync — bridges outline panel clicks to editor scroll
 * position and tracks cursor to highlight the active heading.
 *
 * @module hooks/useOutlineSync.test
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUIStore } from "@/stores/uiStore";

// --- Hoisted mocks ---
const mocks = vi.hoisted(() => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: mocks.listen,
}));

const mockSafeUnlisten = vi.fn();
vi.mock("@/utils/safeUnlisten", () => ({
  safeUnlisten: (...args: unknown[]) => mockSafeUnlisten(...args),
}));

// Mock getTiptapEditorDom to return a real DOM element when view is provided
let mockDom: HTMLElement | null = null;
vi.mock("@/utils/tiptapView", () => ({
  getTiptapEditorDom: (view: unknown) => (view ? mockDom : null),
}));

// Mock ProseMirror Selection.near — it's used for scroll-to-heading
vi.mock("@tiptap/pm/state", () => ({
  Selection: {
    near: (pos: unknown) => ({ anchor: pos }),
  },
}));

import { useOutlineSync } from "./useOutlineSync";

type ListenCallback = (event: { payload: { headingIndex: number } }) => void;

/** Build a minimal mock ProseMirror-like Node */
function createMockDoc(headings: Array<{ name: string; pos: number }>) {
  const allNodes: Array<{ node: { type: { name: string } }; pos: number }> = headings.map((h) => ({
    node: { type: { name: h.name } },
    pos: h.pos,
  }));

  return {
    descendants: (cb: (node: { type: { name: string } }, pos: number) => boolean | undefined) => {
      for (const entry of allNodes) {
        const shouldContinue = cb(entry.node, entry.pos);
        if (shouldContinue === false) break;
      }
    },
    resolve: (pos: number) => pos,
  };
}

function createMockView(
  headingPositions: number[] = [],
  selectionAnchor = 0
) {
  const doc = createMockDoc(headingPositions.map((pos) => ({ name: "heading", pos })));
  return {
    state: {
      doc,
      tr: {
        setSelection: vi.fn().mockReturnThis(),
        setMeta: vi.fn().mockReturnThis(),
      },
      selection: { anchor: selectionAnchor },
    },
    dispatch: vi.fn(),
    focus: vi.fn(),
    nodeDOM: vi.fn(() => {
      const el = document.createElement("h1");
      el.scrollIntoView = vi.fn();
      return el;
    }),
  };
}

describe("useOutlineSync — scroll-to-heading listener", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDom = null;
  });

  it("registers listener for outline:scroll-to-heading on mount", () => {
    const view = createMockView([0, 50, 100]);
    const getView = () => view as unknown as ReturnType<() => import("@tiptap/pm/view").EditorView>;

    renderHook(() => useOutlineSync(getView));

    expect(mocks.listen).toHaveBeenCalledWith(
      "outline:scroll-to-heading",
      expect.any(Function)
    );
  });

  it("dispatches selection and focuses editor on heading click", async () => {
    const view = createMockView([0, 50, 100]);
    const getView = () => view as unknown as ReturnType<() => import("@tiptap/pm/view").EditorView>;

    renderHook(() => useOutlineSync(getView));

    await vi.waitFor(() => expect(mocks.listen).toHaveBeenCalled());

    const calls = mocks.listen.mock.calls as unknown[][];
    const scrollCall = calls.find((c) => c[0] === "outline:scroll-to-heading");
    expect(scrollCall).toBeDefined();

    const callback = scrollCall![1] as ListenCallback;
    callback({ payload: { headingIndex: 1 } });

    // Should dispatch a transaction for heading at index 1 (pos 50)
    expect(view.dispatch).toHaveBeenCalled();
    expect(view.focus).toHaveBeenCalled();
  });

  it("does nothing when heading index is out of range", async () => {
    const view = createMockView([0, 50]);
    const getView = () => view as unknown as ReturnType<() => import("@tiptap/pm/view").EditorView>;

    renderHook(() => useOutlineSync(getView));

    await vi.waitFor(() => expect(mocks.listen).toHaveBeenCalled());

    const calls = mocks.listen.mock.calls as unknown[][];
    const scrollCall = calls.find((c) => c[0] === "outline:scroll-to-heading");
    const callback = scrollCall![1] as ListenCallback;

    callback({ payload: { headingIndex: 10 } });

    expect(view.dispatch).not.toHaveBeenCalled();
  });

  it("does nothing when editor view is null", async () => {
    const getView = () => null;

    renderHook(() => useOutlineSync(getView));

    await vi.waitFor(() => expect(mocks.listen).toHaveBeenCalled());

    const calls = mocks.listen.mock.calls as unknown[][];
    const scrollCall = calls.find((c) => c[0] === "outline:scroll-to-heading");
    const callback = scrollCall![1] as ListenCallback;

    // Should not throw
    callback({ payload: { headingIndex: 0 } });
  });

  it("cleans up listener on unmount", async () => {
    const mockUnlisten = vi.fn();
    mocks.listen.mockResolvedValueOnce(mockUnlisten);

    const getView = () => null;
    const { unmount } = renderHook(() => useOutlineSync(getView));

    // Wait for listen promise to resolve
    await vi.waitFor(() => expect(mocks.listen).toHaveBeenCalled());

    unmount();

    // safeUnlisten is called on cleanup
    expect(mockSafeUnlisten).toHaveBeenCalled();
  });
});

describe("useOutlineSync — cursor tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUIStore.getState().setActiveHeadingLine(-1);
    mockDom = null;
  });

  it("sets up keyup and mouseup listeners when editor DOM is available", () => {
    const dom = document.createElement("div");
    mockDom = dom;
    const addSpy = vi.spyOn(dom, "addEventListener");

    const view = createMockView([0, 50], 60);
    const getView = () => view as unknown as ReturnType<() => import("@tiptap/pm/view").EditorView>;

    renderHook(() => useOutlineSync(getView));

    expect(addSpy).toHaveBeenCalledWith("keyup", expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith("mouseup", expect.any(Function));
  });

  it("removes listeners on unmount", () => {
    const dom = document.createElement("div");
    mockDom = dom;
    const removeSpy = vi.spyOn(dom, "removeEventListener");

    const view = createMockView([0, 50], 10);
    const getView = () => view as unknown as ReturnType<() => import("@tiptap/pm/view").EditorView>;

    const { unmount } = renderHook(() => useOutlineSync(getView));
    unmount();

    expect(removeSpy).toHaveBeenCalledWith("keyup", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("mouseup", expect.any(Function));
  });

  it("updates active heading on initial render", () => {
    const dom = document.createElement("div");
    mockDom = dom;

    // Cursor at position 60, after heading at pos 50 (index 1)
    const view = createMockView([0, 50], 60);
    const getView = () => view as unknown as ReturnType<() => import("@tiptap/pm/view").EditorView>;

    renderHook(() => useOutlineSync(getView));

    // The heading index at pos 60 should be 1 (after heading at pos 50, before pos 60)
    // findHeadingIndexAtPosition checks nodePos < cursorPos
    const headingLine = useUIStore.getState().activeHeadingLine;
    expect(headingLine).toBe(1);
  });

  it("returns -1 when cursor is before all headings", () => {
    const dom = document.createElement("div");
    mockDom = dom;

    // Heading at pos 100, cursor at pos 5 (before all headings)
    const view = createMockView([100], 5);
    const getView = () => view as unknown as ReturnType<() => import("@tiptap/pm/view").EditorView>;

    renderHook(() => useOutlineSync(getView));

    const headingLine = useUIStore.getState().activeHeadingLine;
    expect(headingLine).toBe(-1);
  });

  it("does not set up listeners when editor DOM is not available", () => {
    mockDom = null;

    const view = createMockView([0], 0);
    const getView = () => view as unknown as ReturnType<() => import("@tiptap/pm/view").EditorView>;

    // Should not throw, just poll internally
    renderHook(() => useOutlineSync(getView));
  });
});
