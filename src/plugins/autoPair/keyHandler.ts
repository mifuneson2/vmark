/**
 * Auto-Pair Keyboard Handler
 *
 * Purpose: Keyboard event dispatch for auto-pair — routes Tab, Shift+Tab,
 * Backspace, and closing-bracket keydown events to the appropriate handler.
 *
 * Split from handlers.ts to keep files under ~300 lines.
 *
 * @coordinates-with handlers.ts — core auto-pair logic (text input, bracket skip, backspace)
 * @coordinates-with pairs.ts — pair definitions and lookup functions
 * @coordinates-with tiptap.ts — wires this handler into the ProseMirror plugin
 * @module plugins/autoPair/keyHandler
 */

import type { EditorView } from "@tiptap/pm/view";
import {
  isClosingChar,
  straightToCurlyClosing,
  type PairConfig,
} from "./pairs";
import {
  type AutoPairConfig,
  handleTabJump,
  handleShiftTabJump,
  handleBackspacePair,
  handleClosingBracket,
} from "./handlers";

/** Convert AutoPairConfig to PairConfig for pair lookup functions */
function toPairConfig(config: AutoPairConfig): PairConfig {
  return {
    includeCJK: config.includeCJK,
    includeCurlyQuotes: config.includeCurlyQuotes,
  };
}

/**
 * Create keyboard event handler.
 * Accepts a config getter so the handler always reads fresh settings
 * without allocating a new closure on every keydown.
 */
export function createKeyHandler(getConfig: () => AutoPairConfig) {
  return function handleKeyDown(view: EditorView, event: KeyboardEvent): boolean {
    // Skip if modifiers are pressed (except Shift)
    if (event.ctrlKey || event.altKey || event.metaKey) {
      return false;
    }

    const config = getConfig();

    // Handle Tab to jump over closing bracket
    if (event.key === "Tab" && !event.shiftKey) {
      if (handleTabJump(view, config)) {
        event.preventDefault();
        return true;
      }
      // Let normal Tab behavior happen (indent)
      return false;
    }

    // Handle Shift+Tab to jump before opening bracket
    if (event.key === "Tab" && event.shiftKey) {
      if (handleShiftTabJump(view, config)) {
        event.preventDefault();
        return true;
      }
      return false;
    }

    // Handle backspace for pair deletion
    if (event.key === "Backspace") {
      if (handleBackspacePair(view, config)) {
        event.preventDefault();
        return true;
      }
      return false;
    }

    // Handle closing bracket skip
    if (event.key.length === 1 && isClosingChar(event.key)) {
      if (handleClosingBracket(view, event.key, config)) {
        event.preventDefault();
        return true;
      }
      // When curly quotes are enabled, also try the curly closing equivalent.
      // event.key is always the physical key (" straight) even when the document
      // contains curly quotes from auto-pair or macOS Smart Quotes.
      const pairConfig = toPairConfig(config);
      const curlyClosing = straightToCurlyClosing(event.key, pairConfig);
      if (curlyClosing !== event.key && handleClosingBracket(view, curlyClosing, config)) {
        event.preventDefault();
        return true;
      }
    }

    return false;
  };
}
