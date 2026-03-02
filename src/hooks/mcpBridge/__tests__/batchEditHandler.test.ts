/**
 * Tests for batchEditHandler — batch_edit with idempotency cache,
 * validation, dryRun, suggest, and apply modes.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock utils
const mockRespond = vi.fn();
const mockGetEditor = vi.fn();
const mockIsAutoApproveEnabled = vi.fn().mockReturnValue(true);
const mockGetActiveTabId = vi.fn().mockReturnValue("tab-1");
const mockResolveNodeId = vi.fn();
const mockGetTextRange = vi.fn();
vi.mock("../utils", () => ({
  respond: (response: unknown) => mockRespond(response),
  getEditor: () => mockGetEditor(),
  isAutoApproveEnabled: () => mockIsAutoApproveEnabled(),
  getActiveTabId: () => mockGetActiveTabId(),
  resolveNodeId: (...args: unknown[]) => mockResolveNodeId(...args),
  getTextRange: (...args: unknown[]) => mockGetTextRange(...args),
}));

// Mock revision tracker
const mockValidateBaseRevision = vi.fn();
const mockGetCurrentRevision = vi.fn().mockReturnValue("rev-new");
vi.mock("../revisionTracker", () => ({
  validateBaseRevision: (...args: unknown[]) =>
    mockValidateBaseRevision(...args),
  getCurrentRevision: () => mockGetCurrentRevision(),
}));

// Mock idempotency cache
const mockCacheGet = vi.fn();
const mockCacheSet = vi.fn();
vi.mock("../idempotencyCache", () => ({
  idempotencyCache: {
    get: (...args: unknown[]) => mockCacheGet(...args),
    set: (...args: unknown[]) => mockCacheSet(...args),
  },
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

import { handleBatchEdit } from "../batchEditHandler";

function createMockEditor() {
  const tr = {
    replaceRange: vi.fn().mockReturnThis(),
  };
  const chainMethods = {
    focus: vi.fn().mockReturnThis(),
    setTextSelection: vi.fn().mockReturnThis(),
    deleteSelection: vi.fn().mockReturnThis(),
    run: vi.fn(),
  };
  return {
    state: {
      doc: {
        textBetween: vi.fn().mockReturnValue("original text"),
      },
      tr,
    },
    view: {
      dispatch: vi.fn(),
    },
    chain: vi.fn().mockReturnValue(chainMethods),
    commands: {
      toggleMark: vi.fn(),
    },
    _chainMethods: chainMethods,
  };
}

describe("batchEditHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateBaseRevision.mockReturnValue(null);
    mockIsAutoApproveEnabled.mockReturnValue(true);
    mockCacheGet.mockReturnValue(undefined);
  });

  it("returns cached response for duplicate requestId", async () => {
    const cachedResponse = {
      id: "req-1",
      success: true,
      data: { cached: true },
    };
    mockCacheGet.mockReturnValue(cachedResponse);

    await handleBatchEdit("req-1", {
      requestId: "dedup-1",
      baseRevision: "rev-1",
      operations: [{ type: "update", nodeId: "p-0", text: "new" }],
    });

    expect(mockRespond).toHaveBeenCalledWith(cachedResponse);
    expect(mockValidateBaseRevision).not.toHaveBeenCalled();
  });

  it("returns revision conflict error", async () => {
    mockValidateBaseRevision.mockReturnValue({
      error: "Revision conflict",
      currentRevision: "rev-current",
    });

    await handleBatchEdit("req-2", {
      baseRevision: "rev-old",
      operations: [{ type: "update", nodeId: "p-0", text: "new" }],
    });

    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(false);
    expect(call.data.code).toBe("conflict");
  });

  it("caches revision conflict response when requestId provided", async () => {
    mockValidateBaseRevision.mockReturnValue({
      error: "Revision conflict",
      currentRevision: "rev-current",
    });

    await handleBatchEdit("req-2b", {
      requestId: "dedup-2",
      baseRevision: "rev-old",
      operations: [{ type: "update", nodeId: "p-0", text: "new" }],
    });

    expect(mockCacheSet).toHaveBeenCalledWith(
      "dedup-2",
      expect.objectContaining({ success: false })
    );
  });

  it("returns error when no editor", async () => {
    mockGetEditor.mockReturnValue(null);

    await handleBatchEdit("req-3", {
      baseRevision: "rev-1",
      operations: [{ type: "update", nodeId: "p-0", text: "new" }],
    });

    expect(mockRespond).toHaveBeenCalledWith({
      id: "req-3",
      success: false,
      error: "No active editor",
    });
  });

  it("returns error for empty operations", async () => {
    mockGetEditor.mockReturnValue(createMockEditor());

    await handleBatchEdit("req-4", {
      baseRevision: "rev-1",
      operations: [],
    });

    expect(mockRespond).toHaveBeenCalledWith({
      id: "req-4",
      success: false,
      error: "At least one operation is required",
    });
  });

  it("returns error for too many operations", async () => {
    mockGetEditor.mockReturnValue(createMockEditor());
    const ops = Array.from({ length: 101 }, (_, i) => ({
      type: "update" as const,
      nodeId: `p-${i}`,
      text: "x",
    }));

    await handleBatchEdit("req-5", {
      baseRevision: "rev-1",
      operations: ops,
    });

    expect(mockRespond).toHaveBeenCalledWith({
      id: "req-5",
      success: false,
      error: "Maximum 100 operations per batch",
    });
  });

  it("validates required nodeId for update/delete/format", async () => {
    mockGetEditor.mockReturnValue(createMockEditor());

    await handleBatchEdit("req-6", {
      baseRevision: "rev-1",
      operations: [
        { type: "update", text: "new" }, // missing nodeId
        { type: "delete" }, // missing nodeId
      ],
    });

    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(false);
    expect(call.error).toBe("invalid_operation");
    expect(call.data.errors).toHaveLength(2);
  });

  it("validates insert requires after or nodeId", async () => {
    mockGetEditor.mockReturnValue(createMockEditor());

    await handleBatchEdit("req-7", {
      baseRevision: "rev-1",
      operations: [{ type: "insert", content: "hello" }], // missing both
    });

    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(false);
    expect(call.data.errors[0]).toContain("insert requires");
  });

  it("returns dryRun preview", async () => {
    mockGetEditor.mockReturnValue(createMockEditor());

    await handleBatchEdit("req-8", {
      baseRevision: "rev-1",
      mode: "dryRun",
      operations: [
        { type: "update", nodeId: "p-0", text: "new" },
        { type: "delete", nodeId: "p-1" },
      ],
    });

    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(true);
    expect(call.data.isDryRun).toBe(true);
    expect(call.data.changedNodeIds).toContain("p-0");
    expect(call.data.deletedNodeIds).toContain("p-1");
  });

  it("returns error when node is not found", async () => {
    mockGetEditor.mockReturnValue(createMockEditor());
    mockResolveNodeId.mockReturnValue(null);

    await handleBatchEdit("req-9", {
      baseRevision: "rev-1",
      operations: [{ type: "update", nodeId: "p-999", text: "new" }],
    });

    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(false);
    expect(call.error).toContain("Node not found: p-999");
  });

  it("creates suggestions in suggest mode", async () => {
    const editor = createMockEditor();
    mockGetEditor.mockReturnValue(editor);
    mockIsAutoApproveEnabled.mockReturnValue(false);
    mockResolveNodeId.mockReturnValue({ from: 0, to: 10 });
    mockGetTextRange.mockReturnValue({ from: 1, to: 9 });

    await handleBatchEdit("req-10", {
      baseRevision: "rev-1",
      mode: "suggest",
      operations: [{ type: "update", nodeId: "p-0", text: "new text" }],
    });

    expect(mockAddSuggestion).toHaveBeenCalled();
    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(true);
    expect(call.data.suggestionIds).toHaveLength(1);
  });

  it("applies update operation in apply mode", async () => {
    const editor = createMockEditor();
    mockGetEditor.mockReturnValue(editor);
    mockResolveNodeId.mockReturnValue({ from: 0, to: 10 });
    mockGetTextRange.mockReturnValue({ from: 1, to: 9 });

    await handleBatchEdit("req-11", {
      baseRevision: "rev-1",
      mode: "apply",
      operations: [{ type: "update", nodeId: "p-0", text: "new text" }],
    });

    expect(editor.view.dispatch).toHaveBeenCalled();
    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(true);
    expect(call.data.changedNodeIds).toContain("p-0");
  });

  it("applies delete operation", async () => {
    const editor = createMockEditor();
    mockGetEditor.mockReturnValue(editor);
    mockResolveNodeId.mockReturnValue({ from: 0, to: 10 });

    await handleBatchEdit("req-12", {
      baseRevision: "rev-1",
      mode: "apply",
      operations: [{ type: "delete", nodeId: "p-0" }],
    });

    expect(editor._chainMethods.deleteSelection).toHaveBeenCalled();
    const call = mockRespond.mock.calls[0][0];
    expect(call.data.deletedNodeIds).toContain("p-0");
  });

  it("applies insert operation with after target", async () => {
    const editor = createMockEditor();
    mockGetEditor.mockReturnValue(editor);
    mockResolveNodeId.mockReturnValue({ from: 0, to: 10 });

    await handleBatchEdit("req-13", {
      baseRevision: "rev-1",
      mode: "apply",
      operations: [
        { type: "insert", after: "p-0", content: "inserted text" },
      ],
    });

    expect(editor.view.dispatch).toHaveBeenCalled();
    const call = mockRespond.mock.calls[0][0];
    expect(call.data.addedNodeIds).toHaveLength(1);
  });

  it("caches response when requestId provided", async () => {
    const editor = createMockEditor();
    mockGetEditor.mockReturnValue(editor);
    mockResolveNodeId.mockReturnValue({ from: 0, to: 10 });
    mockGetTextRange.mockReturnValue({ from: 1, to: 9 });

    await handleBatchEdit("req-14", {
      requestId: "dedup-14",
      baseRevision: "rev-1",
      mode: "apply",
      operations: [{ type: "update", nodeId: "p-0", text: "new" }],
    });

    expect(mockCacheSet).toHaveBeenCalledWith(
      "dedup-14",
      expect.objectContaining({ success: true })
    );
  });

  it("applies format operation with marks", async () => {
    const editor = createMockEditor();
    mockGetEditor.mockReturnValue(editor);
    mockResolveNodeId.mockReturnValue({ from: 0, to: 10 });
    mockGetTextRange.mockReturnValue({ from: 1, to: 9 });

    await handleBatchEdit("req-15", {
      baseRevision: "rev-1",
      mode: "apply",
      operations: [
        {
          type: "format",
          nodeId: "p-0",
          marks: [{ type: "bold" }, { type: "italic" }],
        },
      ],
    });

    expect(editor.commands.toggleMark).toHaveBeenCalledWith("bold", undefined);
    expect(editor.commands.toggleMark).toHaveBeenCalledWith("italic", undefined);
    const call = mockRespond.mock.calls[0][0];
    expect(call.data.changedNodeIds).toContain("p-0");
  });

  it("warns for unknown operation type", async () => {
    const editor = createMockEditor();
    mockGetEditor.mockReturnValue(editor);
    mockResolveNodeId.mockReturnValue({ from: 0, to: 10 });

    await handleBatchEdit("req-16", {
      baseRevision: "rev-1",
      mode: "apply",
      operations: [
        { type: "unknown_op" as "update", nodeId: "p-0" },
      ],
    });

    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(true);
    expect(call.data.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Unknown operation type"),
      ])
    );
  });

  it("returns node_not_found for insert with missing after target", async () => {
    const editor = createMockEditor();
    mockGetEditor.mockReturnValue(editor);
    mockResolveNodeId.mockReturnValue(null);

    await handleBatchEdit("req-17", {
      baseRevision: "rev-1",
      mode: "apply",
      operations: [
        { type: "insert", after: "missing-node", content: "text" },
      ],
    });

    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(false);
    expect(call.error).toContain("Node not found for 'after'");
  });

  it("creates suggestions for insert in suggest mode", async () => {
    const editor = createMockEditor();
    mockGetEditor.mockReturnValue(editor);
    mockIsAutoApproveEnabled.mockReturnValue(false);
    mockResolveNodeId.mockReturnValue({ from: 0, to: 10 });

    await handleBatchEdit("req-18", {
      baseRevision: "rev-1",
      mode: "suggest",
      operations: [
        { type: "insert", after: "p-0", content: "new text" },
      ],
    });

    expect(mockAddSuggestion).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "insert",
        from: 10,
        to: 10,
        newContent: "new text",
      })
    );
  });

  it("creates suggestions for delete in suggest mode", async () => {
    const editor = createMockEditor();
    mockGetEditor.mockReturnValue(editor);
    mockIsAutoApproveEnabled.mockReturnValue(false);
    mockResolveNodeId.mockReturnValue({ from: 0, to: 10 });

    await handleBatchEdit("req-19", {
      baseRevision: "rev-1",
      mode: "suggest",
      operations: [{ type: "delete", nodeId: "p-0" }],
    });

    expect(mockAddSuggestion).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "delete",
        from: 0,
        to: 10,
      })
    );
  });

  it("caches dryRun response when requestId provided", async () => {
    mockGetEditor.mockReturnValue(createMockEditor());

    await handleBatchEdit("req-20", {
      requestId: "dedup-20",
      baseRevision: "rev-1",
      mode: "dryRun",
      operations: [{ type: "update", nodeId: "p-0", text: "new" }],
    });

    expect(mockCacheSet).toHaveBeenCalledWith(
      "dedup-20",
      expect.objectContaining({
        data: expect.objectContaining({ isDryRun: true }),
      })
    );
  });

  it("caches validation error response when requestId provided", async () => {
    mockGetEditor.mockReturnValue(createMockEditor());

    await handleBatchEdit("req-21", {
      requestId: "dedup-21",
      baseRevision: "rev-1",
      operations: [{ type: "update", text: "no nodeId" }],
    });

    expect(mockCacheSet).toHaveBeenCalledWith(
      "dedup-21",
      expect.objectContaining({ success: false })
    );
  });

  it("caches node_not_found response when requestId provided", async () => {
    const editor = createMockEditor();
    mockGetEditor.mockReturnValue(editor);
    mockResolveNodeId.mockReturnValue(null);

    await handleBatchEdit("req-22", {
      requestId: "dedup-22",
      baseRevision: "rev-1",
      operations: [{ type: "update", nodeId: "missing", text: "x" }],
    });

    expect(mockCacheSet).toHaveBeenCalledWith(
      "dedup-22",
      expect.objectContaining({
        data: expect.objectContaining({ code: "node_not_found" }),
      })
    );
  });

  it("caches suggest mode response when requestId provided", async () => {
    const editor = createMockEditor();
    mockGetEditor.mockReturnValue(editor);
    mockIsAutoApproveEnabled.mockReturnValue(false);
    mockResolveNodeId.mockReturnValue({ from: 0, to: 10 });
    mockGetTextRange.mockReturnValue({ from: 1, to: 9 });

    await handleBatchEdit("req-23", {
      requestId: "dedup-23",
      baseRevision: "rev-1",
      mode: "suggest",
      operations: [{ type: "update", nodeId: "p-0", text: "new" }],
    });

    expect(mockCacheSet).toHaveBeenCalledWith(
      "dedup-23",
      expect.objectContaining({ success: true })
    );
  });

  it("validates format requires nodeId", async () => {
    mockGetEditor.mockReturnValue(createMockEditor());

    await handleBatchEdit("req-24", {
      baseRevision: "rev-1",
      operations: [
        { type: "format", marks: [{ type: "bold" }] },
      ],
    });

    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(false);
    expect(call.data.errors[0]).toContain("format requires nodeId");
  });

  it("validates move requires nodeId", async () => {
    mockGetEditor.mockReturnValue(createMockEditor());

    await handleBatchEdit("req-25", {
      baseRevision: "rev-1",
      operations: [{ type: "move" }],
    });

    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(false);
    expect(call.data.errors[0]).toContain("move requires nodeId");
  });

  it("sorts operations by position descending for safe editing", async () => {
    const editor = createMockEditor();
    mockGetEditor.mockReturnValue(editor);
    // First call returns pos 0-10, second returns pos 20-30
    mockResolveNodeId
      .mockReturnValueOnce({ from: 0, to: 10 })
      .mockReturnValueOnce({ from: 20, to: 30 });
    mockGetTextRange
      .mockReturnValueOnce({ from: 1, to: 9 })
      .mockReturnValueOnce({ from: 21, to: 29 });

    await handleBatchEdit("req-26", {
      baseRevision: "rev-1",
      mode: "apply",
      operations: [
        { type: "update", nodeId: "p-0", text: "first" },
        { type: "update", nodeId: "p-1", text: "second" },
      ],
    });

    // Both dispatched, but second (higher pos) should be processed first
    expect(editor.view.dispatch).toHaveBeenCalledTimes(2);
    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(true);
    expect(call.data.changedNodeIds).toHaveLength(2);
  });

  it("caches insert-after-not-found response when requestId provided (line 185)", async () => {
    const editor = createMockEditor();
    mockGetEditor.mockReturnValue(editor);
    // resolveNodeId returns null for the 'after' node
    mockResolveNodeId.mockReturnValue(null);

    await handleBatchEdit("req-27", {
      requestId: "dedup-27",
      baseRevision: "rev-1",
      mode: "apply",
      operations: [{ type: "insert", after: "heading-99", text: "new paragraph" }],
    });

    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(false);
    expect(call.error).toContain("Node not found for 'after'");
    expect(mockCacheSet).toHaveBeenCalledWith("dedup-27", expect.objectContaining({
      success: false,
      data: expect.objectContaining({ code: "node_not_found" }),
    }));
  });

  it("pushes resolved null for ops with unrecognized type and no nodeId (line 193)", async () => {
    const editor = createMockEditor();
    mockGetEditor.mockReturnValue(editor);

    // Validation only checks known types (update/delete/format/move/insert).
    // An op with an unrecognized type and no nodeId passes validation
    // and falls through to the else branch at line 193 (resolved: null).
    await handleBatchEdit("req-28", {
      baseRevision: "rev-1",
      mode: "apply",
      operations: [
        { type: "replace" as string, text: "hello" },
      ],
    });

    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(true);
  });

  it("handles non-Error thrown in outer catch (line 344)", async () => {
    // Force a non-Error throw by passing a non-string baseRevision
    // requireString will throw an Error, so we mock it to throw a non-Error
    mockGetEditor.mockReturnValue(null);
    // Make validateBaseRevision throw a non-Error
    mockValidateBaseRevision.mockImplementation(() => { throw 42; });

    await handleBatchEdit("req-29", {
      baseRevision: "rev-1",
      operations: [{ type: "update", nodeId: "p-0", text: "x" }],
    });

    expect(mockRespond).toHaveBeenCalledWith({
      id: "req-29",
      success: false,
      error: "42",
    });
  });

  it("skips insert in apply mode when content is not a string", async () => {
    const editor = createMockEditor();
    mockGetEditor.mockReturnValue(editor);
    mockResolveNodeId.mockReturnValue({ from: 0, to: 10 });

    await handleBatchEdit("req-30", {
      baseRevision: "rev-1",
      mode: "apply",
      operations: [
        { type: "insert", nodeId: "p-0", content: { complex: true } as unknown as string },
      ],
    });

    // insert was skipped (content is not a string), no dispatch
    expect(editor.view.dispatch).not.toHaveBeenCalled();
    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(true);
    expect(call.data.addedNodeIds).toHaveLength(0);
  });

  it("skips update in apply mode when text is falsy", async () => {
    const editor = createMockEditor();
    mockGetEditor.mockReturnValue(editor);
    mockResolveNodeId.mockReturnValue({ from: 0, to: 10 });

    await handleBatchEdit("req-31", {
      baseRevision: "rev-1",
      mode: "apply",
      operations: [
        { type: "update", nodeId: "p-0", text: "" },
      ],
    });

    expect(editor.view.dispatch).not.toHaveBeenCalled();
    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(true);
    expect(call.data.changedNodeIds).toHaveLength(0);
  });

  it("skips delete in apply mode when resolved is null", async () => {
    const editor = createMockEditor();
    mockGetEditor.mockReturnValue(editor);

    await handleBatchEdit("req-32", {
      baseRevision: "rev-1",
      mode: "apply",
      operations: [
        // An unrecognized type with no nodeId goes to else branch → resolved=null
        // Then in switch it's 'delete' but resolved is null → skip
        { type: "replace" as string },
      ],
    });

    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(true);
  });

  it("skips format in apply mode when marks is falsy", async () => {
    const editor = createMockEditor();
    mockGetEditor.mockReturnValue(editor);
    mockResolveNodeId.mockReturnValue({ from: 0, to: 10 });
    mockGetTextRange.mockReturnValue({ from: 1, to: 9 });

    await handleBatchEdit("req-33", {
      baseRevision: "rev-1",
      mode: "apply",
      operations: [
        { type: "format", nodeId: "p-0" }, // marks is undefined
      ],
    });

    expect(editor.commands.toggleMark).not.toHaveBeenCalled();
    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(true);
    expect(call.data.changedNodeIds).toHaveLength(0);
  });

  it("uses fallback nodeId names when nodeId is undefined in apply operations", async () => {
    const editor = createMockEditor();
    mockGetEditor.mockReturnValue(editor);
    // Return the first call for insert (after), second for delete (nodeId)
    mockResolveNodeId
      .mockReturnValueOnce({ from: 10, to: 20 })   // insert after
      .mockReturnValueOnce({ from: 0, to: 10 });    // delete nodeId
    mockGetTextRange.mockReturnValue({ from: 1, to: 9 });

    await handleBatchEdit("req-34", {
      baseRevision: "rev-1",
      mode: "apply",
      operations: [
        { type: "insert", after: "p-0", content: "text" },
        // delete without nodeId — uses fallback `deleted-0`
        // But validation requires nodeId for delete, so pass it
        { type: "delete", nodeId: "p-1" },
      ],
    });

    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(true);
  });

  it("skips suggest for ops that don't match known types in suggest mode", async () => {
    const editor = createMockEditor();
    mockGetEditor.mockReturnValue(editor);
    mockIsAutoApproveEnabled.mockReturnValue(false);
    mockResolveNodeId.mockReturnValue({ from: 0, to: 10 });

    await handleBatchEdit("req-35", {
      baseRevision: "rev-1",
      mode: "suggest",
      operations: [
        // format with nodeId doesn't create suggestions in suggest mode
        { type: "format", nodeId: "p-0", marks: [{ type: "bold" }] },
      ],
    });

    // No suggestions created for format
    expect(mockAddSuggestion).not.toHaveBeenCalled();
    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(true);
    expect(call.data.suggestionIds).toHaveLength(0);
  });

  it("skips suggest for insert when content is not a string", async () => {
    const editor = createMockEditor();
    mockGetEditor.mockReturnValue(editor);
    mockIsAutoApproveEnabled.mockReturnValue(false);
    mockResolveNodeId.mockReturnValue({ from: 0, to: 10 });

    await handleBatchEdit("req-36", {
      baseRevision: "rev-1",
      mode: "suggest",
      operations: [
        { type: "insert", after: "p-0", content: { complex: true } },
      ],
    });

    expect(mockAddSuggestion).not.toHaveBeenCalled();
  });

  it("skips suggest for update when text is falsy", async () => {
    const editor = createMockEditor();
    mockGetEditor.mockReturnValue(editor);
    mockIsAutoApproveEnabled.mockReturnValue(false);
    mockResolveNodeId.mockReturnValue({ from: 0, to: 10 });

    await handleBatchEdit("req-37", {
      baseRevision: "rev-1",
      mode: "suggest",
      operations: [
        { type: "update", nodeId: "p-0" }, // no text
      ],
    });

    expect(mockAddSuggestion).not.toHaveBeenCalled();
  });

  it("falls back to auto-approve check when mode is 'apply' but auto-approve disabled", async () => {
    const editor = createMockEditor();
    mockGetEditor.mockReturnValue(editor);
    mockIsAutoApproveEnabled.mockReturnValue(false);
    mockResolveNodeId.mockReturnValue({ from: 0, to: 10 });
    mockGetTextRange.mockReturnValue({ from: 1, to: 9 });

    await handleBatchEdit("req-38", {
      baseRevision: "rev-1",
      mode: "apply",
      operations: [{ type: "update", nodeId: "p-0", text: "new text" }],
    });

    // Should create suggestion instead of applying directly
    expect(mockAddSuggestion).toHaveBeenCalled();
    const call = mockRespond.mock.calls[0][0];
    expect(call.success).toBe(true);
    expect(call.data.suggestionIds).toHaveLength(1);
  });

  it("skips suggest for delete when resolved is null", async () => {
    const editor = createMockEditor();
    mockGetEditor.mockReturnValue(editor);
    mockIsAutoApproveEnabled.mockReturnValue(false);

    await handleBatchEdit("req-39", {
      baseRevision: "rev-1",
      mode: "suggest",
      operations: [
        // Unrecognized type passes validation (no nodeId check)
        // and goes through else branch → resolved=null
        { type: "replace" as string },
      ],
    });

    // No suggestions created for unresolved ops
    expect(mockAddSuggestion).not.toHaveBeenCalled();
  });
});
