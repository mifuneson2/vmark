/**
 * Source Mode Selection Utilities
 *
 * Purpose: Word and line range detection for the CodeMirror source editor,
 * used by toolbar actions and formatting operations in source mode.
 *
 * @coordinates-with toolbarActions/sourceAdapter.ts — uses getSourceWordRange for auto-selection
 * @coordinates-with sourceContextDetection/ — uses range utilities for formatting detection
 * @module utils/sourceSelection
 */

import type { EditorState, Text } from "@codemirror/state";

/** A from/to character offset range in a CodeMirror document. */
export interface SourceSelectionRange {
  from: number;
  to: number;
}

function normalizeRange(range: SourceSelectionRange): SourceSelectionRange {
  if (range.from <= range.to) return range;
  return { from: range.to, to: range.from };
}

/** Return the word range at a position, or null if not inside a word. */
export function getSourceWordRange(
  state: EditorState,
  pos: number
): SourceSelectionRange | null {
  const range = state.wordAt(pos);
  if (!range) return null;
  return { from: range.from, to: range.to };
}

/** Return the full line range containing the given position. */
export function getSourceLineRange(
  state: EditorState,
  pos: number
): SourceSelectionRange {
  const line = state.doc.lineAt(pos);
  return { from: line.from, to: line.to };
}

function isBlankLine(lineText: string): boolean {
  return lineText.trim().length === 0;
}

/** Expand a range to include the surrounding contiguous non-blank lines. */
export function getSourceBlockRange(
  state: EditorState,
  from: number,
  to: number
): SourceSelectionRange {
  const doc = state.doc;
  const normalized = normalizeRange({ from, to });

  let startLine = doc.lineAt(normalized.from).number;
  let endLine = doc.lineAt(normalized.to).number;

  while (startLine > 1) {
    const line = doc.line(startLine - 1);
    if (isBlankLine(line.text)) break;
    startLine -= 1;
  }

  while (endLine < doc.lines) {
    const line = doc.line(endLine + 1);
    if (isBlankLine(line.text)) break;
    endLine += 1;
  }

  return {
    from: doc.line(startLine).from,
    to: doc.line(endLine).to,
  };
}

/** Progressively expand selection: word -> line -> block -> document, or null if already at max. */
export function getSourceExpandedRange(
  state: EditorState,
  from: number,
  to: number
): SourceSelectionRange | null {
  const normalized = normalizeRange({ from, to });

  if (normalized.from === normalized.to) {
    const word = getSourceWordRange(state, normalized.from);
    if (word && (word.from !== normalized.from || word.to !== normalized.to)) {
      return word;
    }
  }

  const line = getSourceLineRange(state, normalized.from);
  if (normalized.from > line.from || normalized.to < line.to) {
    return line;
  }

  const block = getSourceBlockRange(state, normalized.from, normalized.to);
  if (normalized.from > block.from || normalized.to < block.to) {
    return block;
  }

  if (normalized.from !== 0 || normalized.to !== state.doc.length) {
    return { from: 0, to: state.doc.length };
  }

  return null;
}

/** Return the primary selection range from the editor state, normalized (from <= to). */
export function getSourceSelectionRange(
  state: EditorState
): SourceSelectionRange {
  const main = state.selection.main;
  return normalizeRange({ from: main.from, to: main.to });
}

/** Test helper: return a range spanning the entire document. */
export function _getSourceDocRange(doc: Text): SourceSelectionRange {
  return { from: 0, to: doc.length };
}
