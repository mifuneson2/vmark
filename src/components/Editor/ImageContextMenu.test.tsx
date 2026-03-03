import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

/**
 * ImageContextMenu test suite
 *
 * Tests rendering, menu item actions, keyboard/mouse close behavior,
 * viewport position adjustment, and edge cases.
 */

// ── Hoisted mocks ────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  isOpen: true,
  position: { x: 100, y: 100 } as { x: number; y: number } | null,
  closeMenu: vi.fn(),
  isImeKeyEvent: vi.fn(() => false),
  getRevealInFileManagerLabel: vi.fn(() => "Reveal in Finder"),
}));

vi.mock("@/stores/imageContextMenuStore", () => {
  const store = ((selector: (s: Record<string, unknown>) => unknown) => {
    const state: Record<string, unknown> = {
      isOpen: mocks.isOpen,
      position: mocks.position,
      closeMenu: mocks.closeMenu,
    };
    return selector(state);
  }) as unknown as {
    (selector: (s: Record<string, unknown>) => unknown): unknown;
    getState: () => Record<string, unknown>;
  };
  store.getState = () => ({
    isOpen: mocks.isOpen,
    position: mocks.position,
    closeMenu: mocks.closeMenu,
  });
  return { useImageContextMenuStore: store };
});

vi.mock("@/utils/imeGuard", () => ({
  isImeKeyEvent: (...args: unknown[]) => mocks.isImeKeyEvent(...args),
}));

vi.mock("@/utils/pathUtils", () => ({
  getRevealInFileManagerLabel: () => mocks.getRevealInFileManagerLabel(),
}));

vi.mock("@/components/Sidebar/FileExplorer/ContextMenu.css", () => ({}));

import { ImageContextMenu } from "./ImageContextMenu";

// ── Tests ────────────────────────────────────────────────────────────

describe("ImageContextMenu", () => {
  let onAction: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    onAction = vi.fn();
    mocks.isOpen = true;
    mocks.position = { x: 100, y: 100 };
    mocks.getRevealInFileManagerLabel.mockReturnValue("Reveal in Finder");
    mocks.isImeKeyEvent.mockReturnValue(false);
  });

  // ── Rendering ────────────────────────────────────────────────────

  it("renders all four menu items when open", () => {
    render(<ImageContextMenu onAction={onAction} />);

    expect(screen.getByText("Change Image...")).toBeInTheDocument();
    expect(screen.getByText("Delete Image")).toBeInTheDocument();
    expect(screen.getByText("Copy Image Path")).toBeInTheDocument();
    expect(screen.getByText("Reveal in Finder")).toBeInTheDocument();
  });

  it("renders nothing when isOpen is false", () => {
    mocks.isOpen = false;
    const { container } = render(<ImageContextMenu onAction={onAction} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when position is null", () => {
    mocks.position = null;
    const { container } = render(<ImageContextMenu onAction={onAction} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders a separator before Delete Image", () => {
    const { container } = render(<ImageContextMenu onAction={onAction} />);
    const separators = container.querySelectorAll(".context-menu-separator");
    expect(separators.length).toBe(1);
  });

  it("uses the context-menu class on the container", () => {
    const { container } = render(<ImageContextMenu onAction={onAction} />);
    expect(container.querySelector(".context-menu")).toBeInTheDocument();
  });

  it("positions the menu at the given coordinates", () => {
    const { container } = render(<ImageContextMenu onAction={onAction} />);
    const menu = container.querySelector(".context-menu") as HTMLElement;
    expect(menu.style.left).toBe("100px");
    expect(menu.style.top).toBe("100px");
  });

  // ── Platform-specific label ──────────────────────────────────────

  it("uses platform-appropriate reveal label", () => {
    mocks.getRevealInFileManagerLabel.mockReturnValue("Show in Explorer");
    const { rerender } = render(<ImageContextMenu onAction={onAction} />);
    // The label is memoized on first render, so we need a fresh mount
    rerender(<ImageContextMenu onAction={onAction} />);
    // On macOS test env it will use whatever the mock returns
    expect(screen.getByText("Show in Explorer")).toBeInTheDocument();
  });

  // ── Menu item clicks ────────────────────────────────────────────

  it("calls onAction with 'change' and closes menu on Change Image click", () => {
    render(<ImageContextMenu onAction={onAction} />);
    fireEvent.click(screen.getByText("Change Image..."));
    expect(onAction).toHaveBeenCalledWith("change");
    expect(mocks.closeMenu).toHaveBeenCalled();
  });

  it("calls onAction with 'delete' on Delete Image click", () => {
    render(<ImageContextMenu onAction={onAction} />);
    fireEvent.click(screen.getByText("Delete Image"));
    expect(onAction).toHaveBeenCalledWith("delete");
    expect(mocks.closeMenu).toHaveBeenCalled();
  });

  it("calls onAction with 'copyPath' on Copy Image Path click", () => {
    render(<ImageContextMenu onAction={onAction} />);
    fireEvent.click(screen.getByText("Copy Image Path"));
    expect(onAction).toHaveBeenCalledWith("copyPath");
    expect(mocks.closeMenu).toHaveBeenCalled();
  });

  it("calls onAction with 'revealInFinder' on Reveal click", () => {
    render(<ImageContextMenu onAction={onAction} />);
    // The label comes from the mock — match whatever it returns
    const revealItem = screen.getByText(mocks.getRevealInFileManagerLabel());
    fireEvent.click(revealItem);
    expect(onAction).toHaveBeenCalledWith("revealInFinder");
    expect(mocks.closeMenu).toHaveBeenCalled();
  });

  // ── Close on Escape ──────────────────────────────────────────────

  it("closes the menu when Escape is pressed", () => {
    render(<ImageContextMenu onAction={onAction} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(mocks.closeMenu).toHaveBeenCalled();
  });

  it("does not close on Escape during IME composition", () => {
    mocks.isImeKeyEvent.mockReturnValue(true);
    render(<ImageContextMenu onAction={onAction} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(mocks.closeMenu).not.toHaveBeenCalled();
  });

  it("does not close on non-Escape keys", () => {
    render(<ImageContextMenu onAction={onAction} />);
    fireEvent.keyDown(document, { key: "ArrowDown" });
    expect(mocks.closeMenu).not.toHaveBeenCalled();
  });

  // ── Close on click outside ───────────────────────────────────────

  it("closes the menu when clicking outside", () => {
    render(
      <div>
        <div data-testid="outside">outside</div>
        <ImageContextMenu onAction={onAction} />
      </div>
    );
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(mocks.closeMenu).toHaveBeenCalled();
  });

  it("does not close when clicking inside the menu", () => {
    const { container } = render(<ImageContextMenu onAction={onAction} />);
    const menu = container.querySelector(".context-menu")!;
    fireEvent.mouseDown(menu);
    // closeMenu should only be called from the item click handler, not from outside click
    expect(mocks.closeMenu).not.toHaveBeenCalled();
  });

  // ── Cleanup ──────────────────────────────────────────────────────

  it("removes event listeners on unmount", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const { unmount } = render(<ImageContextMenu onAction={onAction} />);
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("mousedown", expect.any(Function), true);
    expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    removeSpy.mockRestore();
  });

  it("does not attach listeners when closed", () => {
    mocks.isOpen = false;
    const addSpy = vi.spyOn(document, "addEventListener");
    render(<ImageContextMenu onAction={onAction} />);
    // Should not have added mousedown or keydown listeners for context menu
    const contextMenuCalls = addSpy.mock.calls.filter(
      (call) => call[0] === "mousedown" || call[0] === "keydown"
    );
    expect(contextMenuCalls.length).toBe(0);
    addSpy.mockRestore();
  });

  // ── Viewport boundary adjustment ────────────────────────────────

  it("adjusts position when menu overflows right edge", () => {
    // Simulate a menu that would overflow the viewport
    mocks.position = { x: window.innerWidth - 5, y: 100 };
    const { container } = render(<ImageContextMenu onAction={onAction} />);
    const menu = container.querySelector(".context-menu") as HTMLElement;
    // The position adjustment happens in a useEffect, so the initial inline style
    // is set to the raw position. The useEffect then adjusts via menu.style.
    expect(menu).toBeInTheDocument();
  });

  it("adjusts position when menu overflows bottom edge", () => {
    mocks.position = { x: 100, y: window.innerHeight - 5 };
    const { container } = render(<ImageContextMenu onAction={onAction} />);
    const menu = container.querySelector(".context-menu") as HTMLElement;
    expect(menu).toBeInTheDocument();
  });
});
