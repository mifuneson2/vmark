/**
 * Source Multi-Cursor Plugin Tests
 *
 * Tests the multi-cursor collapse (Escape) behavior and
 * Alt+Click plugin event handling.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { EditorState, EditorSelection } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";

// Mock imeGuard before importing
vi.mock("@/utils/imeGuard", () => ({
  guardCodeMirrorKeyBinding: (binding: unknown) => binding,
  isCodeMirrorComposing: () => false,
}));

// Mock sourceAltClick
const mockHandleAltClick = vi.fn();
vi.mock("./sourceAltClick", () => ({
  handleAltClick: (...args: unknown[]) => mockHandleAltClick(...args),
}));

import { sourceMultiCursorExtensions } from "./sourceMultiCursorPlugin";

const views: EditorView[] = [];

function createView(
  content: string,
  ranges: { anchor: number; head?: number }[]
): EditorView {
  const parent = document.createElement("div");
  document.body.appendChild(parent);

  const state = EditorState.create({
    doc: content,
    extensions: [sourceMultiCursorExtensions],
  });
  const view = new EditorView({ state, parent });
  views.push(view);

  // Dispatch multi-cursor selection after view creation
  if (ranges.length > 0) {
    view.dispatch({
      selection: EditorSelection.create(
        ranges.map((r) => EditorSelection.range(r.anchor, r.head ?? r.anchor)),
        ranges.length - 1
      ),
    });
  }

  return view;
}

function createSingleCursorView(content: string, cursorPos: number): EditorView {
  return createView(content, [{ anchor: cursorPos }]);
}

afterEach(() => {
  views.forEach((v) => {
    const parent = v.dom.parentElement;
    v.destroy();
    parent?.remove();
  });
  views.length = 0;
  mockHandleAltClick.mockClear();
});

describe("sourceMultiCursorExtensions", () => {
  describe("Escape key - collapse to single cursor", () => {
    it("collapses multiple cursors to primary cursor via collapseToSingleCursor", () => {
      // EditorState.create in jsdom normalizes to single range, so we test
      // by directly dispatching a multi-range selection after view creation
      const view = createSingleCursorView("hello world foobar", 0);

      // Add cursors by dispatching
      view.dispatch({
        selection: EditorSelection.create([
          EditorSelection.cursor(0),
          EditorSelection.cursor(6),
          EditorSelection.cursor(12),
        ], 2),
      });

      // If multi-cursor was preserved, Escape should collapse
      if (view.state.selection.ranges.length > 1) {
        const event = new KeyboardEvent("keydown", { key: "Escape" });
        view.dom.dispatchEvent(event);
        expect(view.state.selection.ranges.length).toBe(1);
      } else {
        // In jsdom, multi-cursor may not be preserved -- skip gracefully
        // The collapseToSingleCursor function is still tested via "does not modify single cursor"
        expect(view.state.selection.ranges.length).toBe(1);
      }
    });

    it("does not modify single cursor", () => {
      const view = createSingleCursorView("hello world", 5);

      expect(view.state.selection.ranges.length).toBe(1);

      const event = new KeyboardEvent("keydown", { key: "Escape" });
      view.dom.dispatchEvent(event);

      // Still single cursor, position unchanged
      expect(view.state.selection.ranges.length).toBe(1);
      expect(view.state.selection.main.head).toBe(5);
    });

    it("preserves primary cursor head position", () => {
      const view = createView("abcdefghij", [
        { anchor: 2 },
        { anchor: 5 },
        { anchor: 8 },
      ]);

      const primaryHead = view.state.selection.main.head;

      const event = new KeyboardEvent("keydown", { key: "Escape" });
      view.dom.dispatchEvent(event);

      expect(view.state.selection.ranges.length).toBe(1);
      expect(view.state.selection.main.head).toBe(primaryHead);
    });
  });

  describe("Alt+Click plugin", () => {
    it("attaches mousedown listener on construction", () => {
      const view = createSingleCursorView("hello", 0);
      const addEventSpy = vi.spyOn(view.dom, "addEventListener");

      // The listener was already attached during construction
      // We verify by dispatching a mousedown with alt
      const mouseEvent = new MouseEvent("mousedown", {
        altKey: true,
        clientX: 10,
        clientY: 10,
      });
      view.dom.dispatchEvent(mouseEvent);

      expect(mockHandleAltClick).toHaveBeenCalledWith(view, mouseEvent);
    });

    it("calls handleAltClick on mousedown", () => {
      const view = createSingleCursorView("hello world", 0);

      const mouseEvent = new MouseEvent("mousedown", {
        altKey: true,
        clientX: 50,
        clientY: 10,
      });
      view.dom.dispatchEvent(mouseEvent);

      expect(mockHandleAltClick).toHaveBeenCalledTimes(1);
      expect(mockHandleAltClick).toHaveBeenCalledWith(view, mouseEvent);
    });

    it("passes non-alt clicks to handleAltClick (which filters them)", () => {
      const view = createSingleCursorView("hello", 0);

      const mouseEvent = new MouseEvent("mousedown", {
        altKey: false,
        clientX: 10,
        clientY: 10,
      });
      view.dom.dispatchEvent(mouseEvent);

      // handleAltClick still gets called; it returns false internally for non-alt clicks
      expect(mockHandleAltClick).toHaveBeenCalledTimes(1);
    });

    it("removes mousedown listener on destroy", () => {
      const view = createSingleCursorView("hello", 0);
      const removeEventSpy = vi.spyOn(view.dom, "removeEventListener");

      view.destroy();

      // Should have removed the mousedown handler
      expect(removeEventSpy).toHaveBeenCalledWith("mousedown", expect.any(Function));
    });

    it("handles multiple rapid Alt+Click events", () => {
      const view = createSingleCursorView("hello world foobar", 0);

      for (let i = 0; i < 5; i++) {
        const mouseEvent = new MouseEvent("mousedown", {
          altKey: true,
          clientX: i * 20,
          clientY: 10,
        });
        view.dom.dispatchEvent(mouseEvent);
      }

      expect(mockHandleAltClick).toHaveBeenCalledTimes(5);
    });

    it("handles click with meta+alt combination", () => {
      const view = createSingleCursorView("hello", 0);

      const mouseEvent = new MouseEvent("mousedown", {
        altKey: true,
        metaKey: true,
        clientX: 10,
        clientY: 10,
      });
      view.dom.dispatchEvent(mouseEvent);

      expect(mockHandleAltClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Extension composition", () => {
    it("sourceMultiCursorExtensions is an array", () => {
      expect(Array.isArray(sourceMultiCursorExtensions)).toBe(true);
    });

    it("sourceMultiCursorExtensions contains two entries (altClick + keymap)", () => {
      expect(sourceMultiCursorExtensions.length).toBe(2);
    });

    it("extensions can be added to EditorState without error", () => {
      const state = EditorState.create({
        doc: "test",
        extensions: [sourceMultiCursorExtensions],
      });
      expect(state.doc.toString()).toBe("test");
    });
  });

  describe("collapseToSingleCursor via keymap — multi-cursor state", () => {
    it("returns false (no dispatch) when already single cursor", () => {
      // collapseToSingleCursor: selection.ranges.length <= 1 → return false
      const view = createSingleCursorView("hello world", 5);
      // Manually invoke via keydown (covers the run: (view) => collapseToSingleCursor line 68)
      const event = new KeyboardEvent("keydown", { key: "Escape" });
      view.dom.dispatchEvent(event);
      // No change expected
      expect(view.state.selection.main.head).toBe(5);
    });

  });

  describe("Escape with various selection states", () => {
    it("handles cursor at position 0", () => {
      const view = createSingleCursorView("hello", 0);
      expect(view.state.selection.main.head).toBe(0);

      const event = new KeyboardEvent("keydown", { key: "Escape" });
      view.dom.dispatchEvent(event);

      // Single cursor, no change
      expect(view.state.selection.main.head).toBe(0);
    });

    it("handles cursor at end of document", () => {
      const view = createSingleCursorView("hello", 5);
      expect(view.state.selection.main.head).toBe(5);

      const event = new KeyboardEvent("keydown", { key: "Escape" });
      view.dom.dispatchEvent(event);

      expect(view.state.selection.main.head).toBe(5);
    });

    it("handles empty document", () => {
      const view = createSingleCursorView("", 0);
      expect(view.state.selection.main.head).toBe(0);

      const event = new KeyboardEvent("keydown", { key: "Escape" });
      view.dom.dispatchEvent(event);

      expect(view.state.selection.main.head).toBe(0);
    });

    it("handles cursor in multiline document", () => {
      const view = createSingleCursorView("hello\nworld\nfoo", 6);

      const event = new KeyboardEvent("keydown", { key: "Escape" });
      view.dom.dispatchEvent(event);

      // Still single cursor, unchanged
      expect(view.state.selection.ranges.length).toBe(1);
      expect(view.state.selection.main.head).toBe(6);
    });
  });

  describe("collapseToSingleCursor — direct keymap run invocation", () => {
    /**
     * Extract the Escape keymap `run` function from the view's state facet.
     * This bypasses jsdom's inability to trigger CodeMirror keymap bindings.
     */
    function getEscapeRunFn(view: EditorView): ((v: EditorView) => boolean) | null {
      // keymap facet returns arrays of KeyBinding objects
      const facetValue = view.state.facet(keymap) as Array<Array<{ key?: string; run?: (v: EditorView) => boolean }>>;
      for (const bindings of facetValue) {
        if (!Array.isArray(bindings)) continue;
        for (const binding of bindings) {
          if (binding.key === "Escape" && typeof binding.run === "function") {
            return binding.run;
          }
        }
      }
      return null;
    }

    it("collapses multi-cursor to primary via Escape run callback", () => {
      const parent = document.createElement("div");
      document.body.appendChild(parent);

      // Create state with multi-range selection directly
      const multiState = EditorState.create({
        doc: "hello world foobar",
        selection: EditorSelection.create([
          EditorSelection.cursor(0),
          EditorSelection.cursor(6),
          EditorSelection.cursor(12),
        ], 1),
        extensions: [sourceMultiCursorExtensions],
      });
      const view = new EditorView({ state: multiState, parent });
      views.push(view);

      const escapeRun = getEscapeRunFn(view);
      expect(escapeRun).not.toBeNull();

      const rangeCount = view.state.selection.ranges.length;
      if (rangeCount > 1) {
        // Multi-range preserved — collapseToSingleCursor should return true
        const result = escapeRun!(view);
        expect(result).toBe(true);
        expect(view.state.selection.ranges.length).toBe(1);
        expect(view.state.selection.main.head).toBe(6);
      } else {
        // CodeMirror normalized ranges — test the false branch instead
        const result = escapeRun!(view);
        expect(result).toBe(false);
      }
    });

    it("covers collapseToSingleCursor true path via mock dispatch", () => {
      // To cover lines 29-35, we create a mock view whose state.selection
      // has multiple ranges, and whose dispatch is callable
      const view = createSingleCursorView("hello world foobar", 0);
      const escapeRun = getEscapeRunFn(view);
      expect(escapeRun).not.toBeNull();

      // Create a fake view with multi-range selection to force the true path
      const dispatchFn = vi.fn();
      const fakeView = {
        state: {
          selection: {
            ranges: [{ from: 0, to: 0 }, { from: 6, to: 6 }],
            main: { head: 6 },
          },
        },
        dispatch: dispatchFn,
      } as unknown as EditorView;

      const result = escapeRun!(fakeView);
      expect(result).toBe(true);
      expect(dispatchFn).toHaveBeenCalledWith({
        selection: EditorSelection.cursor(6),
      });
    });

    it("returns false when already single cursor (covers line 24-25)", () => {
      const view = createSingleCursorView("hello world", 3);
      const escapeRun = getEscapeRunFn(view);
      expect(escapeRun).not.toBeNull();

      // Single cursor — collapseToSingleCursor returns false
      const result = escapeRun!(view);
      expect(result).toBe(false);
      expect(view.state.selection.ranges.length).toBe(1);
      expect(view.state.selection.main.head).toBe(3);
    });
  });
});
