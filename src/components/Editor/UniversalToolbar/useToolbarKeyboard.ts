/**
 * useToolbarKeyboard - Keyboard navigation hook
 *
 * Handles keyboard events for the universal toolbar.
 * Implements simplified linear navigation per spec Section 3.1.
 *
 * Navigation:
 * - ←/→ or Tab/Shift+Tab: Move between buttons (wrapping)
 * - Home/End: Jump to first/last enabled button
 * - Enter/Space: Activate button (open dropdown)
 * - ↑/↓: Open dropdown (dropdown buttons only, no-op on action buttons)
 * - Escape: Handled by parent (two-step cascade)
 *
 * @module components/Editor/UniversalToolbar/useToolbarKeyboard
 */
import { useCallback, useRef, useEffect, useState } from "react";
import {
  getNextFocusableIndex,
  getPrevFocusableIndex,
  getFirstFocusableIndex,
  getLastFocusableIndex,
} from "./toolbarNavigation";

interface UseToolbarKeyboardOptions {
  /** Total number of buttons in the toolbar */
  buttonCount: number;
  /** Whether a button is focusable (enabled) */
  isButtonFocusable: (index: number) => boolean;
  /** Whether a button is a dropdown (vs action button) */
  isDropdownButton?: (index: number) => boolean;
  /** Optional external ref for the toolbar container */
  containerRef?: React.RefObject<HTMLDivElement | null>;
  /** Whether focus should be managed by the toolbar */
  focusMode: boolean;
  /** Callback when a button should be activated */
  onActivate: (index: number) => void;
  /** Callback when a dropdown should open (returns true if opened) */
  onOpenDropdown?: (index: number) => boolean;
  /** Callback when toolbar should close (Escape pressed, no dropdown open) */
  onClose?: () => void;
}

interface UseToolbarKeyboardReturn {
  /** Current focused button index (roving tabindex) */
  focusedIndex: number;
  /** Set the focused index */
  setFocusedIndex: (index: number) => void;
  /** Ref to attach to the toolbar container */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Handle keydown events */
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

/**
 * Hook for toolbar keyboard navigation.
 *
 * Implements linear navigation (no group jumping).
 * Session memory is managed externally (cleared on toolbar close).
 */
export function useToolbarKeyboard(
  options: UseToolbarKeyboardOptions
): UseToolbarKeyboardReturn {
  const {
    buttonCount,
    isButtonFocusable,
    isDropdownButton,
    onActivate,
    onOpenDropdown,
    onClose,
    containerRef: externalRef,
    focusMode,
  } = options;

  const internalRef = useRef<HTMLDivElement>(null);
  const containerRef = externalRef ?? internalRef;

  // Session-only focus tracking (no persistent store)
  const [focusedIndex, setFocusedIndexState] = useState(0);

  const setFocusedIndex = useCallback((index: number) => {
    setFocusedIndexState(index);
  }, []);

  // Move focus to a button
  const focusButton = useCallback((index: number) => {
    setFocusedIndex(index);
    const container = containerRef.current;
    if (!container) return;

    const buttons = container.querySelectorAll<HTMLButtonElement>(".universal-toolbar-btn");
    const targetIndex = Math.min(index, buttons.length - 1);
    /* v8 ignore next -- @preserve defensive guard: targetIndex is always valid when buttons.length > 0, and empty containers return early via focusMode effect */
    if (buttons[targetIndex]) {
      buttons[targetIndex].focus();
    }
  }, [setFocusedIndex, containerRef]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Prevent Cmd+A from selecting all page content
      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault();
        return;
      }

      const current = focusedIndex;

      switch (e.key) {
        // Tab navigation: moves focus only (no dropdown open)
        case "Tab":
          if (e.shiftKey) {
            e.preventDefault();
            focusButton(getPrevFocusableIndex(current, buttonCount, isButtonFocusable));
          } else {
            e.preventDefault();
            focusButton(getNextFocusableIndex(current, buttonCount, isButtonFocusable));
          }
          break;

        // Arrow navigation: moves focus AND opens dropdown
        case "ArrowRight": {
          e.preventDefault();
          const nextIndex = getNextFocusableIndex(current, buttonCount, isButtonFocusable);
          focusButton(nextIndex);
          // Auto-open dropdown when navigating with arrows
          if (isDropdownButton?.(nextIndex) && onOpenDropdown) {
            onOpenDropdown(nextIndex);
          }
          break;
        }

        case "ArrowLeft": {
          e.preventDefault();
          const prevIndex = getPrevFocusableIndex(current, buttonCount, isButtonFocusable);
          focusButton(prevIndex);
          // Auto-open dropdown when navigating with arrows
          if (isDropdownButton?.(prevIndex) && onOpenDropdown) {
            onOpenDropdown(prevIndex);
          }
          break;
        }

        // Open dropdown (dropdown buttons only)
        case "ArrowDown":
        case "ArrowUp":
          // Only open dropdown if this is a dropdown button
          if (isDropdownButton?.(current) !== false && onOpenDropdown) {
            const opened = onOpenDropdown(current);
            if (opened) {
              e.preventDefault();
            }
          }
          // No-op on action buttons (per spec Section 3.1)
          break;

        // Jump to first/last
        case "Home":
          e.preventDefault();
          focusButton(getFirstFocusableIndex(buttonCount, isButtonFocusable));
          break;

        case "End":
          e.preventDefault();
          focusButton(getLastFocusableIndex(buttonCount, isButtonFocusable));
          break;

        // Activate button
        case "Enter":
        case " ":
          e.preventDefault();
          if (isButtonFocusable(current)) {
            onActivate(current);
          }
          break;

        // Close toolbar (handled by parent for two-step cascade)
        case "Escape":
          e.preventDefault();
          if (onClose) {
            onClose();
          }
          break;
      }
    },
    [buttonCount, focusButton, focusedIndex, onActivate, onClose, isButtonFocusable, isDropdownButton, onOpenDropdown]
  );

  // Focus button when toolbar gets focus
  useEffect(() => {
    if (!focusMode) return;
    const container = containerRef.current;
    if (!container) return;
    const activeElement = document.activeElement as HTMLElement | null;
    if (activeElement && container.contains(activeElement)) return;

    // Delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const buttons = container.querySelectorAll<HTMLButtonElement>(".universal-toolbar-btn");
      if (buttons.length === 0) return;
      const safeIndex = Math.min(focusedIndex, buttons.length - 1);
      const targetIndex = isButtonFocusable(safeIndex)
        ? safeIndex
        : getFirstFocusableIndex(buttons.length, isButtonFocusable);
      if (buttons[targetIndex]) buttons[targetIndex].focus();
    }, 0);

    return () => clearTimeout(timer);
  }, [focusMode, focusedIndex, isButtonFocusable, containerRef]);

  return {
    focusedIndex,
    setFocusedIndex,
    containerRef,
    handleKeyDown,
  };
}
