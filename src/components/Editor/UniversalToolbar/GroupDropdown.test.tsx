/**
 * GroupDropdown - Tests
 *
 * Tests for dropdown menu per redesign spec Sections 3.2, 3.4, and 6.
 *
 * Covers:
 * - Initial focus: active+enabled item, else first enabled, else first
 * - ARIA roles: menuitemcheckbox, menuitemradio, menuitem
 * - Keyboard navigation: ↑/↓ within dropdown (wrap, skip disabled)
 * - Exit navigation: ←/→ closes dropdown and moves to adjacent button
 * - Tab/Shift+Tab closes dropdown and moves to next/prev button
 * - Escape closes dropdown only (two-step cascade)
 * - Disabled items use aria-disabled (allows focus)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GroupDropdown } from "./GroupDropdown";
import type { ToolbarActionItem, ToolbarSeparator } from "./toolbarGroups";
import type { ToolbarItemState } from "@/plugins/toolbarActions/enableRules";

// Helper to create dropdown items
function makeItem(
  action: string,
  label?: string
): { item: ToolbarActionItem; state: ToolbarItemState } {
  return {
    item: {
      id: action,
      icon: "<svg></svg>",
      label: label ?? action,
      action,
      enabledIn: ["always"],
    },
    state: {
      disabled: false,
      notImplemented: false,
      active: false,
    },
  };
}

function makeDisabledItem(
  action: string
): { item: ToolbarActionItem; state: ToolbarItemState } {
  const entry = makeItem(action);
  entry.state.disabled = true;
  return entry;
}

function makeActiveItem(
  action: string
): { item: ToolbarActionItem; state: ToolbarItemState } {
  const entry = makeItem(action);
  entry.state.active = true;
  return entry;
}

function makeSeparator(
  id: string
): { item: ToolbarSeparator; state: ToolbarItemState } {
  return {
    item: { id, type: "separator" },
    state: { disabled: true, notImplemented: false, active: false },
  };
}

const mockAnchorRect = new DOMRect(100, 400, 28, 28);

describe("GroupDropdown", () => {
  const onSelect = vi.fn();
  const onClose = vi.fn();
  const onNavigateOut = vi.fn();
  const onTabOut = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ARIA roles per spec Section 6.2", () => {
    it("uses menuitemcheckbox for toggle formats (inline group)", () => {
      const items = [makeItem("bold"), makeItem("italic"), makeItem("code")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      const buttons = screen.getAllByRole("menuitemcheckbox");
      expect(buttons).toHaveLength(3);
    });

    it("uses menuitemradio for mutually exclusive options (block group)", () => {
      const items = [
        makeItem("heading:0", "Paragraph"),
        makeItem("heading:1", "Heading 1"),
        makeItem("heading:2", "Heading 2"),
      ];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="block"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      const buttons = screen.getAllByRole("menuitemradio");
      expect(buttons).toHaveLength(3);
    });

    it("uses menuitemradio for list options (list group)", () => {
      const items = [
        makeItem("bulletList", "Bullet List"),
        makeItem("orderedList", "Ordered List"),
        makeItem("taskList", "Task List"),
      ];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="list"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      const buttons = screen.getAllByRole("menuitemradio");
      expect(buttons).toHaveLength(3);
    });

    it("uses menuitem for action items (insert group)", () => {
      const items = [
        makeItem("insertTable", "Insert Table"),
        makeItem("insertCodeBlock", "Insert Code Block"),
      ];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="insert"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      const buttons = screen.getAllByRole("menuitem");
      expect(buttons).toHaveLength(2);
    });

    it("sets aria-checked on active checkbox items", () => {
      const items = [makeActiveItem("bold"), makeItem("italic")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      const buttons = screen.getAllByRole("menuitemcheckbox");
      expect(buttons[0]).toHaveAttribute("aria-checked", "true");
      expect(buttons[1]).toHaveAttribute("aria-checked", "false");
    });

    it("sets aria-checked on active radio items", () => {
      const items = [makeItem("heading:0"), makeActiveItem("heading:1")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="block"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      const buttons = screen.getAllByRole("menuitemradio");
      expect(buttons[0]).toHaveAttribute("aria-checked", "false");
      expect(buttons[1]).toHaveAttribute("aria-checked", "true");
    });

    it("uses aria-disabled instead of disabled attribute", () => {
      const items = [makeItem("bold"), makeDisabledItem("italic")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      const buttons = screen.getAllByRole("menuitemcheckbox");
      // Should NOT have disabled attribute (allows focus)
      expect(buttons[1]).not.toHaveAttribute("disabled");
      // Should have aria-disabled
      expect(buttons[1]).toHaveAttribute("aria-disabled", "true");
    });

    it("has role=menu on container with aria-label", () => {
      const items = [makeItem("bold")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      const menu = screen.getByRole("menu");
      expect(menu).toHaveAttribute("aria-label", "inline options");
    });

    it("renders separators with role=separator", () => {
      const items = [makeItem("bold"), makeSeparator("sep1"), makeItem("italic")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      expect(screen.getByRole("separator")).toBeInTheDocument();
    });
  });

  describe("initial focus", () => {
    it("focuses first enabled item (simple focus, not smart focus)", () => {
      // Even with active item at index 1, we now focus first enabled (index 0)
      const items = [makeItem("heading:0"), makeActiveItem("heading:1"), makeItem("heading:2")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="block"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      // First enabled item should be focused (not active item)
      const buttons = screen.getAllByRole("menuitemradio");
      expect(document.activeElement).toBe(buttons[0]);
    });

    it("focuses first enabled if no active item", () => {
      const items = [makeItem("heading:0"), makeItem("heading:1"), makeItem("heading:2")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="block"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      // First item should be focused
      const buttons = screen.getAllByRole("menuitemradio");
      expect(document.activeElement).toBe(buttons[0]);
    });

    it("skips disabled items when finding initial focus", () => {
      const items = [
        makeDisabledItem("heading:0"),
        makeItem("heading:1"),
        makeItem("heading:2"),
      ];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="block"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      // Second item (first enabled) should be focused
      const buttons = screen.getAllByRole("menuitemradio");
      expect(document.activeElement).toBe(buttons[1]);
    });

    it("skips disabled items to focus first enabled", () => {
      const items = [
        makeDisabledItem("heading:0"),
        makeActiveItem("heading:1"),
        makeItem("heading:2"),
      ];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="block"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      // First enabled item (index 1) should be focused
      const buttons = screen.getAllByRole("menuitemradio");
      expect(document.activeElement).toBe(buttons[1]);
    });

    it("focuses first item if all are disabled", () => {
      const items = [
        makeDisabledItem("heading:0"),
        makeDisabledItem("heading:1"),
      ];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="block"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      // First item should be focused (even though disabled)
      const buttons = screen.getAllByRole("menuitemradio");
      expect(document.activeElement).toBe(buttons[0]);
    });
  });

  describe("keyboard navigation per spec Section 3.2", () => {
    it("ArrowDown moves to next enabled item", () => {
      const items = [makeItem("bold"), makeItem("italic"), makeItem("code")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      const buttons = screen.getAllByRole("menuitemcheckbox");
      expect(document.activeElement).toBe(buttons[0]);

      fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
      expect(document.activeElement).toBe(buttons[1]);

      fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
      expect(document.activeElement).toBe(buttons[2]);
    });

    it("ArrowDown skips disabled items", () => {
      const items = [makeItem("bold"), makeDisabledItem("italic"), makeItem("code")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      const buttons = screen.getAllByRole("menuitemcheckbox");
      fireEvent.keyDown(buttons[0], { key: "ArrowDown" });

      // Should skip italic (disabled) and go to code
      expect(document.activeElement).toBe(buttons[2]);
    });

    it("ArrowDown wraps to first enabled at end", () => {
      const items = [makeItem("bold"), makeItem("italic")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      const buttons = screen.getAllByRole("menuitemcheckbox");
      buttons[1].focus();

      fireEvent.keyDown(buttons[1], { key: "ArrowDown" });
      expect(document.activeElement).toBe(buttons[0]);
    });

    it("ArrowUp moves to previous enabled item", () => {
      const items = [makeItem("bold"), makeItem("italic"), makeItem("code")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      const buttons = screen.getAllByRole("menuitemcheckbox");
      buttons[2].focus();

      fireEvent.keyDown(buttons[2], { key: "ArrowUp" });
      expect(document.activeElement).toBe(buttons[1]);
    });

    it("ArrowUp wraps to last enabled at start", () => {
      const items = [makeItem("bold"), makeItem("italic")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      const buttons = screen.getAllByRole("menuitemcheckbox");

      fireEvent.keyDown(buttons[0], { key: "ArrowUp" });
      expect(document.activeElement).toBe(buttons[1]);
    });

    it("Home moves to first enabled item", () => {
      const items = [
        makeDisabledItem("bold"),
        makeItem("italic"),
        makeItem("code"),
      ];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      const buttons = screen.getAllByRole("menuitemcheckbox");
      buttons[2].focus();

      fireEvent.keyDown(buttons[2], { key: "Home" });
      expect(document.activeElement).toBe(buttons[1]); // First enabled
    });

    it("End moves to last enabled item", () => {
      const items = [
        makeItem("bold"),
        makeItem("italic"),
        makeDisabledItem("code"),
      ];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      const buttons = screen.getAllByRole("menuitemcheckbox");

      fireEvent.keyDown(buttons[0], { key: "End" });
      expect(document.activeElement).toBe(buttons[1]); // Last enabled
    });
  });

  describe("exit navigation per spec Section 3.3", () => {
    it("Escape calls onClose", () => {
      const items = [makeItem("bold")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      fireEvent.keyDown(document.activeElement!, { key: "Escape" });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("ArrowLeft calls onNavigateOut with 'left'", () => {
      const items = [makeItem("bold")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
          onNavigateOut={onNavigateOut}
        />
      );

      fireEvent.keyDown(document.activeElement!, { key: "ArrowLeft" });
      expect(onNavigateOut).toHaveBeenCalledWith("left");
    });

    it("ArrowRight calls onNavigateOut with 'right'", () => {
      const items = [makeItem("bold")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
          onNavigateOut={onNavigateOut}
        />
      );

      fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" });
      expect(onNavigateOut).toHaveBeenCalledWith("right");
    });

    it("Tab calls onTabOut with 'forward'", () => {
      const items = [makeItem("bold")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
          onTabOut={onTabOut}
        />
      );

      fireEvent.keyDown(document.activeElement!, { key: "Tab" });
      expect(onTabOut).toHaveBeenCalledWith("forward");
    });

    it("Shift+Tab calls onTabOut with 'backward'", () => {
      const items = [makeItem("bold")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
          onTabOut={onTabOut}
        />
      );

      fireEvent.keyDown(document.activeElement!, { key: "Tab", shiftKey: true });
      expect(onTabOut).toHaveBeenCalledWith("backward");
    });

    it("falls back to onClose if onNavigateOut not provided", () => {
      const items = [makeItem("bold")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      fireEvent.keyDown(document.activeElement!, { key: "ArrowLeft" });
      expect(onClose).toHaveBeenCalled();
    });

    it("falls back to onClose if onTabOut not provided", () => {
      const items = [makeItem("bold")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      fireEvent.keyDown(document.activeElement!, { key: "Tab" });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("item selection", () => {
    it("Enter selects enabled item", () => {
      const items = [makeItem("bold"), makeItem("italic")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      fireEvent.keyDown(document.activeElement!, { key: "Enter" });
      // Enter lets the click handler deal with it - simulate click
      fireEvent.click(document.activeElement!);

      expect(onSelect).toHaveBeenCalledWith("bold");
    });

    it("click selects enabled item", () => {
      const items = [makeItem("bold"), makeItem("italic")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      const buttons = screen.getAllByRole("menuitemcheckbox");
      fireEvent.click(buttons[1]);

      expect(onSelect).toHaveBeenCalledWith("italic");
    });

    it("click on disabled item does not select", () => {
      const items = [makeItem("bold"), makeDisabledItem("italic")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      const buttons = screen.getAllByRole("menuitemcheckbox");
      fireEvent.click(buttons[1]);

      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe("visual states", () => {
    it("active item has active class", () => {
      const items = [makeItem("bold"), makeActiveItem("italic")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      const buttons = screen.getAllByRole("menuitemcheckbox");
      expect(buttons[0]).not.toHaveClass("active");
      expect(buttons[1]).toHaveClass("active");
    });

    it("disabled item has disabled class", () => {
      const items = [makeItem("bold"), makeDisabledItem("italic")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      const buttons = screen.getAllByRole("menuitemcheckbox");
      expect(buttons[0]).not.toHaveClass("disabled");
      expect(buttons[1]).toHaveClass("disabled");
    });
  });

  describe("ref forwarding", () => {
    it("forwards function ref to the container div", () => {
      const items = [makeItem("bold")];
      const refCallback = vi.fn();

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
          ref={refCallback}
        />
      );

      // Function ref should be called with the DOM node
      expect(refCallback).toHaveBeenCalledWith(expect.any(HTMLElement));
    });

    it("forwards object ref to the container div", () => {
      const items = [makeItem("bold")];
      const refObj = { current: null as HTMLDivElement | null };

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
          ref={refObj}
        />
      );

      expect(refObj.current).not.toBeNull();
      expect(refObj.current).toBeInstanceOf(HTMLElement);
    });
  });

  describe("ArrowRight falls back to onClose when onNavigateOut not provided", () => {
    it("calls onClose on ArrowRight when onNavigateOut is absent", () => {
      const items = [makeItem("bold")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
          // onNavigateOut intentionally omitted
        />
      );

      fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" });
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("findNextEnabledButtonIndex edge cases", () => {
    it("returns currentButtonIndex unchanged when enabledButtonIndices is empty (all disabled)", () => {
      // All items disabled → enabledButtonIndices = []
      // ArrowDown will call findNextEnabledButtonIndex, but guard prevents focus call
      const items = [makeDisabledItem("bold"), makeDisabledItem("italic")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      const buttons = screen.getAllByRole("menuitemcheckbox");
      // Focus the first disabled button
      buttons[0].focus();

      // ArrowDown with empty enabledButtonIndices — guard `if (enabledButtonIndices.length > 0)`
      // means findNextEnabledButtonIndex is NOT called, but we verify no crash
      fireEvent.keyDown(buttons[0], { key: "ArrowDown" });
      // Focus should not have moved (guard prevents the call)
      expect(document.activeElement).toBe(buttons[0]);
    });

    it("returns first enabled index when current button is disabled", () => {
      // Items: disabled, enabled, enabled — focus the disabled one and press ArrowDown
      // activeButtonIndex will be 0 (disabled), currentEnabledPos will be -1
      // so findNextEnabledButtonIndex returns enabledButtonIndices[0] = 1
      const items = [makeDisabledItem("bold"), makeItem("italic"), makeItem("code")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      const buttons = screen.getAllByRole("menuitemcheckbox");
      // Manually focus the disabled button (not focused by default since first enabled is index 1)
      buttons[0].focus();

      fireEvent.keyDown(buttons[0], { key: "ArrowDown" });
      // Should jump to first enabled (index 1)
      expect(document.activeElement).toBe(buttons[1]);
    });
  });

  describe("Enter/Space key selection in dropdown (lines 194-209)", () => {
    it("Enter on focused enabled item calls onSelect with action", () => {
      const items = [makeItem("bold"), makeItem("italic"), makeItem("code")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      // First item is focused by default
      const buttons = screen.getAllByRole("menuitemcheckbox");
      expect(document.activeElement).toBe(buttons[0]);

      // Press Enter — should call onSelect("bold")
      fireEvent.keyDown(document.activeElement!, { key: "Enter" });
      expect(onSelect).toHaveBeenCalledWith("bold");
    });

    it("Space on focused enabled item calls onSelect with action", () => {
      const items = [makeItem("bold"), makeItem("italic")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      fireEvent.keyDown(document.activeElement!, { key: " " });
      expect(onSelect).toHaveBeenCalledWith("bold");
    });

    it("Enter on disabled item does NOT call onSelect (line 201)", () => {
      const items = [makeDisabledItem("bold"), makeItem("italic")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      // First enabled item (italic) is focused by default
      // Manually focus the disabled one
      const buttons = screen.getAllByRole("menuitemcheckbox");
      buttons[0].focus();

      fireEvent.keyDown(buttons[0], { key: "Enter" });
      // onSelect should NOT be called for disabled item
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("Enter with no active element (activeButtonIndex=-1) does not select", () => {
      const items = [makeItem("bold")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      // Blur all buttons so activeElement is not inside the dropdown
      (document.activeElement as HTMLElement)?.blur();

      // Press Enter on the menu container
      const menu = screen.getByRole("menu");
      fireEvent.keyDown(menu, { key: "Enter" });

      // Should not call onSelect since activeButtonIndex is -1
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("Enter on second item iterates buttonIdx past first (covers line 206)", () => {
      const items = [makeItem("bold"), makeItem("italic"), makeItem("code")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      // Navigate down to second item
      fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
      const buttons = screen.getAllByRole("menuitemcheckbox");
      expect(document.activeElement).toBe(buttons[1]);

      // Press Enter on second item — loop must iterate past first (buttonIdx++)
      fireEvent.keyDown(buttons[1], { key: "Enter" });
      expect(onSelect).toHaveBeenCalledWith("italic");
    });

    it("Enter skips separator items when finding action (line 198)", () => {
      const items = [makeSeparator("sep1"), makeItem("bold")];

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={items}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      // First button (bold at buttonIndex 0) is focused
      fireEvent.keyDown(document.activeElement!, { key: "Enter" });
      expect(onSelect).toHaveBeenCalledWith("bold");
    });
  });

  describe("notImplemented title (line 253 cond-expr)", () => {
    it("shows 'Not available yet' suffix when item is notImplemented", () => {
      const item = makeItem("bold", "Bold");
      item.state.notImplemented = true;

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={[item]}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      const button = screen.getByRole("menuitemcheckbox");
      expect(button).toHaveAttribute("title", "Bold — Not available yet");
    });

    it("shows just the label when item is NOT notImplemented", () => {
      const item = makeItem("bold", "Bold");
      item.state.notImplemented = false;

      render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={[item]}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      const button = screen.getByRole("menuitemcheckbox");
      expect(button).toHaveAttribute("title", "Bold");
    });
  });

  describe("re-render does not steal focus (isInitialMount guard)", () => {
    it("does not re-focus on re-render when items change", () => {
      const initialItems = [makeItem("bold"), makeItem("italic")];

      const { rerender } = render(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={initialItems}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      const buttons = screen.getAllByRole("menuitemcheckbox");
      // Manually focus second button
      buttons[1].focus();
      expect(document.activeElement).toBe(buttons[1]);

      // Re-render with same items — should NOT re-focus first button
      rerender(
        <GroupDropdown
          anchorRect={mockAnchorRect}
          items={initialItems}
          groupId="inline"
          onSelect={onSelect}
          onClose={onClose}
        />
      );

      // Focus should remain on the button the user moved to
      expect(document.activeElement).toBe(buttons[1]);
    });
  });
});
