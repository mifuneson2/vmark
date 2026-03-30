/**
 * Source Math Popup View
 *
 * Purpose: Editable math popup for Source mode — textarea for LaTeX input
 *   with live KaTeX preview. Extends SourcePopupView for consistent lifecycle
 *   (click-outside, scroll-close, Tab trapping, Escape handling).
 *
 * Key decisions:
 *   - Saves on Cmd+Enter, cancels on Escape
 *   - Click-outside auto-saves (not discard)
 *   - Replaces the full math range (including delimiters) in the document
 *   - Reuses KaTeX loading from the shared katexLoader
 *
 * @coordinates-with stores/sourceMathPopupStore.ts — popup state
 * @coordinates-with plugins/codemirror/sourceMathPreview.ts — triggers this popup
 * @coordinates-with plugins/sourcePopup/SourcePopupView.ts — base class
 * @module plugins/sourceMathPopup/SourceMathPopupView
 */

import type { EditorView } from "@codemirror/view";
import { SourcePopupView, type PopupPositionConfig } from "@/plugins/sourcePopup/SourcePopupView";
import { useSourceMathPopupStore } from "@/stores/sourceMathPopupStore";
import { loadKatex } from "@/plugins/latex/katexLoader";
import { isImeKeyEvent } from "@/utils/imeGuard";
import { renderWarn } from "@/utils/debug";
import i18n from "@/i18n";
import "./source-math-popup.css";

type SourceMathPopupState = ReturnType<typeof useSourceMathPopupStore.getState>;

export class SourceMathPopupView extends SourcePopupView<SourceMathPopupState> {
  private textarea!: HTMLTextAreaElement;
  private preview!: HTMLElement;
  private error!: HTMLElement;
  private renderToken = 0;

  constructor(view: EditorView) {
    super(view, useSourceMathPopupStore);
  }

  protected buildContainer(): HTMLElement {
    const container = document.createElement("div");
    container.className = "source-math-popup popup-container";

    const textarea = document.createElement("textarea");
    textarea.className = "source-math-popup-input";
    textarea.placeholder = i18n.t("editor:popup.math.input.placeholder");
    textarea.rows = 3;
    textarea.addEventListener("input", this.handleInputChange);
    textarea.addEventListener("keydown", this.handleTextareaKeydown);
    this.textarea = textarea;

    const preview = document.createElement("div");
    preview.className = "source-math-popup-preview";
    this.preview = preview;

    const error = document.createElement("div");
    error.className = "source-math-popup-error";
    this.error = error;

    const buttons = document.createElement("div");
    buttons.className = "source-math-popup-buttons";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "source-math-popup-btn source-math-popup-btn-cancel";
    cancelBtn.textContent = i18n.t("editor:popup.math.cancel");
    cancelBtn.addEventListener("click", this.handleCancel);

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "source-math-popup-btn source-math-popup-btn-save";
    saveBtn.textContent = i18n.t("editor:popup.math.save");
    saveBtn.addEventListener("click", this.handleSave);

    buttons.appendChild(cancelBtn);
    buttons.appendChild(saveBtn);

    container.appendChild(textarea);
    container.appendChild(preview);
    container.appendChild(error);
    container.appendChild(buttons);

    return container;
  }

  protected onShow(state: SourceMathPopupState): void {
    this.textarea.value = state.latex;
    this.renderPreview(state.latex);

    requestAnimationFrame(() => {
      this.textarea.focus();
      this.textarea.select();
    });
  }

  protected onHide(): void {
    this.renderToken++;
    this.preview.textContent = "";
    this.error.textContent = "";
  }

  protected getPopupDimensions(): PopupPositionConfig {
    return {
      width: 360,
      height: 200,
      gap: 8,
      preferAbove: true,
    };
  }

  private renderPreview(latex: string) {
    const trimmed = latex.trim();
    this.error.textContent = "";

    if (!trimmed) {
      this.preview.textContent = "";
      return;
    }

    const token = ++this.renderToken;

    loadKatex()
      .then((katex) => {
        if (token !== this.renderToken) return;
        try {
          katex.default.render(trimmed, this.preview, {
            throwOnError: true,
            displayMode: false,
          });
        } catch {
          this.preview.textContent = trimmed;
          this.error.textContent = i18n.t("editor:popup.math.invalidLatex");
        }
      })
      .catch((err: unknown) => {
        if (token !== this.renderToken) return;
        renderWarn("LaTeX preview failed:", err instanceof Error ? err.message : String(err));
        this.preview.textContent = trimmed;
        this.error.textContent = i18n.t("editor:popup.math.previewFailed");
      });
  }

  private handleInputChange = () => {
    const value = this.textarea.value;
    useSourceMathPopupStore.getState().updateLatex(value);
    this.renderPreview(value);
  };

  private handleTextareaKeydown = (e: KeyboardEvent) => {
    if (isImeKeyEvent(e)) return;

    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      e.stopPropagation();
      this.handleSave();
      return;
    }

    // Let Escape propagate to SourcePopupView's handler
  };

  private handleSave = () => {
    const state = useSourceMathPopupStore.getState();
    const { latex, mathFrom, mathTo, isBlock, originalLatex } = state;

    // Don't save if nothing changed
    if (latex === originalLatex) {
      state.closePopup();
      this.editorView.focus();
      return;
    }

    // Rebuild the full math expression with delimiters
    let replacement: string;
    if (isBlock) {
      // For block math, we need to determine if it was $$ or ```latex
      const existingText = this.editorView.state.doc.sliceString(mathFrom, mathTo);
      if (existingText.startsWith("```")) {
        replacement = "```latex\n" + latex + "\n```";
      } else {
        replacement = "$$\n" + latex + "\n$$";
      }
    } else {
      replacement = "$" + latex + "$";
    }

    this.editorView.dispatch({
      changes: { from: mathFrom, to: mathTo, insert: replacement },
    });

    state.closePopup();
    this.editorView.focus();
  };

  private handleCancel = () => {
    useSourceMathPopupStore.getState().closePopup();
    this.editorView.focus();
  };
}
