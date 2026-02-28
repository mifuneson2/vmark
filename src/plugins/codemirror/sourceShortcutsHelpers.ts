/**
 * Source Mode Shortcut Helpers
 *
 * Purpose: Helper functions used by buildSourceShortcutKeymap() in sourceShortcuts.ts.
 * Contains block formatting, navigation, CJK formatting, text transformation,
 * and line operation helpers.
 *
 * @coordinates-with plugins/codemirror/sourceShortcuts.ts — consumes these helpers
 * @coordinates-with stores/shortcutsStore.ts — source of shortcut key definitions
 * @coordinates-with toolbarActions/sourceAdapter.ts — action execution for format operations
 * @module plugins/codemirror/sourceShortcutsHelpers
 */

import type { EditorView } from "@codemirror/view";
import {
  toUpperCase,
  toLowerCase,
  toTitleCase,
  toggleCase,
  moveLinesUp,
  moveLinesDown,
  duplicateLines,
  deleteLines,
  joinLines,
  sortLinesAscending,
  sortLinesDescending,
} from "@/utils/textTransformations";
import { useSearchStore } from "@/stores/searchStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useDocumentStore } from "@/stores/documentStore";
import { useTabStore } from "@/stores/tabStore";
import { performSourceToolbarAction, setSourceHeadingLevel, formatCJKCurrentBlock } from "@/plugins/toolbarActions/sourceAdapter";
import { useSourceCursorContextStore } from "@/stores/sourceCursorContextStore";
import { getSourceMultiSelectionContext } from "@/plugins/toolbarActions/multiSelectionContext";
import { formatMarkdown, formatSelection } from "@/lib/cjkFormatter";
import { resolveHardBreakStyle } from "@/utils/linebreaks";
import { getWindowLabel } from "@/hooks/useWindowFocus";
import { setHeadingLevel, convertToHeading } from "@/plugins/sourceContextDetection/headingDetection";
import { getHeadingInfo } from "@/plugins/sourceContextDetection/headingDetection";
import { getListItemInfo, toBulletList, toOrderedList, toTaskList, removeList } from "@/plugins/sourceContextDetection/listDetection";
import { toggleBlockquote as toggleBlockquoteAction } from "@/plugins/sourceContextDetection/blockquoteActions";

// --- Source context builder ---

export function buildSourceContext(view: EditorView) {
  const cursorContext = useSourceCursorContextStore.getState().context;
  const multiSelection = getSourceMultiSelectionContext(view, cursorContext);
  return {
    surface: "source" as const,
    view,
    context: cursorContext,
    multiSelection,
  };
}

export function runSourceAction(action: string) {
  return (view: EditorView) => {
    performSourceToolbarAction(action, buildSourceContext(view));
    return true;
  };
}

// --- Block formatting helpers ---

export function setHeading(level: number) {
  return (view: EditorView) => {
    const context = buildSourceContext(view);
    return setSourceHeadingLevel(context, level);
  };
}

export function increaseHeadingLevel(view: EditorView): boolean {
  const info = getHeadingInfo(view);
  if (info && info.level < 6) {
    setHeadingLevel(view, info, info.level + 1);
    return true;
  }
  if (!info) {
    convertToHeading(view, 1);
    return true;
  }
  return false;
}

export function decreaseHeadingLevel(view: EditorView): boolean {
  const info = getHeadingInfo(view);
  if (info && info.level > 1) {
    setHeadingLevel(view, info, info.level - 1);
    return true;
  }
  if (info && info.level === 1) {
    // Convert to paragraph
    setHeadingLevel(view, info, 0);
    return true;
  }
  return false;
}

export function toggleBlockquote(view: EditorView): boolean {
  toggleBlockquoteAction(view);
  return true;
}

export function toggleList(view: EditorView, type: "bullet" | "ordered" | "task"): boolean {
  const info = getListItemInfo(view);
  if (info && info.type === type) {
    // Already in this list type - remove it
    removeList(view, info);
    return true;
  }
  if (info) {
    // In a different list type - convert it
    switch (type) {
      case "bullet":
        toBulletList(view, info);
        break;
      case "ordered":
        toOrderedList(view, info);
        break;
      case "task":
        toTaskList(view, info);
        break;
    }
    return true;
  }
  // Not in a list - insert list marker
  const { from } = view.state.selection.main;
  const line = view.state.doc.lineAt(from);
  const marker = type === "bullet" ? "- " : type === "ordered" ? "1. " : "- [ ] ";
  view.dispatch({
    changes: { from: line.from, to: line.from, insert: marker },
  });
  view.focus();
  return true;
}

// --- Navigation helpers ---

export function openFindBar(): boolean {
  useSearchStore.getState().open();
  return true;
}

export function findNextMatch(_view: EditorView): boolean {
  const store = useSearchStore.getState();
  if (!store.isOpen || store.matchCount === 0) return false;
  store.findNext();
  return true;
}

export function findPreviousMatch(_view: EditorView): boolean {
  const store = useSearchStore.getState();
  if (!store.isOpen || store.matchCount === 0) return false;
  store.findPrevious();
  return true;
}

// --- CJK formatting helpers ---

function getActiveDocument() {
  const windowLabel = getWindowLabel();
  const tabId = useTabStore.getState().activeTabId[windowLabel] ?? null;
  if (!tabId) return null;
  return { tabId, doc: useDocumentStore.getState().getDocument(tabId) };
}

function shouldPreserveTwoSpaceBreaks(): boolean {
  const active = getActiveDocument();
  const hardBreakStyleOnSave = useSettingsStore.getState().markdown.hardBreakStyleOnSave;
  return resolveHardBreakStyle(active?.doc?.hardBreakStyle ?? "unknown", hardBreakStyleOnSave) === "twoSpaces";
}

export function formatCJKSelection(view: EditorView): boolean {
  const { from, to } = view.state.selection.main;
  const config = useSettingsStore.getState().cjkFormatting;
  const preserveTwoSpaceHardBreaks = shouldPreserveTwoSpaceBreaks();

  if (from === to) {
    // No selection - format current block (paragraph, list, or table)
    return formatCJKCurrentBlock(view, config, { preserveTwoSpaceHardBreaks });
  }

  const selectedText = view.state.doc.sliceString(from, to);
  const formatted = formatSelection(selectedText, config, { preserveTwoSpaceHardBreaks });

  if (formatted !== selectedText) {
    view.dispatch({
      changes: { from, to, insert: formatted },
      selection: { anchor: from, head: from + formatted.length },
    });
    view.focus();
  }
  return true;
}

export function formatCJKFile(view: EditorView): boolean {
  const config = useSettingsStore.getState().cjkFormatting;
  const preserveTwoSpaceHardBreaks = shouldPreserveTwoSpaceBreaks();
  const content = view.state.doc.toString();
  const formatted = formatMarkdown(content, config, { preserveTwoSpaceHardBreaks });

  if (formatted !== content) {
    view.dispatch({
      changes: { from: 0, to: content.length, insert: formatted },
    });
  }
  return true;
}

// --- Copy as HTML helper ---

export function copySelectionAsHtml(view: EditorView): boolean {
  const { from, to } = view.state.selection.main;
  const markdown = from === to
    ? view.state.doc.toString()
    : view.state.doc.sliceString(from, to);

  // Dynamic import to avoid loading exportStyles.css at startup
  void import("@/export").then(({ copyAsHtml }) => copyAsHtml(markdown)).catch(() => {});
  return true;
}

// --- Text transformation helpers ---

function transformSelection(view: EditorView, transform: (text: string) => string): boolean {
  const { from, to } = view.state.selection.main;
  if (from === to) return false; // No selection

  const selectedText = view.state.doc.sliceString(from, to);
  const transformed = transform(selectedText);

  if (transformed !== selectedText) {
    view.dispatch({
      changes: { from, to, insert: transformed },
      selection: { anchor: from, head: from + transformed.length },
    });
  }
  return true;
}

export function doTransformUppercase(view: EditorView): boolean {
  return transformSelection(view, toUpperCase);
}

export function doTransformLowercase(view: EditorView): boolean {
  return transformSelection(view, toLowerCase);
}

export function doTransformTitleCase(view: EditorView): boolean {
  return transformSelection(view, toTitleCase);
}

export function doTransformToggleCase(view: EditorView): boolean {
  return transformSelection(view, toggleCase);
}

// --- Line operation helpers ---

export function doMoveLineUp(view: EditorView): boolean {
  const { from, to } = view.state.selection.main;
  const text = view.state.doc.toString();
  const result = moveLinesUp(text, from, to);

  if (!result) return false;

  view.dispatch({
    changes: { from: 0, to: text.length, insert: result.newText },
    selection: { anchor: result.newFrom, head: result.newTo },
  });
  return true;
}

export function doMoveLineDown(view: EditorView): boolean {
  const { from, to } = view.state.selection.main;
  const text = view.state.doc.toString();
  const result = moveLinesDown(text, from, to);

  if (!result) return false;

  view.dispatch({
    changes: { from: 0, to: text.length, insert: result.newText },
    selection: { anchor: result.newFrom, head: result.newTo },
  });
  return true;
}

export function doDuplicateLine(view: EditorView): boolean {
  const { from, to } = view.state.selection.main;
  const text = view.state.doc.toString();
  const result = duplicateLines(text, from, to);

  view.dispatch({
    changes: { from: 0, to: text.length, insert: result.newText },
    selection: { anchor: result.newFrom, head: result.newTo },
  });
  return true;
}

export function doDeleteLine(view: EditorView): boolean {
  const { from, to } = view.state.selection.main;
  const text = view.state.doc.toString();
  const result = deleteLines(text, from, to);

  view.dispatch({
    changes: { from: 0, to: text.length, insert: result.newText },
    selection: { anchor: result.newCursor },
  });
  return true;
}

export function doJoinLines(view: EditorView): boolean {
  const { from, to } = view.state.selection.main;
  const text = view.state.doc.toString();
  const result = joinLines(text, from, to);

  view.dispatch({
    changes: { from: 0, to: text.length, insert: result.newText },
    selection: { anchor: result.newFrom, head: result.newTo },
  });
  return true;
}

export function doSortLinesAsc(view: EditorView): boolean {
  const { from, to } = view.state.selection.main;
  if (from === to) return false; // Need selection for sort

  const text = view.state.doc.toString();
  const result = sortLinesAscending(text, from, to);

  view.dispatch({
    changes: { from: 0, to: text.length, insert: result.newText },
    selection: { anchor: result.newFrom, head: result.newTo },
  });
  return true;
}

export function doSortLinesDesc(view: EditorView): boolean {
  const { from, to } = view.state.selection.main;
  if (from === to) return false; // Need selection for sort

  const text = view.state.doc.toString();
  const result = sortLinesDescending(text, from, to);

  view.dispatch({
    changes: { from: 0, to: text.length, insert: result.newText },
    selection: { anchor: result.newFrom, head: result.newTo },
  });
  return true;
}
