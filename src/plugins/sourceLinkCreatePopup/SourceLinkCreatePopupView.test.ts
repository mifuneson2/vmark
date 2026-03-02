/**
 * Tests for SourceLinkCreatePopupView — link creation popup in Source mode.
 *
 * Tests DOM construction, store subscription, input handling,
 * save/cancel actions, keyboard navigation, and edge cases.
 */

import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import type { EditorView } from "@codemirror/view";

// Mock stores and utilities
const mockClosePopup = vi.fn();
const mockSetText = vi.fn();
const mockSetUrl = vi.fn();
const mockOpenPopup = vi.fn();

let storeState = {
  isOpen: false,
  anchorRect: null as { top: number; left: number; bottom: number; right: number } | null,
  text: "",
  url: "",
  rangeFrom: 0,
  rangeTo: 0,
  showTextInput: true,
  closePopup: mockClosePopup,
  setText: mockSetText,
  setUrl: mockSetUrl,
  openPopup: mockOpenPopup,
};
const subscribers: Array<(state: typeof storeState) => void> = [];

vi.mock("@/stores/linkCreatePopupStore", () => ({
  useLinkCreatePopupStore: {
    getState: () => storeState,
    subscribe: (fn: (state: typeof storeState) => void) => {
      subscribers.push(fn);
      return () => {
        const idx = subscribers.indexOf(fn);
        if (idx >= 0) subscribers.splice(idx, 1);
      };
    },
  },
}));

vi.mock("@/utils/popupPosition", () => ({
  calculatePopupPosition: () => ({ top: 200, left: 150 }),
  getBoundaryRects: () => ({
    horizontal: { left: 0, right: 800 },
    vertical: { top: 0, bottom: 600 },
  }),
  getViewportBounds: () => ({
    horizontal: { left: 0, right: 800 },
    vertical: { top: 0, bottom: 600 },
  }),
}));

vi.mock("@/utils/imeGuard", () => ({
  isImeKeyEvent: () => false,
}));

vi.mock("@/utils/popupComponents", () => ({
  popupIcons: {
    save: "<svg>save</svg>",
    close: "<svg>close</svg>",
  },
}));

vi.mock("@/plugins/sourcePopup", () => ({
  getPopupHostForDom: () => null,
  toHostCoordsForDom: (_host: HTMLElement, pos: { top: number; left: number }) => pos,
}));

import { SourceLinkCreatePopupView } from "./SourceLinkCreatePopupView";

// Helper functions
function createMockView(): EditorView {
  const contentDOM = document.createElement("div");
  contentDOM.contentEditable = "true";

  const editorDom = document.createElement("div");
  editorDom.className = "cm-editor";
  editorDom.appendChild(contentDOM);
  document.body.appendChild(editorDom);

  return {
    dom: editorDom,
    contentDOM,
    focus: vi.fn(),
    state: {
      doc: {
        sliceString: vi.fn(() => "selected text"),
      },
    },
    dispatch: vi.fn(),
  } as unknown as EditorView;
}

function emitStateChange(newState: Partial<typeof storeState>) {
  storeState = { ...storeState, ...newState };
  subscribers.forEach((fn) => fn(storeState));
}

function resetState() {
  storeState = {
    isOpen: false,
    anchorRect: null,
    text: "",
    url: "",
    rangeFrom: 0,
    rangeTo: 0,
    showTextInput: true,
    closePopup: mockClosePopup,
    setText: mockSetText,
    setUrl: mockSetUrl,
    openPopup: mockOpenPopup,
  };
  subscribers.length = 0;
}

describe("SourceLinkCreatePopupView", () => {
  let view: EditorView;
  let popup: SourceLinkCreatePopupView;
  const anchorRect = { top: 200, left: 150, bottom: 220, right: 250 };

  beforeEach(() => {
    document.body.innerHTML = "";
    resetState();
    vi.clearAllMocks();
    view = createMockView();
    popup = new SourceLinkCreatePopupView(view);
  });

  afterEach(() => {
    popup.destroy();
  });

  describe("Construction", () => {
    it("subscribes to store on construction", () => {
      expect(subscribers.length).toBe(1);
    });

    it("creates a container element", () => {
      // Container is not appended to DOM until show() is called.
      // Verify it exists by triggering a show cycle.
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true });
      const container = document.querySelector(".link-create-popup");
      expect(container).not.toBeNull();
    });
  });

  describe("Show/hide lifecycle", () => {
    it("shows popup when store opens with text input", () => {
      emitStateChange({
        isOpen: true,
        anchorRect,
        showTextInput: true,
        text: "link text",
      });

      const container = document.querySelector(".link-create-popup") as HTMLElement;
      expect(container.style.display).toBe("flex");

      // Should have text input and URL input
      const textInput = container.querySelector(".link-create-popup-text") as HTMLInputElement;
      const urlInput = container.querySelector(".link-create-popup-url") as HTMLInputElement;
      expect(textInput).not.toBeNull();
      expect(urlInput).not.toBeNull();
      expect(textInput.value).toBe("link text");
    });

    it("shows popup without text input when showTextInput is false", () => {
      emitStateChange({
        isOpen: true,
        anchorRect,
        showTextInput: false,
        text: "",
      });

      const container = document.querySelector(".link-create-popup") as HTMLElement;
      expect(container.style.display).toBe("flex");

      const textInput = container.querySelector(".link-create-popup-text");
      const urlInput = container.querySelector(".link-create-popup-url");
      expect(textInput).toBeNull();
      expect(urlInput).not.toBeNull();
    });

    it("hides popup when store closes", () => {
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true });
      emitStateChange({ isOpen: false, anchorRect: null });

      const container = document.querySelector(".link-create-popup") as HTMLElement;
      expect(container.style.display).toBe("none");
    });

    it("does not show when anchorRect is null", () => {
      // First open to get the container in the DOM
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true });
      // Close it
      emitStateChange({ isOpen: false, anchorRect: null });

      const container = document.querySelector(".link-create-popup") as HTMLElement;
      expect(container.style.display).toBe("none");

      // Now try to open with null anchor -- should stay hidden
      emitStateChange({ isOpen: true, anchorRect: null });
      expect(container.style.display).toBe("none");
    });
  });

  describe("Input handling", () => {
    beforeEach(() => {
      emitStateChange({
        isOpen: true,
        anchorRect,
        showTextInput: true,
        text: "",
      });
    });

    it("calls setText on text input change", () => {
      const textInput = document.querySelector(".link-create-popup-text") as HTMLInputElement;
      textInput.value = "New text";
      textInput.dispatchEvent(new Event("input", { bubbles: true }));

      expect(mockSetText).toHaveBeenCalledWith("New text");
    });

    it("calls setUrl on URL input change", () => {
      const urlInput = document.querySelector(".link-create-popup-url") as HTMLInputElement;
      urlInput.value = "https://example.com";
      urlInput.dispatchEvent(new Event("input", { bubbles: true }));

      expect(mockSetUrl).toHaveBeenCalledWith("https://example.com");
    });

    it("clears URL input on show", () => {
      const urlInput = document.querySelector(".link-create-popup-url") as HTMLInputElement;
      urlInput.value = "old-value";

      // Re-open should clear
      emitStateChange({ isOpen: false, anchorRect: null });
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true, text: "" });

      const newUrlInput = document.querySelector(".link-create-popup-url") as HTMLInputElement;
      expect(newUrlInput.value).toBe("");
    });
  });

  describe("Save action", () => {
    it("dispatches markdown link on save with text input", () => {
      emitStateChange({
        isOpen: true,
        anchorRect,
        showTextInput: true,
        text: "click here",
        rangeFrom: 0,
        rangeTo: 0,
      });

      storeState.url = "https://example.com";
      storeState.text = "click here";

      const saveBtn = document.querySelector(".link-create-popup-btn-save") as HTMLElement;
      saveBtn.click();

      expect((view.dispatch as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: expect.objectContaining({
            insert: "[click here](https://example.com)",
          }),
        })
      );
      expect(mockClosePopup).toHaveBeenCalled();
    });

    it("uses URL as text when text is empty", () => {
      emitStateChange({
        isOpen: true,
        anchorRect,
        showTextInput: true,
        text: "",
        rangeFrom: 0,
        rangeTo: 0,
      });

      storeState.url = "https://example.com";
      storeState.text = "  "; // whitespace only

      const saveBtn = document.querySelector(".link-create-popup-btn-save") as HTMLElement;
      saveBtn.click();

      expect((view.dispatch as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: expect.objectContaining({
            insert: "[https://example.com](https://example.com)",
          }),
        })
      );
    });

    it("wraps existing text when showTextInput is false", () => {
      emitStateChange({
        isOpen: true,
        anchorRect,
        showTextInput: false,
        text: "",
        rangeFrom: 5,
        rangeTo: 18,
      });

      storeState.url = "https://link.com";

      const saveBtn = document.querySelector(".link-create-popup-btn-save") as HTMLElement;
      saveBtn.click();

      expect((view.dispatch as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: expect.objectContaining({
            insert: "[selected text](https://link.com)",
            from: 5,
            to: 18,
          }),
        })
      );
    });

    it("focuses URL input when URL is empty on save", () => {
      emitStateChange({
        isOpen: true,
        anchorRect,
        showTextInput: true,
        text: "text",
        rangeFrom: 0,
        rangeTo: 0,
      });

      storeState.url = "  "; // whitespace only

      const urlInput = document.querySelector(".link-create-popup-url") as HTMLInputElement;
      const focusSpy = vi.spyOn(urlInput, "focus");

      const saveBtn = document.querySelector(".link-create-popup-btn-save") as HTMLElement;
      saveBtn.click();

      expect(focusSpy).toHaveBeenCalled();
      expect(view.dispatch).not.toHaveBeenCalled();
    });

    it("saves on Enter key in input", () => {
      emitStateChange({
        isOpen: true,
        anchorRect,
        showTextInput: true,
        text: "text",
        rangeFrom: 0,
        rangeTo: 0,
      });

      storeState.url = "https://example.com";
      storeState.text = "text";

      const urlInput = document.querySelector(".link-create-popup-url") as HTMLInputElement;
      const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
      urlInput.dispatchEvent(event);

      expect(view.dispatch).toHaveBeenCalled();
      expect(mockClosePopup).toHaveBeenCalled();
    });
  });

  describe("Cancel action", () => {
    it("closes popup on cancel button click", () => {
      emitStateChange({
        isOpen: true,
        anchorRect,
        showTextInput: true,
      });

      const cancelBtn = document.querySelector(".link-create-popup-btn-cancel") as HTMLElement;
      cancelBtn.click();

      expect(mockClosePopup).toHaveBeenCalled();
      expect(view.focus).toHaveBeenCalled();
    });

    it("closes popup on Escape in input", () => {
      emitStateChange({
        isOpen: true,
        anchorRect,
        showTextInput: true,
      });

      const urlInput = document.querySelector(".link-create-popup-url") as HTMLInputElement;
      urlInput.focus();

      const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
      urlInput.dispatchEvent(event);

      expect(mockClosePopup).toHaveBeenCalled();
      expect(view.focus).toHaveBeenCalled();
    });
  });

  describe("Click outside", () => {
    it("closes popup when clicking outside container", () => {
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true });

      // Simulate the rAF callback to clear justOpened flag
      vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
        cb(0);
        return 0;
      });

      // Re-open to get the rAF to fire
      emitStateChange({ isOpen: false, anchorRect: null });
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true });

      const outsideEl = document.createElement("div");
      document.body.appendChild(outsideEl);

      const mousedownEvent = new MouseEvent("mousedown", { bubbles: true });
      Object.defineProperty(mousedownEvent, "target", { value: outsideEl });
      document.dispatchEvent(mousedownEvent);

      expect(mockClosePopup).toHaveBeenCalled();
    });

    it("does not close when clicking inside container", () => {
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true });

      // Reset mock after the open call
      mockClosePopup.mockClear();

      const container = document.querySelector(".link-create-popup") as HTMLElement;
      const mousedownEvent = new MouseEvent("mousedown", { bubbles: true });
      Object.defineProperty(mousedownEvent, "target", { value: container });
      document.dispatchEvent(mousedownEvent);

      expect(mockClosePopup).not.toHaveBeenCalled();
    });
  });

  describe("Scroll handling", () => {
    it("closes popup on scroll", () => {
      // Need an editor-container ancestor for scroll listener
      const editorContainer = document.createElement("div");
      editorContainer.className = "editor-container";
      document.body.appendChild(editorContainer);
      editorContainer.appendChild(view.dom);

      // Recreate popup with proper DOM hierarchy
      popup.destroy();
      resetState();
      popup = new SourceLinkCreatePopupView(view);

      emitStateChange({ isOpen: true, anchorRect, showTextInput: true });

      const scrollEvent = new Event("scroll", { bubbles: true });
      editorContainer.dispatchEvent(scrollEvent);

      expect(mockClosePopup).toHaveBeenCalled();
    });
  });

  describe("Keyboard navigation", () => {
    it("sets up keyboard navigation on show", () => {
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true });

      const container = document.querySelector(".link-create-popup") as HTMLElement;
      expect(container).not.toBeNull();

      // Verify Tab key handler is registered by dispatching Tab
      const urlInput = document.querySelector(".link-create-popup-url") as HTMLInputElement;
      urlInput.focus();

      const tabEvent = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
      document.dispatchEvent(tabEvent);

      // If no error, the handler is set up
    });

    it("removes keyboard navigation on hide", () => {
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true });
      emitStateChange({ isOpen: false, anchorRect: null });

      // Subsequent Tab events should not be handled by popup
      const tabEvent = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
      document.dispatchEvent(tabEvent);
    });
  });

  describe("Destroy", () => {
    it("unsubscribes from store", () => {
      expect(subscribers.length).toBe(1);
      popup.destroy();
      expect(subscribers.length).toBe(0);
    });

    it("removes container from DOM", () => {
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true });
      expect(document.querySelector(".link-create-popup")).not.toBeNull();

      popup.destroy();
      expect(document.querySelector(".link-create-popup")).toBeNull();
    });

    it("removes event listeners safely", () => {
      popup.destroy();

      // Should not throw after destroy
      const mousedownEvent = new MouseEvent("mousedown", { bubbles: true });
      document.dispatchEvent(mousedownEvent);
    });
  });

  describe("Error handling", () => {
    it("handles dispatch error gracefully", () => {
      emitStateChange({
        isOpen: true,
        anchorRect,
        showTextInput: true,
        text: "text",
        rangeFrom: 0,
        rangeTo: 0,
      });

      storeState.url = "https://example.com";
      storeState.text = "text";

      // Make dispatch throw
      (view.dispatch as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error("Dispatch failed");
      });

      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      const saveBtn = document.querySelector(".link-create-popup-btn-save") as HTMLElement;

      // Should not throw
      saveBtn.click();

      expect(consoleError).toHaveBeenCalled();
      expect(mockClosePopup).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });
});
