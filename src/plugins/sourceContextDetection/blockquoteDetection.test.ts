/**
 * Tests for blockquoteDetection — blockquote detection, nesting, unnesting,
 * and removal in source mode.
 */

import { describe, it, expect } from "vitest";
import { EditorState, EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

import {
  isBlockquoteLine,
  getBlockquoteInfo,
  nestBlockquote,
  unnestBlockquote,
  removeBlockquote,
} from "./blockquoteDetection";

function createView(doc: string, pos?: number): EditorView {
  const parent = document.createElement("div");
  const selection = pos !== undefined
    ? EditorSelection.cursor(pos)
    : EditorSelection.cursor(0);
  const state = EditorState.create({ doc, selection });
  return new EditorView({ state, parent });
}

describe("isBlockquoteLine", () => {
  it("returns true for simple blockquote", () => {
    expect(isBlockquoteLine("> text")).toBe(true);
  });

  it("returns true for nested blockquote", () => {
    expect(isBlockquoteLine(">> text")).toBe(true);
  });

  it("returns true for blockquote with leading space", () => {
    expect(isBlockquoteLine(" > text")).toBe(true);
  });

  it("returns true for empty blockquote marker", () => {
    expect(isBlockquoteLine(">")).toBe(true);
  });

  it("returns true for deeply nested blockquote", () => {
    expect(isBlockquoteLine(">>> deep")).toBe(true);
  });

  it("returns false for plain text", () => {
    expect(isBlockquoteLine("plain text")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isBlockquoteLine("")).toBe(false);
  });

  it("returns false for code block", () => {
    expect(isBlockquoteLine("```")).toBe(false);
  });

  it("returns false for text with > in middle", () => {
    expect(isBlockquoteLine("hello > world")).toBe(false);
  });
});

describe("getBlockquoteInfo", () => {
  it("returns null for non-blockquote line", () => {
    const view = createView("Hello world", 3);
    const info = getBlockquoteInfo(view);
    expect(info).toBeNull();
    view.destroy();
  });

  it("detects single-line blockquote", () => {
    const view = createView("> quote text", 3);
    const info = getBlockquoteInfo(view);
    expect(info).not.toBeNull();
    expect(info!.level).toBe(1);
    expect(info!.startLine).toBe(1);
    expect(info!.endLine).toBe(1);
    view.destroy();
  });

  it("detects multi-line blockquote", () => {
    const view = createView("> line 1\n> line 2\n> line 3", 3);
    const info = getBlockquoteInfo(view);
    expect(info!.startLine).toBe(1);
    expect(info!.endLine).toBe(3);
    expect(info!.from).toBe(0);
    view.destroy();
  });

  it("detects nested blockquote level", () => {
    const view = createView(">> nested", 3);
    const info = getBlockquoteInfo(view);
    expect(info!.level).toBe(2);
    view.destroy();
  });

  it("detects deeply nested blockquote level (3 levels)", () => {
    const view = createView(">>> deep", 4);
    const info = getBlockquoteInfo(view);
    expect(info!.level).toBe(3);
    view.destroy();
  });

  it("stops at non-blockquote lines above", () => {
    const view = createView("paragraph\n> quote\n> line 2", 12);
    const info = getBlockquoteInfo(view);
    expect(info!.startLine).toBe(2); // line 2 (1-based)
    expect(info!.endLine).toBe(3);
    view.destroy();
  });

  it("stops at non-blockquote lines below", () => {
    const view = createView("> quote\n> line 2\nparagraph", 3);
    const info = getBlockquoteInfo(view);
    expect(info!.startLine).toBe(1);
    expect(info!.endLine).toBe(2);
    view.destroy();
  });

  it("uses explicit pos parameter", () => {
    const view = createView("plain\n> quote", 2);
    const info = getBlockquoteInfo(view, 8);
    expect(info).not.toBeNull();
    expect(info!.level).toBe(1);
    view.destroy();
  });

  it("returns null for empty line", () => {
    const view = createView("", 0);
    const info = getBlockquoteInfo(view);
    expect(info).toBeNull();
    view.destroy();
  });

  it("handles blockquote containing code-like content", () => {
    const view = createView("> ```code```", 3);
    const info = getBlockquoteInfo(view);
    expect(info).not.toBeNull();
    expect(info!.level).toBe(1);
    view.destroy();
  });

  it("handles blockquote at start of document", () => {
    const view = createView("> first line\n> second line", 3);
    const info = getBlockquoteInfo(view);
    expect(info!.startLine).toBe(1);
    expect(info!.endLine).toBe(2);
    view.destroy();
  });

  it("scans upward to line 1 when entire document is blockquote (covers line 71 loop exit)", () => {
    // When upward scan reaches line 1 without finding a non-blockquote line,
    // startLine = lineNum (1) from the final iteration (line 71)
    const view = createView("> line 1\n> line 2\n> line 3", 15); // cursor on line 2
    const info = getBlockquoteInfo(view);
    expect(info!.startLine).toBe(1);
    expect(info!.endLine).toBe(3);
    view.destroy();
  });

  it("scans downward to last line when document ends with blockquote (covers line 82 loop exit)", () => {
    // When downward scan reaches totalLines without finding a non-blockquote line,
    // endLine = lineNum from the final iteration (line 82)
    const view = createView("> line 1\n> line 2\n> line 3", 20); // cursor on line 3
    const info = getBlockquoteInfo(view);
    expect(info!.startLine).toBe(1);
    expect(info!.endLine).toBe(3);
    view.destroy();
  });

  it("handles cursor on second line scanning upward past one blockquote line", () => {
    // Ensures the upward scan loop iterates and sets startLine = lineNum (line 71)
    const view = createView("> first\n> second", 10); // cursor on second line
    const info = getBlockquoteInfo(view);
    expect(info!.startLine).toBe(1);
    expect(info!.endLine).toBe(2);
    view.destroy();
  });

  it("handles blockquote at end of document", () => {
    const view = createView("paragraph\n> last line", 12);
    const info = getBlockquoteInfo(view);
    expect(info!.endLine).toBe(2);
    view.destroy();
  });

  it("reports correct lineStart and lineEnd", () => {
    const view = createView("> line one", 3);
    const info = getBlockquoteInfo(view);
    expect(info!.lineStart).toBe(0);
    expect(info!.lineEnd).toBe(10);
    view.destroy();
  });

  it("handles CJK content in blockquote", () => {
    const view = createView("> 你好世界", 3);
    const info = getBlockquoteInfo(view);
    expect(info).not.toBeNull();
    expect(info!.level).toBe(1);
    view.destroy();
  });
});

describe("nestBlockquote", () => {
  it("adds nested > to each line", () => {
    const view = createView("> line 1\n> line 2", 3);
    const info = getBlockquoteInfo(view)!;
    nestBlockquote(view, info);
    expect(view.state.doc.toString()).toBe("> > line 1\n> > line 2");
    view.destroy();
  });

  it("nests single-line blockquote", () => {
    const view = createView("> text", 3);
    const info = getBlockquoteInfo(view)!;
    nestBlockquote(view, info);
    expect(view.state.doc.toString()).toBe("> > text");
    view.destroy();
  });

  it("does nothing when no changes are needed (empty changes array)", () => {
    // Craft a blockquote info that covers a line range with lines that have no > match
    // This is synthetic: we pass an info pointing to lines that aren't blockquotes
    const view = createView("plain text", 3);
    const fakeInfo = { startLine: 1, endLine: 1, from: 0, to: 10, level: 0, lineStart: 0, lineEnd: 10 };
    nestBlockquote(view, fakeInfo);
    // No changes should be dispatched — document stays the same
    expect(view.state.doc.toString()).toBe("plain text");
    view.destroy();
  });
});

describe("unnestBlockquote", () => {
  it("removes one > level from each line", () => {
    const view = createView(">> line 1\n>> line 2", 4);
    const info = getBlockquoteInfo(view)!;
    unnestBlockquote(view, info);
    expect(view.state.doc.toString()).toBe("> line 1\n> line 2");
    view.destroy();
  });

  it("removes blockquote entirely when single level", () => {
    const view = createView("> text", 3);
    const info = getBlockquoteInfo(view)!;
    unnestBlockquote(view, info);
    expect(view.state.doc.toString()).toBe("text");
    view.destroy();
  });

  it("does nothing when no > markers match (empty changes)", () => {
    const view = createView("plain text", 3);
    const fakeInfo = { startLine: 1, endLine: 1, from: 0, to: 10, level: 0, lineStart: 0, lineEnd: 10 };
    unnestBlockquote(view, fakeInfo);
    expect(view.state.doc.toString()).toBe("plain text");
    view.destroy();
  });
});

describe("removeBlockquote", () => {
  it("removes all > markers from each line", () => {
    const view = createView(">> deep\n> shallow", 4);
    const info = getBlockquoteInfo(view)!;
    removeBlockquote(view, info);
    expect(view.state.doc.toString()).toBe("deep\nshallow");
    view.destroy();
  });

  it("removes single-level blockquote", () => {
    const view = createView("> text", 3);
    const info = getBlockquoteInfo(view)!;
    removeBlockquote(view, info);
    expect(view.state.doc.toString()).toBe("text");
    view.destroy();
  });

  it("removes multi-line blockquote", () => {
    const view = createView("> line 1\n> line 2\n> line 3", 3);
    const info = getBlockquoteInfo(view)!;
    removeBlockquote(view, info);
    expect(view.state.doc.toString()).toBe("line 1\nline 2\nline 3");
    view.destroy();
  });

  it("handles blockquote with mixed nesting levels", () => {
    const view = createView("> level 1\n>> level 2", 3);
    const info = getBlockquoteInfo(view)!;
    removeBlockquote(view, info);
    expect(view.state.doc.toString()).toBe("level 1\nlevel 2");
    view.destroy();
  });

  it("does nothing when no > markers match (empty changes)", () => {
    const view = createView("plain text", 3);
    const fakeInfo = { startLine: 1, endLine: 1, from: 0, to: 10, level: 0, lineStart: 0, lineEnd: 10 };
    removeBlockquote(view, fakeInfo);
    expect(view.state.doc.toString()).toBe("plain text");
    view.destroy();
  });
});
