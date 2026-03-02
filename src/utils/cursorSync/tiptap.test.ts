import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock tiptapAnchors before importing
vi.mock("./tiptapAnchors", () => ({
  getBlockAnchor: vi.fn(() => undefined),
  restoreCursorInTable: vi.fn(() => false),
  restoreCursorInCodeBlock: vi.fn(() => false),
}));

import { getCursorInfoFromTiptap, restoreCursorInTiptap } from "./tiptap";
import { getBlockAnchor, restoreCursorInTable, restoreCursorInCodeBlock } from "./tiptapAnchors";
import { Schema } from "@tiptap/pm/model";
import { EditorState, TextSelection, Selection } from "@tiptap/pm/state";
import type { CursorInfo } from "@/types/cursorSync";

// Schema with sourceLine support
const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: {
      content: "text*",
      group: "block",
      attrs: { sourceLine: { default: null } },
      parseDOM: [{ tag: "p" }],
      toDOM() {
        return ["p", 0];
      },
    },
    heading: {
      content: "text*",
      group: "block",
      attrs: { sourceLine: { default: null }, level: { default: 1 } },
      parseDOM: [{ tag: "h1" }],
      toDOM() {
        return ["h1", 0];
      },
    },
    codeBlock: {
      content: "text*",
      group: "block",
      code: true,
      attrs: { sourceLine: { default: null }, language: { default: null } },
      parseDOM: [{ tag: "pre" }],
      toDOM() {
        return ["pre", 0];
      },
    },
    blockquote: {
      content: "block+",
      group: "block",
      attrs: { sourceLine: { default: null } },
      parseDOM: [{ tag: "blockquote" }],
      toDOM() {
        return ["blockquote", 0];
      },
    },
    text: { inline: true },
  },
});

function para(text: string, sourceLine: number | null = null) {
  const content = text ? [schema.text(text)] : [];
  return schema.node("paragraph", { sourceLine }, content);
}

function heading(text: string, sourceLine: number | null = null) {
  const content = text ? [schema.text(text)] : [];
  return schema.node("heading", { sourceLine, level: 1 }, content);
}

function codeBlock(text: string, sourceLine: number | null = null) {
  const content = text ? [schema.text(text)] : [];
  return schema.node("codeBlock", { sourceLine }, content);
}

function createState(doc: ReturnType<typeof schema.node>, pos?: number) {
  const state = EditorState.create({ doc, schema });
  if (pos !== undefined) {
    const clampedPos = Math.min(pos, doc.content.size);
    return state.apply(
      state.tr.setSelection(TextSelection.create(state.doc, clampedPos))
    );
  }
  return state;
}

function createMockView(state: EditorState) {
  const dispatchedTrs: unknown[] = [];
  return {
    state,
    dispatch: vi.fn((tr: unknown) => {
      dispatchedTrs.push(tr);
    }),
    _dispatched: dispatchedTrs,
  };
}

beforeEach(() => {
  vi.mocked(getBlockAnchor).mockReturnValue(undefined);
  vi.mocked(restoreCursorInTable).mockReturnValue(false);
  vi.mocked(restoreCursorInCodeBlock).mockReturnValue(false);
});

describe("getCursorInfoFromTiptap", () => {
  it("extracts basic cursor info from paragraph", () => {
    const doc = schema.node("doc", null, [para("hello world", 1)]);
    // Position 4 -> inside "hello world" at offset 3 from para start
    const state = createState(doc, 4);
    const view = createMockView(state);

    const info = getCursorInfoFromTiptap(view as never);
    expect(info.sourceLine).toBe(1);
    expect(info.nodeType).toBe("paragraph");
    expect(info.wordAtCursor).toBe("hello");
  });

  it("detects heading node type", () => {
    const doc = schema.node("doc", null, [heading("Title", 1)]);
    const state = createState(doc, 2);
    const view = createMockView(state);

    const info = getCursorInfoFromTiptap(view as never);
    expect(info.nodeType).toBe("heading");
  });

  it("detects code_block node type", () => {
    const doc = schema.node("doc", null, [codeBlock("const x = 1;", 5)]);
    const state = createState(doc, 3);
    const view = createMockView(state);

    const info = getCursorInfoFromTiptap(view as never);
    expect(info.nodeType).toBe("code_block");
  });

  it("detects blockquote node type", () => {
    const bq = schema.node("blockquote", { sourceLine: 3 }, [para("quoted", 3)]);
    const doc = schema.node("doc", null, [bq]);
    const state = createState(doc, 3);
    const view = createMockView(state);

    const info = getCursorInfoFromTiptap(view as never);
    expect(info.nodeType).toBe("blockquote");
  });

  it("falls back to estimateSourceLine when no sourceLine attr", () => {
    const doc = schema.node("doc", null, [para("no source line")]);
    const state = createState(doc, 2);
    const view = createMockView(state);

    const info = getCursorInfoFromTiptap(view as never);
    // estimateSourceLine defaults to 1
    expect(info.sourceLine).toBe(1);
  });

  it("calculates percentInLine correctly", () => {
    const doc = schema.node("doc", null, [para("1234567890", 1)]);
    // Position at offset 5 within the paragraph
    const state = createState(doc, 6); // +1 for node open
    const view = createMockView(state);

    const info = getCursorInfoFromTiptap(view as never);
    expect(info.percentInLine).toBeCloseTo(0.5, 1);
  });

  it("returns percentInLine 0 for empty text", () => {
    const doc = schema.node("doc", null, [para("", 1)]);
    const state = createState(doc, 1);
    const view = createMockView(state);

    const info = getCursorInfoFromTiptap(view as never);
    expect(info.percentInLine).toBe(0);
  });

  it("includes block anchor from getBlockAnchor", () => {
    vi.mocked(getBlockAnchor).mockReturnValue({
      kind: "code",
      lineInBlock: 2,
      columnInLine: 5,
    });
    const doc = schema.node("doc", null, [codeBlock("line0\nline1\nline2 text", 1)]);
    const state = createState(doc, 3);
    const view = createMockView(state);

    const info = getCursorInfoFromTiptap(view as never);
    expect(info.blockAnchor).toEqual({
      kind: "code",
      lineInBlock: 2,
      columnInLine: 5,
    });
  });
});

describe("restoreCursorInTiptap", () => {
  it("restores cursor to matching sourceLine paragraph", () => {
    const doc = schema.node("doc", null, [
      para("first", 1),
      para("second", 3),
      para("third", 5),
    ]);
    const state = createState(doc);
    const view = createMockView(state);

    const info: CursorInfo = {
      sourceLine: 3,
      wordAtCursor: "second",
      offsetInWord: 0,
      nodeType: "paragraph",
      percentInLine: 0,
      contextBefore: "",
      contextAfter: "second",
    };

    restoreCursorInTiptap(view as never, info);
    expect(view.dispatch).toHaveBeenCalled();
  });

  it("tries table restoration first when blockAnchor is table", () => {
    vi.mocked(restoreCursorInTable).mockReturnValue(true);
    const doc = schema.node("doc", null, [para("text", 1)]);
    const state = createState(doc);
    const view = createMockView(state);

    const info: CursorInfo = {
      sourceLine: 1,
      wordAtCursor: "",
      offsetInWord: 0,
      nodeType: "table_cell",
      percentInLine: 0,
      contextBefore: "",
      contextAfter: "",
      blockAnchor: { kind: "table", row: 0, col: 0, offsetInCell: 0 },
    };

    restoreCursorInTiptap(view as never, info);
    expect(restoreCursorInTable).toHaveBeenCalled();
    // Should not dispatch again since table restore returned true
    expect(view.dispatch).not.toHaveBeenCalled();
  });

  it("tries code block restoration when blockAnchor is code", () => {
    vi.mocked(restoreCursorInCodeBlock).mockReturnValue(true);
    const doc = schema.node("doc", null, [codeBlock("code", 1)]);
    const state = createState(doc);
    const view = createMockView(state);

    const info: CursorInfo = {
      sourceLine: 1,
      wordAtCursor: "",
      offsetInWord: 0,
      nodeType: "code_block",
      percentInLine: 0,
      contextBefore: "",
      contextAfter: "",
      blockAnchor: { kind: "code", lineInBlock: 0, columnInLine: 2 },
    };

    restoreCursorInTiptap(view as never, info);
    expect(restoreCursorInCodeBlock).toHaveBeenCalled();
    expect(view.dispatch).not.toHaveBeenCalled();
  });

  it("falls back to generic restore when block anchor restore fails", () => {
    vi.mocked(restoreCursorInCodeBlock).mockReturnValue(false);
    const doc = schema.node("doc", null, [para("fallback text", 1)]);
    const state = createState(doc);
    const view = createMockView(state);

    const info: CursorInfo = {
      sourceLine: 1,
      wordAtCursor: "fallback",
      offsetInWord: 0,
      nodeType: "code_block",
      percentInLine: 0,
      contextBefore: "",
      contextAfter: "fallback text",
      blockAnchor: { kind: "code", lineInBlock: 0, columnInLine: 0 },
    };

    restoreCursorInTiptap(view as never, info);
    expect(view.dispatch).toHaveBeenCalled();
  });

  it("falls back to closest sourceLine when exact match not found", () => {
    const doc = schema.node("doc", null, [
      para("line one", 1),
      para("line ten", 10),
    ]);
    const state = createState(doc);
    const view = createMockView(state);

    const info: CursorInfo = {
      sourceLine: 5,
      wordAtCursor: "",
      offsetInWord: 0,
      nodeType: "paragraph",
      percentInLine: 0,
      contextBefore: "",
      contextAfter: "",
    };

    restoreCursorInTiptap(view as never, info);
    expect(view.dispatch).toHaveBeenCalled();
  });

  it("goes to start when no matching node found", () => {
    const doc = schema.node("doc", null, [para("no source lines")]);
    const state = createState(doc);
    const view = createMockView(state);

    const info: CursorInfo = {
      sourceLine: 99,
      wordAtCursor: "",
      offsetInWord: 0,
      nodeType: "paragraph",
      percentInLine: 0,
      contextBefore: "",
      contextAfter: "",
    };

    restoreCursorInTiptap(view as never, info);
    // Should still dispatch something (either fallback or start)
    expect(view.dispatch).toHaveBeenCalled();
  });

  it("positions at end of line when percentInLine >= threshold", () => {
    const doc = schema.node("doc", null, [para("hello world", 1)]);
    const state = createState(doc);
    const view = createMockView(state);

    const info: CursorInfo = {
      sourceLine: 1,
      wordAtCursor: "",
      offsetInWord: 0,
      nodeType: "paragraph",
      percentInLine: 1.0,
      contextBefore: "",
      contextAfter: "",
    };

    restoreCursorInTiptap(view as never, info);
    expect(view.dispatch).toHaveBeenCalled();
  });

  it("uses context matching for column position", () => {
    const doc = schema.node("doc", null, [para("the quick brown fox", 1)]);
    const state = createState(doc);
    const view = createMockView(state);

    const info: CursorInfo = {
      sourceLine: 1,
      wordAtCursor: "brown",
      offsetInWord: 2,
      nodeType: "paragraph",
      percentInLine: 0.5,
      contextBefore: "the quick ",
      contextAfter: "brown fox",
    };

    restoreCursorInTiptap(view as never, info);
    expect(view.dispatch).toHaveBeenCalled();
  });

  it("sets addToHistory meta to false", () => {
    const doc = schema.node("doc", null, [para("text", 1)]);
    const state = createState(doc);
    const view = createMockView(state);

    const info: CursorInfo = {
      sourceLine: 1,
      wordAtCursor: "",
      offsetInWord: 0,
      nodeType: "paragraph",
      percentInLine: 0,
      contextBefore: "",
      contextAfter: "",
    };

    restoreCursorInTiptap(view as never, info);
    expect(view.dispatch).toHaveBeenCalled();
    const tr = view.dispatch.mock.calls[0][0];
    expect(tr.getMeta("addToHistory")).toBe(false);
  });
});
