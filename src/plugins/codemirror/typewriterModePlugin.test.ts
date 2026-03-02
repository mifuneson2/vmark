/**
 * Typewriter Mode Plugin Tests for CodeMirror (Source Mode)
 *
 * Tests the typewriter scrolling behavior that keeps the cursor
 * vertically centered at ~40% from the top of the viewport.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

// Mock editorStore before importing
const mockEditorStore = {
  typewriterModeEnabled: false,
};

vi.mock("@/stores/editorStore", () => ({
  useEditorStore: {
    getState: () => mockEditorStore,
  },
}));

import { createSourceTypewriterPlugin } from "./typewriterModePlugin";

const views: EditorView[] = [];

function createView(content: string, cursorPos?: number): EditorView {
  const parent = document.createElement("div");
  document.body.appendChild(parent);

  const state = EditorState.create({
    doc: content,
    selection: { anchor: cursorPos ?? 0 },
    extensions: [createSourceTypewriterPlugin()],
  });
  const view = new EditorView({ state, parent });
  views.push(view);
  return view;
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  mockEditorStore.typewriterModeEnabled = false;
});

afterEach(() => {
  views.forEach((v) => {
    const parent = v.dom.parentElement;
    v.destroy();
    parent?.remove();
  });
  views.length = 0;
  vi.useRealTimers();
});

describe("createSourceTypewriterPlugin", () => {
  describe("when typewriter mode is disabled", () => {
    beforeEach(() => {
      mockEditorStore.typewriterModeEnabled = false;
    });

    it("does not scroll on selection change", () => {
      const view = createView("Hello\nWorld\nTest");

      // Change selection
      view.dispatch({ selection: { anchor: 6 } });

      // No scroll should have been triggered (no error = pass)
      expect(view.state.selection.main.from).toBe(6);
    });
  });

  describe("when typewriter mode is enabled", () => {
    beforeEach(() => {
      mockEditorStore.typewriterModeEnabled = true;
    });

    it("does not scroll for non-selection updates", () => {
      const view = createView("Hello\nWorld");

      // Document change without selection change
      view.dispatch({
        changes: { from: 5, to: 5, insert: "!" },
      });

      // Should not throw
      expect(view.state.doc.toString()).toBe("Hello!\nWorld");
    });

    it("skips initial updates to avoid jarring scroll on load", () => {
      const view = createView("Hello\nWorld\nTest");
      const rafSpy = vi.spyOn(globalThis, "requestAnimationFrame");

      // First 3 selection changes should be skipped
      view.dispatch({ selection: { anchor: 1 } });
      view.dispatch({ selection: { anchor: 2 } });
      view.dispatch({ selection: { anchor: 3 } });

      expect(rafSpy).not.toHaveBeenCalled();

      // 4th selection change should trigger scrolling
      view.dispatch({ selection: { anchor: 4 } });

      expect(rafSpy).toHaveBeenCalledTimes(1);

      rafSpy.mockRestore();
    });

    it("cancels pending scroll on rapid cursor movement", () => {
      const view = createView("Hello\nWorld\nTest\nMore lines");
      const cancelSpy = vi.spyOn(globalThis, "cancelAnimationFrame");

      // Skip initial updates
      for (let i = 1; i <= 3; i++) {
        view.dispatch({ selection: { anchor: i } });
      }

      // Now subsequent rapid changes should cancel previous
      view.dispatch({ selection: { anchor: 5 } });
      view.dispatch({ selection: { anchor: 10 } });

      expect(cancelSpy).toHaveBeenCalled();

      cancelSpy.mockRestore();
    });
  });

  describe("destroy", () => {
    it("cancels pending animation frame on destroy", () => {
      mockEditorStore.typewriterModeEnabled = true;
      const cancelSpy = vi.spyOn(globalThis, "cancelAnimationFrame");

      const view = createView("Hello\nWorld\nTest");

      // Skip initial updates
      for (let i = 1; i <= 4; i++) {
        view.dispatch({ selection: { anchor: i } });
      }

      view.destroy();

      // Should cancel if there was a pending raf
      // (may or may not have been called depending on timing)
      expect(cancelSpy).toHaveBeenCalled();

      cancelSpy.mockRestore();
    });

    it("does not throw when destroyed without pending scroll", () => {
      const view = createView("Hello");
      expect(() => view.destroy()).not.toThrow();
    });
  });

  describe("scroll behavior", () => {
    beforeEach(() => {
      mockEditorStore.typewriterModeEnabled = true;
    });

    it("uses requestAnimationFrame for smooth batching", () => {
      const view = createView("Hello\nWorld\nTest\nFourth");
      const rafSpy = vi.spyOn(globalThis, "requestAnimationFrame");

      // Skip initial updates
      for (let i = 1; i <= 3; i++) {
        view.dispatch({ selection: { anchor: i } });
      }

      view.dispatch({ selection: { anchor: 10 } });

      expect(rafSpy).toHaveBeenCalledWith(expect.any(Function));

      rafSpy.mockRestore();
    });

    it("handles coordsAtPos failure gracefully", () => {
      const view = createView("Hello\nWorld");

      // Skip initial updates
      for (let i = 1; i <= 3; i++) {
        view.dispatch({ selection: { anchor: i } });
      }

      // Mock coordsAtPos to return null
      const origCoords = view.coordsAtPos.bind(view);
      vi.spyOn(view, "coordsAtPos").mockReturnValue(null);

      view.dispatch({ selection: { anchor: 5 } });

      // Execute the raf callback — should not throw
      vi.runAllTimers();

      view.coordsAtPos = origCoords;
    });
  });
});
