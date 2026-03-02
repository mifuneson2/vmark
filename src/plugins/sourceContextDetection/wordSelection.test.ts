import { describe, it, expect, vi } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { getWordAtCursor, selectWordAtCursor } from "./wordSelection";

function createView(doc: string, cursor: number): EditorView {
  const state = EditorState.create({
    doc,
    selection: { anchor: cursor },
  });
  return new EditorView({ state, parent: document.createElement("div") });
}

describe("getWordAtCursor", () => {
  it("returns word range when cursor is inside a word", () => {
    const view = createView("hello world", 3); // inside "hello"
    const range = getWordAtCursor(view);

    expect(range).not.toBeNull();
    // The word "hello" starts at 0
    expect(range!.from).toBe(0);
    expect(range!.to).toBe(5);
    view.destroy();
  });

  it("returns null when cursor is in whitespace", () => {
    const view = createView("hello world", 5); // at space
    const range = getWordAtCursor(view);
    expect(range).toBeNull();
    view.destroy();
  });

  it("returns null for empty document", () => {
    const view = createView("", 0);
    const range = getWordAtCursor(view);
    expect(range).toBeNull();
    view.destroy();
  });

  it("detects word at beginning of line", () => {
    const doc = "first second";
    const view = createView(doc, 3); // inside "first"
    const range = getWordAtCursor(view);

    expect(range).not.toBeNull();
    expect(range!.from).toBe(0);
    expect(range!.to).toBe(5);
    view.destroy();
  });

  it("detects word at end of line", () => {
    const doc = "hello world";
    const view = createView(doc, 8); // inside "world"
    const range = getWordAtCursor(view);

    expect(range).not.toBeNull();
    expect(range!.from).toBe(6);
    expect(range!.to).toBe(11);
    view.destroy();
  });

  it("works on multiline document", () => {
    const doc = "line one\nline two";
    // "line two" starts at position 9, "two" starts at 14
    const view = createView(doc, 15); // inside "two"
    const range = getWordAtCursor(view);

    expect(range).not.toBeNull();
    // "two" starts at position 14 (9 + 5)
    expect(range!.from).toBe(14);
    expect(range!.to).toBe(17);
    view.destroy();
  });

  it("returns null when cursor is at start of line", () => {
    const doc = "hello";
    const view = createView(doc, 0); // at very start
    const range = getWordAtCursor(view);
    // findWordBoundaries requires cursor to be strictly inside word
    expect(range).toBeNull();
    view.destroy();
  });

  it("returns null for whitespace-only line", () => {
    const view = createView("   ", 1);
    const range = getWordAtCursor(view);
    expect(range).toBeNull();
    view.destroy();
  });

  it("returns null when cursor is at punctuation", () => {
    const doc = "hello, world";
    const view = createView(doc, 5); // at comma
    const range = getWordAtCursor(view);
    // Punctuation is not a word
    expect(range).toBeNull();
    view.destroy();
  });
});

describe("selectWordAtCursor", () => {
  it("selects word and returns range", () => {
    const view = createView("hello world", 3);
    const range = selectWordAtCursor(view);

    expect(range).not.toBeNull();
    expect(range!.from).toBe(0);
    expect(range!.to).toBe(5);

    // Check that the editor selection was updated
    const { anchor, head } = view.state.selection.main;
    expect(anchor).toBe(0);
    expect(head).toBe(5);
    view.destroy();
  });

  it("returns null and does not change selection when not in word", () => {
    const view = createView("hello world", 5); // at space
    const originalAnchor = view.state.selection.main.anchor;
    const range = selectWordAtCursor(view);

    expect(range).toBeNull();
    // Selection should not change
    expect(view.state.selection.main.anchor).toBe(originalAnchor);
    view.destroy();
  });

  it("returns null for empty document", () => {
    const view = createView("", 0);
    expect(selectWordAtCursor(view)).toBeNull();
    view.destroy();
  });
});
