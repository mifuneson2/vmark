/**
 * Tests for MermaidPreviewView — show/hide lifecycle, zoom, drag, resize,
 * content update debouncing, and destroy cleanup.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/plugins/shared/diagramCleanup", () => ({
  cleanupDescendants: vi.fn(),
}));

vi.mock("@/utils/popupPosition", () => ({
  calculatePopupPosition: vi.fn(() => ({ top: 100, left: 200 })),
  getBoundaryRects: vi.fn(() => ({
    top: 0, left: 0, bottom: 800, right: 1200, width: 1200, height: 800,
  })),
  getViewportBounds: vi.fn(() => ({
    top: 0, left: 0, bottom: 800, right: 1200, width: 1200, height: 800,
  })),
}));

vi.mock("@/plugins/sourcePopup", () => ({
  getPopupHostForDom: vi.fn(() => null),
  toHostCoordsForDom: vi.fn((_host: HTMLElement, pos: { top: number; left: number }) => pos),
}));

vi.mock("../mermaidPreviewRender", () => ({
  renderPreview: vi.fn(() => 1),
}));

import { MermaidPreviewView, getMermaidPreviewView } from "../MermaidPreviewView";
import { renderPreview } from "../mermaidPreviewRender";
import { cleanupDescendants } from "@/plugins/shared/diagramCleanup";

describe("MermaidPreviewView", () => {
  let view: MermaidPreviewView;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    view = new MermaidPreviewView();
  });

  afterEach(() => {
    view.destroy();
    vi.useRealTimers();
  });

  describe("show/hide lifecycle", () => {
    it("starts hidden", () => {
      expect(view.isVisible()).toBe(false);
    });

    it("becomes visible after show()", () => {
      const editorDom = document.createElement("div");
      const anchor = { top: 50, left: 100, width: 10, height: 20 };

      view.show("graph TD; A-->B", anchor, editorDom);

      expect(view.isVisible()).toBe(true);
      expect(renderPreview).toHaveBeenCalled();
    });

    it("becomes hidden after hide()", () => {
      const editorDom = document.createElement("div");
      view.show("graph TD; A-->B", { top: 50, left: 100, width: 10, height: 20 }, editorDom);

      view.hide();

      expect(view.isVisible()).toBe(false);
      expect(cleanupDescendants).toHaveBeenCalled();
    });

    it("clears debounce timer on hide", () => {
      const editorDom = document.createElement("div");
      view.show("graph TD; A-->B", { top: 50, left: 100, width: 10, height: 20 }, editorDom);

      view.updateContent("new content");
      view.hide();

      // Advancing timers should not trigger render
      vi.advanceTimersByTime(500);
      // renderPreview called once on show(), not again after hide cleared timer
      expect(vi.mocked(renderPreview)).toHaveBeenCalledTimes(1);
    });

    it("show with language parameter", () => {
      view.show("test", { top: 0, left: 0, width: 10, height: 10 }, undefined, "svg");
      expect(view.isVisible()).toBe(true);
    });
  });

  describe("updateContent", () => {
    it("debounces mermaid rendering", () => {
      const editorDom = document.createElement("div");
      view.show("initial", { top: 0, left: 0, width: 10, height: 10 }, editorDom);
      vi.mocked(renderPreview).mockClear();

      view.updateContent("update 1");
      view.updateContent("update 2");
      view.updateContent("update 3");

      // No immediate render
      expect(renderPreview).not.toHaveBeenCalled();

      // After debounce period
      vi.advanceTimersByTime(200);
      expect(renderPreview).toHaveBeenCalledTimes(1);
    });

    it("renders SVG immediately without debounce", () => {
      view.show("initial", { top: 0, left: 0, width: 10, height: 10 }, undefined, "svg");
      vi.mocked(renderPreview).mockClear();

      view.updateContent("<svg></svg>", "svg");

      // Should render immediately
      expect(renderPreview).toHaveBeenCalledTimes(1);
    });

    it("clears pending debounce timer for SVG", () => {
      view.show("initial", { top: 0, left: 0, width: 10, height: 10 });
      vi.mocked(renderPreview).mockClear();

      // Start a mermaid debounce
      view.updateContent("mermaid content");
      expect(renderPreview).not.toHaveBeenCalled();

      // Switch to SVG — should cancel debounce and render immediately
      view.updateContent("<svg></svg>", "svg");
      expect(renderPreview).toHaveBeenCalledTimes(1);

      // The original debounce should not fire
      vi.advanceTimersByTime(300);
      expect(renderPreview).toHaveBeenCalledTimes(1);
    });

    it("updates language when provided", () => {
      view.show("initial", { top: 0, left: 0, width: 10, height: 10 });
      vi.mocked(renderPreview).mockClear();

      view.updateContent("content", "markmap");
      vi.advanceTimersByTime(200);

      const callArgs = vi.mocked(renderPreview).mock.calls[0];
      expect(callArgs[1].currentLanguage).toBe("markmap");
    });
  });

  describe("zoom", () => {
    it("zoom in button increases zoom", () => {
      view.show("graph TD; A-->B", { top: 0, left: 0, width: 10, height: 10 });

      // Find zoom in button and click it
      const container = document.querySelector(".mermaid-preview-popup");
      const zoomInBtn = container?.querySelector('[data-action="in"]') as HTMLElement;

      expect(zoomInBtn).not.toBeNull();
      zoomInBtn.click();

      const zoomDisplay = container?.querySelector(".mermaid-preview-zoom-value");
      expect(zoomDisplay?.textContent).toBe("110%");
    });

    it("zoom out button decreases zoom", () => {
      view.show("graph TD; A-->B", { top: 0, left: 0, width: 10, height: 10 });

      const container = document.querySelector(".mermaid-preview-popup");
      const zoomOutBtn = container?.querySelector('[data-action="out"]') as HTMLElement;

      expect(zoomOutBtn).not.toBeNull();
      zoomOutBtn.click();

      const zoomDisplay = container?.querySelector(".mermaid-preview-zoom-value");
      expect(zoomDisplay?.textContent).toBe("90%");
    });

    it("zoom does not exceed max (300%)", () => {
      view.show("graph TD; A-->B", { top: 0, left: 0, width: 10, height: 10 });

      const container = document.querySelector(".mermaid-preview-popup");
      const zoomInBtn = container?.querySelector('[data-action="in"]') as HTMLElement;

      // Click 25 times (100% + 25*10 = 350%, should cap at 300%)
      for (let i = 0; i < 25; i++) {
        zoomInBtn.click();
      }

      const zoomDisplay = container?.querySelector(".mermaid-preview-zoom-value");
      expect(zoomDisplay?.textContent).toBe("300%");
    });

    it("zoom does not go below min (10%)", () => {
      view.show("graph TD; A-->B", { top: 0, left: 0, width: 10, height: 10 });

      const container = document.querySelector(".mermaid-preview-popup");
      const zoomOutBtn = container?.querySelector('[data-action="out"]') as HTMLElement;

      // Click 15 times (100% - 15*10 = -50%, should cap at 10%)
      for (let i = 0; i < 15; i++) {
        zoomOutBtn.click();
      }

      const zoomDisplay = container?.querySelector(".mermaid-preview-zoom-value");
      expect(zoomDisplay?.textContent).toBe("10%");
    });

    it("ignores click on non-button zoom area", () => {
      view.show("graph TD; A-->B", { top: 0, left: 0, width: 10, height: 10 });

      const container = document.querySelector(".mermaid-preview-popup");
      const zoomArea = container?.querySelector(".mermaid-preview-zoom") as HTMLElement;
      const zoomDisplay = container?.querySelector(".mermaid-preview-zoom-value");

      // Click on the zoom value text (not a button)
      const clickEvent = new MouseEvent("click", { bubbles: true });
      Object.defineProperty(clickEvent, "target", { value: zoomDisplay });
      zoomArea?.dispatchEvent(clickEvent);

      // Zoom should remain at 100%
      expect(zoomDisplay?.textContent).toBe("100%");
    });
  });

  describe("updatePosition", () => {
    it("does not update position if user has dragged", () => {
      view.show("graph TD", { top: 0, left: 0, width: 10, height: 10 });

      const container = document.querySelector(".mermaid-preview-popup") as HTMLElement;
      const header = container?.querySelector(".mermaid-preview-header") as HTMLElement;

      // Simulate drag: mousedown on header, mousemove > 5px, mouseup
      const mousedown = new MouseEvent("mousedown", { clientX: 10, clientY: 10, bubbles: true });
      header.dispatchEvent(mousedown);

      const mousemove = new MouseEvent("mousemove", { clientX: 50, clientY: 50, bubbles: true });
      document.dispatchEvent(mousemove);

      const mouseup = new MouseEvent("mouseup", { bubbles: true });
      document.dispatchEvent(mouseup);

      // After drag, updatePosition should be a no-op
      const currentTop = container.style.top;
      const currentLeft = container.style.left;

      view.updatePosition({ top: 999, left: 999, width: 10, height: 10 });

      expect(container.style.top).toBe(currentTop);
      expect(container.style.left).toBe(currentLeft);
    });
  });

  describe("destroy", () => {
    it("removes container from DOM", () => {
      view.show("graph TD", { top: 0, left: 0, width: 10, height: 10 });
      const container = document.querySelector(".mermaid-preview-popup");
      expect(container).not.toBeNull();

      view.destroy();

      expect(document.querySelector(".mermaid-preview-popup")).toBeNull();
    });

    it("cleans up event listeners", () => {
      const removeSpy = vi.spyOn(document, "removeEventListener");

      view.show("graph TD", { top: 0, left: 0, width: 10, height: 10 });
      view.destroy();

      // Should remove mousemove and mouseup for both drag and resize
      const removedEvents = removeSpy.mock.calls.map((c) => c[0]);
      expect(removedEvents).toContain("mousemove");
      expect(removedEvents).toContain("mouseup");

      removeSpy.mockRestore();
    });

    it("clears debounce timer on destroy", () => {
      view.show("graph TD", { top: 0, left: 0, width: 10, height: 10 });
      view.updateContent("pending");
      vi.mocked(renderPreview).mockClear();

      view.destroy();

      vi.advanceTimersByTime(500);
      expect(renderPreview).not.toHaveBeenCalled();
    });

    it("calls cleanupDescendants on destroy", () => {
      view.show("graph TD", { top: 0, left: 0, width: 10, height: 10 });
      vi.mocked(cleanupDescendants).mockClear();

      view.destroy();

      expect(cleanupDescendants).toHaveBeenCalled();
    });
  });
});

describe("getMermaidPreviewView", () => {
  it("returns a singleton instance", () => {
    const instance1 = getMermaidPreviewView();
    const instance2 = getMermaidPreviewView();

    expect(instance1).toBe(instance2);
    expect(instance1).toBeInstanceOf(MermaidPreviewView);
  });
});
