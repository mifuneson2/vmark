/**
 * Source Math Popup Store
 *
 * Purpose: State for the Source mode math editing popup — tracks anchor rect,
 *   LaTeX content, and the document range being edited for live math editing.
 *
 * @coordinates-with plugins/sourceMathPopup/SourceMathPopupView.ts — the popup view
 * @coordinates-with plugins/codemirror/sourceMathPreview.ts — opens this popup
 * @module stores/sourceMathPopupStore
 */

import { create } from "zustand";
import type { AnchorRect } from "@/utils/popupPosition";

interface SourceMathPopupState {
  isOpen: boolean;
  anchorRect: AnchorRect | null;
  /** Current LaTeX content (without delimiters) */
  latex: string;
  /** Original LaTeX for cancel/revert */
  originalLatex: string;
  /** Document range of the full math expression (including delimiters) */
  mathFrom: number;
  mathTo: number;
  /** Whether this is block math ($$..$$) vs inline ($...$) */
  isBlock: boolean;
}

interface SourceMathPopupActions {
  openPopup: (
    rect: AnchorRect,
    latex: string,
    mathFrom: number,
    mathTo: number,
    isBlock: boolean,
  ) => void;
  closePopup: () => void;
  updateLatex: (latex: string) => void;
}

type SourceMathPopupStore = SourceMathPopupState & SourceMathPopupActions;

const initialState: SourceMathPopupState = {
  isOpen: false,
  anchorRect: null,
  latex: "",
  originalLatex: "",
  mathFrom: 0,
  mathTo: 0,
  isBlock: false,
};

export const useSourceMathPopupStore = create<SourceMathPopupStore>((set) => ({
  ...initialState,

  openPopup: (rect, latex, mathFrom, mathTo, isBlock) =>
    set({
      isOpen: true,
      anchorRect: rect,
      latex,
      originalLatex: latex,
      mathFrom,
      mathTo,
      isBlock,
    }),

  closePopup: () => set(initialState),

  updateLatex: (latex) => set({ latex }),
}));
