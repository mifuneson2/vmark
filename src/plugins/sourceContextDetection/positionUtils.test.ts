import { describe, it, expect } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import {
  getSelectionRect,
  getCursorRect,
  getContextModeSource,
} from "./positionUtils";

function createView(
  doc: string,
  cursor: number,
  head?: number
): EditorView {
  const state = EditorState.create({
    doc,
    selection: { anchor: cursor, head: head ?? cursor },
  });
  return new EditorView({ state, parent: document.createElement("div") });
}

describe("getContextModeSource", () => {
  it("returns 'format' when there is a selection", () => {
    const view = createView("hello world", 0, 5); // "hello" selected
    expect(getContextModeSource(view)).toBe("format");
    view.destroy();
  });

  it("returns 'format' when cursor is in a word", () => {
    const view = createView("hello world", 3); // inside "hello"
    expect(getContextModeSource(view)).toBe("format");
    view.destroy();
  });

  it("returns 'block-insert' at start of empty line", () => {
    const doc = "first\n\nthird";
    const view = createView(doc, 6); // at start of blank line
    expect(getContextModeSource(view)).toBe("block-insert");
    view.destroy();
  });

  it("returns 'inline-insert' when cursor not in word and not at blank line", () => {
    const doc = "hello world";
    const view = createView(doc, 5); // at space between words
    expect(getContextModeSource(view)).toBe("inline-insert");
    view.destroy();
  });

  it("returns 'block-insert' for whitespace-only line at start", () => {
    const doc = "text\n   \nmore";
    const view = createView(doc, 5); // start of "   " line
    expect(getContextModeSource(view)).toBe("block-insert");
    view.destroy();
  });

  it("returns 'block-insert' for empty document", () => {
    const view = createView("", 0);
    expect(getContextModeSource(view)).toBe("block-insert");
    view.destroy();
  });

  it("returns 'inline-insert' at end of non-empty line with no word", () => {
    const doc = "hello ";
    const view = createView(doc, 6); // after trailing space
    // Not at line start, not in word, line not blank
    expect(getContextModeSource(view)).toBe("inline-insert");
    view.destroy();
  });
});

describe("getSelectionRect", () => {
  it("throws in jsdom because coordsAtPos needs real layout", () => {
    // In jsdom, coordsAtPos throws because getClientRects is not available.
    // In a real browser, it would return coords or null.
    const view = createView("hello", 0);
    expect(() => getSelectionRect(view, 0, 5)).toThrow();
    view.destroy();
  });
});

describe("getCursorRect", () => {
  it("throws in jsdom because coordsAtPos needs real layout", () => {
    const view = createView("hello", 2);
    expect(() => getCursorRect(view, 2)).toThrow();
    view.destroy();
  });
});
