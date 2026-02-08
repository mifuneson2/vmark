/**
 * Source Copy-on-Select Plugin
 *
 * CodeMirror ViewPlugin that auto-copies selected text to clipboard
 * on mouseup, matching the WYSIWYG copy-on-select behavior.
 *
 * The copyFormat setting is not applicable here — source mode buffer
 * text IS already markdown, so no conversion is needed.
 */

import type { Extension } from "@codemirror/state";
import { ViewPlugin, type EditorView } from "@codemirror/view";
import { useSettingsStore } from "@/stores/settingsStore";
import { cleanTextForClipboard } from "@/plugins/markdownCopy/tiptap";

export function createSourceCopyOnSelectPlugin(): Extension {
  return ViewPlugin.fromClass(
    class {
      private view: EditorView;
      private destroyed = false;

      constructor(view: EditorView) {
        this.view = view;
        view.dom.addEventListener("mouseup", this.handleMouseUp);
      }

      handleMouseUp = () => {
        if (!useSettingsStore.getState().markdown.copyOnSelect) return;

        const view = this.view;
        requestAnimationFrame(() => {
          if (this.destroyed) return;

          const { from, to } = view.state.selection.main;
          if (from === to) return;

          const raw = view.state.sliceDoc(from, to);
          const text = cleanTextForClipboard(raw);
          if (text) {
            navigator.clipboard.writeText(text).catch(() => {
              // Clipboard write can fail if window loses focus
            });
          }
        });
      };

      destroy() {
        this.destroyed = true;
        this.view.dom.removeEventListener("mouseup", this.handleMouseUp);
      }
    }
  );
}
