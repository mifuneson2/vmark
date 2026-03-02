/**
 * Comprehensive tests for usePromptHistory hook
 *
 * Covers: display value, ghost text, cycling, dropdown, recordAndReset,
 * reset, Tab/ArrowRight acceptance, multi-line guard, edge cases.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockEntries = ["hello world", "help me", "goodbye"];
const mockAddEntry = vi.fn();

vi.mock("@/stores/promptHistoryStore", () => ({
  usePromptHistoryStore: Object.assign(
    (selector: (s: { entries: string[] }) => unknown) =>
      selector({ entries: mockEntries }),
    {
      getState: () => ({
        entries: mockEntries,
        addEntry: mockAddEntry,
        getFilteredEntries: (prefix: string) => {
          if (!prefix) return mockEntries;
          const lower = prefix.toLowerCase();
          return mockEntries.filter((e) => e.toLowerCase().startsWith(lower));
        },
      }),
      subscribe: vi.fn(() => () => {}),
    }
  ),
}));

import { usePromptHistory } from "./usePromptHistory";

function makeKeyEvent(overrides: Record<string, unknown> = {}) {
  const isComposing = (overrides.isComposing ?? false) as boolean;
  return {
    key: "Enter",
    isComposing,
    keyCode: (overrides.keyCode ?? 13) as number,
    ctrlKey: (overrides.ctrlKey ?? false) as boolean,
    metaKey: (overrides.metaKey ?? false) as boolean,
    shiftKey: false,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    currentTarget: {
      selectionStart: (overrides.selectionStart ?? 0) as number,
      value: (overrides.value ?? "") as string,
    } as unknown as HTMLTextAreaElement,
    nativeEvent: { isComposing, keyCode: (overrides.keyCode ?? 13) as number },
    ...overrides,
  } as unknown as React.KeyboardEvent<HTMLTextAreaElement>;
}

describe("usePromptHistory — comprehensive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Initial state ---

  it("starts with empty display value and no ghost text", () => {
    const { result } = renderHook(() => usePromptHistory());
    expect(result.current.displayValue).toBe("");
    expect(result.current.ghostText).toBe("");
    expect(result.current.isDropdownOpen).toBe(false);
  });

  // --- handleChange ---

  it("updates display value on handleChange", () => {
    const { result } = renderHook(() => usePromptHistory());

    act(() => {
      result.current.handleChange("hel");
    });

    expect(result.current.displayValue).toBe("hel");
  });

  // --- Ghost text ---

  it("shows ghost text for matching prefix", () => {
    const { result } = renderHook(() => usePromptHistory());

    act(() => {
      result.current.handleChange("hel");
    });

    expect(result.current.ghostText).toBe("lo world");
  });

  it("shows no ghost text when no match", () => {
    const { result } = renderHook(() => usePromptHistory());

    act(() => {
      result.current.handleChange("xyz");
    });

    expect(result.current.ghostText).toBe("");
  });

  it("shows no ghost text when draft is empty", () => {
    const { result } = renderHook(() => usePromptHistory());
    expect(result.current.ghostText).toBe("");
  });

  // --- Tab accepts ghost text ---

  it("accepts ghost text on Tab key", () => {
    const { result } = renderHook(() => usePromptHistory());

    act(() => {
      result.current.handleChange("hel");
    });

    const e = makeKeyEvent({ key: "Tab", value: "hel", selectionStart: 3 });
    act(() => {
      result.current.handleKeyDown(e);
    });

    expect(e.preventDefault).toHaveBeenCalled();
    expect(result.current.displayValue).toBe("hello world");
    expect(result.current.ghostText).toBe(""); // Exact match now
  });

  // --- ArrowRight at end accepts ghost text ---

  it("accepts ghost text on ArrowRight at end of input", () => {
    const { result } = renderHook(() => usePromptHistory());

    act(() => {
      result.current.handleChange("hel");
    });

    const e = makeKeyEvent({
      key: "ArrowRight",
      value: "hel",
      selectionStart: 3,
    });
    act(() => {
      result.current.handleKeyDown(e);
    });

    expect(e.preventDefault).toHaveBeenCalled();
    expect(result.current.displayValue).toBe("hello world");
  });

  it("does not accept ghost text on ArrowRight when not at end", () => {
    const { result } = renderHook(() => usePromptHistory());

    act(() => {
      result.current.handleChange("hel");
    });

    const e = makeKeyEvent({
      key: "ArrowRight",
      value: "hel",
      selectionStart: 1, // Not at end
    });
    act(() => {
      result.current.handleKeyDown(e);
    });

    expect(e.preventDefault).not.toHaveBeenCalled();
  });

  // --- ArrowUp/Down cycling ---

  it("enters cycling mode on ArrowUp", () => {
    const { result } = renderHook(() => usePromptHistory());

    const e = makeKeyEvent({ key: "ArrowUp", keyCode: 38 });
    act(() => {
      result.current.handleKeyDown(e);
    });

    expect(e.preventDefault).toHaveBeenCalled();
    // Display value should be the first history entry
    expect(result.current.displayValue).toBe("hello world");
  });

  it("cycles through entries with ArrowUp", () => {
    const { result } = renderHook(() => usePromptHistory());

    // First ArrowUp enters cycling
    act(() => {
      result.current.handleKeyDown(
        makeKeyEvent({ key: "ArrowUp", keyCode: 38 })
      );
    });
    expect(result.current.displayValue).toBe("hello world");

    // Second ArrowUp advances
    act(() => {
      result.current.handleKeyDown(
        makeKeyEvent({ key: "ArrowUp", keyCode: 38 })
      );
    });
    expect(result.current.displayValue).toBe("help me");
  });

  it("exits cycling on ArrowDown at first entry", () => {
    const { result } = renderHook(() => usePromptHistory());

    // Enter cycling
    act(() => {
      result.current.handleKeyDown(
        makeKeyEvent({ key: "ArrowUp", keyCode: 38 })
      );
    });

    // ArrowDown at index 0 exits cycling and restores draft
    act(() => {
      result.current.handleKeyDown(
        makeKeyEvent({ key: "ArrowDown", keyCode: 40 })
      );
    });

    expect(result.current.displayValue).toBe(""); // Restored empty draft
  });

  it("does not start cycling when draft has newlines (multi-line guard)", () => {
    const { result } = renderHook(() => usePromptHistory());

    act(() => {
      result.current.handleChange("line1\nline2");
    });

    const e = makeKeyEvent({ key: "ArrowUp", keyCode: 38 });
    act(() => {
      result.current.handleKeyDown(e);
    });

    // Should not intercept — browser handles multi-line cursor movement
    expect(e.preventDefault).not.toHaveBeenCalled();
  });

  it("typing exits cycling mode", () => {
    const { result } = renderHook(() => usePromptHistory());

    // Enter cycling
    act(() => {
      result.current.handleKeyDown(
        makeKeyEvent({ key: "ArrowUp", keyCode: 38 })
      );
    });
    expect(result.current.displayValue).toBe("hello world");

    // Type something — should exit cycling
    act(() => {
      result.current.handleChange("new text");
    });
    expect(result.current.displayValue).toBe("new text");
  });

  // --- Prefix filtering in cycling ---

  it("filters cycling entries by prefix", () => {
    const { result } = renderHook(() => usePromptHistory());

    act(() => {
      result.current.handleChange("good");
    });

    const e = makeKeyEvent({ key: "ArrowUp", keyCode: 38 });
    act(() => {
      result.current.handleKeyDown(e);
    });

    // Only "goodbye" matches "good"
    expect(result.current.displayValue).toBe("goodbye");
  });

  it("does not start cycling when no history matches prefix", () => {
    const { result } = renderHook(() => usePromptHistory());

    act(() => {
      result.current.handleChange("zzz");
    });

    const e = makeKeyEvent({ key: "ArrowUp", keyCode: 38 });
    act(() => {
      result.current.handleKeyDown(e);
    });

    expect(e.preventDefault).not.toHaveBeenCalled();
    expect(result.current.displayValue).toBe("zzz");
  });

  // --- Dropdown (Ctrl+R) ---

  it("toggles dropdown with Ctrl+R", () => {
    const { result } = renderHook(() => usePromptHistory());

    // Open
    const openEvent = makeKeyEvent({ key: "r", ctrlKey: true });
    act(() => {
      result.current.handleKeyDown(openEvent);
    });
    expect(result.current.isDropdownOpen).toBe(true);
    expect(openEvent.preventDefault).toHaveBeenCalled();

    // Close
    const closeEvent = makeKeyEvent({ key: "r", ctrlKey: true });
    act(() => {
      result.current.handleKeyDown(closeEvent);
    });
    expect(result.current.isDropdownOpen).toBe(false);
  });

  it("navigates dropdown with ArrowDown/ArrowUp", () => {
    const { result } = renderHook(() => usePromptHistory());

    // Open dropdown
    act(() => {
      result.current.handleKeyDown(makeKeyEvent({ key: "r", ctrlKey: true }));
    });

    // ArrowDown
    const downEvent = makeKeyEvent({ key: "ArrowDown", keyCode: 40 });
    act(() => {
      result.current.handleKeyDown(downEvent);
    });
    expect(downEvent.preventDefault).toHaveBeenCalled();
    expect(result.current.dropdownSelectedIndex).toBe(1);

    // ArrowUp
    const upEvent = makeKeyEvent({ key: "ArrowUp", keyCode: 38 });
    act(() => {
      result.current.handleKeyDown(upEvent);
    });
    expect(result.current.dropdownSelectedIndex).toBe(0);
  });

  it("selects dropdown entry on Enter", () => {
    const { result } = renderHook(() => usePromptHistory());

    // Open dropdown
    act(() => {
      result.current.handleKeyDown(makeKeyEvent({ key: "r", ctrlKey: true }));
    });

    // Move to second entry
    act(() => {
      result.current.handleKeyDown(
        makeKeyEvent({ key: "ArrowDown", keyCode: 40 })
      );
    });

    // Select with Enter
    act(() => {
      result.current.handleKeyDown(makeKeyEvent({ key: "Enter" }));
    });

    expect(result.current.isDropdownOpen).toBe(false);
    expect(result.current.displayValue).toBe("help me");
  });

  it("closes dropdown on Escape", () => {
    const { result } = renderHook(() => usePromptHistory());

    // Open dropdown
    act(() => {
      result.current.handleKeyDown(makeKeyEvent({ key: "r", ctrlKey: true }));
    });
    expect(result.current.isDropdownOpen).toBe(true);

    // Escape
    act(() => {
      result.current.handleKeyDown(makeKeyEvent({ key: "Escape" }));
    });
    expect(result.current.isDropdownOpen).toBe(false);
  });

  // --- openDropdown / closeDropdown / selectDropdownEntry ---

  it("openDropdown opens and resets index", () => {
    const { result } = renderHook(() => usePromptHistory());

    act(() => {
      result.current.openDropdown();
    });

    expect(result.current.isDropdownOpen).toBe(true);
    expect(result.current.dropdownSelectedIndex).toBe(0);
  });

  it("closeDropdown closes", () => {
    const { result } = renderHook(() => usePromptHistory());

    act(() => {
      result.current.openDropdown();
    });
    act(() => {
      result.current.closeDropdown();
    });

    expect(result.current.isDropdownOpen).toBe(false);
  });

  it("selectDropdownEntry sets draft and closes dropdown", () => {
    const { result } = renderHook(() => usePromptHistory());

    act(() => {
      result.current.openDropdown();
    });

    act(() => {
      result.current.selectDropdownEntry(2);
    });

    expect(result.current.isDropdownOpen).toBe(false);
    expect(result.current.displayValue).toBe("goodbye");
  });

  it("selectDropdownEntry handles out-of-bounds index gracefully", () => {
    const { result } = renderHook(() => usePromptHistory());

    act(() => {
      result.current.openDropdown();
    });

    act(() => {
      result.current.selectDropdownEntry(999);
    });

    // Should close dropdown, draft unchanged
    expect(result.current.isDropdownOpen).toBe(false);
  });

  // --- recordAndReset ---

  it("records entry and resets state", () => {
    const { result } = renderHook(() => usePromptHistory());

    act(() => {
      result.current.handleChange("some prompt");
    });

    act(() => {
      result.current.recordAndReset("some prompt");
    });

    expect(mockAddEntry).toHaveBeenCalledWith("some prompt");
    expect(result.current.displayValue).toBe("");
    expect(result.current.isDropdownOpen).toBe(false);
  });

  // --- reset ---

  it("resets all state to initial values", () => {
    const { result } = renderHook(() => usePromptHistory());

    // Set up some state
    act(() => {
      result.current.handleChange("draft");
      result.current.openDropdown();
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.displayValue).toBe("");
    expect(result.current.ghostText).toBe("");
    expect(result.current.isDropdownOpen).toBe(false);
    expect(result.current.dropdownSelectedIndex).toBe(0);
  });

  // --- Dropdown hides ghost text ---

  it("hides ghost text when dropdown is open", () => {
    const { result } = renderHook(() => usePromptHistory());

    act(() => {
      result.current.handleChange("hel");
    });
    expect(result.current.ghostText).toBe("lo world");

    act(() => {
      result.current.openDropdown();
    });
    expect(result.current.ghostText).toBe("");
  });
});
