/**
 * Tests for sourcePeekActions — canUseSourcePeek, getMarkdownOptions,
 * openSourcePeekInline, commitSourcePeek, revertAndCloseSourcePeek.
 */

const mockOpen = vi.fn();
const mockClose = vi.fn();

// Mutable state that getState returns a reference to
const mockStoreState: Record<string, unknown> = {
  isOpen: false,
  markdown: "",
  originalMarkdown: null,
  range: null,
  hasUnsavedChanges: false,
  livePreview: false,
  blockTypeName: null,
  open: mockOpen,
  close: mockClose,
};

vi.mock("@/stores/settingsStore", () => ({
  useSettingsStore: {
    getState: vi.fn(() => ({
      markdown: {
        preserveLineBreaks: true,
        hardBreakStyleOnSave: "preserve",
      },
    })),
  },
}));

vi.mock("@/stores/tabStore", () => ({
  useTabStore: {
    getState: vi.fn(() => ({
      activeTabId: { main: "tab-1" },
    })),
  },
}));

vi.mock("@/stores/documentStore", () => ({
  useDocumentStore: {
    getState: vi.fn(() => ({
      getDocument: vi.fn((id: string) =>
        id === "tab-1"
          ? { content: "# Hello\n\nWorld", hardBreakStyle: "unknown" }
          : null
      ),
    })),
  },
}));

vi.mock("@/stores/unifiedHistoryStore", () => ({
  useUnifiedHistoryStore: {
    getState: vi.fn(() => ({
      createCheckpoint: vi.fn(),
    })),
  },
}));

vi.mock("@/stores/sourcePeekStore", () => ({
  useSourcePeekStore: {
    getState: vi.fn(() => mockStoreState),
  },
}));

vi.mock("@/utils/sourcePeek", () => ({
  applySourcePeekMarkdown: vi.fn(),
  serializeSourcePeekRange: vi.fn(() => "# Hello"),
  getExpandedSourcePeekRange: vi.fn(() => ({ from: 0, to: 10 })),
}));

vi.mock("@/utils/linebreaks", () => ({
  resolveHardBreakStyle: vi.fn(() => "twoSpaces"),
}));

vi.mock("./sourcePeekEditor", () => ({
  cleanupCMView: vi.fn(),
}));

import { describe, expect, it, vi, beforeEach } from "vitest";
import { Schema } from "@tiptap/pm/model";
import { EditorState } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import {
  canUseSourcePeek,
  getMarkdownOptions,
  EDITING_STATE_CHANGED,
  openSourcePeekInline,
  commitSourcePeek,
  revertAndCloseSourcePeek,
} from "./sourcePeekActions";
import { cleanupCMView } from "./sourcePeekEditor";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const testSchema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: {
      content: "text*",
      group: "block",
    },
    text: { group: "inline" },
  },
});

function createMockView(text = "Hello world"): EditorView {
  const doc = testSchema.node("doc", null, [
    testSchema.node("paragraph", null, text ? [testSchema.text(text)] : []),
  ]);
  const state = EditorState.create({ doc, schema: testSchema });

  return {
    state,
    dispatch: vi.fn(),
    focus: vi.fn(),
  } as unknown as EditorView;
}

function resetMockStoreState() {
  mockStoreState.isOpen = false;
  mockStoreState.markdown = "";
  mockStoreState.originalMarkdown = null;
  mockStoreState.range = null;
  mockStoreState.hasUnsavedChanges = false;
  mockStoreState.livePreview = false;
  mockStoreState.blockTypeName = null;
  mockStoreState.open = mockOpen;
  mockStoreState.close = mockClose;
}

// ---------------------------------------------------------------------------
// EDITING_STATE_CHANGED
// ---------------------------------------------------------------------------

describe("EDITING_STATE_CHANGED", () => {
  it("is a string constant", () => {
    expect(typeof EDITING_STATE_CHANGED).toBe("string");
    expect(EDITING_STATE_CHANGED).toBe("sourcePeekEditingChanged");
  });
});

// ---------------------------------------------------------------------------
// canUseSourcePeek
// ---------------------------------------------------------------------------

describe("canUseSourcePeek", () => {
  it.each([
    ["paragraph", true],
    ["heading", true],
    ["blockquote", true],
    ["bulletList", true],
    ["orderedList", true],
    ["table", true],
    ["taskList", true],
  ])("returns %s for %s", (type, expected) => {
    expect(canUseSourcePeek(type)).toBe(expected);
  });

  it.each([
    "codeBlock",
    "code_block",
    "block_image",
    "frontmatter",
    "html_block",
    "horizontalRule",
  ])("returns false for excluded type %s", (type) => {
    expect(canUseSourcePeek(type)).toBe(false);
  });

  it("returns true for unknown types (not in exclusion set)", () => {
    expect(canUseSourcePeek("someNewBlock")).toBe(true);
  });

  it("returns true for empty string", () => {
    expect(canUseSourcePeek("")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getMarkdownOptions
// ---------------------------------------------------------------------------

describe("getMarkdownOptions", () => {
  it("returns an object with preserveLineBreaks and hardBreakStyle", () => {
    const options = getMarkdownOptions();
    expect(options).toHaveProperty("preserveLineBreaks");
    expect(options).toHaveProperty("hardBreakStyle");
  });

  it("returns preserveLineBreaks from settings", () => {
    const options = getMarkdownOptions();
    expect(options.preserveLineBreaks).toBe(true);
  });

  it("returns resolved hardBreakStyle", () => {
    const options = getMarkdownOptions();
    expect(options.hardBreakStyle).toBe("twoSpaces");
  });
});

// ---------------------------------------------------------------------------
// openSourcePeekInline
// ---------------------------------------------------------------------------

describe("openSourcePeekInline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockStoreState();
  });

  it("returns true when block is eligible", () => {
    const view = createMockView("Hello");
    const result = openSourcePeekInline(view);
    expect(result).toBe(true);
  });

  it("dispatches a transaction with EDITING_STATE_CHANGED meta", () => {
    const view = createMockView("Hello");
    openSourcePeekInline(view);
    expect(view.dispatch).toHaveBeenCalled();
  });

  it("calls store.open with markdown, range, and blockTypeName", () => {
    const view = createMockView("Hello");
    openSourcePeekInline(view);
    expect(mockOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        markdown: expect.any(String),
        range: expect.objectContaining({ from: expect.any(Number), to: expect.any(Number) }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// commitSourcePeek
// ---------------------------------------------------------------------------

describe("commitSourcePeek", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockStoreState();
  });

  it("returns early if range is null", () => {
    const view = createMockView("Hello");
    // Store has range: null by default
    commitSourcePeek(view);
    // Should not dispatch or focus
    expect(view.dispatch).not.toHaveBeenCalled();
    expect(view.focus).not.toHaveBeenCalled();
  });

  it("calls cleanupCMView on commit when range exists", () => {
    mockStoreState.range = { from: 0, to: 10 };
    mockStoreState.markdown = "changed";
    mockStoreState.originalMarkdown = "original";

    const view = createMockView("Hello");
    commitSourcePeek(view);
    expect(cleanupCMView).toHaveBeenCalled();
  });

  it("calls view.focus after commit when range exists", () => {
    mockStoreState.range = { from: 0, to: 10 };
    mockStoreState.markdown = "same";
    mockStoreState.originalMarkdown = "same";

    const view = createMockView("Hello");
    commitSourcePeek(view);
    expect(view.focus).toHaveBeenCalled();
  });

  it("calls store.close on commit", () => {
    mockStoreState.range = { from: 0, to: 10 };
    mockStoreState.markdown = "same";
    mockStoreState.originalMarkdown = "same";

    const view = createMockView("Hello");
    commitSourcePeek(view);
    expect(mockClose).toHaveBeenCalled();
  });

  it("dispatches transaction with EDITING_STATE_CHANGED after commit", () => {
    mockStoreState.range = { from: 0, to: 10 };
    mockStoreState.markdown = "same";
    mockStoreState.originalMarkdown = "same";

    const view = createMockView("Hello");
    commitSourcePeek(view);
    expect(view.dispatch).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// revertAndCloseSourcePeek
// ---------------------------------------------------------------------------

describe("revertAndCloseSourcePeek", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockStoreState();
  });

  it("calls store.close", () => {
    const view = createMockView("Hello");
    revertAndCloseSourcePeek(view);
    expect(mockClose).toHaveBeenCalled();
  });

  it("calls cleanupCMView", () => {
    const view = createMockView("Hello");
    revertAndCloseSourcePeek(view);
    expect(cleanupCMView).toHaveBeenCalled();
  });

  it("dispatches transaction with EDITING_STATE_CHANGED meta", () => {
    const view = createMockView("Hello");
    revertAndCloseSourcePeek(view);
    expect(view.dispatch).toHaveBeenCalled();
  });

  it("calls view.focus", () => {
    const view = createMockView("Hello");
    revertAndCloseSourcePeek(view);
    expect(view.focus).toHaveBeenCalled();
  });
});
