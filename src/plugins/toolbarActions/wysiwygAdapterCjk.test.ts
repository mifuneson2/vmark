import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all external dependencies
vi.mock("@/hooks/useWindowFocus", () => ({
  getWindowLabel: vi.fn(() => "main"),
}));

vi.mock("@/stores/documentStore", () => ({
  useDocumentStore: {
    getState: vi.fn(() => ({
      getDocument: vi.fn(() => ({ hardBreakStyle: "unknown" })),
      setLineMetadata: vi.fn(),
    })),
  },
}));

vi.mock("@/stores/settingsStore", () => ({
  useSettingsStore: {
    getState: vi.fn(() => ({
      cjkFormatting: { addSpaces: true, quoteStyle: "smart" },
      markdown: {
        preserveLineBreaks: false,
        hardBreakStyleOnSave: "twoSpaces",
      },
    })),
  },
}));

vi.mock("@/stores/tabStore", () => ({
  useTabStore: {
    getState: vi.fn(() => ({
      activeTabId: { main: "tab-1" },
    })),
  },
}));

vi.mock("@/lib/cjkFormatter", () => ({
  collapseNewlines: vi.fn((s: string) => s.replace(/\n{3,}/g, "\n\n")),
  formatMarkdown: vi.fn((s: string) => `formatted:${s}`),
  formatSelection: vi.fn((s: string) => `sel-formatted:${s}`),
  removeTrailingSpaces: vi.fn((s: string) => s.replace(/ +$/gm, "")),
}));

vi.mock("@/utils/linebreaks", () => ({
  normalizeLineEndings: vi.fn((s: string, target: string) => target === "crlf" ? s.replace(/\n/g, "\r\n") : s.replace(/\r\n/g, "\n")),
  resolveHardBreakStyle: vi.fn(() => "twoSpaces"),
}));

vi.mock("@/utils/markdownPipeline", () => ({
  parseMarkdown: vi.fn((_schema: unknown, content: string) => ({ content: `parsed:${content}` })),
  serializeMarkdown: vi.fn(() => "# original markdown"),
}));

import {
  handleFormatCJK,
  handleFormatCJKFile,
  handleRemoveTrailingSpaces,
  handleCollapseBlankLines,
  handleLineEndings,
} from "./wysiwygAdapterCjk";
import { formatSelection } from "@/lib/cjkFormatter";
import { serializeMarkdown, parseMarkdown } from "@/utils/markdownPipeline";
import { useDocumentStore } from "@/stores/documentStore";
import { useTabStore } from "@/stores/tabStore";
import type { WysiwygToolbarContext } from "./types";

function createMockContext(opts?: {
  selectionEmpty?: boolean;
  selectedText?: string;
  depth?: number;
}): WysiwygToolbarContext {
  const selectionEmpty = opts?.selectionEmpty ?? true;
  const selectedText = opts?.selectedText ?? "hello world";
  const depth = opts?.depth ?? 1;

  const tr = {
    replaceWith: vi.fn().mockReturnThis(),
    setMeta: vi.fn().mockReturnThis(),
  };

  const dispatch = vi.fn();
  const focus = vi.fn();

  const blockNode = {
    nodeSize: 20,
    content: "mock-content",
  };

  const schema = {
    text: vi.fn((t: string) => ({ text: t })),
    nodes: {
      doc: { create: vi.fn((_attrs: unknown, child: unknown) => child) },
    },
  };

  const $from = {
    depth,
    node: vi.fn(() => blockNode),
    before: vi.fn(() => 5),
    after: vi.fn(() => 25),
  };

  return {
    surface: "wysiwyg",
    view: {
      state: {
        selection: {
          $from,
          from: 10,
          to: selectionEmpty ? 10 : 20,
          empty: selectionEmpty,
        },
        doc: {
          textBetween: vi.fn(() => selectedText),
          content: { size: 100 },
          nodesBetween: vi.fn(),
        },
        tr,
        schema,
      },
      dispatch,
      focus,
    } as never,
    editor: {
      schema,
      state: {
        selection: {
          $from,
          from: 10,
          to: selectionEmpty ? 10 : 20,
          empty: selectionEmpty,
        },
        doc: { content: { size: 100 } },
      },
      commands: { focus },
    } as never,
    context: null,
  };
}

describe("handleFormatCJK", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when view is null", () => {
    const ctx = createMockContext();
    ctx.view = null;
    expect(handleFormatCJK(ctx)).toBe(false);
  });

  it("returns false when editor is null", () => {
    const ctx = createMockContext();
    ctx.editor = null;
    expect(handleFormatCJK(ctx)).toBe(false);
  });

  it("formats selected text when selection is not empty", () => {
    const ctx = createMockContext({ selectionEmpty: false, selectedText: "hello世界" });

    vi.mocked(formatSelection).mockReturnValue("hello 世界");

    const result = handleFormatCJK(ctx);
    expect(result).toBe(true);
    expect(formatSelection).toHaveBeenCalled();
    expect(ctx.view!.dispatch).toHaveBeenCalled();
    expect(ctx.view!.focus).toHaveBeenCalled();
  });

  it("does not dispatch when formatted text is unchanged", () => {
    const ctx = createMockContext({ selectionEmpty: false, selectedText: "already formatted" });

    vi.mocked(formatSelection).mockReturnValue("already formatted");

    const result = handleFormatCJK(ctx);
    expect(result).toBe(true);
    expect(ctx.view!.dispatch).not.toHaveBeenCalled();
  });

  it("falls back to block formatting when selection is empty", () => {
    const ctx = createMockContext({ selectionEmpty: true });

    // Block formatting path: serializes block, formats, parses back
    vi.mocked(serializeMarkdown).mockReturnValue("block content");
    vi.mocked(parseMarkdown).mockReturnValue({ content: "parsed" } as never);

    const result = handleFormatCJK(ctx);
    expect(result).toBe(true);
  });

  it("returns false for block formatting when depth < 1", () => {
    const ctx = createMockContext({ selectionEmpty: true, depth: 0 });
    expect(handleFormatCJK(ctx)).toBe(false);
  });
});

describe("handleFormatCJKFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when editor is null", () => {
    const ctx = createMockContext();
    ctx.editor = null;
    expect(handleFormatCJKFile(ctx)).toBe(false);
  });

  it("returns false when view is null", () => {
    const ctx = createMockContext();
    ctx.view = null;
    expect(handleFormatCJKFile(ctx)).toBe(false);
  });

  it("applies formatMarkdown transform to full document", () => {
    const ctx = createMockContext();
    vi.mocked(serializeMarkdown).mockReturnValue("original");
    vi.mocked(parseMarkdown).mockReturnValue({ content: "new" } as never);

    const result = handleFormatCJKFile(ctx);
    expect(result).toBe(true);
  });
});

describe("handleRemoveTrailingSpaces", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when editor is null", () => {
    const ctx = createMockContext();
    ctx.editor = null;
    expect(handleRemoveTrailingSpaces(ctx)).toBe(false);
  });

  it("applies removeTrailingSpaces transform", () => {
    const ctx = createMockContext();
    vi.mocked(serializeMarkdown).mockReturnValue("hello   ");
    vi.mocked(parseMarkdown).mockReturnValue({ content: "new" } as never);

    const result = handleRemoveTrailingSpaces(ctx);
    expect(result).toBe(true);
  });
});

describe("handleCollapseBlankLines", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when editor is null", () => {
    const ctx = createMockContext();
    ctx.editor = null;
    expect(handleCollapseBlankLines(ctx)).toBe(false);
  });

  it("applies collapseNewlines transform", () => {
    const ctx = createMockContext();
    vi.mocked(serializeMarkdown).mockReturnValue("a\n\n\nb");
    vi.mocked(parseMarkdown).mockReturnValue({ content: "new" } as never);

    const result = handleCollapseBlankLines(ctx);
    expect(result).toBe(true);
  });
});

describe("handleLineEndings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes to LF and updates store metadata", () => {
    const setLineMetadata = vi.fn();
    vi.mocked(useDocumentStore.getState).mockReturnValue({
      getDocument: vi.fn(() => ({ hardBreakStyle: "unknown" })),
      setLineMetadata,
    } as never);

    const ctx = createMockContext();
    vi.mocked(serializeMarkdown).mockReturnValue("hello\r\nworld");
    vi.mocked(parseMarkdown).mockReturnValue({ content: "new" } as never);

    const result = handleLineEndings(ctx, "lf");
    expect(result).toBe(true);
    expect(setLineMetadata).toHaveBeenCalledWith("tab-1", { lineEnding: "lf" });
  });

  it("normalizes to CRLF and updates store metadata", () => {
    const setLineMetadata = vi.fn();
    vi.mocked(useDocumentStore.getState).mockReturnValue({
      getDocument: vi.fn(() => ({ hardBreakStyle: "unknown" })),
      setLineMetadata,
    } as never);

    const ctx = createMockContext();
    vi.mocked(serializeMarkdown).mockReturnValue("hello\nworld");
    vi.mocked(parseMarkdown).mockReturnValue({ content: "new" } as never);

    const result = handleLineEndings(ctx, "crlf");
    expect(result).toBe(true);
    expect(setLineMetadata).toHaveBeenCalledWith("tab-1", { lineEnding: "crlf" });
  });

  it("returns true even when no active tab (metadata update skipped)", () => {
    vi.mocked(useDocumentStore.getState).mockReturnValue({
      getDocument: vi.fn(() => ({ hardBreakStyle: "unknown" })),
      setLineMetadata: vi.fn(),
    } as never);

    // No active tab
    vi.mocked(useTabStore.getState).mockReturnValue({
      activeTabId: {},
    } as never);

    const ctx = createMockContext();
    vi.mocked(serializeMarkdown).mockReturnValue("content");

    const result = handleLineEndings(ctx, "lf");
    expect(result).toBe(true);
  });
});
