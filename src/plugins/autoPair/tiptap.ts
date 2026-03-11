/**
 * Auto-Pair Tiptap Extension
 *
 * Purpose: Automatically inserts matching closing brackets/quotes when the user types
 * an opening character in WYSIWYG mode. Also handles skip-over, backspace-delete, and
 * Shift+Tab jump past closing characters.
 *
 * Key decisions:
 *   - Uses handleDOMEvents.keydown (not handleKeyDown) to intercept Tab/Backspace before
 *     Tiptap's built-in keyboard shortcuts (e.g., list indent)
 *   - Key dispatch is delegated to keyHandler.ts for Shift+Tab and backtick handling
 *   - Config is read lazily from settingsStore so changes take effect immediately
 *   - IME composition is fully guarded to avoid corrupting CJK input
 *
 * @coordinates-with handlers.ts — core auto-pair logic (text input, key handling)
 * @coordinates-with keyHandler.ts — Shift+Tab jump and key event dispatch
 * @coordinates-with backtickToggle.ts — backtick code mark toggle logic
 * @coordinates-with pairs.ts — character pair definitions (ASCII, CJK, curly quotes)
 * @coordinates-with utils.ts — context detection (code block, inline code, word boundary)
 * @module plugins/autoPair/tiptap
 */

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  isProseMirrorComposing,
  isProseMirrorInCompositionGrace,
  markProseMirrorCompositionEnd,
  isImeKeyEvent,
} from "@/utils/imeGuard";
import { handleTextInput, type AutoPairConfig } from "./handlers";
import { createKeyHandler } from "./keyHandler";

const autoPairPluginKey = new PluginKey("autoPair");

function getConfig(): AutoPairConfig {
  const settings = useSettingsStore.getState().markdown;
  return {
    enabled: settings.autoPairEnabled ?? true,
    includeCJK: settings.autoPairCJKStyle !== "off",
    includeCurlyQuotes: settings.autoPairCurlyQuotes ?? false,
    /* v8 ignore next 3 -- @preserve reason: normalizeRightDoubleQuote compound boolean; CJK+curlyQuotes+rightDoubleQuote=true path not exercised in tests */
    normalizeRightDoubleQuote:
      settings.autoPairCJKStyle !== "off" &&
      (settings.autoPairCurlyQuotes ?? false) &&
      (settings.autoPairRightDoubleQuote ?? false),
  };
}

/**
 * Check if IME composition is active or in grace period.
 * This prevents auto-pair from interfering with CJK input.
 */
function isComposingOrGrace(view: Parameters<typeof isProseMirrorComposing>[0]): boolean {
  return isProseMirrorComposing(view) || isProseMirrorInCompositionGrace(view);
}

export const autoPairExtension = Extension.create({
  name: "autoPair",
  addProseMirrorPlugins() {
    // Create key handler once — it reads config lazily via the getter
    const keyHandler = createKeyHandler(getConfig);

    return [
      new Plugin({
        key: autoPairPluginKey,
        props: {
          handleTextInput(view, from, to, text) {
            // Block during IME composition and grace period
            if (isComposingOrGrace(view)) return false;
            return handleTextInput(view, from, to, text, getConfig());
          },
          // Use handleDOMEvents.keydown instead of handleKeyDown to intercept
          // Tab/Backspace before Tiptap's keyboard shortcuts (list indent, etc.)
          handleDOMEvents: {
            keydown(view, event) {
              // Block during IME composition, grace period, or IME key events
              if (isComposingOrGrace(view) || isImeKeyEvent(event)) return false;
              return keyHandler(view, event);
            },
            compositionend(view) {
              // Mark composition end for grace period tracking
              markProseMirrorCompositionEnd(view);
              return false;
            },
          },
        },
      }),
    ];
  },
});
