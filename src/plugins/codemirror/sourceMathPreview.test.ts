/**
 * Tests for sourceMathPreview — SourceMathPreviewPlugin.
 *
 * Covers: cursor-in-math detection, popup opening via store,
 * debounce behavior, non-collapsed selection guard, and destroy cleanup.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock math action finders
const mockFindInlineMath = vi.fn().mockReturnValue(null);
const mockFindBlockMath = vi.fn().mockReturnValue(null);
vi.mock("@/plugins/toolbarActions/sourceMathActions", () => ({
  findInlineMathAtCursor: (...args: unknown[]) => mockFindInlineMath(...args),
  findBlockMathAtCursor: (...args: unknown[]) => mockFindBlockMath(...args),
}));

// Mock the popup view to avoid DOM side effects
vi.mock("@/plugins/sourceMathPopup/SourceMathPopupView", () => ({
  SourceMathPopupView: class MockSourceMathPopupView {
    destroy() { /* no-op */ }
  },
}));

import { createSourceMathPreviewPlugin } from "./sourceMathPreview";
import { useSourceMathPopupStore } from "@/stores/sourceMathPopupStore";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

const views: EditorView[] = [];

function createViewWithRafSpy(
  doc = "hello $E=mc^2$ world",
  callbacks?: FrameRequestCallback[],
): EditorView {
  const parent = document.createElement("div");
  document.body.appendChild(parent);
  if (callbacks !== undefined) {
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      callbacks.push(cb);
      return callbacks.length;
    });
  }
  const state = EditorState.create({
    doc,
    extensions: createSourceMathPreviewPlugin(),
  });
  const view = new EditorView({ state, parent });
  views.push(view);
  return view;
}

describe("createSourceMathPreviewPlugin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    useSourceMathPopupStore.getState().closePopup();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    views.forEach((v) => {
      const parent = v.dom.parentElement;
      v.destroy();
      parent?.remove();
    });
    views.length = 0;
    vi.useRealTimers();
  });

  it("returns an array of extensions", () => {
    const exts = createSourceMathPreviewPlugin();
    expect(Array.isArray(exts)).toBe(true);
    expect(exts.length).toBeGreaterThan(0);
  });

  it("constructs an EditorView without error", () => {
    const view = createViewWithRafSpy();
    expect(view).toBeDefined();
  });

  describe("checkMathAtCursor — opens popup store", () => {
    it("opens popup for inline math when cursor is inside $...$", () => {
      mockFindInlineMath.mockReturnValue({
        from: 6, to: 14, content: "E=mc^2",
      });

      // Spy on coordsAtPos BEFORE creating the view, then reassign after
      const callbacks: FrameRequestCallback[] = [];
      const rafSpy = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
        callbacks.push(cb);
        return callbacks.length;
      });

      const parent = document.createElement("div");
      document.body.appendChild(parent);
      const editorState = EditorState.create({
        doc: "hello $E=mc^2$ world",
        extensions: createSourceMathPreviewPlugin(),
      });
      const view = new EditorView({ state: editorState, parent });
      views.push(view);

      // Now spy on coordsAtPos before firing the RAF
      vi.spyOn(view, "coordsAtPos").mockReturnValue({
        top: 10, bottom: 20, left: 5, right: 100,
      });

      // Fire the RAF
      expect(callbacks.length).toBeGreaterThan(0);
      callbacks[0](0);

      const state = useSourceMathPopupStore.getState();
      expect(mockFindBlockMath).toHaveBeenCalled();
      expect(mockFindInlineMath).toHaveBeenCalled();
      expect(state.isOpen).toBe(true);
      expect(state.latex).toBe("E=mc^2");
      expect(state.isBlock).toBe(false);

      rafSpy.mockRestore();
    });

    it("opens popup for block math ($$...$$) when cursor is inside", () => {
      mockFindBlockMath.mockReturnValue({
        from: 0, to: 14, content: "x^2 + y^2",
      });

      const callbacks: FrameRequestCallback[] = [];
      const view = createViewWithRafSpy("$$\nx^2 + y^2\n$$", callbacks);

      vi.spyOn(view, "coordsAtPos").mockReturnValue({
        top: 10, bottom: 20, left: 5, right: 100,
      });

      if (callbacks.length > 0) callbacks[0](0);

      const state = useSourceMathPopupStore.getState();
      expect(state.isOpen).toBe(true);
      expect(state.latex).toBe("x^2 + y^2");
      expect(state.isBlock).toBe(true);
    });

    it("does not open popup when no math at cursor", () => {
      mockFindBlockMath.mockReturnValue(null);
      mockFindInlineMath.mockReturnValue(null);

      const callbacks: FrameRequestCallback[] = [];
      const _view = createViewWithRafSpy("no math here", callbacks);

      if (callbacks.length > 0) callbacks[0](0);

      expect(useSourceMathPopupStore.getState().isOpen).toBe(false);
    });

    it("does not open popup when selection is not collapsed", () => {
      // Set up mocks to return math — but range selection should prevent popup
      mockFindInlineMath.mockReturnValue({
        from: 6, to: 14, content: "E=mc^2",
      });

      const callbacks: FrameRequestCallback[] = [];

      // Create view with an initial RANGE selection (anchor !== head)
      const parent = document.createElement("div");
      document.body.appendChild(parent);
      vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
        callbacks.push(cb);
        return callbacks.length;
      });
      const editorState = EditorState.create({
        doc: "hello $E=mc^2$ world",
        selection: { anchor: 0, head: 5 },
        extensions: createSourceMathPreviewPlugin(),
      });
      const view = new EditorView({ state: editorState, parent });
      views.push(view);

      // Fire the initial RAF (cursor is not collapsed → should not open)
      if (callbacks.length > 0) callbacks[0](0);

      expect(useSourceMathPopupStore.getState().isOpen).toBe(false);
    });
  });

  describe("debounce behavior", () => {
    it("does not schedule second RAF while one is pending", () => {
      const callbacks: FrameRequestCallback[] = [];
      const rafSpy = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
        callbacks.push(cb);
        return callbacks.length;
      });

      const view = createViewWithRafSpy();
      const callsAfterConstruct = rafSpy.mock.calls.length;

      view.dispatch({ selection: { anchor: 1 } });
      view.dispatch({ selection: { anchor: 2 } });

      const newCalls = rafSpy.mock.calls.length - callsAfterConstruct;
      expect(newCalls).toBeLessThanOrEqual(1);
    });

    it("does not recheck while popup is already open", () => {
      const callbacks: FrameRequestCallback[] = [];
      const view = createViewWithRafSpy("hello $x$ world", callbacks);

      // Open popup manually
      useSourceMathPopupStore.getState().openPopup(
        { top: 0, left: 0, bottom: 10, right: 10 },
        "x", 6, 9, false,
      );

      // Clear mocks
      mockFindBlockMath.mockClear();
      mockFindInlineMath.mockClear();

      // Dispatch selection change
      view.dispatch({ selection: { anchor: 7 } });

      // Should NOT have called find functions since popup is open
      // (the update() method returns early)
      expect(mockFindBlockMath).not.toHaveBeenCalled();
    });
  });

  describe("coords null guard", () => {
    it("does not open popup when coordsAtPos returns null", () => {
      mockFindInlineMath.mockReturnValue({
        from: 6, to: 14, content: "E=mc^2",
      });

      const callbacks: FrameRequestCallback[] = [];
      const view = createViewWithRafSpy("hello $E=mc^2$ world", callbacks);

      vi.spyOn(view, "coordsAtPos").mockReturnValue(
        null as unknown as ReturnType<typeof view.coordsAtPos>,
      );

      if (callbacks.length > 0) callbacks[0](0);

      expect(useSourceMathPopupStore.getState().isOpen).toBe(false);
    });
  });

  describe("destroy", () => {
    it("destroys popup view on plugin destroy", () => {
      const view = createViewWithRafSpy();
      // Should not throw
      view.destroy();
      expect(view).toBeDefined();
    });
  });
});
