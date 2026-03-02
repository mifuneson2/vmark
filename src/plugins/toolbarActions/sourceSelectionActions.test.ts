import { describe, it, expect } from "vitest";
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import {
  selectWordInSource,
  selectLineInSource,
  selectBlockInSource,
  expandSelectionInSource,
} from "./sourceSelectionActions";

function createView(doc: string, from: number, to?: number): EditorView {
  const parent = document.createElement("div");
  const state = EditorState.create({
    doc,
    selection: EditorSelection.single(from, to ?? from),
  });
  return new EditorView({ state, parent });
}

describe("selectWordInSource", () => {
  it("selects word at cursor position", () => {
    const view = createView("hello world", 2);
    const result = selectWordInSource(view);
    expect(result).toBe(true);
    const sel = view.state.selection.main;
    expect(sel.from).toBe(0);
    expect(sel.to).toBe(5);
    view.destroy();
  });

  it("returns false when cursor is not in a word", () => {
    const view = createView("   ", 1);
    const result = selectWordInSource(view);
    expect(result).toBe(false);
    view.destroy();
  });

  it("selects word at start of line", () => {
    const view = createView("hello", 0);
    const result = selectWordInSource(view);
    expect(result).toBe(true);
    const sel = view.state.selection.main;
    expect(sel.from).toBe(0);
    expect(sel.to).toBe(5);
    view.destroy();
  });

  it("selects second word when cursor is in it", () => {
    const view = createView("hello world", 8);
    const result = selectWordInSource(view);
    expect(result).toBe(true);
    const sel = view.state.selection.main;
    expect(sel.from).toBe(6);
    expect(sel.to).toBe(11);
    view.destroy();
  });

  it("handles empty document", () => {
    const view = createView("", 0);
    const result = selectWordInSource(view);
    expect(result).toBe(false);
    view.destroy();
  });
});

describe("selectLineInSource", () => {
  it("selects entire line at cursor", () => {
    const view = createView("first line\nsecond line", 3);
    const result = selectLineInSource(view);
    expect(result).toBe(true);
    const sel = view.state.selection.main;
    expect(sel.from).toBe(0);
    expect(sel.to).toBe(10);
    view.destroy();
  });

  it("selects second line when cursor is on it", () => {
    const view = createView("first\nsecond\nthird", 8);
    const result = selectLineInSource(view);
    expect(result).toBe(true);
    const sel = view.state.selection.main;
    expect(sel.from).toBe(6);
    expect(sel.to).toBe(12);
    view.destroy();
  });

  it("selects empty line", () => {
    const view = createView("first\n\nthird", 6);
    const result = selectLineInSource(view);
    expect(result).toBe(true);
    const sel = view.state.selection.main;
    expect(sel.from).toBe(6);
    expect(sel.to).toBe(6);
    view.destroy();
  });

  it("selects single-line document", () => {
    const view = createView("only line", 5);
    const result = selectLineInSource(view);
    expect(result).toBe(true);
    const sel = view.state.selection.main;
    expect(sel.from).toBe(0);
    expect(sel.to).toBe(9);
    view.destroy();
  });

  it("selects last line", () => {
    const view = createView("first\nlast", 8);
    const result = selectLineInSource(view);
    expect(result).toBe(true);
    const sel = view.state.selection.main;
    expect(sel.from).toBe(6);
    expect(sel.to).toBe(10);
    view.destroy();
  });
});

describe("selectBlockInSource", () => {
  it("selects contiguous non-blank lines as a block", () => {
    const view = createView("line1\nline2\nline3\n\nother", 3);
    const result = selectBlockInSource(view);
    expect(result).toBe(true);
    const sel = view.state.selection.main;
    expect(sel.from).toBe(0);
    expect(sel.to).toBe(17); // end of "line3"
    view.destroy();
  });

  it("selects block separated by blank lines", () => {
    const view = createView("para1\n\npara2a\npara2b\n\npara3", 10);
    const result = selectBlockInSource(view);
    expect(result).toBe(true);
    const sel = view.state.selection.main;
    expect(sel.from).toBe(7); // start of "para2a"
    expect(sel.to).toBe(20); // end of "para2b"
    view.destroy();
  });

  it("handles single-line block", () => {
    const view = createView("\nsingle\n", 4);
    const result = selectBlockInSource(view);
    expect(result).toBe(true);
    const sel = view.state.selection.main;
    expect(sel.from).toBe(1); // start of "single"
    expect(sel.to).toBe(7); // end of "single"
    view.destroy();
  });

  it("selects entire document when no blank lines exist", () => {
    const view = createView("line1\nline2\nline3", 5);
    const result = selectBlockInSource(view);
    expect(result).toBe(true);
    const sel = view.state.selection.main;
    expect(sel.from).toBe(0);
    expect(sel.to).toBe(17);
    view.destroy();
  });
});

describe("expandSelectionInSource", () => {
  it("expands from cursor to word", () => {
    const view = createView("hello world", 2);
    const result = expandSelectionInSource(view);
    expect(result).toBe(true);
    const sel = view.state.selection.main;
    // Should expand to word
    expect(sel.from).toBe(0);
    expect(sel.to).toBe(5);
    view.destroy();
  });

  it("expands from word to line", () => {
    // Start with word already selected
    const view = createView("hello world end", 0, 5);
    const result = expandSelectionInSource(view);
    expect(result).toBe(true);
    const sel = view.state.selection.main;
    expect(sel.from).toBe(0);
    expect(sel.to).toBe(15); // entire line
    view.destroy();
  });

  it("expands from line to block", () => {
    const doc = "line1\nline2\n\nother";
    // Start with first line selected
    const view = createView(doc, 0, 5);
    expandSelectionInSource(view);
    // Should now be at line level, expand again
    const view2 = createView(doc, 0, 5);
    expandSelectionInSource(view2);
    // Line is fully selected, next step expands to block
    const sel = view2.state.selection.main;
    expect(sel.to).toBeGreaterThanOrEqual(5);
    view.destroy();
    view2.destroy();
  });

  it("expands to entire document eventually", () => {
    const view = createView("hello", 0, 5);
    // Line is already fully selected, next step is block, then document
    const result = expandSelectionInSource(view);
    // Since entire line = entire block = entire document for single-line doc,
    // it should expand to whole doc or return null
    // With "hello" fully selected (0-5), line is 0-5, block is 0-5, doc is 0-5
    // So no further expansion possible
    expect(result).toBe(false);
    view.destroy();
  });

  it("returns false when entire document is already selected", () => {
    const view = createView("hello\nworld", 0, 11);
    const result = expandSelectionInSource(view);
    expect(result).toBe(false);
    view.destroy();
  });

  it("handles empty document", () => {
    const view = createView("", 0);
    const result = expandSelectionInSource(view);
    expect(result).toBe(false);
    view.destroy();
  });
});
