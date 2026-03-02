import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./table", () => ({
  getTableAnchorForLine: vi.fn(() => undefined),
  restoreTableColumnFromAnchor: vi.fn(() => null),
}));

import { getCursorInfoFromCodeMirror, restoreCursorInCodeMirror } from "./codemirror";
import type { CursorInfo } from "@/types/cursorSync";
import { getTableAnchorForLine, restoreTableColumnFromAnchor } from "./table";

// --- Mock EditorView builder ---

interface MockDoc {
  toString(): string;
  lineAt(pos: number): { number: number; from: number; to: number; text: string };
  line(n: number): { from: number; to: number; text: string };
  lines: number;
}

function buildMockDoc(content: string): MockDoc {
  const lines = content.split("\n");
  // Build line offsets
  const lineStarts: number[] = [];
  let offset = 0;
  for (const line of lines) {
    lineStarts.push(offset);
    offset += line.length + 1; // +1 for \n
  }

  return {
    toString: () => content,
    lines: lines.length,
    lineAt(pos: number) {
      for (let i = 0; i < lines.length; i++) {
        const from = lineStarts[i];
        const to = from + lines[i].length;
        if (pos >= from && pos <= to) {
          return { number: i + 1, from, to, text: lines[i] };
        }
      }
      // Fallback: last line
      const last = lines.length - 1;
      return {
        number: last + 1,
        from: lineStarts[last],
        to: lineStarts[last] + lines[last].length,
        text: lines[last],
      };
    },
    line(n: number) {
      const idx = n - 1;
      const from = lineStarts[idx];
      const to = from + lines[idx].length;
      return { from, to, text: lines[idx] };
    },
  };
}

interface MockViewOptions {
  content: string;
  cursorPos: number;
}

function buildMockView(opts: MockViewOptions) {
  const doc = buildMockDoc(opts.content);
  const dispatched: Array<{ selection: { anchor: number }; scrollIntoView: boolean }> = [];

  return {
    state: {
      selection: { main: { head: opts.cursorPos } },
      doc,
    },
    dispatch: vi.fn((args: { selection: { anchor: number }; scrollIntoView?: boolean }) => {
      dispatched.push({ selection: args.selection, scrollIntoView: !!args.scrollIntoView });
    }),
    _dispatched: dispatched,
  };
}

beforeEach(() => {
  vi.mocked(getTableAnchorForLine).mockReturnValue(undefined);
  vi.mocked(restoreTableColumnFromAnchor).mockReturnValue(null);
});

describe("getCursorInfoFromCodeMirror", () => {
  it("extracts cursor info from a simple paragraph", () => {
    const view = buildMockView({ content: "hello world", cursorPos: 3 });
    const info = getCursorInfoFromCodeMirror(view as never);
    expect(info.sourceLine).toBe(1);
    expect(info.nodeType).toBe("paragraph");
    expect(info.wordAtCursor).toBe("hello");
    expect(info.offsetInWord).toBe(3);
    expect(info.blockAnchor).toBeUndefined();
  });

  it("detects heading node type", () => {
    const view = buildMockView({ content: "# Heading", cursorPos: 4 });
    const info = getCursorInfoFromCodeMirror(view as never);
    expect(info.nodeType).toBe("heading");
    expect(info.sourceLine).toBe(1);
  });

  it("detects list item node type", () => {
    const view = buildMockView({ content: "- list item", cursorPos: 5 });
    const info = getCursorInfoFromCodeMirror(view as never);
    expect(info.nodeType).toBe("list_item");
  });

  it("extracts cursor info from second line", () => {
    const content = "first line\nsecond line";
    // Position at start of "second" => offset 11 (after \n)
    const view = buildMockView({ content, cursorPos: 14 });
    const info = getCursorInfoFromCodeMirror(view as never);
    expect(info.sourceLine).toBe(2);
  });

  it("detects code block inside fenced block", () => {
    const content = "```js\nconst x = 1;\n```";
    // Position inside code content (line 2, "const x = 1;")
    const view = buildMockView({ content, cursorPos: 6 });
    const info = getCursorInfoFromCodeMirror(view as never);
    expect(info.nodeType).toBe("code_block");
    expect(info.blockAnchor).toBeDefined();
    expect(info.blockAnchor!.kind).toBe("code");
  });

  it("provides code block anchor with lineInBlock and columnInLine", () => {
    const content = "```\nline0\nline1\n```";
    // Cursor at "line1" (line index 2), col 3
    // Offset: "```\nline0\n" = 10, then "lin" = 3 more = 13
    const view = buildMockView({ content, cursorPos: 13 });
    const info = getCursorInfoFromCodeMirror(view as never);
    expect(info.blockAnchor).toEqual({
      kind: "code",
      lineInBlock: 1,
      columnInLine: 3,
    });
  });

  it("detects table node type when table anchor is returned", () => {
    const content = "| a | b |\n|---|---|\n| 1 | 2 |";
    vi.mocked(getTableAnchorForLine).mockReturnValue({
      kind: "table",
      row: 0,
      col: 0,
      offsetInCell: 1,
    });
    const view = buildMockView({ content, cursorPos: 2 });
    const info = getCursorInfoFromCodeMirror(view as never);
    expect(info.nodeType).toBe("table_cell");
    expect(info.blockAnchor).toBeDefined();
    expect(info.blockAnchor!.kind).toBe("table");
  });

  it("calculates percentInLine for non-empty stripped text", () => {
    const view = buildMockView({ content: "hello world", cursorPos: 5 });
    const info = getCursorInfoFromCodeMirror(view as never);
    // column 5 on "hello world" (11 chars) -> stripped same
    expect(info.percentInLine).toBeCloseTo(5 / 11, 5);
  });

  it("returns percentInLine 0 for empty text", () => {
    const view = buildMockView({ content: "", cursorPos: 0 });
    const info = getCursorInfoFromCodeMirror(view as never);
    expect(info.percentInLine).toBe(0);
  });

  it("handles cursor at start of document", () => {
    const view = buildMockView({ content: "hello", cursorPos: 0 });
    const info = getCursorInfoFromCodeMirror(view as never);
    expect(info.sourceLine).toBe(1);
    expect(info.percentInLine).toBe(0);
  });

  it("handles cursor at end of document", () => {
    const view = buildMockView({ content: "hello", cursorPos: 5 });
    const info = getCursorInfoFromCodeMirror(view as never);
    expect(info.sourceLine).toBe(1);
    expect(info.percentInLine).toBe(1);
  });
});

describe("restoreCursorInCodeMirror", () => {
  it("restores cursor to correct line using sourceLine", () => {
    const content = "line one\nline two\nline three";
    const view = buildMockView({ content, cursorPos: 0 });
    const info: CursorInfo = {
      sourceLine: 2,
      wordAtCursor: "two",
      offsetInWord: 0,
      nodeType: "paragraph",
      percentInLine: 0.625, // 5/8
      contextBefore: "line ",
      contextAfter: "two",
      blockAnchor: undefined,
    };
    restoreCursorInCodeMirror(view as never, info);
    expect(view.dispatch).toHaveBeenCalled();
    const selection = view.dispatch.mock.calls[0][0].selection;
    // Should be on line 2, at the context match position
    const line2 = view.state.doc.line(2);
    expect(selection.anchor).toBeGreaterThanOrEqual(line2.from);
    expect(selection.anchor).toBeLessThanOrEqual(line2.to);
  });

  it("clamps sourceLine to valid range when too high", () => {
    const content = "only line";
    const view = buildMockView({ content, cursorPos: 0 });
    const info: CursorInfo = {
      sourceLine: 999,
      wordAtCursor: "",
      offsetInWord: 0,
      nodeType: "paragraph",
      percentInLine: 0,
      contextBefore: "",
      contextAfter: "",
    };
    restoreCursorInCodeMirror(view as never, info);
    expect(view.dispatch).toHaveBeenCalled();
    const selection = view.dispatch.mock.calls[0][0].selection;
    // Should clamp to last line
    expect(selection.anchor).toBeGreaterThanOrEqual(0);
  });

  it("restores cursor in code block using block anchor", () => {
    const content = "```\nline0\nline1\n```";
    const view = buildMockView({ content, cursorPos: 0 });
    const info: CursorInfo = {
      sourceLine: 1, // sourceLine points somewhere near the code block
      wordAtCursor: "",
      offsetInWord: 0,
      nodeType: "code_block",
      percentInLine: 0,
      contextBefore: "",
      contextAfter: "",
      blockAnchor: {
        kind: "code",
        lineInBlock: 1,
        columnInLine: 2,
      },
    };
    restoreCursorInCodeMirror(view as never, info);
    expect(view.dispatch).toHaveBeenCalled();
    const selection = view.dispatch.mock.calls[0][0].selection;
    // line1 starts at offset 10 ("```\nline0\n" = 10), + col 2 = 12
    expect(selection.anchor).toBe(12);
  });

  it("falls back to generic restore when code block anchor fails", () => {
    const content = "no code here";
    const view = buildMockView({ content, cursorPos: 0 });
    const info: CursorInfo = {
      sourceLine: 1,
      wordAtCursor: "",
      offsetInWord: 0,
      nodeType: "code_block",
      percentInLine: 0.5,
      contextBefore: "",
      contextAfter: "",
      blockAnchor: {
        kind: "code",
        lineInBlock: 0,
        columnInLine: 0,
      },
    };
    restoreCursorInCodeMirror(view as never, info);
    expect(view.dispatch).toHaveBeenCalled();
  });

  it("restores cursor in table using block anchor", () => {
    const content = "| a | b |\n|---|---|\n| 1 | 2 |";
    vi.mocked(restoreTableColumnFromAnchor).mockReturnValue(4);
    const view = buildMockView({ content, cursorPos: 0 });
    const info: CursorInfo = {
      sourceLine: 1,
      wordAtCursor: "",
      offsetInWord: 0,
      nodeType: "table_cell",
      percentInLine: 0,
      contextBefore: "",
      contextAfter: "",
      blockAnchor: {
        kind: "table",
        row: 0,
        col: 1,
        offsetInCell: 1,
      },
    };
    restoreCursorInCodeMirror(view as never, info);
    expect(view.dispatch).toHaveBeenCalled();
    const selection = view.dispatch.mock.calls[0][0].selection;
    // restoreTableColumnFromAnchor returned 4, so anchor = line.from + 4
    expect(selection.anchor).toBe(4);
  });

  it("uses context matching for column within heading", () => {
    const content = "## Hello World";
    const view = buildMockView({ content, cursorPos: 0 });
    const info: CursorInfo = {
      sourceLine: 1,
      wordAtCursor: "World",
      offsetInWord: 0,
      nodeType: "heading",
      percentInLine: 0,
      contextBefore: "Hello ",
      contextAfter: "World",
      blockAnchor: undefined,
    };
    restoreCursorInCodeMirror(view as never, info);
    expect(view.dispatch).toHaveBeenCalled();
    const selection = view.dispatch.mock.calls[0][0].selection;
    // "## " (3 chars marker) + "Hello " context match at idx 0 in stripped -> col 6
    // final = 6 + 3 (marker) = 9
    expect(selection.anchor).toBe(9);
  });

  it("uses percentage fallback for column when no match", () => {
    const content = "abcdefghij";
    const view = buildMockView({ content, cursorPos: 0 });
    const info: CursorInfo = {
      sourceLine: 1,
      wordAtCursor: "notfound",
      offsetInWord: 0,
      nodeType: "paragraph",
      percentInLine: 0.5,
      contextBefore: "xx",
      contextAfter: "yy",
      blockAnchor: undefined,
    };
    restoreCursorInCodeMirror(view as never, info);
    expect(view.dispatch).toHaveBeenCalled();
    const selection = view.dispatch.mock.calls[0][0].selection;
    expect(selection.anchor).toBe(5); // round(0.5 * 10)
  });

  it("handles empty document", () => {
    const content = "";
    const view = buildMockView({ content, cursorPos: 0 });
    const info: CursorInfo = {
      sourceLine: 1,
      wordAtCursor: "",
      offsetInWord: 0,
      nodeType: "paragraph",
      percentInLine: 0,
      contextBefore: "",
      contextAfter: "",
    };
    restoreCursorInCodeMirror(view as never, info);
    expect(view.dispatch).toHaveBeenCalled();
    const selection = view.dispatch.mock.calls[0][0].selection;
    expect(selection.anchor).toBe(0);
  });

  it("scrolls into view", () => {
    const content = "hello";
    const view = buildMockView({ content, cursorPos: 0 });
    const info: CursorInfo = {
      sourceLine: 1,
      wordAtCursor: "",
      offsetInWord: 0,
      nodeType: "paragraph",
      percentInLine: 0,
      contextBefore: "",
      contextAfter: "",
    };
    restoreCursorInCodeMirror(view as never, info);
    expect(view.dispatch.mock.calls[0][0].scrollIntoView).toBe(true);
  });
});
