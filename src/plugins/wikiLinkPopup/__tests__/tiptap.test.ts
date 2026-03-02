/**
 * Wiki Link Popup Extension (tiptap.ts) Tests
 *
 * Tests for the ProseMirror plugin that detects hover/mouseout on wiki link
 * nodes and manages the WikiLinkPopupPluginView lifecycle.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock stores and utilities before importing
const mockClosePopup = vi.fn();
const mockOpenPopup = vi.fn();

let storeState = {
  isOpen: false,
  target: "",
  nodePos: null as number | null,
  anchorRect: null as { top: number; left: number; bottom: number; right: number } | null,
  closePopup: mockClosePopup,
  openPopup: mockOpenPopup,
  updateTarget: vi.fn(),
};

vi.mock("@/stores/wikiLinkPopupStore", () => ({
  useWikiLinkPopupStore: {
    getState: () => storeState,
    subscribe: () => () => {},
  },
}));

vi.mock("@/utils/debug", () => ({
  wikiLinkPopupWarn: vi.fn(),
}));

vi.mock("@/utils/imeGuard", () => ({
  isImeKeyEvent: () => false,
}));

vi.mock("@/utils/popupComponents", () => ({
  popupIcons: { open: "o", copy: "c", save: "s", delete: "d", close: "x", folder: "f" },
  buildPopupIconButton: vi.fn(({ onClick, title }) => {
    const btn = document.createElement("button");
    btn.title = title;
    btn.addEventListener("click", onClick);
    return btn;
  }),
  buildPopupInput: vi.fn(({ placeholder, className, onInput, onKeydown }) => {
    const input = document.createElement("input");
    input.placeholder = placeholder;
    input.className = className;
    if (onInput) input.addEventListener("input", (e) => onInput((e.target as HTMLInputElement).value));
    if (onKeydown) input.addEventListener("keydown", onKeydown);
    return input;
  }),
  handlePopupTabNavigation: vi.fn(),
}));

vi.mock("@/plugins/sourcePopup", () => ({
  getPopupHostForDom: (dom: HTMLElement) => dom.closest(".editor-container"),
  toHostCoordsForDom: (_host: HTMLElement, pos: { top: number; left: number }) => pos,
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@tauri-apps/api/webviewWindow", () => ({
  getCurrentWebviewWindow: vi.fn(() => ({
    emit: vi.fn(() => Promise.resolve()),
  })),
}));

vi.mock("@/stores/workspaceStore", () => ({
  useWorkspaceStore: {
    getState: () => ({ rootPath: "/workspace" }),
  },
}));

vi.mock("../wiki-link-popup.css", () => ({}));

import { wikiLinkPopupExtension } from "../tiptap";

describe("wikiLinkPopupExtension", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeState = {
      isOpen: false,
      target: "",
      nodePos: null,
      anchorRect: null,
      closePopup: mockClosePopup,
      openPopup: mockOpenPopup,
      updateTarget: vi.fn(),
    };
  });

  describe("extension creation", () => {
    it("has name 'wikiLinkPopup'", () => {
      expect(wikiLinkPopupExtension.name).toBe("wikiLinkPopup");
    });

    it("has addProseMirrorPlugins method", () => {
      // The extension has the method that creates ProseMirror plugins
      expect(typeof wikiLinkPopupExtension.config.addProseMirrorPlugins).toBe("function");
    });
  });
});
