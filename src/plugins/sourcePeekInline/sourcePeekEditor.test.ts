/**
 * Tests for sourcePeekEditor — createCodeMirrorEditor and cleanupCMView.
 */

const mockDestroy = vi.fn();
const mockFocus = vi.fn();

vi.mock("@codemirror/state", () => ({
  EditorState: {
    create: vi.fn(() => ({ doc: { toString: () => "test" } })),
  },
}));

// Capture keymap bindings and updateListener callback so tests can invoke them
let capturedKeymapBindings: Array<{ key: string; run: () => boolean }> = [];
let capturedUpdateListener: ((update: unknown) => void) | null = null;

vi.mock("@codemirror/view", () => {
  class MockCMView {
    destroy = mockDestroy;
    focus = mockFocus;
    state = { doc: { toString: () => "test" } };
    constructor(public config: Record<string, unknown>) {}
  }
  (MockCMView as unknown as Record<string, unknown>).theme = vi.fn(() => ({}));
  (MockCMView as unknown as Record<string, unknown>).lineWrapping = {};
  (MockCMView as unknown as Record<string, unknown>).updateListener = {
    of: vi.fn((cb: (update: unknown) => void) => {
      capturedUpdateListener = cb;
      return {};
    }),
  };
  return {
    EditorView: MockCMView,
    keymap: {
      of: vi.fn((bindings: Array<{ key: string; run: () => boolean }>) => {
        capturedKeymapBindings = bindings;
        return {};
      }),
    },
  };
});

vi.mock("@codemirror/commands", () => ({
  defaultKeymap: [],
  history: vi.fn(() => ({})),
  historyKeymap: [],
}));

vi.mock("@codemirror/lang-markdown", () => ({
  markdown: vi.fn(() => ({})),
}));

vi.mock("@codemirror/language-data", () => ({
  languages: [],
}));

vi.mock("@codemirror/language", () => ({
  syntaxHighlighting: vi.fn(() => ({})),
}));

vi.mock("@/plugins/codemirror", () => ({
  codeHighlightStyle: {},
}));

import { describe, expect, it, vi, beforeEach } from "vitest";
import { createCodeMirrorEditor, cleanupCMView } from "./sourcePeekEditor";
import { EditorState as CMState } from "@codemirror/state";
import { EditorView as CMView } from "@codemirror/view";
import { history } from "@codemirror/commands";
import { markdown as markdownLang } from "@codemirror/lang-markdown";
import { syntaxHighlighting } from "@codemirror/language";

// ---------------------------------------------------------------------------
// cleanupCMView
// ---------------------------------------------------------------------------

describe("cleanupCMView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanupCMView();
    vi.clearAllMocks();
  });

  it("does not throw when no CM view exists", () => {
    expect(() => cleanupCMView()).not.toThrow();
  });

  it("destroys CM view after createCodeMirrorEditor was called", () => {
    const noop = () => {};
    createCodeMirrorEditor("test", noop, noop, noop);
    cleanupCMView();
    expect(mockDestroy).toHaveBeenCalled();
  });

  it("calling cleanupCMView twice does not throw", () => {
    const noop = () => {};
    createCodeMirrorEditor("test", noop, noop, noop);
    cleanupCMView();
    expect(() => cleanupCMView()).not.toThrow();
  });

  it("only calls destroy once on double cleanup", () => {
    const noop = () => {};
    createCodeMirrorEditor("test", noop, noop, noop);
    cleanupCMView();
    const destroyCount = mockDestroy.mock.calls.length;
    cleanupCMView();
    expect(mockDestroy.mock.calls.length).toBe(destroyCount);
  });
});

// ---------------------------------------------------------------------------
// createCodeMirrorEditor
// ---------------------------------------------------------------------------

describe("createCodeMirrorEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanupCMView();
    vi.clearAllMocks();
  });

  it("returns an HTMLElement", () => {
    const noop = () => {};
    const el = createCodeMirrorEditor("# Hello", noop, noop, noop);
    expect(el).toBeInstanceOf(HTMLElement);
  });

  it("returned element has correct class", () => {
    const noop = () => {};
    const el = createCodeMirrorEditor("test", noop, noop, noop);
    expect(el.className).toBe("source-peek-inline-editor");
  });

  it("creates CMState with provided markdown", () => {
    const noop = () => {};
    createCodeMirrorEditor("# My Content", noop, noop, noop);
    expect(CMState.create).toHaveBeenCalledWith(
      expect.objectContaining({ doc: "# My Content" })
    );
  });

  it("destroys previous CM view when creating a new one", () => {
    const noop = () => {};
    createCodeMirrorEditor("first", noop, noop, noop);
    createCodeMirrorEditor("second", noop, noop, noop);
    expect(mockDestroy).toHaveBeenCalled();
  });

  it("creates a theme with CMView.theme", () => {
    const noop = () => {};
    createCodeMirrorEditor("test", noop, noop, noop);
    expect((CMView as unknown as Record<string, ReturnType<typeof vi.fn>>).theme).toHaveBeenCalled();
  });

  it("configures markdown language support", () => {
    const noop = () => {};
    createCodeMirrorEditor("test", noop, noop, noop);
    expect(markdownLang).toHaveBeenCalled();
  });

  it("configures syntax highlighting", () => {
    const noop = () => {};
    createCodeMirrorEditor("test", noop, noop, noop);
    expect(syntaxHighlighting).toHaveBeenCalled();
  });

  it("configures history extension", () => {
    const noop = () => {};
    createCodeMirrorEditor("test", noop, noop, noop);
    expect(history).toHaveBeenCalled();
  });

  it("creates container as parent for CMView", () => {
    const noop = () => {};
    const el = createCodeMirrorEditor("test", noop, noop, noop);
    expect(el.tagName).toBe("DIV");
  });

  it("handleSave keymap binding calls onSave and returns true (lines 52-53)", () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    const onUpdate = vi.fn();

    createCodeMirrorEditor("test", onSave, onCancel, onUpdate);

    // Find the Mod-Enter binding in captured keymap bindings
    const saveBinding = capturedKeymapBindings.find((b) => b.key === "Mod-Enter");
    expect(saveBinding).toBeDefined();

    const result = saveBinding!.run();
    expect(result).toBe(true);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("handleCancel keymap binding calls onCancel and returns true (lines 57-58)", () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    const onUpdate = vi.fn();

    createCodeMirrorEditor("test", onSave, onCancel, onUpdate);

    // Find the Escape binding in captured keymap bindings
    const cancelBinding = capturedKeymapBindings.find((b) => b.key === "Escape");
    expect(cancelBinding).toBeDefined();

    const result = cancelBinding!.run();
    expect(result).toBe(true);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("updateListener calls onUpdate when docChanged is true (lines 73-75)", () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    const onUpdate = vi.fn();

    createCodeMirrorEditor("initial text", onSave, onCancel, onUpdate);

    expect(capturedUpdateListener).not.toBeNull();

    // Simulate a document change update
    capturedUpdateListener!({
      docChanged: true,
      state: { doc: { toString: () => "updated text" } },
    });

    expect(onUpdate).toHaveBeenCalledWith("updated text");
  });

  it("updateListener does not call onUpdate when docChanged is false", () => {
    const onUpdate = vi.fn();
    const noop = () => {};

    createCodeMirrorEditor("test", noop, noop, onUpdate);

    capturedUpdateListener!({
      docChanged: false,
      state: { doc: { toString: () => "test" } },
    });

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("focuses the CM view via requestAnimationFrame (line 97)", () => {
    vi.useFakeTimers();
    const noop = () => {};
    createCodeMirrorEditor("test", noop, noop, noop);

    // requestAnimationFrame callback fires after flush
    vi.runAllTimers();

    expect(mockFocus).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
