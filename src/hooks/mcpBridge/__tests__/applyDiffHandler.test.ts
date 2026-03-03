/**
 * Tests for applyDiffHandler — apply_diff with match policies.
 *
 * Covers: missing args, revision conflict, no matches, match policies
 * (first, all, nth, error_if_multiple), dryRun, suggest mode.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock utils
const mockRespond = vi.fn();
const mockGetEditor = vi.fn();
const mockIsAutoApproveEnabled = vi.fn().mockReturnValue(true);
const mockGetActiveTabId = vi.fn().mockReturnValue("tab-1");
const mockFindTextMatches = vi.fn();
vi.mock("../utils", () => ({
  respond: (response: unknown) => mockRespond(response),
  getEditor: () => mockGetEditor(),
  isAutoApproveEnabled: () => mockIsAutoApproveEnabled(),
  getActiveTabId: () => mockGetActiveTabId(),
  findTextMatches: (...args: unknown[]) => mockFindTextMatches(...args),
}));

// Mock revision tracker
const mockValidateBaseRevision = vi.fn();
const mockGetCurrentRevision = vi.fn().mockReturnValue("rev-new");
vi.mock("../revisionTracker", () => ({
  validateBaseRevision: (...args: unknown[]) =>
    mockValidateBaseRevision(...args),
  getCurrentRevision: () => mockGetCurrentRevision(),
}));

// Mock suggestion store
const mockAddSuggestion = vi.fn().mockReturnValue("suggestion-1");
vi.mock("@/stores/aiSuggestionStore", () => ({
  useAiSuggestionStore: {
    getState: () => ({
      addSuggestion: (...args: unknown[]) => mockAddSuggestion(...args),
    }),
  },
}));

// Mock markdown paste slice
vi.mock("@/plugins/markdownPaste/tiptap", () => ({
  createMarkdownPasteSlice: vi.fn().mockReturnValue({ content: "mock-slice" }),
}));

import { handleApplyDiff } from "../applyDiffHandler";

function createMockEditor() {
  const tr = {
    replaceRange: vi.fn().mockReturnThis(),
  };
  return {
    state: {
      doc: { textContent: "Hello world" },
      tr,
    },
    view: {
      dispatch: vi.fn(),
    },
  };
}

describe("applyDiffHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateBaseRevision.mockReturnValue(null);
    mockIsAutoApproveEnabled.mockReturnValue(true);
  });

  it("returns revision conflict error when revision is invalid", async () => {
    mockValidateBaseRevision.mockReturnValue({
      error: "Revision conflict",
      currentRevision: "rev-current",
    });

    await handleApplyDiff("req-1", {
      baseRevision: "rev-old",
      original: "Hello",
      replacement: "World",
      matchPolicy: "first",
    });

    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(false);
    expect(call.data.code).toBe("conflict");
  });

  it("returns error when no editor", async () => {
    mockGetEditor.mockReturnValue(null);

    await handleApplyDiff("req-2", {
      baseRevision: "rev-1",
      original: "Hello",
      replacement: "World",
      matchPolicy: "first",
    });

    expect(mockRespond).toHaveBeenCalledWith({
      id: "req-2",
      success: false,
      error: "No active editor",
    });
  });

  it("returns error when original is missing", async () => {
    mockGetEditor.mockReturnValue(createMockEditor());

    await handleApplyDiff("req-3", {
      baseRevision: "rev-1",
      replacement: "World",
      matchPolicy: "first",
    });

    expect(mockRespond).toHaveBeenCalledWith({
      id: "req-3",
      success: false,
      error: expect.stringContaining("'original'"),
    });
  });

  it("returns error when replacement is missing", async () => {
    mockGetEditor.mockReturnValue(createMockEditor());

    await handleApplyDiff("req-4", {
      baseRevision: "rev-1",
      original: "Hello",
      matchPolicy: "first",
    });

    expect(mockRespond).toHaveBeenCalledWith({
      id: "req-4",
      success: false,
      error: expect.stringContaining("'replacement'"),
    });
  });

  it("returns success with matchCount=0 when no matches found", async () => {
    mockGetEditor.mockReturnValue(createMockEditor());
    mockFindTextMatches.mockReturnValue([]);

    await handleApplyDiff("req-5", {
      baseRevision: "rev-1",
      original: "xyz",
      replacement: "abc",
      matchPolicy: "first",
    });

    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(true);
    expect(call.data.matchCount).toBe(0);
    expect(call.data.appliedCount).toBe(0);
  });

  it("applies first match with matchPolicy=first", async () => {
    const editor = createMockEditor();
    mockGetEditor.mockReturnValue(editor);
    mockFindTextMatches.mockReturnValue([
      { from: 0, to: 5, nodeId: "p-0", context: { before: "", after: " world" } },
      { from: 20, to: 25, nodeId: "p-1", context: { before: "Another ", after: " here" } },
    ]);

    await handleApplyDiff("req-6", {
      baseRevision: "rev-1",
      original: "Hello",
      replacement: "Hi",
      matchPolicy: "first",
    });

    expect(editor.view.dispatch).toHaveBeenCalledTimes(1);
    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(true);
    expect(call.data.matchCount).toBe(2);
    expect(call.data.appliedCount).toBe(1);
  });

  it("applies all matches with matchPolicy=all in reverse order", async () => {
    const editor = createMockEditor();
    mockGetEditor.mockReturnValue(editor);
    mockFindTextMatches.mockReturnValue([
      { from: 0, to: 5, nodeId: "p-0", context: { before: "", after: " world" } },
      { from: 20, to: 25, nodeId: "p-1", context: { before: "Another ", after: " here" } },
    ]);

    await handleApplyDiff("req-7", {
      baseRevision: "rev-1",
      original: "Hello",
      replacement: "Hi",
      matchPolicy: "all",
    });

    expect(editor.view.dispatch).toHaveBeenCalledTimes(2);
    const call = mockRespond.mock.calls[0][0];
    expect(call.data.appliedCount).toBe(2);
  });

  it("applies nth match with matchPolicy=nth", async () => {
    const editor = createMockEditor();
    mockGetEditor.mockReturnValue(editor);
    mockFindTextMatches.mockReturnValue([
      { from: 0, to: 5, nodeId: "p-0", context: { before: "", after: "" } },
      { from: 20, to: 25, nodeId: "p-1", context: { before: "", after: "" } },
    ]);

    await handleApplyDiff("req-8", {
      baseRevision: "rev-1",
      original: "Hello",
      replacement: "Hi",
      matchPolicy: "nth",
      nth: 1,
    });

    expect(editor.view.dispatch).toHaveBeenCalledTimes(1);
    const call = mockRespond.mock.calls[0][0];
    expect(call.data.appliedCount).toBe(1);
  });

  it("returns error when nth is missing for matchPolicy=nth", async () => {
    mockGetEditor.mockReturnValue(createMockEditor());
    mockFindTextMatches.mockReturnValue([
      { from: 0, to: 5, nodeId: "p-0", context: { before: "", after: "" } },
    ]);

    await handleApplyDiff("req-9", {
      baseRevision: "rev-1",
      original: "Hello",
      replacement: "Hi",
      matchPolicy: "nth",
    });

    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(false);
    expect(call.data.code).toBe("invalid_operation");
  });

  it("returns error when nth is negative", async () => {
    mockGetEditor.mockReturnValue(createMockEditor());

    await handleApplyDiff("req-9b", {
      baseRevision: "rev-1",
      original: "Hello",
      replacement: "Hi",
      matchPolicy: "nth",
      nth: -1,
    });

    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(false);
    expect(call.data.code).toBe("invalid_operation");
  });

  it("returns error when nth is out of bounds", async () => {
    mockGetEditor.mockReturnValue(createMockEditor());
    mockFindTextMatches.mockReturnValue([
      { from: 0, to: 5, nodeId: "p-0", context: { before: "", after: "" } },
    ]);

    await handleApplyDiff("req-10", {
      baseRevision: "rev-1",
      original: "Hello",
      replacement: "Hi",
      matchPolicy: "nth",
      nth: 5,
    });

    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(false);
    expect(call.data.code).toBe("invalid_operation");
  });

  it("returns ambiguous error for error_if_multiple with multiple matches", async () => {
    mockGetEditor.mockReturnValue(createMockEditor());
    mockFindTextMatches.mockReturnValue([
      { from: 0, to: 5, nodeId: "p-0", context: { before: "", after: "" } },
      { from: 20, to: 25, nodeId: "p-1", context: { before: "", after: "" } },
    ]);

    await handleApplyDiff("req-11", {
      baseRevision: "rev-1",
      original: "Hello",
      replacement: "Hi",
      matchPolicy: "error_if_multiple",
    });

    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(true);
    expect(call.data.success).toBe(false);
    expect(call.data.error).toBe("ambiguous_target");
    expect(call.data.matchCount).toBe(2);
  });

  it("applies single match with error_if_multiple", async () => {
    const editor = createMockEditor();
    mockGetEditor.mockReturnValue(editor);
    mockFindTextMatches.mockReturnValue([
      { from: 0, to: 5, nodeId: "p-0", context: { before: "", after: "" } },
    ]);

    await handleApplyDiff("req-12", {
      baseRevision: "rev-1",
      original: "Hello",
      replacement: "Hi",
      matchPolicy: "error_if_multiple",
    });

    expect(editor.view.dispatch).toHaveBeenCalledTimes(1);
    const call = mockRespond.mock.calls[0][0];
    expect(call.data.appliedCount).toBe(1);
  });

  it("returns preview for dryRun mode", async () => {
    mockGetEditor.mockReturnValue(createMockEditor());
    mockFindTextMatches.mockReturnValue([
      { from: 0, to: 5, nodeId: "p-0", context: { before: "", after: " world" } },
    ]);

    await handleApplyDiff("req-13", {
      baseRevision: "rev-1",
      original: "Hello",
      replacement: "Hi",
      matchPolicy: "first",
      mode: "dryRun",
    });

    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(true);
    expect(call.data.isDryRun).toBe(true);
    expect(call.data.matchCount).toBe(1);
    expect(call.data.appliedCount).toBe(1);
  });

  it("dryRun with matchPolicy=all returns count of all matches", async () => {
    mockGetEditor.mockReturnValue(createMockEditor());
    mockFindTextMatches.mockReturnValue([
      { from: 0, to: 5, nodeId: "p-0", context: { before: "", after: "" } },
      { from: 20, to: 25, nodeId: "p-1", context: { before: "", after: "" } },
      { from: 40, to: 45, nodeId: "p-2", context: { before: "", after: "" } },
    ]);

    await handleApplyDiff("req-13a", {
      baseRevision: "rev-1",
      original: "Hello",
      replacement: "Hi",
      matchPolicy: "all",
      mode: "dryRun",
    });

    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(true);
    expect(call.data.isDryRun).toBe(true);
    expect(call.data.matchCount).toBe(3);
    expect(call.data.appliedCount).toBe(3);
  });

  it("dryRun with matchPolicy=nth returns appliedCount=1", async () => {
    mockGetEditor.mockReturnValue(createMockEditor());
    mockFindTextMatches.mockReturnValue([
      { from: 0, to: 5, nodeId: "p-0", context: { before: "", after: "" } },
      { from: 20, to: 25, nodeId: "p-1", context: { before: "", after: "" } },
    ]);

    await handleApplyDiff("req-13b", {
      baseRevision: "rev-1",
      original: "Hello",
      replacement: "Hi",
      matchPolicy: "nth",
      nth: 1,
      mode: "dryRun",
    });

    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(true);
    expect(call.data.isDryRun).toBe(true);
    expect(call.data.appliedCount).toBe(1);
  });

  it("creates suggestions in suggest mode", async () => {
    mockGetEditor.mockReturnValue(createMockEditor());
    mockIsAutoApproveEnabled.mockReturnValue(false);
    mockFindTextMatches.mockReturnValue([
      { from: 0, to: 5, nodeId: "p-0", context: { before: "", after: "" } },
    ]);

    await handleApplyDiff("req-14", {
      baseRevision: "rev-1",
      original: "Hello",
      replacement: "Hi",
      matchPolicy: "first",
      mode: "suggest",
    });

    expect(mockAddSuggestion).toHaveBeenCalledWith({
      tabId: "tab-1",
      type: "replace",
      from: 0,
      to: 5,
      newContent: "Hi",
      originalContent: "Hello",
    });
    const call = mockRespond.mock.calls[0][0];
    expect(call.data.suggestionIds).toHaveLength(1);
  });

  it("creates suggestions for all matches in suggest mode with matchPolicy=all", async () => {
    mockGetEditor.mockReturnValue(createMockEditor());
    mockIsAutoApproveEnabled.mockReturnValue(false);
    mockFindTextMatches.mockReturnValue([
      { from: 0, to: 5, nodeId: "p-0", context: { before: "", after: "" } },
      { from: 20, to: 25, nodeId: "p-1", context: { before: "", after: "" } },
    ]);

    await handleApplyDiff("req-14a", {
      baseRevision: "rev-1",
      original: "Hello",
      replacement: "Hi",
      matchPolicy: "all",
      mode: "suggest",
    });

    expect(mockAddSuggestion).toHaveBeenCalledTimes(2);
    const call = mockRespond.mock.calls[0][0];
    expect(call.data.suggestionIds).toHaveLength(2);
  });

  it("creates suggestion for nth match in suggest mode", async () => {
    mockGetEditor.mockReturnValue(createMockEditor());
    mockIsAutoApproveEnabled.mockReturnValue(false);
    mockFindTextMatches.mockReturnValue([
      { from: 0, to: 5, nodeId: "p-0", context: { before: "", after: "" } },
      { from: 20, to: 25, nodeId: "p-1", context: { before: "", after: "" } },
    ]);

    await handleApplyDiff("req-14b", {
      baseRevision: "rev-1",
      original: "Hello",
      replacement: "Hi",
      matchPolicy: "nth",
      nth: 1,
      mode: "suggest",
    });

    expect(mockAddSuggestion).toHaveBeenCalledTimes(1);
    expect(mockAddSuggestion).toHaveBeenCalledWith(
      expect.objectContaining({ from: 20, to: 25 })
    );
  });

  it("dryRun with matchPolicy=error_if_multiple returns appliedCount=1", async () => {
    mockGetEditor.mockReturnValue(createMockEditor());
    mockFindTextMatches.mockReturnValue([
      { from: 0, to: 5, nodeId: "p-0", context: { before: "", after: "" } },
    ]);

    await handleApplyDiff("req-15", {
      baseRevision: "rev-1",
      original: "Hello",
      replacement: "Hi",
      matchPolicy: "error_if_multiple",
      mode: "dryRun",
    });

    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(true);
    expect(call.data.isDryRun).toBe(true);
    expect(call.data.appliedCount).toBe(1);
  });

  it("creates suggestion with error_if_multiple and single match in suggest mode", async () => {
    mockGetEditor.mockReturnValue(createMockEditor());
    mockIsAutoApproveEnabled.mockReturnValue(false);
    mockFindTextMatches.mockReturnValue([
      { from: 0, to: 5, nodeId: "p-0", context: { before: "", after: "" } },
    ]);

    await handleApplyDiff("req-16", {
      baseRevision: "rev-1",
      original: "Hello",
      replacement: "Hi",
      matchPolicy: "error_if_multiple",
      mode: "suggest",
    });

    expect(mockAddSuggestion).toHaveBeenCalledTimes(1);
    const call = mockRespond.mock.calls[0][0];
    expect(call.data.suggestionIds).toHaveLength(1);
  });

  it("handles non-Error thrown value in catch (String(error) branch)", async () => {
    mockGetEditor.mockImplementation(() => {
      throw "raw string error";
    });

    await handleApplyDiff("req-str-1", {
      baseRevision: "rev-1",
      original: "Hello",
      replacement: "Hi",
      matchPolicy: "first",
    });

    expect(mockRespond).toHaveBeenCalledWith({
      id: "req-str-1",
      success: false,
      error: "raw string error",
    });
  });
});
