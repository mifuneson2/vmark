import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

vi.mock("@/plugins/markmap", () => ({
  renderMarkmapToElement: vi.fn(),
}));

vi.mock("@/plugins/markmap/markmapExport", () => ({
  setupMarkmapExport: vi.fn(),
}));

vi.mock("@/plugins/shared/diagramCleanup", () => ({
  cleanupDescendants: vi.fn(),
}));

vi.mock("@/utils/debug", () => ({
  diagramWarn: vi.fn(),
}));

// Mock Decoration.widget to capture the factory function
let capturedFactory: ((view: unknown) => HTMLElement) | null = null;
vi.mock("@tiptap/pm/view", () => ({
  Decoration: {
    widget: vi.fn((_pos: number, factory: (view: unknown) => HTMLElement, _opts?: unknown) => {
      capturedFactory = factory;
      return { type: "widget" };
    }),
  },
}));

import { renderMarkmapToElement } from "@/plugins/markmap";
import { setupMarkmapExport } from "@/plugins/markmap/markmapExport";
import { cleanupDescendants } from "@/plugins/shared/diagramCleanup";
import { diagramWarn } from "@/utils/debug";
import {
  updateMarkmapLivePreview,
  createMarkmapPreview,
  createMarkmapPreviewWidget,
} from "./renderMarkmapPreview";

describe("updateMarkmapLivePreview", () => {
  beforeEach(() => {
    vi.mocked(renderMarkmapToElement).mockReset();
    vi.mocked(cleanupDescendants).mockClear();
  });

  it("cleans up previous instance before rendering", async () => {
    vi.mocked(renderMarkmapToElement).mockResolvedValueOnce({} as unknown);

    const element = document.createElement("div");
    const token = 1;
    await updateMarkmapLivePreview(element, "# Heading", token, () => token);

    expect(cleanupDescendants).toHaveBeenCalledWith(element);
  });

  it("creates SVG element and renders markmap", async () => {
    vi.mocked(renderMarkmapToElement).mockResolvedValueOnce({} as unknown);

    const element = document.createElement("div");
    const token = 1;
    await updateMarkmapLivePreview(element, "# Test", token, () => token);

    expect(renderMarkmapToElement).toHaveBeenCalled();
    const call = vi.mocked(renderMarkmapToElement).mock.calls[0];
    expect(call[0].tagName).toBe("svg");
    expect(call[1]).toBe("# Test");
  });

  it("shows error when renderMarkmapToElement returns null", async () => {
    vi.mocked(renderMarkmapToElement).mockResolvedValueOnce(null);

    const element = document.createElement("div");
    const token = 1;
    await updateMarkmapLivePreview(element, "bad", token, () => token);

    expect(element.textContent).toContain("Invalid markmap");
  });

  it("skips update when token is stale", async () => {
    vi.mocked(renderMarkmapToElement).mockResolvedValueOnce(null);

    const element = document.createElement("div");
    const token = 1;
    await updateMarkmapLivePreview(element, "# Test", token, () => 2);

    // Should not show error because token was stale
    expect(element.textContent).not.toContain("Invalid markmap");
  });

  it("clears element content before appending SVG", async () => {
    vi.mocked(renderMarkmapToElement).mockResolvedValueOnce({} as unknown);

    const element = document.createElement("div");
    element.textContent = "old content";
    const token = 1;
    await updateMarkmapLivePreview(element, "# Test", token, () => token);

    // Old content should be gone, replaced with SVG
    expect(element.textContent).not.toContain("old content");
    expect(element.querySelector("svg")).not.toBeNull();
  });
});

describe("createMarkmapPreview", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(renderMarkmapToElement).mockReset();
    vi.mocked(setupMarkmapExport).mockClear();
    vi.mocked(diagramWarn).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("creates wrapper with correct class", () => {
    const wrapper = createMarkmapPreview("# Test");
    expect(wrapper.className).toBe("code-block-preview markmap-preview");
  });

  it("appends SVG element to wrapper", () => {
    const wrapper = createMarkmapPreview("# Test");
    const svg = wrapper.querySelector("svg");
    expect(svg).not.toBeNull();
  });

  it("renders markmap after requestAnimationFrame when DOM-attached", async () => {
    const mockInstance = { fit: vi.fn() };
    vi.mocked(renderMarkmapToElement).mockResolvedValueOnce(mockInstance);

    const wrapper = createMarkmapPreview("# Test");
    document.body.appendChild(wrapper);

    await vi.advanceTimersByTimeAsync(16);

    expect(renderMarkmapToElement).toHaveBeenCalled();
    expect(setupMarkmapExport).toHaveBeenCalledWith(wrapper, "# Test");
  });

  it("does not render when element is not connected", async () => {
    const _wrapper = createMarkmapPreview("# Test");
    // Do NOT attach to document

    await vi.advanceTimersByTimeAsync(16);

    expect(renderMarkmapToElement).not.toHaveBeenCalled();
  });

  it("adds fit button on successful render", async () => {
    const mockInstance = { fit: vi.fn() };
    vi.mocked(renderMarkmapToElement).mockResolvedValueOnce(mockInstance);

    const wrapper = createMarkmapPreview("# Test");
    document.body.appendChild(wrapper);

    await vi.advanceTimersByTimeAsync(16);

    const fitBtn = wrapper.querySelector(".markmap-fit-btn");
    expect(fitBtn).not.toBeNull();
    expect(fitBtn!.getAttribute("title")).toBe("Fit to view");
  });

  it("fit button calls instance.fit() on click", async () => {
    const mockInstance = { fit: vi.fn() };
    vi.mocked(renderMarkmapToElement).mockResolvedValueOnce(mockInstance);

    const wrapper = createMarkmapPreview("# Test");
    document.body.appendChild(wrapper);

    await vi.advanceTimersByTimeAsync(16);

    const fitBtn = wrapper.querySelector(".markmap-fit-btn") as HTMLButtonElement;
    const clickEvent = new MouseEvent("click", { bubbles: true });
    fitBtn.dispatchEvent(clickEvent);
    expect(mockInstance.fit).toHaveBeenCalled();
  });

  it("fit button prevents default on mousedown", async () => {
    const mockInstance = { fit: vi.fn() };
    vi.mocked(renderMarkmapToElement).mockResolvedValueOnce(mockInstance);

    const wrapper = createMarkmapPreview("# Test");
    document.body.appendChild(wrapper);

    await vi.advanceTimersByTimeAsync(16);

    const fitBtn = wrapper.querySelector(".markmap-fit-btn") as HTMLButtonElement;
    const mousedown = new MouseEvent("mousedown", { bubbles: true });
    const preventSpy = vi.spyOn(mousedown, "preventDefault");
    fitBtn.dispatchEvent(mousedown);
    expect(preventSpy).toHaveBeenCalled();
  });

  it("does not add fit button when render returns null", async () => {
    vi.mocked(renderMarkmapToElement).mockResolvedValueOnce(null);

    const wrapper = createMarkmapPreview("# Test");
    document.body.appendChild(wrapper);

    await vi.advanceTimersByTimeAsync(16);

    expect(wrapper.querySelector(".markmap-fit-btn")).toBeNull();
  });

  it("shows error state when renderMarkmapToElement rejects", async () => {
    vi.mocked(renderMarkmapToElement).mockRejectedValueOnce(new Error("markmap failed"));

    const wrapper = createMarkmapPreview("bad content");
    document.body.appendChild(wrapper);

    await vi.advanceTimersByTimeAsync(16);

    expect(wrapper.className).toContain("markmap-error");
    expect(wrapper.textContent).toContain("Failed to render mindmap");
    expect(diagramWarn).toHaveBeenCalled();
  });

  it("logs non-Error objects in error path", async () => {
    vi.mocked(renderMarkmapToElement).mockRejectedValueOnce("string error");

    const wrapper = createMarkmapPreview("bad");
    document.body.appendChild(wrapper);

    await vi.advanceTimersByTimeAsync(16);

    expect(diagramWarn).toHaveBeenCalledWith(
      "Markmap preview render failed:",
      "string error"
    );
  });

  it("installs double-click handler when callback provided", () => {
    const handler = vi.fn();
    const wrapper = createMarkmapPreview("# Test", handler);

    wrapper.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("does not throw when double-click handler is omitted", () => {
    const wrapper = createMarkmapPreview("# Test");
    // Should not throw
    wrapper.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
  });
});

describe("createMarkmapPreviewWidget", () => {
  beforeEach(() => {
    capturedFactory = null;
    vi.mocked(renderMarkmapToElement).mockReset();
  });

  it("creates a Decoration.widget at correct position", () => {
    const handleEnterEdit = vi.fn();
    const result = createMarkmapPreviewWidget(15, "# Heading", "markmap:# Heading", handleEnterEdit);
    expect(result).toBeDefined();
    expect(capturedFactory).not.toBeNull();
  });

  it("factory creates markmap preview element", () => {
    const handleEnterEdit = vi.fn();
    createMarkmapPreviewWidget(15, "# Heading", "markmap:# Heading", handleEnterEdit);

    const element = capturedFactory!({ state: {} });
    expect(element.className).toContain("markmap-preview");
  });

  it("passes handleEnterEdit as double-click callback", () => {
    const handleEnterEdit = vi.fn();
    createMarkmapPreviewWidget(15, "# Heading", "key", handleEnterEdit);

    const element = capturedFactory!({ state: {} });
    element.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    expect(handleEnterEdit).toHaveBeenCalledWith({ state: {} });
  });
});
