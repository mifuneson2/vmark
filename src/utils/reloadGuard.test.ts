/**
 * Unit tests for reload guard logic
 */
import { describe, it, expect, vi } from "vitest";
import {
  shouldBlockReload,
  getReloadWarningMessage,
  isReloadShortcut,
  isTerminalFocused,
  isCtrlR,
  type ReloadGuardInput,
} from "./reloadGuard";

describe("reloadGuard", () => {
  describe("shouldBlockReload", () => {
    it("blocks reload when there are dirty documents", () => {
      const input: ReloadGuardInput = {
        dirtyTabIds: ["tab-1", "tab-2"],
      };
      const result = shouldBlockReload(input);
      expect(result.shouldBlock).toBe(true);
      if (result.shouldBlock) {
        expect(result.reason).toBe("unsaved_changes");
        expect(result.count).toBe(2);
      }
    });

    it("allows reload when no dirty documents", () => {
      const input: ReloadGuardInput = {
        dirtyTabIds: [],
      };
      const result = shouldBlockReload(input);
      expect(result.shouldBlock).toBe(false);
    });

    it("blocks reload for single dirty document", () => {
      const input: ReloadGuardInput = {
        dirtyTabIds: ["tab-1"],
      };
      const result = shouldBlockReload(input);
      expect(result.shouldBlock).toBe(true);
      if (result.shouldBlock) {
        expect(result.count).toBe(1);
      }
    });
  });

  describe("getReloadWarningMessage", () => {
    it("returns singular message for one document", () => {
      const message = getReloadWarningMessage(1);
      expect(message).toBe("You have unsaved changes. Are you sure you want to leave?");
    });

    it("returns plural message for multiple documents", () => {
      const message = getReloadWarningMessage(3);
      expect(message).toBe("You have 3 documents with unsaved changes. Are you sure you want to leave?");
    });

    it("returns plural message for two documents", () => {
      const message = getReloadWarningMessage(2);
      expect(message).toContain("2 documents");
    });
  });

  describe("isReloadShortcut", () => {
    it("does not treat F5 as reload (used for Source Peek)", () => {
      expect(isReloadShortcut({ key: "F5", metaKey: false, ctrlKey: false })).toBe(false);
    });

    it("detects Cmd+R (macOS)", () => {
      expect(isReloadShortcut({ key: "r", metaKey: true, ctrlKey: false })).toBe(true);
    });

    it("detects Ctrl+R (Windows/Linux)", () => {
      expect(isReloadShortcut({ key: "r", metaKey: false, ctrlKey: true })).toBe(true);
    });

    it("detects Cmd+Shift+R (uppercase R)", () => {
      expect(isReloadShortcut({ key: "R", metaKey: true, ctrlKey: false })).toBe(true);
    });

    it("detects Ctrl+Shift+R (uppercase R)", () => {
      expect(isReloadShortcut({ key: "R", metaKey: false, ctrlKey: true })).toBe(true);
    });

    it("ignores plain R key", () => {
      expect(isReloadShortcut({ key: "r", metaKey: false, ctrlKey: false })).toBe(false);
    });

    it("ignores unrelated shortcuts", () => {
      expect(isReloadShortcut({ key: "s", metaKey: true, ctrlKey: false })).toBe(false);
      expect(isReloadShortcut({ key: "F4", metaKey: false, ctrlKey: false })).toBe(false);
    });
  });

  describe("isTerminalFocused", () => {
    it("returns true when activeElement is inside .terminal-container", () => {
      const container = document.createElement("div");
      container.className = "terminal-container";
      const textarea = document.createElement("textarea");
      container.appendChild(textarea);
      document.body.appendChild(container);
      textarea.focus();

      expect(isTerminalFocused()).toBe(true);

      document.body.removeChild(container);
    });

    it("returns false when activeElement is outside .terminal-container", () => {
      const editor = document.createElement("div");
      editor.className = "editor";
      const input = document.createElement("input");
      editor.appendChild(input);
      document.body.appendChild(editor);
      input.focus();

      expect(isTerminalFocused()).toBe(false);

      document.body.removeChild(editor);
    });

    it("returns false when activeElement is null (body focused)", () => {
      // When nothing specific is focused, activeElement is <body>
      (document.activeElement as HTMLElement)?.blur?.();
      expect(isTerminalFocused()).toBe(false);
    });

    it("returns false when document.activeElement is null", () => {
      // Simulate activeElement being null (e.g., no focusable element in DOM)
      const spy = vi.spyOn(document, "activeElement", "get").mockReturnValue(null);
      expect(isTerminalFocused()).toBe(false);
      spy.mockRestore();
    });
  });

  describe("isCtrlR", () => {
    it("returns true for Ctrl+R (shell reverse-i-search)", () => {
      expect(isCtrlR({ key: "r", ctrlKey: true, metaKey: false })).toBe(true);
    });

    it("returns true for Ctrl+R with uppercase R", () => {
      expect(isCtrlR({ key: "R", ctrlKey: true, metaKey: false })).toBe(true);
    });

    it("returns false for Cmd+R (macOS reload — must always be blocked)", () => {
      expect(isCtrlR({ key: "r", ctrlKey: false, metaKey: true })).toBe(false);
    });

    it("returns false for Cmd+Ctrl+R (both modifiers)", () => {
      expect(isCtrlR({ key: "r", ctrlKey: true, metaKey: true })).toBe(false);
    });

    it("returns false for plain R", () => {
      expect(isCtrlR({ key: "r", ctrlKey: false, metaKey: false })).toBe(false);
    });
  });

  describe("reload guard integration: terminal focus + shortcut interaction", () => {
    let container: HTMLDivElement;
    let textarea: HTMLTextAreaElement;

    beforeEach(() => {
      container = document.createElement("div");
      container.className = "terminal-container";
      textarea = document.createElement("textarea");
      container.appendChild(textarea);
      document.body.appendChild(container);
      textarea.focus();
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it("Ctrl+R should pass through when terminal is focused", () => {
      const e = { key: "r", ctrlKey: true, metaKey: false };
      // Terminal is focused AND it's Ctrl+R — should NOT be blocked
      const shouldPassThrough = isReloadShortcut(e) && isTerminalFocused() && isCtrlR(e);
      expect(shouldPassThrough).toBe(true);
    });

    it("Cmd+R should still be blocked when terminal is focused", () => {
      const e = { key: "r", ctrlKey: false, metaKey: true };
      // Terminal is focused BUT it's Cmd+R — should still be blocked
      const shouldPassThrough = isReloadShortcut(e) && isTerminalFocused() && isCtrlR(e);
      expect(shouldPassThrough).toBe(false);
    });
  });
});
