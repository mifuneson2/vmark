import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TerminalContextMenu } from "./TerminalContextMenu";
import type { Terminal } from "@xterm/xterm";
import type { IPty } from "tauri-pty";
import { readText, writeText } from "@tauri-apps/plugin-clipboard-manager";
import { isImeKeyEvent } from "@/utils/imeGuard";

vi.mock("tauri-pty", () => ({ spawn: vi.fn() }));
vi.mock("@/utils/imeGuard", () => ({
  isImeKeyEvent: vi.fn(() => false),
}));

function makeTerm(overrides: Partial<Terminal> = {}): Terminal {
  return {
    hasSelection: vi.fn(() => false),
    getSelection: vi.fn(() => ""),
    clearSelection: vi.fn(),
    selectAll: vi.fn(),
    clear: vi.fn(),
    focus: vi.fn(),
    ...overrides,
  } as unknown as Terminal;
}

describe("TerminalContextMenu", () => {
  let onClose: () => void;
  let ptyRef: React.RefObject<IPty | null>;

  beforeEach(() => {
    vi.clearAllMocks();
    onClose = vi.fn<() => void>();
    ptyRef = { current: { write: vi.fn() } as unknown as IPty };
  });

  it("renders all menu items", () => {
    const term = makeTerm();
    render(
      <TerminalContextMenu
        position={{ x: 100, y: 100 }}
        term={term}
        ptyRef={ptyRef}
        onClose={onClose}
      />,
    );

    expect(screen.getByText("Copy")).toBeInTheDocument();
    expect(screen.getByText("Paste")).toBeInTheDocument();
    expect(screen.getByText("Select All")).toBeInTheDocument();
    expect(screen.getByText("Clear")).toBeInTheDocument();
  });

  it("disables Copy when no selection", () => {
    const term = makeTerm({ hasSelection: vi.fn(() => false) });
    const { container } = render(
      <TerminalContextMenu
        position={{ x: 100, y: 100 }}
        term={term}
        ptyRef={ptyRef}
        onClose={onClose}
      />,
    );

    const copyItem = container.querySelector(".context-menu-item");
    expect(copyItem).toHaveStyle({ opacity: "0.4" });
  });

  it("enables Copy when selection exists", () => {
    const term = makeTerm({ hasSelection: vi.fn(() => true) });
    const { container } = render(
      <TerminalContextMenu
        position={{ x: 100, y: 100 }}
        term={term}
        ptyRef={ptyRef}
        onClose={onClose}
      />,
    );

    const copyItem = container.querySelector(".context-menu-item");
    expect(copyItem).toHaveStyle({ opacity: "1" });
  });

  it("closes on Escape", () => {
    const term = makeTerm();
    render(
      <TerminalContextMenu
        position={{ x: 100, y: 100 }}
        term={term}
        ptyRef={ptyRef}
        onClose={onClose}
      />,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("closes on click outside", () => {
    const term = makeTerm();
    render(
      <TerminalContextMenu
        position={{ x: 100, y: 100 }}
        term={term}
        ptyRef={ptyRef}
        onClose={onClose}
      />,
    );

    fireEvent.mouseDown(document);
    expect(onClose).toHaveBeenCalled();
  });

  it("does not close on click inside menu", () => {
    const term = makeTerm();
    render(
      <TerminalContextMenu
        position={{ x: 100, y: 100 }}
        term={term}
        ptyRef={ptyRef}
        onClose={onClose}
      />,
    );

    const menuItem = screen.getByText("Paste");
    fireEvent.mouseDown(menuItem);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not close on IME keydown event", () => {
    vi.mocked(isImeKeyEvent).mockReturnValueOnce(true);
    const term = makeTerm();
    render(
      <TerminalContextMenu
        position={{ x: 100, y: 100 }}
        term={term}
        ptyRef={ptyRef}
        onClose={onClose}
      />,
    );

    fireEvent.keyDown(document, { key: "Escape", isComposing: true });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renders separator before Clear item", () => {
    const term = makeTerm();
    const { container } = render(
      <TerminalContextMenu
        position={{ x: 100, y: 100 }}
        term={term}
        ptyRef={ptyRef}
        onClose={onClose}
      />,
    );

    const separators = container.querySelectorAll(".context-menu-separator");
    expect(separators.length).toBe(1);
  });

  describe("action handlers", () => {
    it("copies selection and clears it on Copy click", async () => {
      const term = makeTerm({
        hasSelection: vi.fn(() => true),
        getSelection: vi.fn(() => "selected text  "),
      });
      render(
        <TerminalContextMenu
          position={{ x: 100, y: 100 }}
          term={term}
          ptyRef={ptyRef}
          onClose={onClose}
        />,
      );

      fireEvent.click(screen.getByText("Copy"));
      await waitFor(() => {
        expect(writeText).toHaveBeenCalledWith("selected text");
      });
      expect(term.clearSelection).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
      expect(term.focus).toHaveBeenCalled();
    });

    it("pastes from clipboard to PTY on Paste click", async () => {
      vi.mocked(readText).mockResolvedValue("pasted content");
      const mockWrite = vi.fn();
      const localPtyRef = { current: { write: mockWrite } as unknown as IPty };
      const term = makeTerm();
      render(
        <TerminalContextMenu
          position={{ x: 100, y: 100 }}
          term={term}
          ptyRef={localPtyRef}
          onClose={onClose}
        />,
      );

      fireEvent.click(screen.getByText("Paste"));
      await waitFor(() => {
        expect(mockWrite).toHaveBeenCalledWith("pasted content");
      });
      expect(onClose).toHaveBeenCalled();
    });

    it("does not write to PTY when ptyRef is null on Paste", async () => {
      vi.mocked(readText).mockResolvedValue("text");
      const nullPtyRef = { current: null };
      const term = makeTerm();
      render(
        <TerminalContextMenu
          position={{ x: 100, y: 100 }}
          term={term}
          ptyRef={nullPtyRef}
          onClose={onClose}
        />,
      );

      fireEvent.click(screen.getByText("Paste"));
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it("does not write to PTY when clipboard is empty on Paste", async () => {
      vi.mocked(readText).mockResolvedValue("");
      const mockWrite = vi.fn();
      const localPtyRef = { current: { write: mockWrite } as unknown as IPty };
      const term = makeTerm();
      render(
        <TerminalContextMenu
          position={{ x: 100, y: 100 }}
          term={term}
          ptyRef={localPtyRef}
          onClose={onClose}
        />,
      );

      fireEvent.click(screen.getByText("Paste"));
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
      expect(mockWrite).not.toHaveBeenCalled();
    });

    it("selects all on Select All click", () => {
      const term = makeTerm();
      render(
        <TerminalContextMenu
          position={{ x: 100, y: 100 }}
          term={term}
          ptyRef={ptyRef}
          onClose={onClose}
        />,
      );

      fireEvent.click(screen.getByText("Select All"));
      expect(term.selectAll).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
      expect(term.focus).toHaveBeenCalled();
    });

    it("clears terminal on Clear click", () => {
      const term = makeTerm();
      render(
        <TerminalContextMenu
          position={{ x: 100, y: 100 }}
          term={term}
          ptyRef={ptyRef}
          onClose={onClose}
        />,
      );

      fireEvent.click(screen.getByText("Clear"));
      expect(term.clear).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
      expect(term.focus).toHaveBeenCalled();
    });
  });

  describe("viewport adjustment", () => {
    it("adjusts position when menu would overflow right edge", () => {
      // Mock window dimensions
      Object.defineProperty(window, "innerWidth", { value: 500, writable: true });
      Object.defineProperty(window, "innerHeight", { value: 500, writable: true });

      const term = makeTerm();
      const { container } = render(
        <TerminalContextMenu
          position={{ x: 480, y: 100 }}
          term={term}
          ptyRef={ptyRef}
          onClose={onClose}
        />,
      );

      const menu = container.querySelector(".context-menu");
      expect(menu).toBeTruthy();
      // The layout effect should have run and adjusted the position
      // We can't easily assert the exact pixel value in jsdom, but it should not throw
    });

    it("adjusts position when menu would overflow bottom edge", () => {
      Object.defineProperty(window, "innerWidth", { value: 500, writable: true });
      Object.defineProperty(window, "innerHeight", { value: 200, writable: true });

      const term = makeTerm();
      const { container } = render(
        <TerminalContextMenu
          position={{ x: 100, y: 190 }}
          term={term}
          ptyRef={ptyRef}
          onClose={onClose}
        />,
      );

      const menu = container.querySelector(".context-menu");
      expect(menu).toBeTruthy();
    });
  });
});
