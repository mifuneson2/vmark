/**
 * Tests for editorHandlers — editor.undo, editor.redo, editor.focus,
 * editor.getUndoState, editor.setMode.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock utils
const mockRespond = vi.fn();
const mockGetEditor = vi.fn();
vi.mock("../utils", () => ({
  respond: (response: unknown) => mockRespond(response),
  getEditor: () => mockGetEditor(),
}));

// Mock unified history
const mockPerformUnifiedUndo = vi.fn();
const mockPerformUnifiedRedo = vi.fn();
const mockCanNativeUndo = vi.fn();
const mockCanNativeRedo = vi.fn();
vi.mock("@/hooks/useUnifiedHistory", () => ({
  performUnifiedUndo: (...args: unknown[]) => mockPerformUnifiedUndo(...args),
  performUnifiedRedo: (...args: unknown[]) => mockPerformUnifiedRedo(...args),
  canNativeUndo: () => mockCanNativeUndo(),
  canNativeRedo: () => mockCanNativeRedo(),
}));

// Mock ProseMirror history
vi.mock("@tiptap/pm/history", () => ({
  undoDepth: () => 3,
  redoDepth: () => 1,
}));

// Mock CodeMirror commands
vi.mock("@codemirror/commands", () => ({
  undoDepth: () => 0,
  redoDepth: () => 0,
}));

// Mock stores
const mockEditorState = { sourceMode: false, setSourceMode: vi.fn() };
vi.mock("@/stores/editorStore", () => ({
  useEditorStore: {
    getState: () => mockEditorState,
  },
}));

const mockActiveEditorState = { activeSourceView: null as object | null };
vi.mock("@/stores/activeEditorStore", () => ({
  useActiveEditorStore: {
    getState: () => mockActiveEditorState,
  },
}));

const mockTabStore = { activeTabId: { main: "tab-1" } };
vi.mock("@/stores/tabStore", () => ({
  useTabStore: {
    getState: () => mockTabStore,
  },
}));

vi.mock("@/stores/unifiedHistoryStore", () => ({
  useUnifiedHistoryStore: {
    getState: () => ({
      canUndoCheckpoint: () => false,
      canRedoCheckpoint: () => false,
    }),
  },
}));

vi.mock("@/utils/workspaceStorage", () => ({
  getCurrentWindowLabel: () => "main",
}));

import {
  handleUndo,
  handleRedo,
  handleFocus,
  handleGetUndoState,
  handleSetMode,
} from "../editorHandlers";

describe("editorHandlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEditorState.sourceMode = false;
    mockActiveEditorState.activeSourceView = null;
  });

  describe("handleUndo", () => {
    it("calls performUnifiedUndo and returns result", async () => {
      mockPerformUnifiedUndo.mockReturnValue(true);

      await handleUndo("req-1");

      expect(mockPerformUnifiedUndo).toHaveBeenCalledWith("main");
      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-1",
        success: true,
        data: { performed: true },
      });
    });

    it("returns performed=false when nothing to undo", async () => {
      mockPerformUnifiedUndo.mockReturnValue(false);

      await handleUndo("req-2");

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-2",
        success: true,
        data: { performed: false },
      });
    });

    it("returns error when performUnifiedUndo throws", async () => {
      mockPerformUnifiedUndo.mockImplementation(() => {
        throw new Error("undo failed");
      });

      await handleUndo("req-undo-err");

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-undo-err",
        success: false,
        error: "undo failed",
      });
    });
  });

  describe("handleRedo", () => {
    it("calls performUnifiedRedo and returns result", async () => {
      mockPerformUnifiedRedo.mockReturnValue(true);

      await handleRedo("req-3");

      expect(mockPerformUnifiedRedo).toHaveBeenCalledWith("main");
      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-3",
        success: true,
        data: { performed: true },
      });
    });

    it("returns error when performUnifiedRedo throws", async () => {
      mockPerformUnifiedRedo.mockImplementation(() => {
        throw new Error("redo failed");
      });

      await handleRedo("req-redo-err");

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-redo-err",
        success: false,
        error: "redo failed",
      });
    });
  });

  describe("handleFocus", () => {
    it("calls editor.commands.focus", async () => {
      const focus = vi.fn();
      mockGetEditor.mockReturnValue({ commands: { focus } });

      await handleFocus("req-4");

      expect(focus).toHaveBeenCalled();
      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-4",
        success: true,
        data: null,
      });
    });

    it("returns error when no editor", async () => {
      mockGetEditor.mockReturnValue(null);

      await handleFocus("req-5");

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-5",
        success: false,
        error: "No active editor",
      });
    });
  });

  describe("handleGetUndoState", () => {
    it("returns undo/redo state in WYSIWYG mode", async () => {
      mockCanNativeUndo.mockReturnValue(true);
      mockCanNativeRedo.mockReturnValue(false);
      mockGetEditor.mockReturnValue({ state: {} });

      await handleGetUndoState("req-6");

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.canUndo).toBe(true);
      expect(call.data.canRedo).toBe(false);
      expect(call.data.undoDepth).toBe(3);
      expect(call.data.redoDepth).toBe(1);
    });

    it("returns source mode undo/redo depths when in source mode with active view", async () => {
      mockEditorState.sourceMode = true;
      mockCanNativeUndo.mockReturnValue(false);
      mockCanNativeRedo.mockReturnValue(true);
      mockActiveEditorState.activeSourceView = { state: {} };

      await handleGetUndoState("req-undo-src");

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      // cmUndoDepth and cmRedoDepth are mocked to return 0
      expect(call.data.undoDepth).toBe(0);
      expect(call.data.redoDepth).toBe(0);
    });

    it("returns zero depths in source mode when no source view available", async () => {
      mockEditorState.sourceMode = true;
      mockCanNativeUndo.mockReturnValue(false);
      mockCanNativeRedo.mockReturnValue(false);
      mockActiveEditorState.activeSourceView = null;

      await handleGetUndoState("req-undo-src-null");

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.undoDepth).toBe(0);
      expect(call.data.redoDepth).toBe(0);
    });

    it("returns error when canNativeUndo throws", async () => {
      mockCanNativeUndo.mockImplementation(() => {
        throw new Error("history error");
      });

      await handleGetUndoState("req-undo-state-err");

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-undo-state-err",
        success: false,
        error: "history error",
      });
    });
  });

  describe("handleSetMode", () => {
    it("switches to source mode", async () => {
      mockEditorState.sourceMode = false;

      await handleSetMode("req-7", { mode: "source" });

      expect(mockEditorState.setSourceMode).toHaveBeenCalledWith(true);
      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-7",
        success: true,
        data: { mode: "source", changed: true },
      });
    });

    it("does not switch when already in target mode", async () => {
      mockEditorState.sourceMode = true;

      await handleSetMode("req-8", { mode: "source" });

      expect(mockEditorState.setSourceMode).not.toHaveBeenCalled();
      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-8",
        success: true,
        data: { mode: "source", changed: false },
      });
    });

    it("returns error for invalid mode", async () => {
      await handleSetMode("req-9", { mode: "invalid" });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-9",
        success: false,
        error: expect.stringContaining("Invalid mode"),
      });
    });

    it("switches to wysiwyg mode from source", async () => {
      mockEditorState.sourceMode = true;

      await handleSetMode("req-10", { mode: "wysiwyg" });

      expect(mockEditorState.setSourceMode).toHaveBeenCalledWith(false);
      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-10",
        success: true,
        data: { mode: "wysiwyg", changed: true },
      });
    });

    it("handles non-Error thrown in catch", async () => {
      mockEditorState.sourceMode = false;
      // setSourceMode throws a non-Error
      mockEditorState.setSourceMode = vi.fn(() => { throw "string error"; });

      await handleSetMode("req-11", { mode: "source" });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-11",
        success: false,
        error: "string error",
      });

      // Restore
      mockEditorState.setSourceMode = vi.fn();
    });
  });

  describe("handleGetUndoState — edge cases", () => {
    it("returns zero checkpoint state when tabId is falsy", async () => {
      mockTabStore.activeTabId = { main: "" };
      mockCanNativeUndo.mockReturnValue(false);
      mockCanNativeRedo.mockReturnValue(false);
      mockGetEditor.mockReturnValue({ state: {} });

      await handleGetUndoState("req-undo-no-tab");

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.hasCheckpointUndo).toBe(false);
      expect(call.data.hasCheckpointRedo).toBe(false);

      // Restore
      mockTabStore.activeTabId = { main: "tab-1" };
    });

    it("returns zero depths in WYSIWYG mode when no editor", async () => {
      mockEditorState.sourceMode = false;
      mockCanNativeUndo.mockReturnValue(false);
      mockCanNativeRedo.mockReturnValue(false);
      mockGetEditor.mockReturnValue(null);

      await handleGetUndoState("req-undo-no-editor");

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.undoDepth).toBe(0);
      expect(call.data.redoDepth).toBe(0);
    });

    it("handles non-Error thrown in catch", async () => {
      mockCanNativeUndo.mockImplementation(() => { throw 42; });

      await handleGetUndoState("req-undo-nonstr");

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-undo-nonstr",
        success: false,
        error: "42",
      });
    });
  });

  describe("handleUndo — non-Error catch", () => {
    it("handles non-Error thrown in catch", async () => {
      mockPerformUnifiedUndo.mockImplementation(() => { throw "undo string"; });

      await handleUndo("req-undo-str");

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-undo-str",
        success: false,
        error: "undo string",
      });
    });
  });

  describe("handleRedo — non-Error catch", () => {
    it("handles non-Error thrown in catch", async () => {
      mockPerformUnifiedRedo.mockImplementation(() => { throw "redo string"; });

      await handleRedo("req-redo-str");

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-redo-str",
        success: false,
        error: "redo string",
      });
    });
  });

  describe("handleFocus — non-Error catch", () => {
    it("handles non-Error thrown in catch", async () => {
      mockGetEditor.mockReturnValue({
        commands: { focus: vi.fn(() => { throw 123; }) },
      });

      await handleFocus("req-focus-str");

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-focus-str",
        success: false,
        error: "123",
      });
    });
  });
});
