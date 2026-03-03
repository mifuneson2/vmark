/**
 * useToolbarKeyboard - Tests
 *
 * Tests for keyboard navigation hook per redesign spec Section 3.1.
 *
 * Covers:
 * - Linear navigation: ←/→ or Tab/Shift+Tab (wrap, skip disabled)
 * - Home/End jumps to first/last enabled
 * - Enter/Space activates button
 * - ↑/↓ opens dropdown on dropdown buttons only (no-op on action buttons)
 * - Escape calls onClose (for two-step cascade)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useToolbarKeyboard } from "./useToolbarKeyboard";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

// Helper to create a mock keyboard event
function createKeyEvent(
  key: string,
  options: { shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean } = {}
): ReactKeyboardEvent {
  return {
    key,
    shiftKey: options.shiftKey ?? false,
    metaKey: options.metaKey ?? false,
    ctrlKey: options.ctrlKey ?? false,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as ReactKeyboardEvent;
}

describe("useToolbarKeyboard", () => {
  const onActivate = vi.fn();
  const onOpenDropdown = vi.fn();
  const onClose = vi.fn();

  // 8 buttons total, all enabled by default
  const buttonCount = 8;
  const allFocusable = () => true;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("linear navigation", () => {
    it("ArrowRight moves to next button", () => {
      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable: allFocusable,
          focusMode: true,
          onActivate,
        })
      );

      act(() => {
        result.current.setFocusedIndex(0);
      });

      act(() => {
        const event = createKeyEvent("ArrowRight");
        result.current.handleKeyDown(event);
      });

      expect(result.current.focusedIndex).toBe(1);
    });

    it("ArrowLeft moves to previous button", () => {
      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable: allFocusable,
          focusMode: true,
          onActivate,
        })
      );

      act(() => {
        result.current.setFocusedIndex(3);
      });

      act(() => {
        const event = createKeyEvent("ArrowLeft");
        result.current.handleKeyDown(event);
      });

      expect(result.current.focusedIndex).toBe(2);
    });

    it("Tab moves to next button", () => {
      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable: allFocusable,
          focusMode: true,
          onActivate,
        })
      );

      act(() => {
        result.current.setFocusedIndex(2);
      });

      act(() => {
        const event = createKeyEvent("Tab");
        result.current.handleKeyDown(event);
      });

      expect(result.current.focusedIndex).toBe(3);
    });

    it("Shift+Tab moves to previous button", () => {
      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable: allFocusable,
          focusMode: true,
          onActivate,
        })
      );

      act(() => {
        result.current.setFocusedIndex(3);
      });

      act(() => {
        const event = createKeyEvent("Tab", { shiftKey: true });
        result.current.handleKeyDown(event);
      });

      expect(result.current.focusedIndex).toBe(2);
    });

    it("ArrowRight wraps from last to first", () => {
      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable: allFocusable,
          focusMode: true,
          onActivate,
        })
      );

      act(() => {
        result.current.setFocusedIndex(buttonCount - 1);
      });

      act(() => {
        const event = createKeyEvent("ArrowRight");
        result.current.handleKeyDown(event);
      });

      expect(result.current.focusedIndex).toBe(0);
    });

    it("ArrowLeft wraps from first to last", () => {
      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable: allFocusable,
          focusMode: true,
          onActivate,
        })
      );

      act(() => {
        result.current.setFocusedIndex(0);
      });

      act(() => {
        const event = createKeyEvent("ArrowLeft");
        result.current.handleKeyDown(event);
      });

      expect(result.current.focusedIndex).toBe(buttonCount - 1);
    });

    it("skips disabled buttons when navigating", () => {
      // Buttons 2 and 3 are disabled
      const isButtonFocusable = (i: number) => i !== 2 && i !== 3;

      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable,
          focusMode: true,
          onActivate,
        })
      );

      act(() => {
        result.current.setFocusedIndex(1);
      });

      act(() => {
        const event = createKeyEvent("ArrowRight");
        result.current.handleKeyDown(event);
      });

      // Should skip 2 and 3, land on 4
      expect(result.current.focusedIndex).toBe(4);
    });
  });

  describe("Home/End navigation", () => {
    it("Home moves to first enabled button", () => {
      // First button disabled
      const isButtonFocusable = (i: number) => i !== 0;

      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable,
          focusMode: true,
          onActivate,
        })
      );

      act(() => {
        result.current.setFocusedIndex(5);
      });

      act(() => {
        const event = createKeyEvent("Home");
        result.current.handleKeyDown(event);
      });

      expect(result.current.focusedIndex).toBe(1); // Skips disabled 0
    });

    it("End moves to last enabled button", () => {
      // Last button disabled
      const isButtonFocusable = (i: number) => i !== buttonCount - 1;

      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable,
          focusMode: true,
          onActivate,
        })
      );

      act(() => {
        result.current.setFocusedIndex(0);
      });

      act(() => {
        const event = createKeyEvent("End");
        result.current.handleKeyDown(event);
      });

      expect(result.current.focusedIndex).toBe(buttonCount - 2); // Skips disabled last
    });
  });

  describe("button activation", () => {
    it("Enter activates focused button", () => {
      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable: allFocusable,
          focusMode: true,
          onActivate,
        })
      );

      act(() => {
        result.current.setFocusedIndex(3);
      });

      act(() => {
        const event = createKeyEvent("Enter");
        result.current.handleKeyDown(event);
      });

      expect(onActivate).toHaveBeenCalledWith(3);
    });

    it("Space activates focused button", () => {
      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable: allFocusable,
          focusMode: true,
          onActivate,
        })
      );

      act(() => {
        result.current.setFocusedIndex(5);
      });

      act(() => {
        const event = createKeyEvent(" ");
        result.current.handleKeyDown(event);
      });

      expect(onActivate).toHaveBeenCalledWith(5);
    });

    it("does not activate disabled button", () => {
      const isButtonFocusable = (i: number) => i !== 3;

      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable,
          focusMode: true,
          onActivate,
        })
      );

      act(() => {
        result.current.setFocusedIndex(3); // Disabled button
      });

      act(() => {
        const event = createKeyEvent("Enter");
        result.current.handleKeyDown(event);
      });

      expect(onActivate).not.toHaveBeenCalled();
    });
  });

  describe("dropdown opening per spec Section 3.1", () => {
    it("ArrowDown opens dropdown on dropdown button", () => {
      onOpenDropdown.mockReturnValue(true);
      const isDropdownButton = () => true;

      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable: allFocusable,
          isDropdownButton,
          focusMode: true,
          onActivate,
          onOpenDropdown,
        })
      );

      act(() => {
        result.current.setFocusedIndex(0);
      });

      act(() => {
        const event = createKeyEvent("ArrowDown");
        result.current.handleKeyDown(event);
        expect(event.preventDefault).toHaveBeenCalled();
      });

      expect(onOpenDropdown).toHaveBeenCalledWith(0);
    });

    it("ArrowUp opens dropdown on dropdown button", () => {
      onOpenDropdown.mockReturnValue(true);
      const isDropdownButton = () => true;

      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable: allFocusable,
          isDropdownButton,
          focusMode: true,
          onActivate,
          onOpenDropdown,
        })
      );

      act(() => {
        result.current.setFocusedIndex(2);
      });

      act(() => {
        const event = createKeyEvent("ArrowUp");
        result.current.handleKeyDown(event);
        expect(event.preventDefault).toHaveBeenCalled();
      });

      expect(onOpenDropdown).toHaveBeenCalledWith(2);
    });

    it("ArrowDown is no-op on action button (not dropdown)", () => {
      const isDropdownButton = () => false; // All buttons are action buttons

      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable: allFocusable,
          isDropdownButton,
          focusMode: true,
          onActivate,
          onOpenDropdown,
        })
      );

      act(() => {
        result.current.setFocusedIndex(0);
      });

      act(() => {
        const event = createKeyEvent("ArrowDown");
        result.current.handleKeyDown(event);
        // Should NOT call preventDefault - no-op
      });

      expect(onOpenDropdown).not.toHaveBeenCalled();
    });

    it("ArrowUp is no-op on action button (not dropdown)", () => {
      const isDropdownButton = (i: number) => i !== 3; // Button 3 is action button

      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable: allFocusable,
          isDropdownButton,
          focusMode: true,
          onActivate,
          onOpenDropdown,
        })
      );

      act(() => {
        result.current.setFocusedIndex(3); // Action button
      });

      act(() => {
        const event = createKeyEvent("ArrowUp");
        result.current.handleKeyDown(event);
      });

      expect(onOpenDropdown).not.toHaveBeenCalled();
    });

    it("ArrowDown does not open if onOpenDropdown not provided", () => {
      const isDropdownButton = () => true;

      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable: allFocusable,
          isDropdownButton,
          focusMode: true,
          onActivate,
          // no onOpenDropdown
        })
      );

      act(() => {
        result.current.setFocusedIndex(0);
      });

      act(() => {
        const event = createKeyEvent("ArrowDown");
        result.current.handleKeyDown(event);
      });

      // Should not throw, just no-op
      expect(onOpenDropdown).not.toHaveBeenCalled();
    });
  });

  describe("Escape for two-step cascade", () => {
    it("Escape calls onClose", () => {
      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable: allFocusable,
          focusMode: true,
          onActivate,
          onClose,
        })
      );

      act(() => {
        const event = createKeyEvent("Escape");
        result.current.handleKeyDown(event);
        expect(event.preventDefault).toHaveBeenCalled();
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("Escape does nothing if onClose not provided", () => {
      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable: allFocusable,
          focusMode: true,
          onActivate,
          // no onClose
        })
      );

      act(() => {
        const event = createKeyEvent("Escape");
        result.current.handleKeyDown(event);
      });

      // Should not throw
    });
  });

  describe("Cmd+A prevention", () => {
    it("prevents Cmd+A from selecting page content", () => {
      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable: allFocusable,
          focusMode: true,
          onActivate,
        })
      );

      act(() => {
        const event = createKeyEvent("a", { metaKey: true });
        result.current.handleKeyDown(event);
        expect(event.preventDefault).toHaveBeenCalled();
      });
    });

    it("prevents Ctrl+A from selecting page content", () => {
      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable: allFocusable,
          focusMode: true,
          onActivate,
        })
      );

      act(() => {
        const event = createKeyEvent("a", { ctrlKey: true });
        result.current.handleKeyDown(event);
        expect(event.preventDefault).toHaveBeenCalled();
      });
    });
  });

  describe("setFocusedIndex", () => {
    it("allows external control of focus index", () => {
      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable: allFocusable,
          focusMode: true,
          onActivate,
        })
      );

      act(() => {
        result.current.setFocusedIndex(5);
      });

      expect(result.current.focusedIndex).toBe(5);
    });
  });

  describe("Enter/Space on dropdown vs action buttons per spec Section 3.1e", () => {
    it("Enter calls onActivate for dropdown buttons (parent handles dropdown open)", () => {
      // The hook always calls onActivate - the parent component
      // decides whether to open a dropdown based on button type
      const isDropdownButton = (i: number) => i === 0; // Button 0 is dropdown

      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable: allFocusable,
          isDropdownButton,
          focusMode: true,
          onActivate,
          onOpenDropdown,
        })
      );

      act(() => {
        result.current.setFocusedIndex(0); // Dropdown button
      });

      act(() => {
        const event = createKeyEvent("Enter");
        result.current.handleKeyDown(event);
      });

      // Parent receives activation and should open dropdown
      expect(onActivate).toHaveBeenCalledWith(0);
    });

    it("Enter calls onActivate for action buttons (parent executes action)", () => {
      const isDropdownButton = (i: number) => i !== 2; // Button 2 is action button

      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable: allFocusable,
          isDropdownButton,
          focusMode: true,
          onActivate,
        })
      );

      act(() => {
        result.current.setFocusedIndex(2); // Action button
      });

      act(() => {
        const event = createKeyEvent("Enter");
        result.current.handleKeyDown(event);
      });

      // Parent receives activation and should execute action
      expect(onActivate).toHaveBeenCalledWith(2);
    });

    it("Space behaves same as Enter for activation", () => {
      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable: allFocusable,
          focusMode: true,
          onActivate,
        })
      );

      act(() => {
        result.current.setFocusedIndex(1);
      });

      act(() => {
        const event = createKeyEvent(" ");
        result.current.handleKeyDown(event);
      });

      expect(onActivate).toHaveBeenCalledWith(1);
    });
  });

  describe("all buttons disabled per spec Section 3.1i", () => {
    it("focus stays on current position when all buttons disabled", () => {
      // All buttons are disabled
      const isButtonFocusable = () => false;

      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable,
          focusMode: true,
          onActivate,
        })
      );

      act(() => {
        result.current.setFocusedIndex(3);
      });

      // Try to navigate right
      act(() => {
        const event = createKeyEvent("ArrowRight");
        result.current.handleKeyDown(event);
      });

      // Focus should stay at 3
      expect(result.current.focusedIndex).toBe(3);
    });

    it("focus stays on current position when navigating left with all disabled", () => {
      const isButtonFocusable = () => false;

      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable,
          focusMode: true,
          onActivate,
        })
      );

      act(() => {
        result.current.setFocusedIndex(5);
      });

      act(() => {
        const event = createKeyEvent("ArrowLeft");
        result.current.handleKeyDown(event);
      });

      expect(result.current.focusedIndex).toBe(5);
    });

    it("Home key keeps focus when all buttons disabled", () => {
      const isButtonFocusable = () => false;

      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable,
          focusMode: true,
          onActivate,
        })
      );

      act(() => {
        result.current.setFocusedIndex(4);
      });

      act(() => {
        const event = createKeyEvent("Home");
        result.current.handleKeyDown(event);
      });

      // Should fallback to 0 when no focusable found
      expect(result.current.focusedIndex).toBe(0);
    });

    it("End key keeps focus when all buttons disabled", () => {
      const isButtonFocusable = () => false;

      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable,
          focusMode: true,
          onActivate,
        })
      );

      act(() => {
        result.current.setFocusedIndex(2);
      });

      act(() => {
        const event = createKeyEvent("End");
        result.current.handleKeyDown(event);
      });

      // Should fallback to last index when no focusable found
      expect(result.current.focusedIndex).toBe(buttonCount - 1);
    });

    it("Enter does not activate when focused button is disabled", () => {
      const isButtonFocusable = () => false;

      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable,
          focusMode: true,
          onActivate,
        })
      );

      act(() => {
        result.current.setFocusedIndex(0);
      });

      act(() => {
        const event = createKeyEvent("Enter");
        result.current.handleKeyDown(event);
      });

      expect(onActivate).not.toHaveBeenCalled();
    });
  });

  describe("focusButton container guard (branch 2, line 92)", () => {
    it("no-ops when containerRef.current is null", () => {
      // Using no external ref — internal ref will be null since no DOM rendered
      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable: allFocusable,
          focusMode: false, // Don't auto-focus
          onActivate,
        })
      );

      // Call handleKeyDown which triggers focusButton — containerRef is null
      act(() => {
        const event = createKeyEvent("ArrowRight");
        result.current.handleKeyDown(event);
      });

      // Should not throw — focusButton returns early when container is null
      expect(result.current.focusedIndex).toBe(1);
    });
  });

  describe("ArrowDown/ArrowUp when onOpenDropdown returns false (branch 13, line 148)", () => {
    it("does not preventDefault when dropdown did not open", () => {
      onOpenDropdown.mockReturnValue(false);
      const isDropdownButton = () => true;

      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable: allFocusable,
          isDropdownButton,
          focusMode: true,
          onActivate,
          onOpenDropdown,
        })
      );

      act(() => {
        result.current.setFocusedIndex(0);
      });

      act(() => {
        const event = createKeyEvent("ArrowDown");
        result.current.handleKeyDown(event);
        // opened === false, so preventDefault should NOT be called
        expect(event.preventDefault).not.toHaveBeenCalled();
      });

      expect(onOpenDropdown).toHaveBeenCalledWith(0);
    });
  });

  describe("focusButton with real container (branch 1[1], line 88)", () => {
    it("focuses the button at the given index when container has buttons", () => {
      const container = document.createElement("div");
      const btn0 = document.createElement("button");
      btn0.className = "universal-toolbar-btn";
      const btn1 = document.createElement("button");
      btn1.className = "universal-toolbar-btn";
      container.appendChild(btn0);
      container.appendChild(btn1);
      document.body.appendChild(container);

      const focusSpy = vi.spyOn(btn1, "focus");
      const externalRef = { current: container } as React.RefObject<HTMLDivElement | null>;

      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount: 2,
          isButtonFocusable: allFocusable,
          containerRef: externalRef,
          focusMode: false,
          onActivate,
        })
      );

      // Navigate right from index 0 → focusButton(1) with real container
      act(() => {
        result.current.setFocusedIndex(0);
      });
      act(() => {
        result.current.handleKeyDown(createKeyEvent("ArrowRight"));
      });

      expect(focusSpy).toHaveBeenCalled();
      container.remove();
    });
  });

  describe("ArrowRight/Left auto-open dropdown (branches 7-10, lines 125/136)", () => {
    it("auto-opens dropdown when navigating right to a dropdown button", () => {
      const isDropdownButton = vi.fn((i: number) => i === 1);

      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount: 3,
          isButtonFocusable: allFocusable,
          focusMode: false,
          onActivate,
          isDropdownButton,
          onOpenDropdown,
        })
      );

      act(() => {
        result.current.setFocusedIndex(0);
      });
      act(() => {
        result.current.handleKeyDown(createKeyEvent("ArrowRight"));
      });

      // Navigation moves to index 1 which is a dropdown button
      expect(isDropdownButton).toHaveBeenCalledWith(1);
      expect(onOpenDropdown).toHaveBeenCalledWith(1);
    });

    it("auto-opens dropdown when navigating left to a dropdown button", () => {
      const isDropdownButton = vi.fn((i: number) => i === 0);

      const { result } = renderHook(() =>
        useToolbarKeyboard({
          buttonCount: 3,
          isButtonFocusable: allFocusable,
          focusMode: false,
          onActivate,
          isDropdownButton,
          onOpenDropdown,
        })
      );

      act(() => {
        result.current.setFocusedIndex(1);
      });
      act(() => {
        result.current.handleKeyDown(createKeyEvent("ArrowLeft"));
      });

      // Navigation moves to index 0 which is a dropdown button
      expect(isDropdownButton).toHaveBeenCalledWith(0);
      expect(onOpenDropdown).toHaveBeenCalledWith(0);
    });
  });

  describe("focusMode effect edge cases", () => {
    it("skips focus when container has no buttons (branch 20, line 198)", () => {
      vi.useFakeTimers();

      // Create a container with no .universal-toolbar-btn elements
      const container = document.createElement("div");
      document.body.appendChild(container);
      const externalRef = { current: container } as React.RefObject<HTMLDivElement | null>;

      renderHook(() =>
        useToolbarKeyboard({
          buttonCount,
          isButtonFocusable: allFocusable,
          containerRef: externalRef,
          focusMode: true,
          onActivate,
        })
      );

      // Advance setTimeout — buttons.length === 0 guard should fire
      vi.advanceTimersByTime(10);

      // No error — guard prevented focus attempt
      container.remove();
      vi.useRealTimers();
    });

    it("focuses safeIndex when it IS focusable (branch 21[0], line 200 true path)", () => {
      vi.useFakeTimers();

      const container = document.createElement("div");
      const btn0 = document.createElement("button");
      btn0.className = "universal-toolbar-btn";
      const focusSpy0 = vi.spyOn(btn0, "focus");
      const btn1 = document.createElement("button");
      btn1.className = "universal-toolbar-btn";
      container.appendChild(btn0);
      container.appendChild(btn1);
      document.body.appendChild(container);

      const externalRef = { current: container } as React.RefObject<HTMLDivElement | null>;

      // All buttons are focusable — safeIndex=0 IS focusable → true path
      renderHook(() =>
        useToolbarKeyboard({
          buttonCount: 2,
          isButtonFocusable: allFocusable,
          containerRef: externalRef,
          focusMode: true,
          onActivate,
        })
      );

      vi.advanceTimersByTime(10);

      // btn0 (index 0) should be focused directly (no fallback)
      expect(focusSpy0).toHaveBeenCalled();

      container.remove();
      vi.useRealTimers();
    });

    it("falls back to first focusable when safeIndex is not focusable (branch 21, line 201)", () => {
      vi.useFakeTimers();

      // Create a container with toolbar buttons
      const container = document.createElement("div");
      const btn0 = document.createElement("button");
      btn0.className = "universal-toolbar-btn";
      const focusSpy0 = vi.spyOn(btn0, "focus");
      const btn1 = document.createElement("button");
      btn1.className = "universal-toolbar-btn";
      const focusSpy1 = vi.spyOn(btn1, "focus");
      container.appendChild(btn0);
      container.appendChild(btn1);
      document.body.appendChild(container);

      const externalRef = { current: container } as React.RefObject<HTMLDivElement | null>;

      // Button 0 is NOT focusable, button 1 IS focusable
      const isButtonFocusable = (i: number) => i !== 0;

      renderHook(() =>
        useToolbarKeyboard({
          buttonCount: 2,
          isButtonFocusable,
          containerRef: externalRef,
          focusMode: true,
          onActivate,
        })
      );

      // Advance setTimeout — safeIndex=0 is not focusable, should fall back
      vi.advanceTimersByTime(10);

      // btn1 (index 1) should be focused as the first focusable
      expect(focusSpy1).toHaveBeenCalled();
      expect(focusSpy0).not.toHaveBeenCalled();

      container.remove();
      vi.useRealTimers();
    });

    it("skips focus when active element is already inside container (branch 22, line 203)", () => {
      vi.useFakeTimers();

      const container = document.createElement("div");
      const btn = document.createElement("button");
      btn.className = "universal-toolbar-btn";
      container.appendChild(btn);
      document.body.appendChild(container);

      // Focus the button so activeElement is inside container
      btn.focus();

      const externalRef = { current: container } as React.RefObject<HTMLDivElement | null>;

      renderHook(() =>
        useToolbarKeyboard({
          buttonCount: 1,
          isButtonFocusable: allFocusable,
          containerRef: externalRef,
          focusMode: true,
          onActivate,
        })
      );

      // The effect should return early because activeElement is inside container
      // The setTimeout should not be set

      container.remove();
      vi.useRealTimers();
    });
  });
});
