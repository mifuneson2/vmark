/**
 * Link Tooltip Store
 *
 * Manages state for the read-only link tooltip that appears on hover.
 * Separate from linkPopupStore which handles edit/create popups.
 */

import { create } from "zustand";

interface AnchorRect {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

interface LinkTooltipState {
  isOpen: boolean;
  href: string;
  anchorRect: AnchorRect | null;
}

interface LinkTooltipActions {
  showTooltip: (data: { href: string; anchorRect: AnchorRect }) => void;
  hideTooltip: () => void;
}

type LinkTooltipStore = LinkTooltipState & LinkTooltipActions;

const initialState: LinkTooltipState = {
  isOpen: false,
  href: "",
  anchorRect: null,
};

export const useLinkTooltipStore = create<LinkTooltipStore>((set) => ({
  ...initialState,

  showTooltip: (data) =>
    set({
      isOpen: true,
      href: data.href,
      anchorRect: data.anchorRect,
    }),

  hideTooltip: () => set(initialState),
}));
