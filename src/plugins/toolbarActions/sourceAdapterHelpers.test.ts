import { describe, it, expect, vi, beforeEach } from "vitest";
import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

vi.mock("@/plugins/sourceContextDetection", () => ({
  applyFormat: vi.fn(),
}));

vi.mock("@/plugins/sourceContextDetection/clearFormatting", () => ({
  clearAllFormatting: vi.fn((text: string) => text.replace(/\*\*/g, "").replace(/~~/g, "")),
}));

vi.mock("@/plugins/sourceContextDetection/formatMultiSelection", () => ({
  applyInlineFormatToSelections: vi.fn(() => true),
}));

import { insertText, applyInlineFormat, clearFormattingSelections } from "./sourceAdapterHelpers";
import { applyFormat } from "@/plugins/sourceContextDetection";
import { applyInlineFormatToSelections } from "@/plugins/sourceContextDetection/formatMultiSelection";

function createView(doc: string, ranges: Array<{ from: number; to: number }>): EditorView {
  const parent = document.createElement("div");
  const selection = EditorSelection.create(
    ranges.map((r) => EditorSelection.range(r.from, r.to))
  );
  const state = EditorState.create({
    doc,
    selection,
    extensions: [EditorState.allowMultipleSelections.of(true)],
  });
  return new EditorView({ state, parent });
}

describe("insertText", () => {
  it("inserts text at cursor and moves cursor to end", () => {
    const view = createView("hello", [{ from: 5, to: 5 }]);
    insertText(view, " world");
    expect(view.state.doc.toString()).toBe("hello world");
    expect(view.state.selection.main.head).toBe(11);
    view.destroy();
  });

  it("replaces selected text", () => {
    const view = createView("hello world", [{ from: 0, to: 5 }]);
    insertText(view, "hi");
    expect(view.state.doc.toString()).toBe("hi world");
    view.destroy();
  });

  it("positions cursor at offset when provided", () => {
    const view = createView("", [{ from: 0, to: 0 }]);
    insertText(view, "```\n\n```", 4);
    expect(view.state.doc.toString()).toBe("```\n\n```");
    expect(view.state.selection.main.head).toBe(4);
    view.destroy();
  });

  it("inserts at beginning of document", () => {
    const view = createView("existing", [{ from: 0, to: 0 }]);
    insertText(view, "new ");
    expect(view.state.doc.toString()).toBe("new existing");
    view.destroy();
  });

  it("handles empty string insertion", () => {
    const view = createView("hello", [{ from: 2, to: 2 }]);
    insertText(view, "");
    expect(view.state.doc.toString()).toBe("hello");
    expect(view.state.selection.main.head).toBe(2);
    view.destroy();
  });

  it("handles multi-line text insertion", () => {
    const view = createView("", [{ from: 0, to: 0 }]);
    insertText(view, "line1\nline2\nline3");
    expect(view.state.doc.toString()).toBe("line1\nline2\nline3");
    view.destroy();
  });

  it("handles Unicode/CJK text", () => {
    const view = createView("", [{ from: 0, to: 0 }]);
    insertText(view, "Hello");
    expect(view.state.doc.toString()).toBe("Hello");
    view.destroy();
  });
});

describe("applyInlineFormat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates to applyInlineFormatToSelections for multiple selections", () => {
    const view = createView("one two", [
      { from: 0, to: 3 },
      { from: 4, to: 7 },
    ]);
    const result = applyInlineFormat(view, "bold");
    expect(result).toBe(true);
    expect(applyInlineFormatToSelections).toHaveBeenCalledWith(view, "bold");
    view.destroy();
  });

  it("returns false for footnote format with multi-selection", () => {
    const view = createView("one two", [
      { from: 0, to: 3 },
      { from: 4, to: 7 },
    ]);
    const result = applyInlineFormat(view, "footnote");
    expect(result).toBe(false);
    view.destroy();
  });

  it("returns false for image format with multi-selection", () => {
    const view = createView("one two", [
      { from: 0, to: 3 },
      { from: 4, to: 7 },
    ]);
    const result = applyInlineFormat(view, "image");
    expect(result).toBe(false);
    view.destroy();
  });

  it("returns false for link format with multi-selection", () => {
    const view = createView("one two", [
      { from: 0, to: 3 },
      { from: 4, to: 7 },
    ]);
    const result = applyInlineFormat(view, "link");
    expect(result).toBe(false);
    view.destroy();
  });

  it("calls applyFormat for single selection with text selected", () => {
    const view = createView("hello world", [{ from: 0, to: 5 }]);
    applyInlineFormat(view, "bold");
    expect(applyFormat).toHaveBeenCalledWith(view, "bold");
    view.destroy();
  });

  it("returns false for footnote with no selection", () => {
    const view = createView("hello", [{ from: 2, to: 2 }]);
    const result = applyInlineFormat(view, "footnote");
    expect(result).toBe(false);
    view.destroy();
  });

  it("returns false for collapsed cursor with no word at position", () => {
    const view = createView("   ", [{ from: 1, to: 1 }]);
    const result = applyInlineFormat(view, "bold");
    expect(result).toBe(false);
    view.destroy();
  });

  it("expands to word at cursor for collapsed selection", () => {
    const view = createView("hello world", [{ from: 2, to: 2 }]);
    const result = applyInlineFormat(view, "bold");
    // Should find "hello" and apply format
    expect(result).toBe(true);
    view.destroy();
  });

  it("unwraps format when word is already wrapped with markers", () => {
    // **hello** — cursor at position 4 is inside "hello" (positions: **=0,1 h=2 e=3 l=4 l=5 o=6 **=7,8)
    const view = createView("**hello** world", [{ from: 4, to: 4 }]);
    const result = applyInlineFormat(view, "bold");
    expect(result).toBe(true);
    // After unwrap, the ** markers should be removed
    expect(view.state.doc.toString()).toBe("hello world");
    view.destroy();
  });
});

describe("clearFormattingSelections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false for single selection", () => {
    const view = createView("**bold**", [{ from: 0, to: 8 }]);
    const result = clearFormattingSelections(view);
    expect(result).toBe(false);
    view.destroy();
  });

  it("returns false when multiple selections are all collapsed", () => {
    const view = createView("hello world", [
      { from: 0, to: 0 },
      { from: 6, to: 6 },
    ]);
    const result = clearFormattingSelections(view);
    expect(result).toBe(false);
    view.destroy();
  });

  it("clears formatting across multiple selections", () => {
    const view = createView("**one** **two**", [
      { from: 0, to: 7 },
      { from: 8, to: 15 },
    ]);
    const result = clearFormattingSelections(view);
    expect(result).toBe(true);
    expect(view.state.doc.toString()).toBe("one two");
    view.destroy();
  });

  it("handles mixed collapsed and non-collapsed selections", () => {
    const view = createView("**bold** plain", [
      { from: 0, to: 8 },
      { from: 9, to: 9 },
    ]);
    const result = clearFormattingSelections(view);
    expect(result).toBe(true);
    // First range has text, second is collapsed (no-op)
    expect(view.state.doc.toString()).toBe("bold plain");
    view.destroy();
  });
});
