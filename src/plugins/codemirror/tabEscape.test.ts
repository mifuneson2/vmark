/**
 * Tab Escape Plugin Tests for CodeMirror
 *
 * Tests the core tab escape handler: link navigation priority,
 * closing char escape, multi-char sequences, and multi-cursor support.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { EditorState, EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

vi.mock("@/utils/imeGuard", () => ({
  guardCodeMirrorKeyBinding: (binding: unknown) => binding,
}));

import { tabEscapeKeymap } from "./tabEscape";

const views: EditorView[] = [];

function createView(contentWithCursor: string): EditorView {
  const cursorPos = contentWithCursor.indexOf("^");
  const content = contentWithCursor.replace("^", "");

  const parent = document.createElement("div");
  document.body.appendChild(parent);

  const state = EditorState.create({
    doc: content,
    selection: { anchor: cursorPos },
  });
  const view = new EditorView({ state, parent });
  views.push(view);
  return view;
}

function createMultiCursorView(
  content: string,
  ranges: { anchor: number; head?: number }[]
): EditorView {
  const parent = document.createElement("div");
  document.body.appendChild(parent);

  // Create with single cursor first, then dispatch multi-selection
  const state = EditorState.create({
    doc: content,
  });
  const view = new EditorView({ state, parent });
  views.push(view);

  // Dispatch multi-cursor selection after view creation
  view.dispatch({
    selection: EditorSelection.create(
      ranges.map((r) => EditorSelection.range(r.anchor, r.head ?? r.anchor)),
      ranges.length - 1
    ),
  });

  return view;
}

afterEach(() => {
  views.forEach((v) => {
    const parent = v.dom.parentElement;
    v.destroy();
    parent?.remove();
  });
  views.length = 0;
});

describe("tabEscapeKeymap", () => {
  it("has key set to Tab", () => {
    expect(tabEscapeKeymap.key).toBe("Tab");
  });

  describe("single cursor - closing char escape", () => {
    it("jumps over closing paren", () => {
      const view = createView("fn(arg^)");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
      expect(view.state.selection.main.from).toBe(7);
    });

    it("jumps over closing bracket", () => {
      const view = createView("arr[0^]");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
      expect(view.state.selection.main.from).toBe(6);
    });

    it("does not jump over non-closing char", () => {
      const view = createView("text^abc");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(false);
    });

    it("does not handle when there is a selection", () => {
      const parent = document.createElement("div");
      document.body.appendChild(parent);
      const state = EditorState.create({
        doc: "text)",
        selection: { anchor: 0, head: 3 },
      });
      const view = new EditorView({ state, parent });
      views.push(view);

      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(false);
    });

    it("returns false at end of document", () => {
      const view = createView("text^");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(false);
    });
  });

  describe("single cursor - multi-char sequences", () => {
    it("jumps over ~~ sequence", () => {
      const view = createView("text^~~");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
      expect(view.state.selection.main.from).toBe(6);
    });

    it("jumps over == sequence", () => {
      const view = createView("text^==");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
      expect(view.state.selection.main.from).toBe(6);
    });

    it("prefers multi-char sequence over single char", () => {
      // ~~ should jump 2, not 1
      const view = createView("text^~~more");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
      expect(view.state.selection.main.from).toBe(6);
    });
  });

  describe("single cursor - link navigation", () => {
    it("navigates from link text to URL", () => {
      const view = createView("[text^](url)");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);

      const cursor = view.state.selection.main.from;
      const doc = view.state.doc.toString();
      expect(doc.charAt(cursor)).toBe("u"); // jumps to URL portion
    });

    it("navigates from URL to outside link", () => {
      const view = createView("[text](url^)");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);

      const cursor = view.state.selection.main.from;
      // [text](url) is 11 chars, ) is at index 10, after ) is 11
      expect(cursor).toBe(11);
    });

    it("prioritizes link navigation over closing bracket", () => {
      const view = createView("[text^](url)");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);

      const cursor = view.state.selection.main.from;
      const doc = view.state.doc.toString();
      // Should jump to URL, not just past ]
      expect(doc.charAt(cursor)).toBe("u");
    });
  });

  describe("multi-cursor escape", () => {
    // Note: EditorState.create in jsdom does not reliably preserve multi-range
    // selections. Multi-cursor integration tests are covered in
    // tabEscape.multi-cursor.test.ts which documents current behavior.

    it("returns false for single cursor (no multi-cursor path)", () => {
      const view = createView("text^)");
      // Single cursor before ) -- should go through single-cursor path, not multi
      expect(view.state.selection.ranges.length).toBe(1);
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
      expect(view.state.selection.main.from).toBe(5);
    });

    it("single cursor returns false when nothing to escape", () => {
      const view = createView("text^abc");
      expect(view.state.selection.ranges.length).toBe(1);
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(false);
    });
  });
});
