/**
 * Tests for useUnifiedHistory
 *
 * Tests cross-mode undo/redo with checkpoints when switching between
 * WYSIWYG and Source modes.
 */

import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock CodeMirror commands
const mockUndo = vi.fn(() => true);
const mockRedo = vi.fn(() => true);
const mockUndoDepth = vi.fn(() => 0);
const mockRedoDepth = vi.fn(() => 0);

vi.mock("@codemirror/commands", () => ({
  undo: (...args: unknown[]) => mockUndo(...args),
  redo: (...args: unknown[]) => mockRedo(...args),
  undoDepth: (...args: unknown[]) => mockUndoDepth(...args),
  redoDepth: (...args: unknown[]) => mockRedoDepth(...args),
}));

// Mock WindowContext
vi.mock("@/contexts/WindowContext", () => ({
  useWindowLabel: vi.fn(() => "main"),
}));

import { useUnifiedHistoryStore } from "@/stores/unifiedHistoryStore";
import { useEditorStore } from "@/stores/editorStore";
import { useDocumentStore } from "@/stores/documentStore";
import { useTabStore } from "@/stores/tabStore";
import { useTiptapEditorStore } from "@/stores/tiptapEditorStore";
import { useActiveEditorStore } from "@/stores/activeEditorStore";
import {
  toggleSourceModeWithCheckpoint,
  canNativeUndo,
  canNativeRedo,
  doNativeUndo,
  doNativeRedo,
  clearDocumentHistory,
  clearAllHistory,
  performUnifiedUndo,
  performUnifiedRedo,
} from "./useUnifiedHistory";

describe("useUnifiedHistory", () => {
  beforeEach(() => {
    // Reset all stores
    useUnifiedHistoryStore.getState().clearAll();
    useEditorStore.setState({ sourceMode: false });
    useTabStore.setState({ activeTabId: { main: "tab-1" } });

    // Set up a document in the store
    useDocumentStore.setState({
      documents: {
        "tab-1": {
          content: "# Hello World",
          cursorInfo: null,
          dirty: false,
          filePath: "/test/doc.md",
          title: "doc.md",
        },
      },
    });

    // Reset mocks
    mockUndo.mockReset().mockReturnValue(true);
    mockRedo.mockReset().mockReturnValue(true);
    mockUndoDepth.mockReset().mockReturnValue(0);
    mockRedoDepth.mockReset().mockReturnValue(0);
  });

  describe("toggleSourceModeWithCheckpoint", () => {
    it("creates checkpoint before toggling source mode", () => {
      toggleSourceModeWithCheckpoint("main");

      const history = useUnifiedHistoryStore.getState().documents["tab-1"];
      expect(history).toBeDefined();
      expect(history.undoStack).toHaveLength(1);
      expect(history.undoStack[0].markdown).toBe("# Hello World");
      expect(history.undoStack[0].mode).toBe("wysiwyg");
    });

    it("toggles source mode after creating checkpoint", () => {
      const initialMode = useEditorStore.getState().sourceMode;
      toggleSourceModeWithCheckpoint("main");
      expect(useEditorStore.getState().sourceMode).toBe(!initialMode);
    });

    it("records source mode in checkpoint when already in source mode", () => {
      useEditorStore.setState({ sourceMode: true });
      toggleSourceModeWithCheckpoint("main");

      const history = useUnifiedHistoryStore.getState().documents["tab-1"];
      expect(history.undoStack[0].mode).toBe("source");
    });

    it("falls back to toggle without checkpoint when no active tab", () => {
      useTabStore.setState({ activeTabId: {} });
      const initialMode = useEditorStore.getState().sourceMode;

      toggleSourceModeWithCheckpoint("main");

      // Should still toggle mode
      expect(useEditorStore.getState().sourceMode).toBe(!initialMode);
      // But no checkpoint created
      expect(useUnifiedHistoryStore.getState().documents["tab-1"]).toBeUndefined();
    });

    it("falls back to toggle without checkpoint when document not found", () => {
      useDocumentStore.setState({ documents: {} });
      const initialMode = useEditorStore.getState().sourceMode;

      toggleSourceModeWithCheckpoint("main");

      expect(useEditorStore.getState().sourceMode).toBe(!initialMode);
    });

    it("stores cursor info in checkpoint when available", () => {
      useDocumentStore.setState({
        documents: {
          "tab-1": {
            content: "# Test",
            cursorInfo: { from: 5, to: 5 } as never,
            dirty: false,
            filePath: "/test/doc.md",
            title: "doc.md",
          },
        },
      });

      toggleSourceModeWithCheckpoint("main");

      const history = useUnifiedHistoryStore.getState().documents["tab-1"];
      expect(history.undoStack[0].cursorInfo).toEqual({ from: 5, to: 5 });
    });
  });

  describe("canNativeUndo", () => {
    it("returns false in source mode when no view is available", () => {
      useEditorStore.setState({ sourceMode: true });
      useActiveEditorStore.setState({ activeSourceView: null });

      expect(canNativeUndo()).toBe(false);
    });

    it("returns true in source mode when undoDepth > 0", () => {
      useEditorStore.setState({ sourceMode: true });
      mockUndoDepth.mockReturnValue(3);
      const mockView = { state: {} };
      useActiveEditorStore.setState({ activeSourceView: mockView as never });

      expect(canNativeUndo()).toBe(true);
    });

    it("returns false in source mode when undoDepth is 0", () => {
      useEditorStore.setState({ sourceMode: true });
      mockUndoDepth.mockReturnValue(0);
      const mockView = { state: {} };
      useActiveEditorStore.setState({ activeSourceView: mockView as never });

      expect(canNativeUndo()).toBe(false);
    });

    it("returns false in WYSIWYG mode when no editor is available", () => {
      useEditorStore.setState({ sourceMode: false });
      useTiptapEditorStore.setState({ editor: null });

      expect(canNativeUndo()).toBe(false);
    });

    it("returns true in WYSIWYG mode when editor can undo", () => {
      useEditorStore.setState({ sourceMode: false });
      useTiptapEditorStore.setState({
        editor: { can: () => ({ undo: () => true, redo: () => false }) } as never,
      });

      expect(canNativeUndo()).toBe(true);
    });

    it("returns false in WYSIWYG mode when editor cannot undo", () => {
      useEditorStore.setState({ sourceMode: false });
      useTiptapEditorStore.setState({
        editor: { can: () => ({ undo: () => false, redo: () => false }) } as never,
      });

      expect(canNativeUndo()).toBe(false);
    });
  });

  describe("canNativeRedo", () => {
    it("returns false in source mode when no view is available", () => {
      useEditorStore.setState({ sourceMode: true });
      useActiveEditorStore.setState({ activeSourceView: null });

      expect(canNativeRedo()).toBe(false);
    });

    it("returns true in source mode when redoDepth > 0", () => {
      useEditorStore.setState({ sourceMode: true });
      mockRedoDepth.mockReturnValue(2);
      const mockView = { state: {} };
      useActiveEditorStore.setState({ activeSourceView: mockView as never });

      expect(canNativeRedo()).toBe(true);
    });

    it("returns false in WYSIWYG mode when editor cannot redo", () => {
      useEditorStore.setState({ sourceMode: false });
      useTiptapEditorStore.setState({
        editor: { can: () => ({ undo: () => false, redo: () => false }) } as never,
      });

      expect(canNativeRedo()).toBe(false);
    });

    it("returns true in WYSIWYG mode when editor can redo", () => {
      useEditorStore.setState({ sourceMode: false });
      useTiptapEditorStore.setState({
        editor: { can: () => ({ undo: () => false, redo: () => true }) } as never,
      });

      expect(canNativeRedo()).toBe(true);
    });
  });

  describe("doNativeUndo", () => {
    it("returns false in source mode when no view or depth 0", () => {
      useEditorStore.setState({ sourceMode: true });
      useActiveEditorStore.setState({ activeSourceView: null });

      expect(doNativeUndo()).toBe(false);
    });

    it("calls CM undo in source mode when depth > 0", () => {
      useEditorStore.setState({ sourceMode: true });
      mockUndoDepth.mockReturnValue(1);
      mockUndo.mockReturnValue(true);
      const mockView = { state: {} };
      useActiveEditorStore.setState({ activeSourceView: mockView as never });

      expect(doNativeUndo()).toBe(true);
      expect(mockUndo).toHaveBeenCalledWith(mockView);
    });

    it("calls tiptap undo in WYSIWYG mode", () => {
      useEditorStore.setState({ sourceMode: false });
      const mockCommands = { undo: vi.fn(() => true) };
      useTiptapEditorStore.setState({
        editor: {
          can: () => ({ undo: () => true, redo: () => false }),
          commands: mockCommands,
        } as never,
      });

      expect(doNativeUndo()).toBe(true);
      expect(mockCommands.undo).toHaveBeenCalled();
    });

    it("returns false in WYSIWYG when editor cannot undo", () => {
      useEditorStore.setState({ sourceMode: false });
      useTiptapEditorStore.setState({
        editor: {
          can: () => ({ undo: () => false, redo: () => false }),
          commands: { undo: vi.fn() },
        } as never,
      });

      expect(doNativeUndo()).toBe(false);
    });
  });

  describe("doNativeRedo", () => {
    it("returns false in source mode when no view", () => {
      useEditorStore.setState({ sourceMode: true });
      useActiveEditorStore.setState({ activeSourceView: null });

      expect(doNativeRedo()).toBe(false);
    });

    it("calls CM redo in source mode when depth > 0", () => {
      useEditorStore.setState({ sourceMode: true });
      mockRedoDepth.mockReturnValue(1);
      mockRedo.mockReturnValue(true);
      const mockView = { state: {} };
      useActiveEditorStore.setState({ activeSourceView: mockView as never });

      expect(doNativeRedo()).toBe(true);
      expect(mockRedo).toHaveBeenCalledWith(mockView);
    });

    it("calls tiptap redo in WYSIWYG mode", () => {
      useEditorStore.setState({ sourceMode: false });
      const mockCommands = { redo: vi.fn(() => true) };
      useTiptapEditorStore.setState({
        editor: {
          can: () => ({ undo: () => false, redo: () => true }),
          commands: mockCommands,
        } as never,
      });

      expect(doNativeRedo()).toBe(true);
      expect(mockCommands.redo).toHaveBeenCalled();
    });
  });

  describe("clearDocumentHistory", () => {
    it("clears history for specific document", () => {
      useUnifiedHistoryStore.getState().createCheckpoint("tab-1", {
        markdown: "content",
        mode: "wysiwyg",
        cursorInfo: null,
      });

      expect(useUnifiedHistoryStore.getState().documents["tab-1"]).toBeDefined();

      clearDocumentHistory("tab-1");

      expect(useUnifiedHistoryStore.getState().documents["tab-1"]).toBeUndefined();
    });
  });

  describe("clearAllHistory", () => {
    it("clears all document histories", () => {
      useUnifiedHistoryStore.getState().createCheckpoint("tab-1", {
        markdown: "content1",
        mode: "wysiwyg",
        cursorInfo: null,
      });
      useUnifiedHistoryStore.getState().createCheckpoint("tab-2", {
        markdown: "content2",
        mode: "source",
        cursorInfo: null,
      });

      clearAllHistory();

      expect(useUnifiedHistoryStore.getState().documents).toEqual({});
    });
  });

  describe("performUnifiedUndo", () => {
    it("returns true when native undo succeeds", () => {
      // Set up WYSIWYG mode with undoable editor
      useEditorStore.setState({ sourceMode: false });
      useTiptapEditorStore.setState({
        editor: {
          can: () => ({ undo: () => true, redo: () => false }),
          commands: { undo: vi.fn(() => true) },
        } as never,
      });

      expect(performUnifiedUndo("main")).toBe(true);
    });

    it("falls back to checkpoint when native undo exhausted", () => {
      // No native undo available
      useEditorStore.setState({ sourceMode: false });
      useTiptapEditorStore.setState({
        editor: {
          can: () => ({ undo: () => false, redo: () => false }),
          commands: { undo: vi.fn(() => false) },
        } as never,
      });

      // Create a checkpoint
      useUnifiedHistoryStore.getState().createCheckpoint("tab-1", {
        markdown: "previous content",
        mode: "wysiwyg",
        cursorInfo: null,
      });

      const result = performUnifiedUndo("main");

      expect(result).toBe(true);
      // Content should be restored
      expect(useDocumentStore.getState().getDocument("tab-1")?.content).toBe("previous content");
    });

    it("returns false when no native undo and no checkpoint", () => {
      useEditorStore.setState({ sourceMode: false });
      useTiptapEditorStore.setState({
        editor: {
          can: () => ({ undo: () => false, redo: () => false }),
          commands: { undo: vi.fn(() => false) },
        } as never,
      });

      expect(performUnifiedUndo("main")).toBe(false);
    });

    it("returns false when no active tab", () => {
      useEditorStore.setState({ sourceMode: false });
      useTiptapEditorStore.setState({ editor: null });
      useTabStore.setState({ activeTabId: {} });

      expect(performUnifiedUndo("main")).toBe(false);
    });

    it("pushes current state to redo stack before restoring", () => {
      useEditorStore.setState({ sourceMode: false });
      useTiptapEditorStore.setState({
        editor: {
          can: () => ({ undo: () => false, redo: () => false }),
          commands: { undo: vi.fn(() => false) },
        } as never,
      });

      useUnifiedHistoryStore.getState().createCheckpoint("tab-1", {
        markdown: "old content",
        mode: "wysiwyg",
        cursorInfo: null,
      });

      performUnifiedUndo("main");

      const history = useUnifiedHistoryStore.getState().documents["tab-1"];
      expect(history.redoStack).toHaveLength(1);
      expect(history.redoStack[0].markdown).toBe("# Hello World");
    });

    it("returns false when document not found", () => {
      useEditorStore.setState({ sourceMode: false });
      useTiptapEditorStore.setState({
        editor: {
          can: () => ({ undo: () => false, redo: () => false }),
          commands: { undo: vi.fn(() => false) },
        } as never,
      });

      useDocumentStore.setState({ documents: {} });

      // Even with checkpoint, no doc means can't undo
      useUnifiedHistoryStore.getState().createCheckpoint("tab-1", {
        markdown: "content",
        mode: "wysiwyg",
        cursorInfo: null,
      });

      expect(performUnifiedUndo("main")).toBe(false);
    });
  });

  describe("performUnifiedRedo", () => {
    it("returns true when native redo succeeds", () => {
      useEditorStore.setState({ sourceMode: false });
      useTiptapEditorStore.setState({
        editor: {
          can: () => ({ undo: () => false, redo: () => true }),
          commands: { redo: vi.fn(() => true) },
        } as never,
      });

      expect(performUnifiedRedo("main")).toBe(true);
    });

    it("falls back to checkpoint redo when native redo exhausted", () => {
      useEditorStore.setState({ sourceMode: false });
      useTiptapEditorStore.setState({
        editor: {
          can: () => ({ undo: () => false, redo: () => false }),
          commands: { redo: vi.fn(() => false) },
        } as never,
      });

      // Set up redo checkpoint
      useUnifiedHistoryStore.getState().pushRedo("tab-1", {
        markdown: "redo content",
        mode: "source",
        cursorInfo: null,
      });

      const result = performUnifiedRedo("main");

      expect(result).toBe(true);
      expect(useDocumentStore.getState().getDocument("tab-1")?.content).toBe("redo content");
    });

    it("returns false when no native redo and no redo checkpoint", () => {
      useEditorStore.setState({ sourceMode: false });
      useTiptapEditorStore.setState({
        editor: {
          can: () => ({ undo: () => false, redo: () => false }),
          commands: { redo: vi.fn(() => false) },
        } as never,
      });

      expect(performUnifiedRedo("main")).toBe(false);
    });

    it("returns false when no active tab", () => {
      useEditorStore.setState({ sourceMode: false });
      useTiptapEditorStore.setState({ editor: null });
      useTabStore.setState({ activeTabId: {} });

      expect(performUnifiedRedo("main")).toBe(false);
    });

    it("pushes current state to undo stack before restoring", () => {
      useEditorStore.setState({ sourceMode: false });
      useTiptapEditorStore.setState({
        editor: {
          can: () => ({ undo: () => false, redo: () => false }),
          commands: { redo: vi.fn(() => false) },
        } as never,
      });

      useUnifiedHistoryStore.getState().pushRedo("tab-1", {
        markdown: "redo content",
        mode: "wysiwyg",
        cursorInfo: null,
      });

      performUnifiedRedo("main");

      const history = useUnifiedHistoryStore.getState().documents["tab-1"];
      expect(history.undoStack).toHaveLength(1);
      expect(history.undoStack[0].markdown).toBe("# Hello World");
    });
  });
});
