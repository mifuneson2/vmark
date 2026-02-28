/**
 * listContinuation Tests
 *
 * Tests for the Enter key handler in list items (source mode).
 */

import { describe, it, expect } from "vitest";
import { EditorState, EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { listContinuationKeymap } from "../listContinuation";

function createView(content: string, cursorPos: number): EditorView {
  const state = EditorState.create({
    doc: content,
    selection: { anchor: cursorPos },
  });
  return new EditorView({
    state,
    parent: document.createElement("div"),
  });
}

function createViewWithMultiCursor(content: string, positions: number[]): EditorView {
  const ranges = positions.map((pos) => EditorSelection.cursor(pos));
  const state = EditorState.create({
    doc: content,
    selection: EditorSelection.create(ranges, 0),
    extensions: [EditorState.allowMultipleSelections.of(true)],
  });
  return new EditorView({
    state,
    parent: document.createElement("div"),
  });
}

describe("listContinuation", () => {
  it("returns false for multi-cursor state", () => {
    const content = "- item one\n- item two";
    const view = createViewWithMultiCursor(content, [5, 16]);
    const result = listContinuationKeymap.run!(view);
    expect(result).toBe(false);
    view.destroy();
  });

  it("returns false for range selection", () => {
    const content = "- item one";
    const state = EditorState.create({
      doc: content,
      selection: { anchor: 2, head: 5 },
    });
    const view = new EditorView({
      state,
      parent: document.createElement("div"),
    });
    const result = listContinuationKeymap.run!(view);
    expect(result).toBe(false);
    view.destroy();
  });

  it("continues unordered list on Enter at end of non-empty item", () => {
    const content = "- hello";
    const view = createView(content, 7);
    const result = listContinuationKeymap.run!(view);
    expect(result).toBe(true);
    expect(view.state.doc.toString()).toBe("- hello\n- ");
    view.destroy();
  });

  it("removes marker on Enter in empty list item", () => {
    const content = "- ";
    const view = createView(content, 2);
    const result = listContinuationKeymap.run!(view);
    expect(result).toBe(true);
    // Marker removed, just empty line
    expect(view.state.doc.toString()).toBe("");
    view.destroy();
  });

  it("returns false when cursor is not in a list", () => {
    const content = "plain text";
    const view = createView(content, 5);
    const result = listContinuationKeymap.run!(view);
    expect(result).toBe(false);
    view.destroy();
  });
});
