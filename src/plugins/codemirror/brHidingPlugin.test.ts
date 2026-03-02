/**
 * Tests for BR Tag Hiding Plugin
 *
 * Tests that <br /> lines are decorated with a hidden class when enabled,
 * and that the plugin handles various br tag formats and edge cases.
 */

import { describe, it, expect, afterEach } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { createBrHidingPlugin } from "./brHidingPlugin";

const views: EditorView[] = [];

afterEach(() => {
  views.forEach((v) => v.destroy());
  views.length = 0;
});

function createView(content: string, hide: boolean): EditorView {
  const plugin = createBrHidingPlugin(hide);
  const state = EditorState.create({
    doc: content,
    extensions: Array.isArray(plugin) ? plugin : [plugin],
  });
  const container = document.createElement("div");
  document.body.appendChild(container);
  const view = new EditorView({ state, parent: container });
  views.push(view);
  return view;
}

function getHiddenLineCount(view: EditorView): number {
  const lines = view.dom.querySelectorAll(".cm-br-hidden");
  return lines.length;
}

describe("createBrHidingPlugin", () => {
  describe("when hide is false", () => {
    it("returns an empty array", () => {
      const result = createBrHidingPlugin(false);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it("does not add hidden class to br lines", () => {
      const view = createView("<br />", false);
      expect(getHiddenLineCount(view)).toBe(0);
    });
  });

  describe("when hide is true", () => {
    it("returns a ViewPlugin", () => {
      const result = createBrHidingPlugin(true);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(false);
    });

    it("decorates <br /> lines", () => {
      const view = createView("<br />", true);
      expect(getHiddenLineCount(view)).toBe(1);
    });

    it("decorates <br/> lines (no space)", () => {
      const view = createView("<br/>", true);
      expect(getHiddenLineCount(view)).toBe(1);
    });

    it("decorates <br> lines (no slash)", () => {
      const view = createView("<br>", true);
      expect(getHiddenLineCount(view)).toBe(1);
    });

    it("decorates lines with leading whitespace", () => {
      const view = createView("  <br />", true);
      expect(getHiddenLineCount(view)).toBe(1);
    });

    it("decorates lines with trailing whitespace", () => {
      const view = createView("<br />  ", true);
      expect(getHiddenLineCount(view)).toBe(1);
    });

    it("does not decorate lines with other content", () => {
      const view = createView("hello <br /> world", true);
      expect(getHiddenLineCount(view)).toBe(0);
    });

    it("does not decorate lines with text before br", () => {
      const view = createView("text<br />", true);
      expect(getHiddenLineCount(view)).toBe(0);
    });

    it("handles multiple br lines", () => {
      const view = createView("<br />\n<br />\n<br />", true);
      expect(getHiddenLineCount(view)).toBe(3);
    });

    it("handles mixed content with br lines", () => {
      const view = createView("hello\n<br />\nworld\n<br />", true);
      expect(getHiddenLineCount(view)).toBe(2);
    });

    it("handles empty document", () => {
      const view = createView("", true);
      expect(getHiddenLineCount(view)).toBe(0);
    });

    it("handles document with no br tags", () => {
      const view = createView("hello world\nno breaks here", true);
      expect(getHiddenLineCount(view)).toBe(0);
    });

    it("updates decorations on document change", () => {
      const view = createView("hello", true);
      expect(getHiddenLineCount(view)).toBe(0);

      view.dispatch({
        changes: { from: 5, to: 5, insert: "\n<br />" },
      });

      expect(getHiddenLineCount(view)).toBe(1);
    });

    it("removes decorations when br line is edited", () => {
      const view = createView("<br />", true);
      expect(getHiddenLineCount(view)).toBe(1);

      // Replace br with normal text
      view.dispatch({
        changes: { from: 0, to: 6, insert: "hello" },
      });

      expect(getHiddenLineCount(view)).toBe(0);
    });

    it("handles tab-indented br tags", () => {
      const view = createView("\t<br />", true);
      expect(getHiddenLineCount(view)).toBe(1);
    });
  });
});
