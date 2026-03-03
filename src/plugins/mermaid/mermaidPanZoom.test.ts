/**
 * Tests for mermaidPanZoom utility.
 *
 * Mocks @panzoom/panzoom since jsdom lacks full SVG transform support.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Polyfill PointerEvent for jsdom
class PointerEventPolyfill extends MouseEvent {
  readonly pointerId: number;
  constructor(type: string, params: PointerEventInit & EventInit = {}) {
    super(type, params);
    this.pointerId = (params as Record<string, unknown>).pointerId as number ?? 0;
  }
}
if (typeof globalThis.PointerEvent === "undefined") {
  (globalThis as Record<string, unknown>).PointerEvent = PointerEventPolyfill;
}

// Mock Panzoom
const mockPanzoomInstance = {
  zoomWithWheel: vi.fn(),
  handleDown: vi.fn(),
  handleMove: vi.fn(),
  handleUp: vi.fn(),
  reset: vi.fn(),
  destroy: vi.fn(),
};

vi.mock("@panzoom/panzoom", () => ({
  default: vi.fn(() => mockPanzoomInstance),
}));

import { setupMermaidPanZoom } from "./mermaidPanZoom";

function createContainer(withSvg = true): HTMLElement {
  const container = document.createElement("div");
  if (withSvg) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", "100");
    rect.setAttribute("height", "50");
    svg.appendChild(rect);
    container.appendChild(svg);
  }
  return container;
}

describe("setupMermaidPanZoom", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when container has no SVG", () => {
    const container = createContainer(false);
    const result = setupMermaidPanZoom(container);
    expect(result).toBeNull();
  });

  it("sets container overflow to hidden via inline style", () => {
    const container = createContainer();
    setupMermaidPanZoom(container);
    expect(container.style.overflow).toBe("hidden");
    expect(container.style.position).toBe("relative");
  });

  it("adds 'panzoom-enabled' class to container", () => {
    const container = createContainer();
    setupMermaidPanZoom(container);
    expect(container.classList.contains("panzoom-enabled")).toBe(true);
  });

  it("creates reset button by default", () => {
    const container = createContainer();
    setupMermaidPanZoom(container);
    const btn = container.querySelector(".mermaid-panzoom-reset");
    expect(btn).not.toBeNull();
  });

  it("omits reset button when showResetButton is false", () => {
    const container = createContainer();
    setupMermaidPanZoom(container, { showResetButton: false });
    const btn = container.querySelector(".mermaid-panzoom-reset");
    expect(btn).toBeNull();
  });

  it("reset() calls panzoom reset with animate", () => {
    const container = createContainer();
    const instance = setupMermaidPanZoom(container)!;
    instance.reset();
    expect(mockPanzoomInstance.reset).toHaveBeenCalledWith({ animate: true });
  });

  it("destroy() removes button and restores container", () => {
    const container = createContainer();
    container.style.overflow = "auto";
    container.style.position = "";

    const instance = setupMermaidPanZoom(container)!;

    // Verify setup state
    expect(container.querySelector(".mermaid-panzoom-reset")).not.toBeNull();
    expect(container.style.overflow).toBe("hidden");

    instance.destroy();

    // After destroy: no button, class removed, styles restored
    expect(container.querySelector(".mermaid-panzoom-reset")).toBeNull();
    expect(container.classList.contains("panzoom-enabled")).toBe(false);
    expect(container.style.overflow).toBe("auto");
    expect(container.style.position).toBe("");
  });

  it("SVG children remain intact (no wrapping)", () => {
    const container = createContainer();
    setupMermaidPanZoom(container);
    const svg = container.querySelector("svg")!;
    expect(svg.querySelector("g.panzoom-target")).toBeNull();
    expect(svg.querySelector("rect")).not.toBeNull();
  });

  it("returns null when container already has panzoom-enabled class", () => {
    const container = createContainer();
    container.classList.add("panzoom-enabled");
    const result = setupMermaidPanZoom(container);
    expect(result).toBeNull();
  });

  it("Cmd+wheel triggers zoomWithWheel", () => {
    const container = createContainer();
    setupMermaidPanZoom(container);

    const event = new WheelEvent("wheel", { metaKey: true, cancelable: true });
    container.dispatchEvent(event);

    expect(mockPanzoomInstance.zoomWithWheel).toHaveBeenCalledWith(event, { animate: false });
  });

  it("Ctrl+wheel triggers zoomWithWheel", () => {
    const container = createContainer();
    setupMermaidPanZoom(container);

    const event = new WheelEvent("wheel", { ctrlKey: true, cancelable: true });
    container.dispatchEvent(event);

    expect(mockPanzoomInstance.zoomWithWheel).toHaveBeenCalledWith(event, { animate: false });
  });

  it("plain wheel does not trigger zoomWithWheel", () => {
    const container = createContainer();
    setupMermaidPanZoom(container);

    const event = new WheelEvent("wheel", { cancelable: true });
    container.dispatchEvent(event);

    expect(mockPanzoomInstance.zoomWithWheel).not.toHaveBeenCalled();
  });

  it("left-click pointerdown calls panzoom handleDown", () => {
    const container = createContainer();
    setupMermaidPanZoom(container);

    const event = new PointerEvent("pointerdown", { button: 0, bubbles: true });
    container.dispatchEvent(event);

    expect(mockPanzoomInstance.handleDown).toHaveBeenCalled();
  });

  it("non-left-click pointerdown does not call handleDown", () => {
    const container = createContainer();
    setupMermaidPanZoom(container);

    const event = new PointerEvent("pointerdown", { button: 2, bubbles: true });
    container.dispatchEvent(event);

    expect(mockPanzoomInstance.handleDown).not.toHaveBeenCalled();
  });

  it("pointerdown on reset button does not call handleDown", () => {
    const container = createContainer();
    document.body.appendChild(container);
    setupMermaidPanZoom(container);

    const resetBtn = container.querySelector(".mermaid-panzoom-reset") as HTMLElement;
    const event = new PointerEvent("pointerdown", { button: 0, bubbles: true });
    resetBtn.dispatchEvent(event);

    expect(mockPanzoomInstance.handleDown).not.toHaveBeenCalled();
    container.remove();
  });

  it("pointerdown on export button does not call handleDown", () => {
    const container = createContainer();
    document.body.appendChild(container);
    setupMermaidPanZoom(container);

    // Add an export button (simulates diagramExport placing one)
    const exportBtn = document.createElement("button");
    exportBtn.className = "mermaid-export-btn";
    container.appendChild(exportBtn);

    const event = new PointerEvent("pointerdown", { button: 0, bubbles: true });
    exportBtn.dispatchEvent(event);

    expect(mockPanzoomInstance.handleDown).not.toHaveBeenCalled();
    container.remove();
  });

  it("pointermove calls panzoom handleMove", () => {
    const container = createContainer();
    setupMermaidPanZoom(container);

    const event = new PointerEvent("pointermove", { bubbles: true });
    document.dispatchEvent(event);

    expect(mockPanzoomInstance.handleMove).toHaveBeenCalled();
  });

  it("pointerup calls panzoom handleUp", () => {
    const container = createContainer();
    setupMermaidPanZoom(container);

    const event = new PointerEvent("pointerup", { bubbles: true });
    document.dispatchEvent(event);

    expect(mockPanzoomInstance.handleUp).toHaveBeenCalled();
  });

  it("reset button click calls panzoom reset", () => {
    const container = createContainer();
    document.body.appendChild(container);
    setupMermaidPanZoom(container);

    const resetBtn = container.querySelector(".mermaid-panzoom-reset") as HTMLElement;
    resetBtn.click();

    expect(mockPanzoomInstance.reset).toHaveBeenCalledWith({ animate: true });
    container.remove();
  });

  it("destroy without reset button does not throw", () => {
    const container = createContainer();
    const instance = setupMermaidPanZoom(container, { showResetButton: false })!;
    expect(() => instance.destroy()).not.toThrow();
    expect(mockPanzoomInstance.destroy).toHaveBeenCalled();
  });

  it("destroy calls panzoom.destroy and removes class", () => {
    const container = createContainer();
    const instance = setupMermaidPanZoom(container)!;

    mockPanzoomInstance.destroy.mockClear();
    instance.destroy();

    expect(mockPanzoomInstance.destroy).toHaveBeenCalled();
    expect(container.classList.contains("panzoom-enabled")).toBe(false);
  });
});
