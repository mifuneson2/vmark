import { describe, it, expect, beforeEach } from "vitest";
import { useActiveEditorStore } from "../activeEditorStore";

beforeEach(() => {
  useActiveEditorStore.setState({
    activeWysiwygEditor: null,
    activeSourceView: null,
  });
});

describe("activeEditorStore", () => {
  describe("setActiveWysiwygEditor", () => {
    it("sets the WYSIWYG editor reference", () => {
      const mockEditor = { id: "editor-1" } as never;
      useActiveEditorStore.getState().setActiveWysiwygEditor(mockEditor);
      expect(useActiveEditorStore.getState().activeWysiwygEditor).toBe(mockEditor);
    });

    it("clears with null", () => {
      const mockEditor = { id: "editor-1" } as never;
      useActiveEditorStore.getState().setActiveWysiwygEditor(mockEditor);
      useActiveEditorStore.getState().setActiveWysiwygEditor(null);
      expect(useActiveEditorStore.getState().activeWysiwygEditor).toBeNull();
    });
  });

  describe("setActiveSourceView", () => {
    it("sets the Source view reference", () => {
      const mockView = { id: "view-1" } as never;
      useActiveEditorStore.getState().setActiveSourceView(mockView);
      expect(useActiveEditorStore.getState().activeSourceView).toBe(mockView);
    });
  });

  describe("clearWysiwygEditorIfMatch", () => {
    it("clears when editor matches", () => {
      const mockEditor = { id: "editor-1" } as never;
      useActiveEditorStore.getState().setActiveWysiwygEditor(mockEditor);
      useActiveEditorStore.getState().clearWysiwygEditorIfMatch(mockEditor);
      expect(useActiveEditorStore.getState().activeWysiwygEditor).toBeNull();
    });

    it("does NOT clear when editor does not match", () => {
      const editorA = { id: "editor-A" } as never;
      const editorB = { id: "editor-B" } as never;
      useActiveEditorStore.getState().setActiveWysiwygEditor(editorA);
      useActiveEditorStore.getState().clearWysiwygEditorIfMatch(editorB);
      expect(useActiveEditorStore.getState().activeWysiwygEditor).toBe(editorA);
    });

    it("handles clear when no editor is active", () => {
      const mockEditor = { id: "editor-1" } as never;
      // Should not throw
      useActiveEditorStore.getState().clearWysiwygEditorIfMatch(mockEditor);
      expect(useActiveEditorStore.getState().activeWysiwygEditor).toBeNull();
    });
  });

  describe("clearSourceViewIfMatch", () => {
    it("clears when view matches", () => {
      const mockView = { id: "view-1" } as never;
      useActiveEditorStore.getState().setActiveSourceView(mockView);
      useActiveEditorStore.getState().clearSourceViewIfMatch(mockView);
      expect(useActiveEditorStore.getState().activeSourceView).toBeNull();
    });

    it("does NOT clear when view does not match (race condition guard)", () => {
      const viewOld = { id: "old" } as never;
      const viewNew = { id: "new" } as never;
      // Simulate: new view focuses, then old view's blur fires
      useActiveEditorStore.getState().setActiveSourceView(viewNew);
      useActiveEditorStore.getState().clearSourceViewIfMatch(viewOld);
      // New view should still be active
      expect(useActiveEditorStore.getState().activeSourceView).toBe(viewNew);
    });
  });

  describe("clearActiveEditors", () => {
    it("clears both editors", () => {
      useActiveEditorStore.getState().setActiveWysiwygEditor({ id: "w" } as never);
      useActiveEditorStore.getState().setActiveSourceView({ id: "s" } as never);
      useActiveEditorStore.getState().clearActiveEditors();
      expect(useActiveEditorStore.getState().activeWysiwygEditor).toBeNull();
      expect(useActiveEditorStore.getState().activeSourceView).toBeNull();
    });
  });
});
