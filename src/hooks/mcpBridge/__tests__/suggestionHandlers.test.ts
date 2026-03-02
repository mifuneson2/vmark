/**
 * Tests for suggestionHandlers — setContent, insertAtCursor, insertAtPosition,
 * selectionReplace, replaceInSource, suggestion.accept/reject/list/acceptAll/rejectAll.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock utils
const mockRespond = vi.fn();
const mockGetEditor = vi.fn();
const mockIsAutoApproveEnabled = vi.fn().mockReturnValue(true);
const mockGetActiveTabId = vi.fn().mockReturnValue("tab-1");
vi.mock("../utils", () => ({
  respond: (response: unknown) => mockRespond(response),
  getEditor: () => mockGetEditor(),
  isAutoApproveEnabled: () => mockIsAutoApproveEnabled(),
  getActiveTabId: () => mockGetActiveTabId(),
}));

// Mock suggestion store
const mockAddSuggestion = vi.fn().mockReturnValue("suggestion-1");
const mockGetSuggestion = vi.fn();
const mockAcceptSuggestion = vi.fn();
const mockRejectSuggestion = vi.fn();
const mockGetSortedSuggestions = vi.fn().mockReturnValue([]);
const mockAcceptAll = vi.fn();
const mockRejectAll = vi.fn();
const mockSuggestions = new Map();
vi.mock("@/stores/aiSuggestionStore", () => ({
  useAiSuggestionStore: {
    getState: () => ({
      addSuggestion: (...args: unknown[]) => mockAddSuggestion(...args),
      getSuggestion: (...args: unknown[]) => mockGetSuggestion(...args),
      acceptSuggestion: (...args: unknown[]) => mockAcceptSuggestion(...args),
      rejectSuggestion: (...args: unknown[]) => mockRejectSuggestion(...args),
      getSortedSuggestions: () => mockGetSortedSuggestions(),
      acceptAll: () => mockAcceptAll(),
      rejectAll: () => mockRejectAll(),
      suggestions: mockSuggestions,
      focusedSuggestionId: null,
    }),
  },
}));

// Mock markdown paste slice
const mockCreateMarkdownPasteSlice = vi.fn().mockReturnValue({ content: "mock" });
vi.mock("@/plugins/markdownPaste/tiptap", () => ({
  createMarkdownPasteSlice: (...args: unknown[]) =>
    mockCreateMarkdownPasteSlice(...args),
}));

// Mock serializer
vi.mock("@/utils/markdownPipeline", () => ({
  serializeMarkdown: vi.fn().mockReturnValue("# Hello\n\nWorld"),
}));

import {
  handleSetContent,
  handleInsertAtCursorWithSuggestion,
  handleInsertAtPositionWithSuggestion,
  handleSelectionReplaceWithSuggestion,
  handleDocumentReplaceInSourceWithSuggestion,
  handleSuggestionAccept,
  handleSuggestionReject,
  handleSuggestionList,
  handleSuggestionAcceptAll,
  handleSuggestionRejectAll,
} from "../suggestionHandlers";

/** Create a mock editor. */
function createMockEditor(opts?: {
  textContent?: string;
  selectionFrom?: number;
  selectionTo?: number;
  docSize?: number;
}) {
  const textContent = opts?.textContent ?? "";
  const docSize = opts?.docSize ?? 100;
  const selectionFrom = opts?.selectionFrom ?? 0;
  const selectionTo = opts?.selectionTo ?? selectionFrom;

  const tr = {
    replaceWith: vi.fn().mockReturnThis(),
    replaceSelection: vi.fn().mockReturnThis(),
    replaceRange: vi.fn().mockReturnThis(),
    setMeta: vi.fn().mockReturnThis(),
    scrollIntoView: vi.fn().mockReturnThis(),
  };

  return {
    state: {
      doc: {
        textContent,
        content: { size: docSize },
        textBetween: vi.fn().mockReturnValue("original text"),
      },
      selection: { from: selectionFrom, to: selectionTo },
      schema: {},
      tr,
    },
    view: {
      dispatch: vi.fn(),
    },
  };
}

describe("suggestionHandlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAutoApproveEnabled.mockReturnValue(true);
    mockSuggestions.clear();
  });

  // ── handleSetContent ────────────────────────────────────────────────

  describe("handleSetContent", () => {
    it("returns error when no editor", async () => {
      mockGetEditor.mockReturnValue(null);

      await handleSetContent("req-1", { content: "hello" });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-1",
        success: false,
        error: "No active editor",
      });
    });

    it("rejects setContent on non-empty document", async () => {
      mockGetEditor.mockReturnValue(
        createMockEditor({ textContent: "existing content" })
      );

      await handleSetContent("req-2", { content: "new content" });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(false);
      expect(call.error).toContain("only allowed on empty documents");
    });

    it("allows setContent on empty document", async () => {
      const editor = createMockEditor({ textContent: "", docSize: 2 });
      mockGetEditor.mockReturnValue(editor);

      await handleSetContent("req-3", { content: "# New Doc" });

      expect(editor.view.dispatch).toHaveBeenCalled();
      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.message).toContain("set successfully");
    });

    it("allows setContent on whitespace-only document", async () => {
      const editor = createMockEditor({ textContent: "   \n  ", docSize: 10 });
      mockGetEditor.mockReturnValue(editor);

      await handleSetContent("req-4", { content: "content" });

      expect(editor.view.dispatch).toHaveBeenCalled();
      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
    });

    it("returns error when content is not a string", async () => {
      mockGetEditor.mockReturnValue(
        createMockEditor({ textContent: "" })
      );

      await handleSetContent("req-5", { content: 123 });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-5",
        success: false,
        error: "content must be a string",
      });
    });
  });

  // ── handleInsertAtCursorWithSuggestion ──────────────────────────────

  describe("handleInsertAtCursorWithSuggestion", () => {
    it("returns error when no editor", async () => {
      mockGetEditor.mockReturnValue(null);

      await handleInsertAtCursorWithSuggestion("req-10", { text: "hi" });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-10",
        success: false,
        error: "No active editor",
      });
    });

    it("returns error when text is not a string", async () => {
      mockGetEditor.mockReturnValue(createMockEditor());

      await handleInsertAtCursorWithSuggestion("req-11", { text: 42 });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-11",
        success: false,
        error: "text must be a string",
      });
    });

    it("applies directly when auto-approve is enabled", async () => {
      const editor = createMockEditor({ selectionFrom: 5 });
      mockGetEditor.mockReturnValue(editor);
      mockIsAutoApproveEnabled.mockReturnValue(true);

      await handleInsertAtCursorWithSuggestion("req-12", { text: "inserted" });

      expect(editor.view.dispatch).toHaveBeenCalled();
      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.message).toContain("auto-approved");
      expect(call.data.position).toBe(5);
    });

    it("creates suggestion when auto-approve is disabled", async () => {
      const editor = createMockEditor({ selectionFrom: 10 });
      mockGetEditor.mockReturnValue(editor);
      mockIsAutoApproveEnabled.mockReturnValue(false);

      await handleInsertAtCursorWithSuggestion("req-13", { text: "new text" });

      expect(mockAddSuggestion).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "insert",
          from: 10,
          to: 10,
          newContent: "new text",
        })
      );
      const call = mockRespond.mock.calls[0][0];
      expect(call.data.suggestionId).toBe("suggestion-1");
      expect(call.data.message).toContain("suggestion");
    });
  });

  // ── handleInsertAtPositionWithSuggestion ────────────────────────────

  describe("handleInsertAtPositionWithSuggestion", () => {
    it("returns error when no editor", async () => {
      mockGetEditor.mockReturnValue(null);

      await handleInsertAtPositionWithSuggestion("req-20", {
        text: "hi",
        position: 0,
      });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-20",
        success: false,
        error: "No active editor",
      });
    });

    it("returns error when text is not a string", async () => {
      mockGetEditor.mockReturnValue(createMockEditor());

      await handleInsertAtPositionWithSuggestion("req-21", {
        text: 42,
        position: 0,
      });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-21",
        success: false,
        error: "text must be a string",
      });
    });

    it("returns error when position is not a number", async () => {
      mockGetEditor.mockReturnValue(createMockEditor());

      await handleInsertAtPositionWithSuggestion("req-22", {
        text: "hi",
        position: "abc",
      });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-22",
        success: false,
        error: "position must be a number",
      });
    });

    it("returns error for out-of-bounds position (negative)", async () => {
      mockGetEditor.mockReturnValue(createMockEditor({ docSize: 50 }));

      await handleInsertAtPositionWithSuggestion("req-23", {
        text: "hi",
        position: -1,
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(false);
      expect(call.error).toContain("Invalid position");
    });

    it("returns error for out-of-bounds position (too large)", async () => {
      mockGetEditor.mockReturnValue(createMockEditor({ docSize: 50 }));

      await handleInsertAtPositionWithSuggestion("req-24", {
        text: "hi",
        position: 100,
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(false);
      expect(call.error).toContain("Invalid position");
    });

    it("applies directly when auto-approve is enabled", async () => {
      const editor = createMockEditor({ docSize: 50 });
      mockGetEditor.mockReturnValue(editor);

      await handleInsertAtPositionWithSuggestion("req-25", {
        text: "inserted",
        position: 10,
      });

      expect(editor.view.dispatch).toHaveBeenCalled();
      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.message).toContain("auto-approved");
    });

    it("creates suggestion when auto-approve is disabled", async () => {
      mockGetEditor.mockReturnValue(createMockEditor({ docSize: 50 }));
      mockIsAutoApproveEnabled.mockReturnValue(false);

      await handleInsertAtPositionWithSuggestion("req-26", {
        text: "new text",
        position: 20,
      });

      expect(mockAddSuggestion).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "insert",
          from: 20,
          to: 20,
          newContent: "new text",
        })
      );
    });
  });

  // ── handleSelectionReplaceWithSuggestion ────────────────────────────

  describe("handleSelectionReplaceWithSuggestion", () => {
    it("returns error when no editor", async () => {
      mockGetEditor.mockReturnValue(null);

      await handleSelectionReplaceWithSuggestion("req-30", { text: "hi" });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-30",
        success: false,
        error: "No active editor",
      });
    });

    it("returns error when text is not a string", async () => {
      mockGetEditor.mockReturnValue(createMockEditor());

      await handleSelectionReplaceWithSuggestion("req-31", { text: 42 });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-31",
        success: false,
        error: "text must be a string",
      });
    });

    it("delegates to insertAtCursor when selection is collapsed", async () => {
      const editor = createMockEditor({ selectionFrom: 5, selectionTo: 5 });
      mockGetEditor.mockReturnValue(editor);

      await handleSelectionReplaceWithSuggestion("req-32", { text: "hi" });

      // Should behave like insert (auto-approve is on)
      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
    });

    it("replaces selection with auto-approve", async () => {
      const editor = createMockEditor({
        selectionFrom: 5,
        selectionTo: 15,
      });
      mockGetEditor.mockReturnValue(editor);

      await handleSelectionReplaceWithSuggestion("req-33", {
        text: "replacement",
      });

      expect(editor.view.dispatch).toHaveBeenCalled();
      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.message).toContain("auto-approved");
      expect(call.data.range).toEqual({ from: 5, to: 15 });
    });

    it("creates suggestion when auto-approve is disabled", async () => {
      const editor = createMockEditor({
        selectionFrom: 5,
        selectionTo: 15,
      });
      mockGetEditor.mockReturnValue(editor);
      mockIsAutoApproveEnabled.mockReturnValue(false);

      await handleSelectionReplaceWithSuggestion("req-34", {
        text: "replacement",
      });

      expect(mockAddSuggestion).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "replace",
          from: 5,
          to: 15,
          newContent: "replacement",
        })
      );
      const call = mockRespond.mock.calls[0][0];
      expect(call.data.suggestionId).toBe("suggestion-1");
    });
  });

  // ── handleDocumentReplaceInSourceWithSuggestion ─────────────────────

  describe("handleDocumentReplaceInSourceWithSuggestion", () => {
    it("returns error when no editor", async () => {
      mockGetEditor.mockReturnValue(null);

      await handleDocumentReplaceInSourceWithSuggestion("req-40", {
        search: "hello",
        replace: "world",
      });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-40",
        success: false,
        error: "No active editor",
      });
    });

    it("returns error when search is empty", async () => {
      mockGetEditor.mockReturnValue(createMockEditor());

      await handleDocumentReplaceInSourceWithSuggestion("req-41", {
        search: "",
        replace: "world",
      });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-41",
        success: false,
        error: "search must be a non-empty string",
      });
    });

    it("returns error when search is not a string", async () => {
      mockGetEditor.mockReturnValue(createMockEditor());

      await handleDocumentReplaceInSourceWithSuggestion("req-42", {
        search: 42,
        replace: "world",
      });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-42",
        success: false,
        error: "search must be a non-empty string",
      });
    });

    it("returns error when replace is not a string", async () => {
      mockGetEditor.mockReturnValue(createMockEditor());

      await handleDocumentReplaceInSourceWithSuggestion("req-43", {
        search: "hello",
        replace: 42,
      });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-43",
        success: false,
        error: "replace must be a string",
      });
    });

    it("returns zero matches when search not found", async () => {
      mockGetEditor.mockReturnValue(createMockEditor());
      // serializeMarkdown returns "# Hello\n\nWorld"

      await handleDocumentReplaceInSourceWithSuggestion("req-44", {
        search: "nonexistent-string-xyz",
        replace: "replacement",
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.count).toBe(0);
      expect(call.data.message).toContain("No matches");
    });

    it("replaces first occurrence with auto-approve", async () => {
      const editor = createMockEditor({ docSize: 50 });
      mockGetEditor.mockReturnValue(editor);

      await handleDocumentReplaceInSourceWithSuggestion("req-45", {
        search: "Hello",
        replace: "Hi",
      });

      expect(editor.view.dispatch).toHaveBeenCalled();
      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.count).toBe(1);
      expect(call.data.applied).toBe(true);
    });

    it("replaces all occurrences when all=true", async () => {
      const editor = createMockEditor({ docSize: 50 });
      mockGetEditor.mockReturnValue(editor);
      // serializeMarkdown mock returns "# Hello\n\nWorld" which has 1 "l" occurrence
      // but we test with a string that appears once

      await handleDocumentReplaceInSourceWithSuggestion("req-46", {
        search: "Hello",
        replace: "Hi",
        all: true,
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.applied).toBe(true);
    });

    it("creates suggestion when auto-approve is disabled", async () => {
      mockGetEditor.mockReturnValue(createMockEditor({ docSize: 50 }));
      mockIsAutoApproveEnabled.mockReturnValue(false);

      await handleDocumentReplaceInSourceWithSuggestion("req-47", {
        search: "Hello",
        replace: "Hi",
      });

      expect(mockAddSuggestion).toHaveBeenCalled();
      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.applied).toBe(false);
      expect(call.data.suggestionIds).toBeDefined();
    });

    it("uses normalized matching when exact match fails due to whitespace", async () => {
      const { serializeMarkdown } = await import("@/utils/markdownPipeline");
      // Content has extra spaces that won't exactly match the search
      vi.mocked(serializeMarkdown).mockReturnValue("Hello   World\n\nFoo");
      const editor = createMockEditor({ docSize: 50 });
      mockGetEditor.mockReturnValue(editor);

      await handleDocumentReplaceInSourceWithSuggestion("req-48", {
        search: "Hello World",
        replace: "Hi Globe",
      });

      expect(editor.view.dispatch).toHaveBeenCalled();
      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.count).toBe(1);
      expect(call.data.applied).toBe(true);

      // Reset mock
      vi.mocked(serializeMarkdown).mockReturnValue("# Hello\n\nWorld");
    });

    it("replaces all with normalized matching", async () => {
      const { serializeMarkdown } = await import("@/utils/markdownPipeline");
      vi.mocked(serializeMarkdown).mockReturnValue("Hello   World and Hello   World again");
      const editor = createMockEditor({ docSize: 80 });
      mockGetEditor.mockReturnValue(editor);

      await handleDocumentReplaceInSourceWithSuggestion("req-49", {
        search: "Hello World",
        replace: "Hi Globe",
        all: true,
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.count).toBe(2);
      expect(call.data.applied).toBe(true);

      vi.mocked(serializeMarkdown).mockReturnValue("# Hello\n\nWorld");
    });

    it("replaces all exact matches using parts.join", async () => {
      const { serializeMarkdown } = await import("@/utils/markdownPipeline");
      vi.mocked(serializeMarkdown).mockReturnValue("foo bar foo bar foo");
      const editor = createMockEditor({ docSize: 50 });
      mockGetEditor.mockReturnValue(editor);

      await handleDocumentReplaceInSourceWithSuggestion("req-50", {
        search: "foo",
        replace: "baz",
        all: true,
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.count).toBe(3);

      vi.mocked(serializeMarkdown).mockReturnValue("# Hello\n\nWorld");
    });

    it("replaces first exact occurrence using indexOf", async () => {
      const { serializeMarkdown } = await import("@/utils/markdownPipeline");
      vi.mocked(serializeMarkdown).mockReturnValue("foo bar foo bar");
      const editor = createMockEditor({ docSize: 50 });
      mockGetEditor.mockReturnValue(editor);

      await handleDocumentReplaceInSourceWithSuggestion("req-51", {
        search: "foo",
        replace: "baz",
        all: false,
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.count).toBe(1);

      vi.mocked(serializeMarkdown).mockReturnValue("# Hello\n\nWorld");
    });
  });

  // ── handleSuggestionAccept ──────────────────────────────────────────

  describe("handleSuggestionAccept", () => {
    it("returns error when suggestionId is not a string", async () => {
      await handleSuggestionAccept("req-50", { suggestionId: 42 });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-50",
        success: false,
        error: "suggestionId must be a string",
      });
    });

    it("returns error when suggestion is not found", async () => {
      mockGetSuggestion.mockReturnValue(null);

      await handleSuggestionAccept("req-51", { suggestionId: "nonexistent" });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(false);
      expect(call.error).toContain("Suggestion not found");
    });

    it("accepts suggestion successfully", async () => {
      mockGetSuggestion.mockReturnValue({ id: "s-1", type: "insert" });

      await handleSuggestionAccept("req-52", { suggestionId: "s-1" });

      expect(mockAcceptSuggestion).toHaveBeenCalledWith("s-1");
      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.message).toContain("accepted");
    });
  });

  // ── handleSuggestionReject ──────────────────────────────────────────

  describe("handleSuggestionReject", () => {
    it("returns error when suggestionId is not a string", async () => {
      await handleSuggestionReject("req-55", { suggestionId: 42 });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-55",
        success: false,
        error: "suggestionId must be a string",
      });
    });

    it("returns error when suggestion is not found", async () => {
      mockGetSuggestion.mockReturnValue(null);

      await handleSuggestionReject("req-56", { suggestionId: "nonexistent" });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(false);
      expect(call.error).toContain("Suggestion not found");
    });

    it("rejects suggestion successfully", async () => {
      mockGetSuggestion.mockReturnValue({ id: "s-2", type: "replace" });

      await handleSuggestionReject("req-57", { suggestionId: "s-2" });

      expect(mockRejectSuggestion).toHaveBeenCalledWith("s-2");
      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.message).toContain("rejected");
    });
  });

  // ── handleSuggestionList ────────────────────────────────────────────

  describe("handleSuggestionList", () => {
    it("returns empty list when no suggestions", async () => {
      mockGetSortedSuggestions.mockReturnValue([]);

      await handleSuggestionList("req-60");

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.suggestions).toEqual([]);
      expect(call.data.count).toBe(0);
    });

    it("returns list of suggestions", async () => {
      mockGetSortedSuggestions.mockReturnValue([
        {
          id: "s-1",
          type: "insert",
          from: 0,
          to: 0,
          newContent: "hello",
          originalContent: undefined,
          createdAt: 1000,
        },
        {
          id: "s-2",
          type: "replace",
          from: 5,
          to: 10,
          newContent: "world",
          originalContent: "old",
          createdAt: 2000,
        },
      ]);

      await handleSuggestionList("req-61");

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.count).toBe(2);
      expect(call.data.suggestions[0].id).toBe("s-1");
      expect(call.data.suggestions[1].id).toBe("s-2");
    });
  });

  // ── handleSuggestionAcceptAll ───────────────────────────────────────

  describe("handleSuggestionAcceptAll", () => {
    it("accepts all suggestions", async () => {
      mockSuggestions.set("s-1", {});
      mockSuggestions.set("s-2", {});

      await handleSuggestionAcceptAll("req-65");

      expect(mockAcceptAll).toHaveBeenCalled();
      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.count).toBe(2);
    });

    it("works with zero suggestions", async () => {
      await handleSuggestionAcceptAll("req-66");

      expect(mockAcceptAll).toHaveBeenCalled();
      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.count).toBe(0);
    });
  });

  // ── error catch branches in list/acceptAll/rejectAll ────────────────

  describe("handleSuggestionList — error catch branch", () => {
    it("returns error when getSortedSuggestions throws", async () => {
      mockGetSortedSuggestions.mockImplementation(() => {
        throw new Error("store error");
      });

      await handleSuggestionList("req-err-list");

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-err-list",
        success: false,
        error: "store error",
      });

      // Reset
      mockGetSortedSuggestions.mockReturnValue([]);
    });
  });

  describe("handleSuggestionAcceptAll — error catch branch", () => {
    it("returns error when acceptAll throws", async () => {
      mockAcceptAll.mockImplementation(() => {
        throw new Error("accept all error");
      });

      await handleSuggestionAcceptAll("req-err-aa");

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-err-aa",
        success: false,
        error: "accept all error",
      });

      // Reset
      mockAcceptAll.mockImplementation(() => {});
    });
  });

  // ── handleSuggestionRejectAll ───────────────────────────────────────

  describe("handleSuggestionRejectAll — error catch branch", () => {
    it("returns error when rejectAll throws", async () => {
      mockRejectAll.mockImplementation(() => {
        throw new Error("reject all error");
      });

      await handleSuggestionRejectAll("req-err-ra");

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-err-ra",
        success: false,
        error: "reject all error",
      });

      // Reset
      mockRejectAll.mockImplementation(() => {});
    });
  });

  describe("handleSuggestionList — non-Error throw", () => {
    it("handles non-Error thrown value", async () => {
      mockGetSortedSuggestions.mockImplementation(() => {
        throw "string error"; // eslint-disable-line no-throw-literal
      });

      await handleSuggestionList("req-ne-list");

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-ne-list",
        success: false,
        error: "string error",
      });
      mockGetSortedSuggestions.mockReturnValue([]);
    });
  });

  describe("handleSuggestionAcceptAll — non-Error throw", () => {
    it("handles non-Error thrown value", async () => {
      mockAcceptAll.mockImplementation(() => {
        throw 42; // eslint-disable-line no-throw-literal
      });

      await handleSuggestionAcceptAll("req-ne-aa");

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-ne-aa",
        success: false,
        error: "42",
      });
      mockAcceptAll.mockImplementation(() => {});
    });
  });

  describe("handleSuggestionRejectAll — non-Error throw", () => {
    it("handles non-Error thrown value", async () => {
      mockRejectAll.mockImplementation(() => {
        throw null; // eslint-disable-line no-throw-literal
      });

      await handleSuggestionRejectAll("req-ne-ra");

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-ne-ra",
        success: false,
        error: "null",
      });
      mockRejectAll.mockImplementation(() => {});
    });
  });

  describe("handleSuggestionRejectAll", () => {
    it("rejects all suggestions", async () => {
      mockSuggestions.set("s-1", {});
      mockSuggestions.set("s-2", {});
      mockSuggestions.set("s-3", {});

      await handleSuggestionRejectAll("req-70");

      expect(mockRejectAll).toHaveBeenCalled();
      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.count).toBe(3);
    });

    it("works with zero suggestions", async () => {
      await handleSuggestionRejectAll("req-71");

      expect(mockRejectAll).toHaveBeenCalled();
      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.count).toBe(0);
    });
  });

  // ── isDocumentEmpty — branch: editor is null → returns false (line 28) ──

  describe("isDocumentEmpty — coverage via handleSetContent", () => {
    it("isDocumentEmpty returns false for null editor (caught by no-editor check)", async () => {
      // handleSetContent calls getEditor() which returns null → throws before isDocumentEmpty
      // isDocumentEmpty(!editor) branch 0[0] is `!editor` → false when editor exists
      // We already test the !editor throw above; the branch is about !editor evaluating to false
      // meaning editor IS present. That path is already covered by other tests.
      // The uncovered stmt/branch is the `if (!editor) return false` inside isDocumentEmpty.
      // This is only reachable if isDocumentEmpty is called with null editor directly.
      // Since it's a private function, we exercise it indirectly:
      // When editor is null AND getEditor returns null, handleSetContent throws before calling isDocumentEmpty.
      // So the only uncovered path is isDocumentEmpty(null) → false.
      // However, handleSetContent first checks getEditor() → throws. So isDocumentEmpty's !editor
      // path can never be hit from handleSetContent. The branch is defensive code.
      // We still test it to confirm handleSetContent with null editor responds with error.
      mockGetEditor.mockReturnValue(null);
      await handleSetContent("req-isnull", { content: "x" });
      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-isnull",
        success: false,
        error: "No active editor",
      });
    });
  });

  // ── non-Error catch branches for setContent, insert, position, selection, replaceInSource ──

  describe("handleSetContent — non-Error thrown value (catch branch)", () => {
    it("handles non-Error thrown value", async () => {
      mockGetEditor.mockImplementation(() => {
        throw 999; // eslint-disable-line no-throw-literal
      });

      await handleSetContent("req-ne-sc", { content: "x" });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-ne-sc",
        success: false,
        error: "999",
      });
    });
  });

  describe("handleInsertAtCursorWithSuggestion — non-Error catch branch", () => {
    it("handles non-Error thrown value", async () => {
      mockGetEditor.mockImplementation(() => {
        throw "cursor error"; // eslint-disable-line no-throw-literal
      });

      await handleInsertAtCursorWithSuggestion("req-ne-ic", { text: "x" });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-ne-ic",
        success: false,
        error: "cursor error",
      });
    });
  });

  describe("handleInsertAtPositionWithSuggestion — non-Error catch branch", () => {
    it("handles non-Error thrown value", async () => {
      mockGetEditor.mockImplementation(() => {
        throw false; // eslint-disable-line no-throw-literal
      });

      await handleInsertAtPositionWithSuggestion("req-ne-ip", { text: "x", position: 0 });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-ne-ip",
        success: false,
        error: "false",
      });
    });
  });

  describe("handleSelectionReplaceWithSuggestion — non-Error catch branch", () => {
    it("handles non-Error thrown value", async () => {
      mockGetEditor.mockImplementation(() => {
        throw undefined; // eslint-disable-line no-throw-literal
      });

      await handleSelectionReplaceWithSuggestion("req-ne-sr", { text: "x" });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-ne-sr",
        success: false,
        error: "undefined",
      });
    });
  });

  describe("handleDocumentReplaceInSourceWithSuggestion — non-Error catch branch", () => {
    it("handles non-Error thrown value", async () => {
      mockGetEditor.mockImplementation(() => {
        throw { custom: true }; // eslint-disable-line no-throw-literal
      });

      await handleDocumentReplaceInSourceWithSuggestion("req-ne-ris", {
        search: "x",
        replace: "y",
      });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-ne-ris",
        success: false,
        error: "[object Object]",
      });
    });
  });

  describe("handleSuggestionAccept — non-Error catch branch", () => {
    it("handles non-Error thrown value", async () => {
      mockGetSuggestion.mockImplementation(() => {
        throw 0; // eslint-disable-line no-throw-literal
      });

      await handleSuggestionAccept("req-ne-sa", { suggestionId: "s-1" });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-ne-sa",
        success: false,
        error: "0",
      });

      mockGetSuggestion.mockReturnValue(null);
    });
  });

  describe("handleSuggestionReject — non-Error catch branch", () => {
    it("handles non-Error thrown value", async () => {
      mockGetSuggestion.mockImplementation(() => {
        throw "reject fail"; // eslint-disable-line no-throw-literal
      });

      await handleSuggestionReject("req-ne-srej", { suggestionId: "s-1" });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-ne-srej",
        success: false,
        error: "reject fail",
      });

      mockGetSuggestion.mockReturnValue(null);
    });
  });

  // ── replaceInSource: suggestion mode for normalized matching ──

  describe("handleDocumentReplaceInSourceWithSuggestion — normalized + suggestion mode", () => {
    it("creates suggestion with normalized matching when auto-approve disabled", async () => {
      const { serializeMarkdown } = await import("@/utils/markdownPipeline");
      vi.mocked(serializeMarkdown).mockReturnValue("Hello   World\n\nFoo");
      mockGetEditor.mockReturnValue(createMockEditor({ docSize: 50 }));
      mockIsAutoApproveEnabled.mockReturnValue(false);

      await handleDocumentReplaceInSourceWithSuggestion("req-norm-sug", {
        search: "Hello World",
        replace: "Hi Globe",
      });

      expect(mockAddSuggestion).toHaveBeenCalled();
      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.applied).toBe(false);

      vi.mocked(serializeMarkdown).mockReturnValue("# Hello\n\nWorld");
    });
  });
});
