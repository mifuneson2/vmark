/**
 * Tests for vmarkHandlers — vmark.insertMathInline, vmark.insertMathBlock,
 * vmark.insertMermaid, vmark.insertSvg, vmark.insertWikiLink,
 * vmark.cjkPunctuationConvert, vmark.cjkSpacingFix.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock utils
const mockRespond = vi.fn();
const mockGetEditor = vi.fn();
vi.mock("../utils", () => ({
  respond: (response: unknown) => mockRespond(response),
  getEditor: () => mockGetEditor(),
}));

// Mock CJK formatter
vi.mock("@/lib/cjkFormatter/rules", () => ({
  addCJKEnglishSpacing: (text: string) => text.replace(/([\u4e00-\u9fff])([A-Za-z])/g, "$1 $2"),
}));

import {
  handleInsertMathInline,
  handleInsertMathBlock,
  handleInsertMermaid,
  handleInsertMarkmap,
  handleInsertSvg,
  handleInsertWikiLink,
  handleCjkPunctuationConvert,
  handleCjkSpacingFix,
} from "../vmarkHandlers";

function createMockEditor(overrides?: Record<string, unknown>) {
  const chainMethods = {
    focus: vi.fn().mockReturnThis(),
    insertContent: vi.fn().mockReturnThis(),
    deleteRange: vi.fn().mockReturnThis(),
    insertContentAt: vi.fn().mockReturnThis(),
    run: vi.fn(),
  };
  return {
    commands: {},
    chain: vi.fn().mockReturnValue(chainMethods),
    state: {
      selection: { from: 0, to: 0, empty: true },
      doc: { textBetween: vi.fn().mockReturnValue("") },
    },
    ...overrides,
    _chainMethods: chainMethods,
  };
}

describe("vmarkHandlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("handleInsertMathInline", () => {
    it("inserts inline math node", async () => {
      const editor = createMockEditor();
      mockGetEditor.mockReturnValue(editor);

      await handleInsertMathInline("req-1", { latex: "E = mc^2" });

      expect(editor._chainMethods.insertContent).toHaveBeenCalledWith({
        type: "math_inline",
        attrs: { content: "E = mc^2" },
      });
      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-1",
        success: true,
        data: null,
      });
    });

    it("returns error when latex is missing", async () => {
      mockGetEditor.mockReturnValue(createMockEditor());

      await handleInsertMathInline("req-2", {});

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-2",
        success: false,
        error: "latex is required",
      });
    });

    it("returns error when no editor", async () => {
      mockGetEditor.mockReturnValue(null);

      await handleInsertMathInline("req-3", { latex: "x" });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-3",
        success: false,
        error: "No active editor",
      });
    });
  });

  describe("handleInsertMathBlock", () => {
    it("inserts code block with latex language", async () => {
      const editor = createMockEditor();
      mockGetEditor.mockReturnValue(editor);

      await handleInsertMathBlock("req-4", { latex: "\\sum_{i=1}^n" });

      expect(editor._chainMethods.insertContent).toHaveBeenCalledWith({
        type: "codeBlock",
        attrs: { language: "latex" },
        content: [{ type: "text", text: "\\sum_{i=1}^n" }],
      });
    });

    it("returns error when latex is missing", async () => {
      mockGetEditor.mockReturnValue(createMockEditor());

      await handleInsertMathBlock("req-5", {});

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-5",
        success: false,
        error: "latex is required",
      });
    });

    it("returns error when no editor", async () => {
      mockGetEditor.mockReturnValue(null);

      await handleInsertMathBlock("req-5b", { latex: "x" });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-5b",
        success: false,
        error: "No active editor",
      });
    });
  });

  describe("handleInsertMarkmap", () => {
    it("inserts code block with markmap language", async () => {
      const editor = createMockEditor();
      mockGetEditor.mockReturnValue(editor);

      await handleInsertMarkmap("req-markmap", { code: "# Root\n## Child" });

      expect(editor._chainMethods.insertContent).toHaveBeenCalledWith({
        type: "codeBlock",
        attrs: { language: "markmap" },
        content: [{ type: "text", text: "# Root\n## Child" }],
      });
    });

    it("returns error when no editor for markmap", async () => {
      mockGetEditor.mockReturnValue(null);

      await handleInsertMarkmap("req-markmap-no-editor", { code: "# Root" });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-markmap-no-editor",
        success: false,
        error: "No active editor",
      });
    });
  });

  describe("handleInsertMermaid", () => {
    it("inserts code block with mermaid language", async () => {
      const editor = createMockEditor();
      mockGetEditor.mockReturnValue(editor);

      await handleInsertMermaid("req-6", { code: "graph LR\n  A-->B" });

      expect(editor._chainMethods.insertContent).toHaveBeenCalledWith({
        type: "codeBlock",
        attrs: { language: "mermaid" },
        content: [{ type: "text", text: "graph LR\n  A-->B" }],
      });
    });

    it("returns error when code is missing", async () => {
      mockGetEditor.mockReturnValue(createMockEditor());

      await handleInsertMermaid("req-7", {});

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-7",
        success: false,
        error: "code is required",
      });
    });
  });

  describe("handleInsertSvg", () => {
    it("inserts code block with svg language", async () => {
      const editor = createMockEditor();
      mockGetEditor.mockReturnValue(editor);

      await handleInsertSvg("req-8", { code: "<svg></svg>" });

      expect(editor._chainMethods.insertContent).toHaveBeenCalledWith({
        type: "codeBlock",
        attrs: { language: "svg" },
        content: [{ type: "text", text: "<svg></svg>" }],
      });
    });
  });

  describe("handleInsertWikiLink", () => {
    it("inserts wiki link with target only", async () => {
      const editor = createMockEditor();
      mockGetEditor.mockReturnValue(editor);

      await handleInsertWikiLink("req-9", { target: "MyPage" });

      expect(editor._chainMethods.insertContent).toHaveBeenCalledWith({
        type: "wikiLink",
        attrs: { value: "MyPage", alias: null },
      });
    });

    it("inserts wiki link with display text", async () => {
      const editor = createMockEditor();
      mockGetEditor.mockReturnValue(editor);

      await handleInsertWikiLink("req-10", {
        target: "MyPage",
        displayText: "My Link",
      });

      expect(editor._chainMethods.insertContent).toHaveBeenCalledWith({
        type: "wikiLink",
        attrs: { value: "MyPage", alias: "My Link" },
      });
    });

    it("returns error when target is missing", async () => {
      mockGetEditor.mockReturnValue(createMockEditor());

      await handleInsertWikiLink("req-11", {});

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-11",
        success: false,
        error: "target is required",
      });
    });

    it("returns error when no editor", async () => {
      mockGetEditor.mockReturnValue(null);

      await handleInsertWikiLink("req-11b", { target: "Page" });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-11b",
        success: false,
        error: "No active editor",
      });
    });
  });

  describe("handleCjkPunctuationConvert", () => {
    it("converts half-width to full-width", async () => {
      const editor = createMockEditor({
        state: {
          selection: { from: 0, to: 5, empty: false },
          doc: { textBetween: vi.fn().mockReturnValue("Hello, world!") },
        },
      });
      mockGetEditor.mockReturnValue(editor);

      await handleCjkPunctuationConvert("req-12", {
        direction: "to-fullwidth",
      });

      expect(editor._chainMethods.insertContentAt).toHaveBeenCalledWith(
        0,
        expect.stringContaining("，")
      );
    });

    it("returns error for invalid direction", async () => {
      mockGetEditor.mockReturnValue(createMockEditor());

      await handleCjkPunctuationConvert("req-13", { direction: "invalid" });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-13",
        success: false,
        error: 'direction must be "to-fullwidth" or "to-halfwidth"',
      });
    });

    it("returns error when no text selected", async () => {
      const editor = createMockEditor();
      mockGetEditor.mockReturnValue(editor);

      await handleCjkPunctuationConvert("req-14", {
        direction: "to-fullwidth",
      });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-14",
        success: false,
        error: "No text selected",
      });
    });

    it("returns error when no editor", async () => {
      mockGetEditor.mockReturnValue(null);

      await handleCjkPunctuationConvert("req-14b", { direction: "to-fullwidth" });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-14b",
        success: false,
        error: "No active editor",
      });
    });

    it("converts full-width to half-width (to-halfwidth direction)", async () => {
      const editor = createMockEditor({
        state: {
          selection: { from: 0, to: 3, empty: false },
          doc: { textBetween: vi.fn().mockReturnValue("，。！") },
        },
      });
      mockGetEditor.mockReturnValue(editor);

      await handleCjkPunctuationConvert("req-14c", { direction: "to-halfwidth" });

      expect(editor._chainMethods.insertContentAt).toHaveBeenCalledWith(
        0,
        expect.stringContaining(",")
      );
      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-14c",
        success: true,
        data: null,
      });
    });
  });

  describe("handleCjkSpacingFix", () => {
    it("returns error for invalid action", async () => {
      mockGetEditor.mockReturnValue(createMockEditor());

      await handleCjkSpacingFix("req-15", { action: "invalid" });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-15",
        success: false,
        error: 'action must be "add" or "remove"',
      });
    });

    it("returns error when no text selected", async () => {
      mockGetEditor.mockReturnValue(createMockEditor());

      await handleCjkSpacingFix("req-16", { action: "add" });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-16",
        success: false,
        error: "No text selected",
      });
    });

    it("adds CJK spacing when action is add", async () => {
      const editor = createMockEditor({
        state: {
          selection: { from: 0, to: 10, empty: false },
          doc: { textBetween: vi.fn().mockReturnValue("你好world") },
        },
      });
      mockGetEditor.mockReturnValue(editor);

      await handleCjkSpacingFix("req-17", { action: "add" });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-17",
        success: true,
        data: null,
      });
    });

    it("returns error when no editor", async () => {
      mockGetEditor.mockReturnValue(null);

      await handleCjkSpacingFix("req-17b", { action: "add" });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-17b",
        success: false,
        error: "No active editor",
      });
    });

    it("removes CJK spacing when action is remove", async () => {
      const editor = createMockEditor({
        state: {
          selection: { from: 0, to: 12, empty: false },
          doc: { textBetween: vi.fn().mockReturnValue("你好 world 测试 test") },
        },
      });
      mockGetEditor.mockReturnValue(editor);

      await handleCjkSpacingFix("req-18", { action: "remove" });

      expect(editor._chainMethods.insertContentAt).toHaveBeenCalledWith(
        0,
        expect.stringContaining("你好world")
      );
      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-18",
        success: true,
        data: null,
      });
    });
  });

  describe("non-Error thrown values (String(error) branch)", () => {
    it("handleInsertMathInline handles non-Error thrown value", async () => {
      mockGetEditor.mockImplementation(() => {
        throw "raw string error";
      });

      await handleInsertMathInline("req-str-1", { latex: "x" });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-str-1",
        success: false,
        error: "raw string error",
      });
    });

    it("handleInsertMathBlock handles non-Error thrown value", async () => {
      mockGetEditor.mockImplementation(() => {
        throw 42;
      });

      await handleInsertMathBlock("req-str-2", { latex: "x" });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-str-2",
        success: false,
        error: "42",
      });
    });

    it("handleInsertMermaid handles non-Error thrown value (covers handleInsertCodeBlock catch)", async () => {
      mockGetEditor.mockImplementation(() => {
        throw "code block error";
      });

      await handleInsertMermaid("req-str-3", { code: "graph LR" });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-str-3",
        success: false,
        error: "code block error",
      });
    });

    it("handleInsertWikiLink handles non-Error thrown value", async () => {
      mockGetEditor.mockImplementation(() => {
        throw null;
      });

      await handleInsertWikiLink("req-str-4", { target: "Page" });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-str-4",
        success: false,
        error: "null",
      });
    });

    it("handleCjkPunctuationConvert handles non-Error thrown value", async () => {
      mockGetEditor.mockImplementation(() => {
        throw "punct error";
      });

      await handleCjkPunctuationConvert("req-str-5", { direction: "to-fullwidth" });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-str-5",
        success: false,
        error: "punct error",
      });
    });

    it("handleCjkSpacingFix handles non-Error thrown value", async () => {
      mockGetEditor.mockImplementation(() => {
        throw "spacing error";
      });

      await handleCjkSpacingFix("req-str-6", { action: "add" });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-str-6",
        success: false,
        error: "spacing error",
      });
    });
  });
});
