/**
 * Source Shortcuts Helpers Tests
 *
 * Tests for text transformation, line operation, navigation,
 * block formatting, and CJK formatting helpers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

// --- Mocks ---

const mockSearchStore = {
  isOpen: false,
  matchCount: 0,
  open: vi.fn(),
  findNext: vi.fn(),
  findPrevious: vi.fn(),
};

vi.mock("@/stores/searchStore", () => ({
  useSearchStore: { getState: () => mockSearchStore },
}));

vi.mock("@/stores/settingsStore", () => ({
  useSettingsStore: {
    getState: () => ({
      cjkFormatting: {},
      markdown: { hardBreakStyleOnSave: "backslash" },
    }),
  },
}));

vi.mock("@/stores/documentStore", () => ({
  useDocumentStore: {
    getState: () => ({
      getDocument: () => ({ hardBreakStyle: "unknown" }),
      setContent: vi.fn(),
    }),
  },
}));

vi.mock("@/stores/tabStore", () => ({
  useTabStore: {
    getState: () => ({
      activeTabId: { main: "tab-1" },
    }),
  },
}));

vi.mock("@/hooks/useWindowFocus", () => ({
  getWindowLabel: () => "main",
}));

vi.mock("@/utils/linebreaks", () => ({
  resolveHardBreakStyle: () => "backslash",
}));

vi.mock("@/lib/cjkFormatter", () => ({
  formatMarkdown: (content: string) => content.replace(/hello/g, "HELLO"),
  formatSelection: (content: string) => content.replace(/hello/g, "HELLO"),
}));

vi.mock("@/stores/sourceCursorContextStore", () => ({
  useSourceCursorContextStore: { getState: () => ({ context: {} }) },
}));

const mockPerformSourceToolbarAction = vi.fn();
const mockSetSourceHeadingLevel = vi.fn(() => true);
const mockFormatCJKCurrentBlock = vi.fn(() => true);

vi.mock("@/plugins/toolbarActions/sourceAdapter", () => ({
  performSourceToolbarAction: (...args: unknown[]) => mockPerformSourceToolbarAction(...args),
  setSourceHeadingLevel: (...args: unknown[]) => mockSetSourceHeadingLevel(...args),
  formatCJKCurrentBlock: (...args: unknown[]) => mockFormatCJKCurrentBlock(...args),
}));

vi.mock("@/plugins/toolbarActions/multiSelectionContext", () => ({
  getSourceMultiSelectionContext: () => ({}),
}));

const mockGetHeadingInfo = vi.fn(() => null);
const mockSetHeadingLevel = vi.fn();
const mockConvertToHeading = vi.fn();

vi.mock("@/plugins/sourceContextDetection/headingDetection", () => ({
  getHeadingInfo: (...args: unknown[]) => mockGetHeadingInfo(...args),
  setHeadingLevel: (...args: unknown[]) => mockSetHeadingLevel(...args),
  convertToHeading: (...args: unknown[]) => mockConvertToHeading(...args),
}));

const mockGetListItemInfo = vi.fn(() => null);
const mockToBulletList = vi.fn();
const mockToOrderedList = vi.fn();
const mockToTaskList = vi.fn();
const mockRemoveList = vi.fn();

vi.mock("@/plugins/sourceContextDetection/listDetection", () => ({
  getListItemInfo: (...args: unknown[]) => mockGetListItemInfo(...args),
  toBulletList: (...args: unknown[]) => mockToBulletList(...args),
  toOrderedList: (...args: unknown[]) => mockToOrderedList(...args),
  toTaskList: (...args: unknown[]) => mockToTaskList(...args),
  removeList: (...args: unknown[]) => mockRemoveList(...args),
}));

const mockToggleBlockquoteAction = vi.fn();

vi.mock("@/plugins/sourceContextDetection/blockquoteActions", () => ({
  toggleBlockquote: (...args: unknown[]) => mockToggleBlockquoteAction(...args),
}));

vi.mock("@/utils/textTransformations", () => ({
  toUpperCase: (s: string) => s.toUpperCase(),
  toLowerCase: (s: string) => s.toLowerCase(),
  toTitleCase: (s: string) => s.replace(/\b\w/g, (c: string) => c.toUpperCase()),
  toggleCase: (s: string) => s === s.toUpperCase() ? s.toLowerCase() : s.toUpperCase(),
  moveLinesUp: (text: string, from: number, to: number) => {
    if (from === 0) return null;
    return { newText: text, newFrom: from, newTo: to };
  },
  moveLinesDown: (text: string, from: number, to: number) => {
    if (to >= text.length) return null;
    return { newText: text, newFrom: from, newTo: to };
  },
  duplicateLines: (text: string, from: number, to: number) => ({
    newText: text + "\n" + text.substring(from, to),
    newFrom: from,
    newTo: to,
  }),
  deleteLines: (text: string) => ({
    newText: text.split("\n").slice(1).join("\n"),
    newCursor: 0,
  }),
  joinLines: (text: string, from: number, to: number) => ({
    newText: text,
    newFrom: from,
    newTo: to,
  }),
  sortLinesAscending: (text: string, from: number, to: number) => ({
    newText: text,
    newFrom: from,
    newTo: to,
  }),
  sortLinesDescending: (text: string, from: number, to: number) => ({
    newText: text,
    newFrom: from,
    newTo: to,
  }),
}));

vi.mock("@/export", () => ({
  copyAsHtml: vi.fn(),
}));

import {
  buildSourceContext,
  runSourceAction,
  setHeading,
  increaseHeadingLevel,
  decreaseHeadingLevel,
  toggleBlockquote,
  toggleList,
  openFindBar,
  findNextMatch,
  findPreviousMatch,
  formatCJKSelection,
  formatCJKFile,
  copySelectionAsHtml,
  doTransformUppercase,
  doTransformLowercase,
  doTransformTitleCase,
  doTransformToggleCase,
  doMoveLineUp,
  doMoveLineDown,
  doDuplicateLine,
  doDeleteLine,
  doJoinLines,
  doSortLinesAsc,
  doSortLinesDesc,
} from "./sourceShortcutsHelpers";

const viewInstances: EditorView[] = [];

function createView(content: string, cursorPos?: number, headPos?: number): EditorView {
  const parent = document.createElement("div");
  document.body.appendChild(parent);

  const anchor = cursorPos ?? 0;
  const head = headPos ?? anchor;

  const state = EditorState.create({
    doc: content,
    selection: { anchor, head },
  });
  const view = new EditorView({ state, parent });
  viewInstances.push(view);
  return view;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSearchStore.isOpen = false;
  mockSearchStore.matchCount = 0;
});

afterEach(() => {
  viewInstances.forEach((v) => {
    const parent = v.dom.parentElement;
    v.destroy();
    parent?.remove();
  });
  viewInstances.length = 0;
});

describe("buildSourceContext", () => {
  it("returns source context with view and surface", () => {
    const view = createView("test");
    const ctx = buildSourceContext(view);
    expect(ctx.surface).toBe("source");
    expect(ctx.view).toBe(view);
    expect(ctx.context).toBeDefined();
    expect(ctx.multiSelection).toBeDefined();
  });
});

describe("runSourceAction", () => {
  it("calls performSourceToolbarAction and returns true", () => {
    const view = createView("test");
    const handler = runSourceAction("bold");
    const result = handler(view);
    expect(result).toBe(true);
    expect(mockPerformSourceToolbarAction).toHaveBeenCalledWith("bold", expect.objectContaining({ surface: "source" }));
  });
});

describe("setHeading", () => {
  it("calls setSourceHeadingLevel with correct level", () => {
    const view = createView("# heading");
    const handler = setHeading(2);
    handler(view);
    expect(mockSetSourceHeadingLevel).toHaveBeenCalledWith(expect.objectContaining({ surface: "source" }), 2);
  });
});

describe("increaseHeadingLevel", () => {
  it("increases heading level from 1 to 2", () => {
    const view = createView("# heading");
    mockGetHeadingInfo.mockReturnValueOnce({ level: 1 });
    const result = increaseHeadingLevel(view);
    expect(result).toBe(true);
    expect(mockSetHeadingLevel).toHaveBeenCalledWith(view, { level: 1 }, 2);
  });

  it("does not increase past level 6", () => {
    const view = createView("###### heading");
    mockGetHeadingInfo.mockReturnValueOnce({ level: 6 });
    const result = increaseHeadingLevel(view);
    expect(result).toBe(false);
  });

  it("converts paragraph to heading level 1 when no heading", () => {
    const view = createView("plain text");
    mockGetHeadingInfo.mockReturnValueOnce(null);
    const result = increaseHeadingLevel(view);
    expect(result).toBe(true);
    expect(mockConvertToHeading).toHaveBeenCalledWith(view, 1);
  });
});

describe("decreaseHeadingLevel", () => {
  it("decreases heading level from 3 to 2", () => {
    const view = createView("### heading");
    mockGetHeadingInfo.mockReturnValueOnce({ level: 3 });
    const result = decreaseHeadingLevel(view);
    expect(result).toBe(true);
    expect(mockSetHeadingLevel).toHaveBeenCalledWith(view, { level: 3 }, 2);
  });

  it("converts heading 1 to paragraph", () => {
    const view = createView("# heading");
    mockGetHeadingInfo.mockReturnValueOnce({ level: 1 });
    const result = decreaseHeadingLevel(view);
    expect(result).toBe(true);
    expect(mockSetHeadingLevel).toHaveBeenCalledWith(view, { level: 1 }, 0);
  });

  it("returns false for plain text", () => {
    const view = createView("plain text");
    mockGetHeadingInfo.mockReturnValueOnce(null);
    const result = decreaseHeadingLevel(view);
    expect(result).toBe(false);
  });
});

describe("toggleBlockquote", () => {
  it("calls toggleBlockquoteAction and returns true", () => {
    const view = createView("text");
    const result = toggleBlockquote(view);
    expect(result).toBe(true);
    expect(mockToggleBlockquoteAction).toHaveBeenCalledWith(view);
  });
});

describe("toggleList", () => {
  it("removes list when already in same type", () => {
    const view = createView("- item");
    mockGetListItemInfo.mockReturnValueOnce({ type: "bullet" });
    const result = toggleList(view, "bullet");
    expect(result).toBe(true);
    expect(mockRemoveList).toHaveBeenCalled();
  });

  it("converts to bullet list from ordered", () => {
    const view = createView("1. item");
    mockGetListItemInfo.mockReturnValueOnce({ type: "ordered" });
    const result = toggleList(view, "bullet");
    expect(result).toBe(true);
    expect(mockToBulletList).toHaveBeenCalled();
  });

  it("converts to ordered list from bullet", () => {
    const view = createView("- item");
    mockGetListItemInfo.mockReturnValueOnce({ type: "bullet" });
    const result = toggleList(view, "ordered");
    expect(result).toBe(true);
    expect(mockToOrderedList).toHaveBeenCalled();
  });

  it("converts to task list from bullet", () => {
    const view = createView("- item");
    mockGetListItemInfo.mockReturnValueOnce({ type: "bullet" });
    const result = toggleList(view, "task");
    expect(result).toBe(true);
    expect(mockToTaskList).toHaveBeenCalled();
  });

  it("inserts bullet marker when not in list", () => {
    const view = createView("plain text");
    mockGetListItemInfo.mockReturnValueOnce(null);
    const result = toggleList(view, "bullet");
    expect(result).toBe(true);
    expect(view.state.doc.toString()).toBe("- plain text");
  });

  it("inserts ordered marker when not in list", () => {
    const view = createView("plain text");
    mockGetListItemInfo.mockReturnValueOnce(null);
    const result = toggleList(view, "ordered");
    expect(result).toBe(true);
    expect(view.state.doc.toString()).toBe("1. plain text");
  });

  it("inserts task marker when not in list", () => {
    const view = createView("plain text");
    mockGetListItemInfo.mockReturnValueOnce(null);
    const result = toggleList(view, "task");
    expect(result).toBe(true);
    expect(view.state.doc.toString()).toBe("- [ ] plain text");
  });
});

describe("openFindBar", () => {
  it("opens search and returns true", () => {
    const result = openFindBar();
    expect(result).toBe(true);
    expect(mockSearchStore.open).toHaveBeenCalled();
  });
});

describe("findNextMatch", () => {
  it("calls findNext when search is open with matches", () => {
    mockSearchStore.isOpen = true;
    mockSearchStore.matchCount = 5;
    const view = createView("test");
    const result = findNextMatch(view);
    expect(result).toBe(true);
    expect(mockSearchStore.findNext).toHaveBeenCalled();
  });

  it("returns false when search is not open", () => {
    mockSearchStore.isOpen = false;
    const view = createView("test");
    const result = findNextMatch(view);
    expect(result).toBe(false);
  });

  it("returns false when no matches", () => {
    mockSearchStore.isOpen = true;
    mockSearchStore.matchCount = 0;
    const view = createView("test");
    const result = findNextMatch(view);
    expect(result).toBe(false);
  });
});

describe("findPreviousMatch", () => {
  it("calls findPrevious when search is open with matches", () => {
    mockSearchStore.isOpen = true;
    mockSearchStore.matchCount = 5;
    const view = createView("test");
    const result = findPreviousMatch(view);
    expect(result).toBe(true);
    expect(mockSearchStore.findPrevious).toHaveBeenCalled();
  });

  it("returns false when search is not open", () => {
    mockSearchStore.isOpen = false;
    const view = createView("test");
    const result = findPreviousMatch(view);
    expect(result).toBe(false);
  });
});

describe("formatCJKSelection", () => {
  it("formats current block when no selection", () => {
    const view = createView("hello world", 0);
    formatCJKSelection(view);
    expect(mockFormatCJKCurrentBlock).toHaveBeenCalled();
  });

  it("formats selected text when selection exists", () => {
    const view = createView("hello world", 0, 5);
    formatCJKSelection(view);
    expect(view.state.doc.toString()).toBe("HELLO world");
  });

  it("does not dispatch when selection is unchanged", () => {
    const view = createView("no match", 0, 8);
    const dispatchSpy = vi.spyOn(view, "dispatch");
    formatCJKSelection(view);
    expect(dispatchSpy).not.toHaveBeenCalled();
  });
});

describe("formatCJKFile", () => {
  it("formats entire document", () => {
    const view = createView("hello world");
    formatCJKFile(view);
    expect(view.state.doc.toString()).toBe("HELLO world");
  });

  it("does not dispatch when content unchanged", () => {
    const view = createView("no match here");
    const dispatchSpy = vi.spyOn(view, "dispatch");
    formatCJKFile(view);
    expect(dispatchSpy).not.toHaveBeenCalled();
  });
});

describe("copySelectionAsHtml", () => {
  it("returns true", () => {
    const view = createView("test");
    const result = copySelectionAsHtml(view);
    expect(result).toBe(true);
  });
});

describe("text transformations", () => {
  it("transforms selection to uppercase", () => {
    const view = createView("hello world", 0, 5);
    const result = doTransformUppercase(view);
    expect(result).toBe(true);
    expect(view.state.doc.toString()).toBe("HELLO world");
  });

  it("transforms selection to lowercase", () => {
    const view = createView("HELLO world", 0, 5);
    const result = doTransformLowercase(view);
    expect(result).toBe(true);
    expect(view.state.doc.toString()).toBe("hello world");
  });

  it("transforms selection to title case", () => {
    const view = createView("hello world", 0, 11);
    const result = doTransformTitleCase(view);
    expect(result).toBe(true);
    expect(view.state.doc.toString()).toBe("Hello World");
  });

  it("toggles case of selection", () => {
    const view = createView("hello world", 0, 5);
    const result = doTransformToggleCase(view);
    expect(result).toBe(true);
    expect(view.state.doc.toString()).toBe("HELLO world");
  });

  it("returns false when no selection for uppercase", () => {
    const view = createView("hello", 0);
    const result = doTransformUppercase(view);
    expect(result).toBe(false);
  });

  it("returns false when no selection for lowercase", () => {
    const view = createView("hello", 3);
    const result = doTransformLowercase(view);
    expect(result).toBe(false);
  });
});

describe("line operations", () => {
  describe("doMoveLineUp", () => {
    it("returns false when at first line", () => {
      const view = createView("first line\nsecond line", 0, 0);
      const result = doMoveLineUp(view);
      expect(result).toBe(false);
    });

    it("dispatches when move is possible", () => {
      const view = createView("first\nsecond", 6, 6);
      const result = doMoveLineUp(view);
      expect(result).toBe(true);
    });
  });

  describe("doMoveLineDown", () => {
    it("dispatches when move is possible", () => {
      const view = createView("first\nsecond", 0, 0);
      const result = doMoveLineDown(view);
      expect(result).toBe(true);
    });
  });

  describe("doDuplicateLine", () => {
    it("duplicates the current line", () => {
      const view = createView("line 1\nline 2", 0, 0);
      const result = doDuplicateLine(view);
      expect(result).toBe(true);
    });
  });

  describe("doDeleteLine", () => {
    it("deletes the current line", () => {
      const view = createView("line 1\nline 2", 0, 0);
      const result = doDeleteLine(view);
      expect(result).toBe(true);
    });
  });

  describe("doJoinLines", () => {
    it("joins current line with next", () => {
      const view = createView("line 1\nline 2", 0, 0);
      const result = doJoinLines(view);
      expect(result).toBe(true);
    });
  });

  describe("doSortLinesAsc", () => {
    it("returns false when no selection", () => {
      const view = createView("c\nb\na", 0, 0);
      const result = doSortLinesAsc(view);
      expect(result).toBe(false);
    });

    it("sorts when selection exists", () => {
      const view = createView("c\nb\na", 0, 5);
      const result = doSortLinesAsc(view);
      expect(result).toBe(true);
    });
  });

  describe("doSortLinesDesc", () => {
    it("returns false when no selection", () => {
      const view = createView("a\nb\nc", 0, 0);
      const result = doSortLinesDesc(view);
      expect(result).toBe(false);
    });

    it("sorts when selection exists", () => {
      const view = createView("a\nb\nc", 0, 5);
      const result = doSortLinesDesc(view);
      expect(result).toBe(true);
    });
  });
});
