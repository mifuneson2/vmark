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

  // ── handleSuggestionRejectAll ───────────────────────────────────────

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
});
