import { describe, it, expect, beforeEach } from "vitest";
import { useEditorStore } from "./editorStore";

describe("editorStore", () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
  });

  it("has correct initial state", () => {
    const state = useEditorStore.getState();

    expect(state.content).toBe("");
    expect(state.savedContent).toBe("");
    expect(state.filePath).toBeNull();
    expect(state.isDirty).toBe(false);
    expect(state.focusModeEnabled).toBe(false);
    expect(state.typewriterModeEnabled).toBe(false);
    expect(state.sourceMode).toBe(false);
    expect(state.wordWrap).toBe(true);
    expect(state.showLineNumbers).toBe(false);
    expect(state.diagramPreviewEnabled).toBe(false);
    expect(state.cursorInfo).toBeNull();
    expect(state.lastAutoSave).toBeNull();
  });

  it("setContent updates content and marks dirty", () => {
    const { setContent } = useEditorStore.getState();

    setContent("# Hello World");

    const state = useEditorStore.getState();
    expect(state.content).toBe("# Hello World");
    expect(state.isDirty).toBe(true);
  });

  it("setContent does not mark dirty when content matches savedContent", () => {
    const { loadContent, setContent } = useEditorStore.getState();

    loadContent("saved text");
    setContent("saved text");

    expect(useEditorStore.getState().isDirty).toBe(false);
  });

  it("setFilePath updates the file path", () => {
    const { setFilePath } = useEditorStore.getState();

    setFilePath("/path/to/file.md");
    expect(useEditorStore.getState().filePath).toBe("/path/to/file.md");
  });

  it("setFilePath can clear path to null", () => {
    const { setFilePath } = useEditorStore.getState();

    setFilePath("/some/path.md");
    setFilePath(null);
    expect(useEditorStore.getState().filePath).toBeNull();
  });

  it("loadContent sets content without marking dirty", () => {
    const { loadContent } = useEditorStore.getState();

    loadContent("# Loaded Content");

    const state = useEditorStore.getState();
    expect(state.content).toBe("# Loaded Content");
    expect(state.savedContent).toBe("# Loaded Content");
    expect(state.isDirty).toBe(false);
  });

  it("loadContent sets content and filePath together", () => {
    const { loadContent } = useEditorStore.getState();

    loadContent("# File Content", "/path/to/doc.md");

    const state = useEditorStore.getState();
    expect(state.content).toBe("# File Content");
    expect(state.filePath).toBe("/path/to/doc.md");
    expect(state.isDirty).toBe(false);
  });

  it("loadContent sets filePath to null when not provided", () => {
    const { loadContent } = useEditorStore.getState();

    loadContent("# No path");

    expect(useEditorStore.getState().filePath).toBeNull();
  });

  it("loadContent increments documentId", () => {
    const { loadContent } = useEditorStore.getState();
    const before = useEditorStore.getState().documentId;

    loadContent("first");
    expect(useEditorStore.getState().documentId).toBe(before + 1);

    loadContent("second");
    expect(useEditorStore.getState().documentId).toBe(before + 2);
  });

  it("markSaved clears the dirty flag", () => {
    const { setContent, markSaved } = useEditorStore.getState();

    setContent("Some content");
    expect(useEditorStore.getState().isDirty).toBe(true);

    markSaved();

    const state = useEditorStore.getState();
    expect(state.isDirty).toBe(false);
    expect(state.savedContent).toBe("Some content");
  });

  it("markAutoSaved clears dirty flag and sets lastAutoSave timestamp", () => {
    const { setContent, markAutoSaved } = useEditorStore.getState();

    setContent("auto-saved content");
    expect(useEditorStore.getState().isDirty).toBe(true);

    const before = Date.now();
    markAutoSaved();
    const after = Date.now();

    const state = useEditorStore.getState();
    expect(state.isDirty).toBe(false);
    expect(state.savedContent).toBe("auto-saved content");
    expect(state.lastAutoSave).toBeGreaterThanOrEqual(before);
    expect(state.lastAutoSave).toBeLessThanOrEqual(after);
  });

  it("toggleFocusMode toggles focus mode", () => {
    const { toggleFocusMode } = useEditorStore.getState();

    expect(useEditorStore.getState().focusModeEnabled).toBe(false);

    toggleFocusMode();
    expect(useEditorStore.getState().focusModeEnabled).toBe(true);

    toggleFocusMode();
    expect(useEditorStore.getState().focusModeEnabled).toBe(false);
  });

  it("toggleTypewriterMode toggles typewriter mode", () => {
    const { toggleTypewriterMode } = useEditorStore.getState();

    expect(useEditorStore.getState().typewriterModeEnabled).toBe(false);

    toggleTypewriterMode();
    expect(useEditorStore.getState().typewriterModeEnabled).toBe(true);

    toggleTypewriterMode();
    expect(useEditorStore.getState().typewriterModeEnabled).toBe(false);
  });

  it("toggleSourceMode toggles source mode", () => {
    const { toggleSourceMode } = useEditorStore.getState();

    expect(useEditorStore.getState().sourceMode).toBe(false);

    toggleSourceMode();
    expect(useEditorStore.getState().sourceMode).toBe(true);

    toggleSourceMode();
    expect(useEditorStore.getState().sourceMode).toBe(false);
  });

  it("setSourceMode sets source mode explicitly", () => {
    const { setSourceMode } = useEditorStore.getState();

    setSourceMode(true);
    expect(useEditorStore.getState().sourceMode).toBe(true);

    setSourceMode(false);
    expect(useEditorStore.getState().sourceMode).toBe(false);
  });

  it("toggleWordWrap toggles word wrap", () => {
    const { toggleWordWrap } = useEditorStore.getState();

    expect(useEditorStore.getState().wordWrap).toBe(true); // default is true

    toggleWordWrap();
    expect(useEditorStore.getState().wordWrap).toBe(false);

    toggleWordWrap();
    expect(useEditorStore.getState().wordWrap).toBe(true);
  });

  it("toggleLineNumbers toggles line numbers", () => {
    const { toggleLineNumbers } = useEditorStore.getState();

    expect(useEditorStore.getState().showLineNumbers).toBe(false);

    toggleLineNumbers();
    expect(useEditorStore.getState().showLineNumbers).toBe(true);

    toggleLineNumbers();
    expect(useEditorStore.getState().showLineNumbers).toBe(false);
  });

  it("toggleDiagramPreview toggles diagram preview", () => {
    const { toggleDiagramPreview } = useEditorStore.getState();

    expect(useEditorStore.getState().diagramPreviewEnabled).toBe(false);

    toggleDiagramPreview();
    expect(useEditorStore.getState().diagramPreviewEnabled).toBe(true);

    toggleDiagramPreview();
    expect(useEditorStore.getState().diagramPreviewEnabled).toBe(false);
  });

  it("setCursorInfo sets cursor info", () => {
    const { setCursorInfo } = useEditorStore.getState();

    const cursorInfo = { line: 5, column: 10, offset: 42 };
    setCursorInfo(cursorInfo as never);
    expect(useEditorStore.getState().cursorInfo).toEqual(cursorInfo);
  });

  it("setCursorInfo can set to null", () => {
    const { setCursorInfo } = useEditorStore.getState();

    setCursorInfo({ line: 1, column: 1, offset: 0 } as never);
    setCursorInfo(null);
    expect(useEditorStore.getState().cursorInfo).toBeNull();
  });

  it("reset restores initial state but increments documentId", () => {
    const { setContent, setFilePath, toggleFocusMode, toggleSourceMode, loadContent, reset } =
      useEditorStore.getState();

    loadContent("content", "/path.md");
    setContent("Modified content");
    setFilePath("/some/path.md");
    toggleFocusMode();
    toggleSourceMode();

    const docIdBefore = useEditorStore.getState().documentId;

    reset();

    const state = useEditorStore.getState();
    expect(state.content).toBe("");
    expect(state.savedContent).toBe("");
    expect(state.filePath).toBeNull();
    expect(state.isDirty).toBe(false);
    expect(state.focusModeEnabled).toBe(false);
    expect(state.sourceMode).toBe(false);
    expect(state.wordWrap).toBe(true);
    expect(state.showLineNumbers).toBe(false);
    expect(state.diagramPreviewEnabled).toBe(false);
    expect(state.cursorInfo).toBeNull();
    expect(state.lastAutoSave).toBeNull();
    expect(state.documentId).toBe(docIdBefore + 1);
  });
});
