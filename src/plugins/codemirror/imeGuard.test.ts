/**
 * Tests for IME Guard Plugin (CodeMirror)
 *
 * Verifies that the plugin attaches/detaches compositionend and blur
 * listeners, and calls the correct IME guard utilities.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockMarkCodeMirrorCompositionEnd = vi.fn();
const mockFlushCodeMirrorCompositionQueue = vi.fn();

vi.mock("@/utils/imeGuard", () => ({
  markCodeMirrorCompositionEnd: (...args: unknown[]) =>
    mockMarkCodeMirrorCompositionEnd(...args),
  flushCodeMirrorCompositionQueue: (...args: unknown[]) =>
    mockFlushCodeMirrorCompositionQueue(...args),
}));

vi.mock("@codemirror/view", () => {
  return {
    EditorView: {},
    ViewPlugin: {
      fromClass: (cls: new (view: unknown) => unknown) => ({
        _class: cls,
      }),
    },
  };
});

import { createImeGuardPlugin } from "./imeGuard";

function createMockView() {
  const dom = document.createElement("div");
  return {
    dom,
    state: { doc: { length: 0 } },
  };
}

describe("createImeGuardPlugin", () => {
  let originalRAF: typeof requestAnimationFrame;

  beforeEach(() => {
    vi.clearAllMocks();
    originalRAF = globalThis.requestAnimationFrame;
    globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    };
  });

  afterEach(() => {
    globalThis.requestAnimationFrame = originalRAF;
  });

  it("returns a ViewPlugin spec", () => {
    const plugin = createImeGuardPlugin();
    expect(plugin).toBeDefined();
    expect(plugin._class).toBeDefined();
  });

  it("attaches compositionend listener on construction", () => {
    const plugin = createImeGuardPlugin();
    const view = createMockView();
    const addSpy = vi.spyOn(view.dom, "addEventListener");

    new plugin._class(view);

    expect(addSpy).toHaveBeenCalledWith(
      "compositionend",
      expect.any(Function)
    );
  });

  it("attaches blur listener on construction", () => {
    const plugin = createImeGuardPlugin();
    const view = createMockView();
    const addSpy = vi.spyOn(view.dom, "addEventListener");

    new plugin._class(view);

    expect(addSpy).toHaveBeenCalledWith("blur", expect.any(Function));
  });

  it("calls markCodeMirrorCompositionEnd and flushCodeMirrorCompositionQueue on compositionend", () => {
    const plugin = createImeGuardPlugin();
    const view = createMockView();

    new plugin._class(view);

    // Fire compositionend
    view.dom.dispatchEvent(new Event("compositionend"));

    expect(mockMarkCodeMirrorCompositionEnd).toHaveBeenCalledWith(view);
    expect(mockFlushCodeMirrorCompositionQueue).toHaveBeenCalledWith(view);
  });

  it("calls markCodeMirrorCompositionEnd and flushCodeMirrorCompositionQueue on blur", () => {
    const plugin = createImeGuardPlugin();
    const view = createMockView();

    new plugin._class(view);

    view.dom.dispatchEvent(new Event("blur"));

    expect(mockMarkCodeMirrorCompositionEnd).toHaveBeenCalledWith(view);
    expect(mockFlushCodeMirrorCompositionQueue).toHaveBeenCalledWith(view);
  });

  it("removes listeners on destroy", () => {
    const plugin = createImeGuardPlugin();
    const view = createMockView();
    const removeSpy = vi.spyOn(view.dom, "removeEventListener");

    const instance = new plugin._class(view) as { destroy: () => void };
    instance.destroy();

    expect(removeSpy).toHaveBeenCalledWith(
      "compositionend",
      expect.any(Function)
    );
    expect(removeSpy).toHaveBeenCalledWith("blur", expect.any(Function));
  });

  it("does not fire handlers after destroy", () => {
    const plugin = createImeGuardPlugin();
    const view = createMockView();

    const instance = new plugin._class(view) as { destroy: () => void };
    instance.destroy();

    mockMarkCodeMirrorCompositionEnd.mockClear();
    mockFlushCodeMirrorCompositionQueue.mockClear();

    view.dom.dispatchEvent(new Event("compositionend"));

    // After destroy, listeners are removed so mocks should not be called
    expect(mockMarkCodeMirrorCompositionEnd).not.toHaveBeenCalled();
    expect(mockFlushCodeMirrorCompositionQueue).not.toHaveBeenCalled();
  });
});
