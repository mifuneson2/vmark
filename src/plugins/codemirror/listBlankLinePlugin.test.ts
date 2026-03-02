/**
 * List Blank Line Hiding Plugin Tests for CodeMirror
 *
 * Tests the detection and hiding of blank lines between list items
 * in Source mode.
 */

import { describe, it, expect, afterEach } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

import { createListBlankLinePlugin } from "./listBlankLinePlugin";

const views: EditorView[] = [];

function createView(content: string): EditorView {
  const parent = document.createElement("div");
  document.body.appendChild(parent);

  const state = EditorState.create({
    doc: content,
    extensions: [createListBlankLinePlugin()],
  });
  const view = new EditorView({ state, parent });
  views.push(view);
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

describe("createListBlankLinePlugin", () => {
  describe("blank lines between list items", () => {
    it("hides blank line between unordered list items (dash)", () => {
      const content = "- item 1\n\n- item 2";
      const view = createView(content);

      const hiddenLines = view.dom.querySelectorAll(".cm-list-blank-hidden");
      expect(hiddenLines.length).toBe(1);
    });

    it("hides blank line between unordered list items (asterisk)", () => {
      const content = "* item 1\n\n* item 2";
      const view = createView(content);

      const hiddenLines = view.dom.querySelectorAll(".cm-list-blank-hidden");
      expect(hiddenLines.length).toBe(1);
    });

    it("hides blank line between unordered list items (plus)", () => {
      const content = "+ item 1\n\n+ item 2";
      const view = createView(content);

      const hiddenLines = view.dom.querySelectorAll(".cm-list-blank-hidden");
      expect(hiddenLines.length).toBe(1);
    });

    it("hides blank line between ordered list items (dot)", () => {
      const content = "1. item 1\n\n2. item 2";
      const view = createView(content);

      const hiddenLines = view.dom.querySelectorAll(".cm-list-blank-hidden");
      expect(hiddenLines.length).toBe(1);
    });

    it("hides blank line between ordered list items (paren)", () => {
      const content = "1) item 1\n\n2) item 2";
      const view = createView(content);

      const hiddenLines = view.dom.querySelectorAll(".cm-list-blank-hidden");
      expect(hiddenLines.length).toBe(1);
    });

    it("hides multiple blank lines between multiple list items", () => {
      const content = "- item 1\n\n- item 2\n\n- item 3";
      const view = createView(content);

      const hiddenLines = view.dom.querySelectorAll(".cm-list-blank-hidden");
      expect(hiddenLines.length).toBe(2);
    });

    it("handles indented list items", () => {
      const content = "  - item 1\n\n  - item 2";
      const view = createView(content);

      const hiddenLines = view.dom.querySelectorAll(".cm-list-blank-hidden");
      expect(hiddenLines.length).toBe(1);
    });
  });

  describe("blank lines NOT between list items", () => {
    it("does not hide blank line between paragraph and list", () => {
      const content = "Some text\n\n- item 1";
      const view = createView(content);

      const hiddenLines = view.dom.querySelectorAll(".cm-list-blank-hidden");
      expect(hiddenLines.length).toBe(0);
    });

    it("does not hide blank line between list and paragraph", () => {
      const content = "- item 1\n\nSome text";
      const view = createView(content);

      const hiddenLines = view.dom.querySelectorAll(".cm-list-blank-hidden");
      expect(hiddenLines.length).toBe(0);
    });

    it("does not hide blank line between two paragraphs", () => {
      const content = "Paragraph one\n\nParagraph two";
      const view = createView(content);

      const hiddenLines = view.dom.querySelectorAll(".cm-list-blank-hidden");
      expect(hiddenLines.length).toBe(0);
    });

    it("does not hide blank line at start of document before list", () => {
      const content = "\n- item 1";
      const view = createView(content);

      const hiddenLines = view.dom.querySelectorAll(".cm-list-blank-hidden");
      expect(hiddenLines.length).toBe(0);
    });

    it("does not hide blank line at end of document after list", () => {
      const content = "- item 1\n";
      const view = createView(content);

      const hiddenLines = view.dom.querySelectorAll(".cm-list-blank-hidden");
      expect(hiddenLines.length).toBe(0);
    });
  });

  describe("mixed content", () => {
    it("only hides blank lines between list items, not around them", () => {
      const content = "Intro\n\n- item 1\n\n- item 2\n\nOutro";
      const view = createView(content);

      const hiddenLines = view.dom.querySelectorAll(".cm-list-blank-hidden");
      // Only the blank line between item 1 and item 2 should be hidden
      expect(hiddenLines.length).toBe(1);
    });

    it("handles list items without blank lines (tight list)", () => {
      const content = "- item 1\n- item 2\n- item 3";
      const view = createView(content);

      const hiddenLines = view.dom.querySelectorAll(".cm-list-blank-hidden");
      // No blank lines to hide
      expect(hiddenLines.length).toBe(0);
    });

    it("handles empty document", () => {
      const view = createView("");

      const hiddenLines = view.dom.querySelectorAll(".cm-list-blank-hidden");
      expect(hiddenLines.length).toBe(0);
    });
  });

  describe("document changes", () => {
    it("rebuilds decorations when document changes", () => {
      const view = createView("- item 1\n\n- item 2");

      let hiddenLines = view.dom.querySelectorAll(".cm-list-blank-hidden");
      expect(hiddenLines.length).toBe(1);

      // Change second list item to plain text
      const doc = view.state.doc;
      const line3 = doc.line(3);
      view.dispatch({
        changes: { from: line3.from, to: line3.to, insert: "plain text" },
      });

      hiddenLines = view.dom.querySelectorAll(".cm-list-blank-hidden");
      expect(hiddenLines.length).toBe(0);
    });

    it("adds decorations when list items are added", () => {
      const view = createView("- item 1");

      let hiddenLines = view.dom.querySelectorAll(".cm-list-blank-hidden");
      expect(hiddenLines.length).toBe(0);

      // Add a blank line and another list item
      const docLen = view.state.doc.length;
      view.dispatch({
        changes: { from: docLen, to: docLen, insert: "\n\n- item 2" },
      });

      hiddenLines = view.dom.querySelectorAll(".cm-list-blank-hidden");
      expect(hiddenLines.length).toBe(1);
    });
  });

  describe("multiple blank lines between list items", () => {
    it("hides consecutive blank lines between list items", () => {
      const content = "- item 1\n\n\n- item 2";
      const view = createView(content);

      const hiddenLines = view.dom.querySelectorAll(".cm-list-blank-hidden");
      // Both blank lines between list items should be hidden
      expect(hiddenLines.length).toBe(2);
    });
  });

  describe("mixed list types", () => {
    it("hides blank line between unordered and ordered items", () => {
      const content = "- unordered\n\n1. ordered";
      const view = createView(content);

      const hiddenLines = view.dom.querySelectorAll(".cm-list-blank-hidden");
      expect(hiddenLines.length).toBe(1);
    });
  });
});
