/**
 * Tests for Source Cursor Context Plugin
 *
 * Verifies that the plugin updates the sourceCursorContextStore
 * when selection or document changes.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockComputeSourceCursorContext = vi.fn(() => ({
  bold: false,
  italic: false,
  code: false,
  codeBlock: null,
  heading: null,
  list: null,
  blockquote: null,
  table: null,
  link: null,
  image: null,
  inlineMath: null,
  footnote: null,
  formattedRange: null,
}));

vi.mock("@/plugins/sourceContextDetection/cursorContext", () => ({
  computeSourceCursorContext: (...args: unknown[]) =>
    mockComputeSourceCursorContext(...args),
}));

import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { useSourceCursorContextStore } from "@/stores/sourceCursorContextStore";
import { createSourceCursorContextPlugin } from "./sourceCursorContext";

const createdViews: EditorView[] = [];

afterEach(() => {
  createdViews.forEach((v) => v.destroy());
  createdViews.length = 0;
  useSourceCursorContextStore.getState().clearContext();
});

function createView(content: string, cursorPos?: number): EditorView {
  const pos = cursorPos ?? 0;
  const state = EditorState.create({
    doc: content,
    selection: { anchor: pos },
    extensions: [createSourceCursorContextPlugin()],
  });
  const container = document.createElement("div");
  document.body.appendChild(container);
  const view = new EditorView({ state, parent: container });
  createdViews.push(view);
  return view;
}

describe("createSourceCursorContextPlugin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSourceCursorContextStore.getState().clearContext();
  });

  it("returns an extension", () => {
    const ext = createSourceCursorContextPlugin();
    expect(ext).toBeDefined();
  });

  it("updates context on document change", () => {
    const view = createView("hello");
    mockComputeSourceCursorContext.mockClear();

    view.dispatch({
      changes: { from: 5, to: 5, insert: " world" },
    });

    expect(mockComputeSourceCursorContext).toHaveBeenCalled();
  });

  it("updates context on selection change", () => {
    const view = createView("hello world");
    mockComputeSourceCursorContext.mockClear();

    view.dispatch({
      selection: { anchor: 5 },
    });

    expect(mockComputeSourceCursorContext).toHaveBeenCalled();
  });

  it("sets editorView in store on update", () => {
    const view = createView("hello");

    // Trigger an update
    view.dispatch({
      selection: { anchor: 3 },
    });

    const store = useSourceCursorContextStore.getState();
    expect(store.editorView).toBe(view);
  });

  it("calls computeSourceCursorContext with the view", () => {
    const view = createView("hello");
    mockComputeSourceCursorContext.mockClear();

    view.dispatch({
      selection: { anchor: 2 },
    });

    expect(mockComputeSourceCursorContext).toHaveBeenCalledWith(view);
  });

  it("updates context when editorView differs from store", () => {
    const view1 = createView("hello");
    mockComputeSourceCursorContext.mockClear();

    // First view triggers update
    view1.dispatch({ selection: { anchor: 1 } });
    expect(mockComputeSourceCursorContext).toHaveBeenCalled();

    // Store now has view1
    const store = useSourceCursorContextStore.getState();
    expect(store.editorView).toBe(view1);
  });

  it("handles empty document on doc change", () => {
    const view = createView("");
    mockComputeSourceCursorContext.mockClear();

    // Insert into empty doc
    view.dispatch({
      changes: { from: 0, to: 0, insert: "x" },
    });

    expect(mockComputeSourceCursorContext).toHaveBeenCalled();
  });
});
