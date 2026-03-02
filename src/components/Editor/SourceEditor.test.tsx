/**
 * SourceEditor tests
 *
 * Tests basic rendering, hidden prop behavior, CSS class application,
 * and hook/store integration. CodeMirror and all external dependencies are mocked.
 */

import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Mocks (must be before imports) ---

// Mock CodeMirror
const mockDispatch = vi.fn();
const mockDestroy = vi.fn();
const mockFocus = vi.fn();
const mockDocToString = vi.fn(() => "# Hello");

vi.mock("@codemirror/state", () => ({
  EditorState: {
    create: vi.fn(() => ({
      doc: { toString: mockDocToString, length: 7 },
      selection: { main: { head: 0, anchor: 0 } },
    })),
  },
  Compartment: vi.fn(() => ({
    of: vi.fn((ext: unknown) => ext),
    reconfigure: vi.fn((ext: unknown) => ext),
  })),
}));

const mockEditorViewInstance = {
  dispatch: mockDispatch,
  destroy: mockDestroy,
  focus: mockFocus,
  state: {
    doc: { toString: mockDocToString, length: 7 },
    selection: { main: { head: 0, anchor: 0 } },
  },
  dom: document.createElement("div"),
  contentDOM: document.createElement("div"),
};

vi.mock("@codemirror/view", () => ({
  EditorView: vi.fn().mockImplementation(function (this: Record<string, unknown>, config: Record<string, unknown>) {
    Object.assign(this, mockEditorViewInstance);
    // Append a child to the parent container to simulate CM mount
    if (config.parent && config.parent instanceof HTMLElement) {
      const cmEl = document.createElement("div");
      cmEl.className = "cm-editor";
      config.parent.appendChild(cmEl);
    }
    return this;
  }),
  keymap: { of: vi.fn(() => []) },
}));

// Attach static properties to EditorView
const { EditorView } = await import("@codemirror/view");
(EditorView as unknown as Record<string, unknown>).updateListener = { of: vi.fn((cb: unknown) => cb) };
(EditorView as unknown as Record<string, unknown>).lineWrapping = {};
(EditorView as unknown as Record<string, unknown>).theme = vi.fn(() => ({}));
(EditorView as unknown as Record<string, unknown>).baseTheme = vi.fn(() => ({}));

// Mock hooks that SourceEditor uses
vi.mock("@/hooks/useDocumentState", () => ({
  useDocumentContent: vi.fn(() => "# Hello"),
  useDocumentCursorInfo: vi.fn(() => null),
  useDocumentActions: vi.fn(() => ({
    setContent: vi.fn(),
    setCursorInfo: vi.fn(),
  })),
}));

vi.mock("@/hooks/useSourceEditorSearch", () => ({
  useSourceEditorSearch: vi.fn(),
}));

vi.mock("@/hooks/useSourceEditorSync", () => ({
  useSourceEditorSync: vi.fn(),
}));

vi.mock("@/hooks/useImageDragDrop", () => ({
  useImageDragDrop: vi.fn(),
}));

vi.mock("@/hooks/useSourceOutlineSync", () => ({
  useSourceOutlineSync: vi.fn(),
}));

// Mock stores
vi.mock("@/stores/editorStore", () => {
  const store = vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({ wordWrap: true, showLineNumbers: false })
  );
  (store as unknown as Record<string, unknown>).getState = () => ({
    wordWrap: true,
    showLineNumbers: false,
  });
  return { useEditorStore: store };
});

vi.mock("@/stores/settingsStore", () => {
  const store = vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({ markdown: { showBrTags: false, autoPairEnabled: true, enableRegexSearch: true } })
  );
  (store as unknown as Record<string, unknown>).getState = () => ({
    markdown: { showBrTags: false, autoPairEnabled: true, enableRegexSearch: true },
  });
  return { useSettingsStore: store };
});

vi.mock("@/stores/shortcutsStore", () => {
  const store = vi.fn();
  (store as unknown as Record<string, unknown>).getState = () => ({});
  (store as unknown as Record<string, unknown>).subscribe = vi.fn(() => vi.fn());
  return { useShortcutsStore: store };
});

vi.mock("@/stores/searchStore", () => {
  const store = vi.fn();
  (store as unknown as Record<string, unknown>).getState = () => ({
    isOpen: false,
    query: "",
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
    currentIndex: -1,
  });
  return { useSearchStore: store };
});

vi.mock("@/stores/activeEditorStore", () => {
  const store = vi.fn();
  (store as unknown as Record<string, unknown>).getState = () => ({
    setActiveSourceView: vi.fn(),
    clearSourceViewIfMatch: vi.fn(),
  });
  return { useActiveEditorStore: store };
});

vi.mock("@/stores/sourceCursorContextStore", () => {
  const store = vi.fn();
  (store as unknown as Record<string, unknown>).getState = () => ({
    setContext: vi.fn(),
  });
  return { useSourceCursorContextStore: store };
});

// Mock utilities
vi.mock("@/utils/cursorSync/codemirror", () => ({
  getCursorInfoFromCodeMirror: vi.fn(() => ({ line: 1, ch: 0 })),
  restoreCursorInCodeMirror: vi.fn(),
}));

vi.mock("@/plugins/codemirror/sourceShortcuts", () => ({
  buildSourceShortcutKeymap: vi.fn(() => []),
}));

vi.mock("@/utils/imeGuard", () => ({
  isImeKeyEvent: vi.fn(() => false),
  runOrQueueCodeMirrorAction: vi.fn((_view: unknown, fn: () => void) => fn()),
  IME_GRACE_PERIOD_MS: 50,
}));

vi.mock("@/plugins/sourceContextDetection/cursorContext", () => ({
  computeSourceCursorContext: vi.fn(() => ({})),
}));

vi.mock("@/utils/sourceEditorSearch", () => ({
  countMatches: vi.fn(() => 0),
}));

vi.mock("@/utils/sourceEditorExtensions", () => ({
  createSourceEditorExtensions: vi.fn(() => []),
  shortcutKeymapCompartment: {
    of: vi.fn((ext: unknown) => ext),
    reconfigure: vi.fn((ext: unknown) => ext),
  },
}));

import { SourceEditor } from "./SourceEditor";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SourceEditor", () => {
  describe("rendering", () => {
    it("renders a container div", () => {
      const { container } = render(<SourceEditor />);
      const editorDiv = container.firstChild as HTMLElement;
      expect(editorDiv).toBeInstanceOf(HTMLDivElement);
      expect(editorDiv.className).toContain("source-editor");
    });

    it("does not have display:none when not hidden", () => {
      const { container } = render(<SourceEditor />);
      const editorDiv = container.firstChild as HTMLElement;
      expect(editorDiv.style.display).not.toBe("none");
    });

    it("has display:none when hidden", () => {
      const { container } = render(<SourceEditor hidden />);
      const editorDiv = container.firstChild as HTMLElement;
      expect(editorDiv.style.display).toBe("none");
    });
  });

  describe("CSS classes", () => {
    it("does not include show-line-numbers class by default (showLineNumbers=false)", () => {
      const { container } = render(<SourceEditor />);
      const editorDiv = container.firstChild as HTMLElement;
      expect(editorDiv.className).not.toContain("show-line-numbers");
    });
  });

  describe("cleanup", () => {
    it("destroys CodeMirror view on unmount", () => {
      const { unmount } = render(<SourceEditor />);
      unmount();
      expect(mockDestroy).toHaveBeenCalled();
    });
  });

  describe("hidden prop", () => {
    it("defaults hidden to false", () => {
      const { container } = render(<SourceEditor />);
      const editorDiv = container.firstChild as HTMLElement;
      expect(editorDiv.style.display).toBe("");
    });

    it("applies hidden style when hidden=true", () => {
      const { container } = render(<SourceEditor hidden={true} />);
      const editorDiv = container.firstChild as HTMLElement;
      expect(editorDiv.style.display).toBe("none");
    });
  });
});
