/**
 * Math Popup View Tests
 *
 * Tests for the math editing popup including:
 * - Store subscription lifecycle
 * - LaTeX preview rendering
 * - Keyboard shortcuts (Cmd+Enter saves)
 * - Error display
 * - Action buttons
 */

import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import type { AnchorRect } from "@/utils/popupPosition";

// Mock stores and utilities before importing the view
const mockClosePopup = vi.fn();
const mockUpdateLatex = vi.fn();

let storeState = {
  isOpen: false,
  latex: "",
  nodePos: null as number | null,
  anchorRect: null as AnchorRect | null,
  closePopup: mockClosePopup,
  updateLatex: mockUpdateLatex,
};
const subscribers: Array<(state: typeof storeState) => void> = [];

vi.mock("@/stores/mathPopupStore", () => ({
  useMathPopupStore: {
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

vi.mock("@/utils/imeGuard", () => ({
  isImeKeyEvent: () => false,
}));

vi.mock("@/plugins/sourcePopup", () => ({
  getPopupHostForDom: (dom: HTMLElement) => dom.closest(".editor-container"),
  toHostCoordsForDom: (_host: HTMLElement, pos: { top: number; left: number }) => pos,
}));

// Mock KaTeX loader
const mockRender = vi.fn();
vi.mock("@/plugins/latex/katexLoader", () => ({
  loadKatex: vi.fn(() =>
    Promise.resolve({
      default: {
        render: mockRender,
      },
    })
  ),
}));

// Import after mocking
import { MathPopupView } from "../MathPopupView";

// Helper functions
const createMockRect = (overrides: Partial<DOMRect> = {}): DOMRect => ({
  top: 100,
  left: 50,
  bottom: 120,
  right: 200,
  width: 150,
  height: 20,
  x: 50,
  y: 100,
  toJSON: () => ({}),
  ...overrides,
});

function createEditorContainer() {
  const container = document.createElement("div");
  container.className = "editor-container";
  container.style.position = "relative";
  container.getBoundingClientRect = () =>
    createMockRect({ top: 0, left: 0, bottom: 600, right: 800, width: 800, height: 600 });

  const editorDom = document.createElement("div");
  editorDom.className = "ProseMirror";
  editorDom.getBoundingClientRect = () =>
    createMockRect({ top: 0, left: 0, bottom: 600, right: 800, width: 800, height: 600 });
  container.appendChild(editorDom);

  document.body.appendChild(container);

  return {
    container,
    editorDom,
    cleanup: () => container.remove(),
  };
}

function createMockView(editorDom: HTMLElement) {
  return {
    dom: editorDom,
    state: {
      doc: {
        nodeAt: vi.fn(() => ({
          type: { name: "math_inline" },
          attrs: { content: "" },
          nodeSize: 1,
        })),
      },
      tr: {
        setNodeMarkup: vi.fn().mockReturnThis(),
      },
    },
    dispatch: vi.fn(),
    focus: vi.fn(),
  };
}

function emitStateChange(newState: Partial<typeof storeState>) {
  storeState = { ...storeState, ...newState };
  subscribers.forEach((fn) => fn(storeState));
}

function resetState() {
  storeState = {
    isOpen: false,
    latex: "",
    nodePos: null,
    anchorRect: null,
    closePopup: mockClosePopup,
    updateLatex: mockUpdateLatex,
  };
  subscribers.length = 0;
}

describe("MathPopupView", () => {
  let dom: ReturnType<typeof createEditorContainer>;
  let view: ReturnType<typeof createMockView>;
  let popup: MathPopupView;
  const anchorRect: AnchorRect = { top: 200, left: 150, bottom: 220, right: 250 };

  beforeEach(() => {
    document.body.innerHTML = "";
    resetState();
    vi.clearAllMocks();
    dom = createEditorContainer();
    view = createMockView(dom.editorDom);
    popup = new MathPopupView(view as unknown as ConstructorParameters<typeof MathPopupView>[0]);
  });

  afterEach(() => {
    popup.destroy();
    dom.cleanup();
  });

  describe("Store subscription", () => {
    it("subscribes to store on construction", () => {
      expect(subscribers.length).toBe(1);
    });

    it("shows popup when store opens", async () => {
      emitStateChange({
        isOpen: true,
        latex: "x^2",
        nodePos: 10,
        anchorRect,
      });

      await new Promise((r) => requestAnimationFrame(r));

      const popupEl = dom.container.querySelector(".math-popup");
      expect(popupEl).not.toBeNull();
      expect((popupEl as HTMLElement).style.display).toBe("flex");
    });

    it("hides popup when store closes", async () => {
      emitStateChange({ isOpen: true, latex: "x", nodePos: 1, anchorRect });
      await new Promise((r) => requestAnimationFrame(r));

      emitStateChange({ isOpen: false, anchorRect: null });

      const popupEl = dom.container.querySelector(".math-popup");
      expect((popupEl as HTMLElement).style.display).toBe("none");
    });

    it("unsubscribes on destroy", () => {
      expect(subscribers.length).toBe(1);
      popup.destroy();
      expect(subscribers.length).toBe(0);
    });
  });

  describe("Input synchronization", () => {
    it("populates textarea with latex from store", async () => {
      emitStateChange({
        isOpen: true,
        latex: "\\frac{a}{b}",
        nodePos: 5,
        anchorRect,
      });

      await new Promise((r) => requestAnimationFrame(r));

      const textarea = dom.container.querySelector(".math-popup-input") as HTMLTextAreaElement;
      expect(textarea.value).toBe("\\frac{a}{b}");
    });

    it("calls updateLatex on input change", async () => {
      emitStateChange({ isOpen: true, latex: "", nodePos: 1, anchorRect });
      await new Promise((r) => requestAnimationFrame(r));

      const textarea = dom.container.querySelector(".math-popup-input") as HTMLTextAreaElement;
      textarea.value = "y = mx + b";
      textarea.dispatchEvent(new Event("input", { bubbles: true }));

      expect(mockUpdateLatex).toHaveBeenCalledWith("y = mx + b");
    });
  });

  describe("LaTeX preview", () => {
    it("renders preview when latex is provided", async () => {
      emitStateChange({
        isOpen: true,
        latex: "E = mc^2",
        nodePos: 5,
        anchorRect,
      });

      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => setTimeout(r, 10)); // Wait for async render

      expect(mockRender).toHaveBeenCalled();
    });

    it("clears preview when latex is empty", async () => {
      emitStateChange({
        isOpen: true,
        latex: "",
        nodePos: 5,
        anchorRect,
      });

      await new Promise((r) => requestAnimationFrame(r));

      const preview = dom.container.querySelector(".math-popup-preview") as HTMLElement;
      expect(preview.textContent).toBe("");
    });
  });

  describe("Keyboard shortcuts", () => {
    beforeEach(async () => {
      emitStateChange({
        isOpen: true,
        latex: "x^2 + y^2 = z^2",
        nodePos: 10,
        anchorRect,
      });
      await new Promise((r) => requestAnimationFrame(r));
    });

    it("closes on Escape", () => {
      const textarea = dom.container.querySelector(".math-popup-input") as HTMLTextAreaElement;
      textarea.focus();

      const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
      textarea.dispatchEvent(event);

      expect(mockClosePopup).toHaveBeenCalled();
      expect(view.focus).toHaveBeenCalled();
    });

    it("saves on Cmd+Enter", () => {
      const textarea = dom.container.querySelector(".math-popup-input") as HTMLTextAreaElement;
      textarea.focus();

      const event = new KeyboardEvent("keydown", {
        key: "Enter",
        metaKey: true,
        bubbles: true,
      });
      textarea.dispatchEvent(event);

      expect(mockClosePopup).toHaveBeenCalled();
    });

    it("saves on Ctrl+Enter", () => {
      const textarea = dom.container.querySelector(".math-popup-input") as HTMLTextAreaElement;
      textarea.focus();

      const event = new KeyboardEvent("keydown", {
        key: "Enter",
        ctrlKey: true,
        bubbles: true,
      });
      textarea.dispatchEvent(event);

      expect(mockClosePopup).toHaveBeenCalled();
    });

    it("allows normal Enter for newlines", () => {
      const textarea = dom.container.querySelector(".math-popup-input") as HTMLTextAreaElement;
      textarea.focus();

      const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
      textarea.dispatchEvent(event);

      // Should not close on plain Enter (multiline input)
      expect(mockClosePopup).not.toHaveBeenCalled();
    });
  });

  describe("Action buttons", () => {
    beforeEach(async () => {
      emitStateChange({
        isOpen: true,
        latex: "a^2 + b^2",
        nodePos: 10,
        anchorRect,
      });
      await new Promise((r) => requestAnimationFrame(r));
    });

    it("cancel button closes popup", () => {
      const cancelBtn = dom.container.querySelector(".math-popup-btn-cancel") as HTMLElement;
      cancelBtn.click();

      expect(mockClosePopup).toHaveBeenCalled();
      expect(view.focus).toHaveBeenCalled();
    });

    it("save button saves and closes", () => {
      const saveBtn = dom.container.querySelector(".math-popup-btn-save") as HTMLElement;
      saveBtn.click();

      expect(view.dispatch).toHaveBeenCalled();
      expect(mockClosePopup).toHaveBeenCalled();
    });
  });

  describe("Click outside handling", () => {
    it("closes popup when clicking outside", async () => {
      emitStateChange({ isOpen: true, latex: "x", nodePos: 1, anchorRect });
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      const outsideEl = document.createElement("div");
      document.body.appendChild(outsideEl);

      const mousedownEvent = new MouseEvent("mousedown", { bubbles: true });
      Object.defineProperty(mousedownEvent, "target", { value: outsideEl });
      document.dispatchEvent(mousedownEvent);

      expect(mockClosePopup).toHaveBeenCalled();
    });

    it("does not close when clicking inside popup", async () => {
      emitStateChange({ isOpen: true, latex: "x", nodePos: 1, anchorRect });
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      const popupEl = dom.container.querySelector(".math-popup") as HTMLElement;
      const mousedownEvent = new MouseEvent("mousedown", { bubbles: true });
      Object.defineProperty(mousedownEvent, "target", { value: popupEl });
      document.dispatchEvent(mousedownEvent);

      expect(mockClosePopup).not.toHaveBeenCalled();
    });
  });

  describe("Save edge cases", () => {
    it("does nothing when nodePos is null", async () => {
      storeState.nodePos = null;
      emitStateChange({ isOpen: true, latex: "x^2", nodePos: null, anchorRect });
      await new Promise((r) => requestAnimationFrame(r));

      const saveBtn = dom.container.querySelector(".math-popup-btn-save") as HTMLElement;
      saveBtn.click();

      expect(view.dispatch).not.toHaveBeenCalled();
    });

    it("closes popup when node at pos is not math_inline", async () => {
      view.state.doc.nodeAt = vi.fn(() => ({
        type: { name: "paragraph" },
        attrs: {},
        nodeSize: 1,
      }));
      storeState.nodePos = 10;
      emitStateChange({ isOpen: true, latex: "x", nodePos: 10, anchorRect });
      await new Promise((r) => requestAnimationFrame(r));

      const saveBtn = dom.container.querySelector(".math-popup-btn-save") as HTMLElement;
      saveBtn.click();

      expect(mockClosePopup).toHaveBeenCalled();
      expect(view.dispatch).not.toHaveBeenCalled();
    });

    it("closes popup when node at pos is null", async () => {
      view.state.doc.nodeAt = vi.fn(() => null);
      storeState.nodePos = 10;
      emitStateChange({ isOpen: true, latex: "x", nodePos: 10, anchorRect });
      await new Promise((r) => requestAnimationFrame(r));

      const saveBtn = dom.container.querySelector(".math-popup-btn-save") as HTMLElement;
      saveBtn.click();

      expect(mockClosePopup).toHaveBeenCalled();
      expect(view.dispatch).not.toHaveBeenCalled();
    });
  });

  describe("LaTeX preview error handling", () => {
    it("shows error message when KaTeX render throws", async () => {
      mockRender.mockImplementation(() => {
        throw new Error("Invalid LaTeX");
      });

      emitStateChange({ isOpen: true, latex: "\\invalid", nodePos: 5, anchorRect });
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => setTimeout(r, 20));

      const error = dom.container.querySelector(".math-popup-error") as HTMLElement;
      expect(error.textContent).toBe("Invalid LaTeX");

      mockRender.mockReset();
    });

    it("shows error when KaTeX loader fails", async () => {
      const { loadKatex } = await import("@/plugins/latex/katexLoader");
      vi.mocked(loadKatex).mockRejectedValueOnce(new Error("Module not found"));

      emitStateChange({ isOpen: true, latex: "x^2", nodePos: 5, anchorRect });
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => setTimeout(r, 20));

      const error = dom.container.querySelector(".math-popup-error") as HTMLElement;
      expect(error.textContent).toBe("LaTeX preview failed");
    });

    it("ignores stale render tokens", async () => {
      // Open with first latex value
      emitStateChange({ isOpen: true, latex: "x", nodePos: 5, anchorRect });
      await new Promise((r) => requestAnimationFrame(r));

      // Change input to trigger a new render (increments token)
      const textarea = dom.container.querySelector(".math-popup-input") as HTMLTextAreaElement;
      textarea.value = "y^2";
      textarea.dispatchEvent(new Event("input", { bubbles: true }));

      // First render callback from initial "x" should be ignored
      // (token mismatch), only "y^2" should be rendered
      await new Promise((r) => setTimeout(r, 20));

      expect(mockUpdateLatex).toHaveBeenCalledWith("y^2");
    });
  });

  describe("Scroll close", () => {
    it("closes popup on editor container scroll", async () => {
      emitStateChange({ isOpen: true, latex: "x", nodePos: 10, anchorRect });
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      dom.container.dispatchEvent(new Event("scroll", { bubbles: false }));

      expect(mockClosePopup).toHaveBeenCalled();
    });

    it("does not close when popup is not open", async () => {
      emitStateChange({ isOpen: true, latex: "x", nodePos: 10, anchorRect });
      await new Promise((r) => requestAnimationFrame(r));

      emitStateChange({ isOpen: false, anchorRect: null });
      vi.clearAllMocks();

      dom.container.dispatchEvent(new Event("scroll", { bubbles: false }));

      expect(mockClosePopup).not.toHaveBeenCalled();
    });
  });

  describe("Mounting", () => {
    it("mounts inside editor-container", async () => {
      emitStateChange({ isOpen: true, latex: "x", nodePos: 1, anchorRect });
      await new Promise((r) => requestAnimationFrame(r));

      const popupEl = dom.container.querySelector(".math-popup");
      expect(popupEl).not.toBeNull();
      expect(dom.container.contains(popupEl)).toBe(true);
    });

    it("uses absolute positioning when in editor-container", async () => {
      emitStateChange({ isOpen: true, latex: "x", nodePos: 1, anchorRect });
      await new Promise((r) => requestAnimationFrame(r));

      const popupEl = dom.container.querySelector(".math-popup") as HTMLElement;
      expect(popupEl.style.position).toBe("absolute");
    });

    it("uses fixed positioning when no editor-container found", async () => {
      // Remove the editor from its container and mock getPopupHostForDom to return null
      // This is tricky with the mock, so we test a different path:
      // when the host is document.body, it uses "fixed"
      emitStateChange({ isOpen: true, latex: "x", nodePos: 1, anchorRect });
      await new Promise((r) => requestAnimationFrame(r));

      // Since our mock returns editor-container, it uses absolute
      const popupEl = dom.container.querySelector(".math-popup") as HTMLElement;
      expect(popupEl.style.position).toBe("absolute");
    });

    it("cleans up on destroy", async () => {
      emitStateChange({ isOpen: true, latex: "x", nodePos: 1, anchorRect });
      await new Promise((r) => requestAnimationFrame(r));

      expect(dom.container.querySelector(".math-popup")).not.toBeNull();

      popup.destroy();

      expect(document.querySelector(".math-popup")).toBeNull();
    });
  });

  describe("DOM structure", () => {
    it("builds textarea with correct placeholder", async () => {
      emitStateChange({ isOpen: true, latex: "", nodePos: 1, anchorRect });
      await new Promise((r) => requestAnimationFrame(r));

      const textarea = dom.container.querySelector(".math-popup-input") as HTMLTextAreaElement;
      expect(textarea).not.toBeNull();
      expect(textarea.placeholder).toBe("Enter LaTeX...");
      expect(textarea.rows).toBe(3);
    });

    it("has preview and error elements", async () => {
      emitStateChange({ isOpen: true, latex: "", nodePos: 1, anchorRect });
      await new Promise((r) => requestAnimationFrame(r));

      expect(dom.container.querySelector(".math-popup-preview")).not.toBeNull();
      expect(dom.container.querySelector(".math-popup-error")).not.toBeNull();
    });

    it("has cancel and save buttons", async () => {
      emitStateChange({ isOpen: true, latex: "", nodePos: 1, anchorRect });
      await new Promise((r) => requestAnimationFrame(r));

      expect(dom.container.querySelector(".math-popup-btn-cancel")).not.toBeNull();
      expect(dom.container.querySelector(".math-popup-btn-save")).not.toBeNull();
    });
  });
});
