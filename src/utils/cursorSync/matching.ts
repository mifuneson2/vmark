/**
 * Cursor Context Extraction
 *
 * Purpose: Capture the word and surrounding text around the cursor so we can
 * find the equivalent position in a different editor representation.
 *
 * @coordinates-with cursorSync/pmHelpers.ts — uses context for column matching
 * @module utils/cursorSync/matching
 */

import type { CursorContext } from "./types";

const CONTEXT_LENGTH = 20; // Characters of context to store

/**
 * Extract word and context at cursor position.
 * Used by both CodeMirror and Tiptap cursor extraction.
 */
export function extractCursorContext(
  text: string,
  pos: number
): CursorContext {
  if (!text || pos < 0) {
    return { word: "", offsetInWord: 0, contextBefore: "", contextAfter: "" };
  }

  // Clamp position
  pos = Math.min(pos, text.length);

  // Find word boundaries (Unicode-aware for CJK support)
  let start = pos;
  let end = pos;
  const wordChar = /[\p{L}\p{N}_]/u;

  // Move start back to word boundary
  while (start > 0 && wordChar.test(text[start - 1])) {
    start--;
  }

  // Move end forward to word boundary
  while (end < text.length && wordChar.test(text[end])) {
    end++;
  }

  const word = text.slice(start, end);
  const offsetInWord = pos - start;

  // Extract context (characters around cursor, not just word)
  const contextStart = Math.max(0, pos - CONTEXT_LENGTH);
  const contextEnd = Math.min(text.length, pos + CONTEXT_LENGTH);
  const contextBefore = text.slice(contextStart, pos);
  const contextAfter = text.slice(pos, contextEnd);

  return { word, offsetInWord, contextBefore, contextAfter };
}
