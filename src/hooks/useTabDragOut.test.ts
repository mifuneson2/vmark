import { createRef, type PointerEvent as ReactPointerEvent } from "react";
import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTabDragOut } from "./useTabDragOut";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function withRect(el: HTMLElement, rect: Rect) {
  Object.defineProperty(el, "getBoundingClientRect", {
    value: () => ({
      x: rect.left,
      y: rect.top,
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      toJSON: () => ({}),
    }),
    configurable: true,
  });
}

function createTabBar({
  barTop,
  barHeight,
  tabRects,
}: {
  barTop: number;
  barHeight: number;
  tabRects: Array<Pick<Rect, "left" | "width">>;
}): HTMLElement {
  const bar = document.createElement("div");
  withRect(bar, { top: barTop, left: 0, width: 1000, height: barHeight });

  const tablist = document.createElement("div");
  tablist.setAttribute("role", "tablist");
  const listWidth = Math.max(300, ...tabRects.map((rect) => rect.left + rect.width));
  withRect(tablist, { top: barTop, left: 0, width: listWidth, height: barHeight });

  tabRects.forEach((rect, index) => {
    const tab = document.createElement("div");
    tab.setAttribute("role", "tab");
    tab.dataset.tabId = `tab-${index + 1}`;
    withRect(tab, { top: barTop, left: rect.left, width: rect.width, height: barHeight });
    tablist.appendChild(tab);
  });

  bar.appendChild(tablist);
  document.body.appendChild(bar);
  return bar;
}

function dispatchPointer(type: string, clientX: number, clientY: number) {
  document.dispatchEvent(
    new MouseEvent(type, { bubbles: true, clientX, clientY, screenX: clientX, screenY: clientY })
  );
}

function createPointerDownEvent({
  clientX,
  clientY,
  pointerType = "mouse",
  button = 0,
  hasPointerCapture = false,
  throwOnSetCapture = false,
  throwOnReleaseCapture = false,
}: {
  clientX: number;
  clientY: number;
  pointerType?: "mouse" | "touch" | "pen";
  button?: number;
  hasPointerCapture?: boolean;
  throwOnSetCapture?: boolean;
  throwOnReleaseCapture?: boolean;
}): ReactPointerEvent {
  return {
    button,
    clientX,
    clientY,
    pointerId: 1,
    pointerType,
    currentTarget: {
      setPointerCapture: vi.fn(() => {
        if (throwOnSetCapture) throw new Error("set capture failed");
      }),
      hasPointerCapture: vi.fn(() => hasPointerCapture),
      releasePointerCapture: vi.fn(() => {
        if (throwOnReleaseCapture) throw new Error("release capture failed");
      }),
    },
  } as unknown as ReactPointerEvent;
}

beforeEach(() => {
  vi.useRealTimers();
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("useTabDragOut", () => {
  it("reorders when dragged horizontally past lock threshold", () => {
    const bar = createTabBar({
      barTop: 0,
      barHeight: 40,
      tabRects: [
        { left: 0, width: 100 },
        { left: 100, width: 100 },
      ],
    });
    const tabBarRef = createRef<HTMLElement>();
    tabBarRef.current = bar;

    const onDragOut = vi.fn();
    const onReorder = vi.fn();
    const { result } = renderHook(() =>
      useTabDragOut({ tabBarRef, onDragOut, onReorder })
    );

    act(() => {
      result.current.getTabDragHandlers("tab-1", false).onPointerDown(
        createPointerDownEvent({ clientX: 10, clientY: 20 })
      );
      dispatchPointer("pointermove", 220, 20);
      dispatchPointer("pointerup", 220, 20);
    });

    expect(onReorder).toHaveBeenCalledWith("tab-1", 2);
    expect(onDragOut).not.toHaveBeenCalled();
  });

  it("detaches when dragged below the tab bar", () => {
    const bar = createTabBar({
      barTop: 0,
      barHeight: 40,
      tabRects: [{ left: 0, width: 120 }],
    });
    const tabBarRef = createRef<HTMLElement>();
    tabBarRef.current = bar;

    const onDragOut = vi.fn();
    const onReorder = vi.fn();
    const { result } = renderHook(() =>
      useTabDragOut({ tabBarRef, onDragOut, onReorder })
    );

    act(() => {
      result.current.getTabDragHandlers("tab-1", false).onPointerDown(
        createPointerDownEvent({ clientX: 30, clientY: 20 })
      );
      dispatchPointer("pointermove", 30, 100);
      dispatchPointer("pointerup", 30, 100);
    });

    expect(onDragOut).toHaveBeenCalledWith("tab-1", {
      clientX: 30,
      clientY: 100,
      screenX: 30,
      screenY: 100,
    });
    expect(onReorder).not.toHaveBeenCalled();
  });

  it("detaches when dragged above the tab bar (bottom-docked tabs)", () => {
    const bar = createTabBar({
      barTop: 760,
      barHeight: 40,
      tabRects: [{ left: 0, width: 120 }],
    });
    const tabBarRef = createRef<HTMLElement>();
    tabBarRef.current = bar;

    const onDragOut = vi.fn();
    const onReorder = vi.fn();
    const { result } = renderHook(() =>
      useTabDragOut({ tabBarRef, onDragOut, onReorder })
    );

    act(() => {
      result.current.getTabDragHandlers("tab-1", false).onPointerDown(
        createPointerDownEvent({ clientX: 30, clientY: 780 })
      );
      dispatchPointer("pointermove", 30, 700);
      dispatchPointer("pointerup", 30, 700);
    });

    expect(onDragOut).toHaveBeenCalledWith("tab-1", {
      clientX: 30,
      clientY: 700,
      screenX: 30,
      screenY: 700,
    });
    expect(onReorder).not.toHaveBeenCalled();
  });

  it("requires long-press before touch drag-out begins", () => {
    vi.useFakeTimers();
    const bar = createTabBar({
      barTop: 0,
      barHeight: 40,
      tabRects: [{ left: 0, width: 120 }],
    });
    const tabBarRef = createRef<HTMLElement>();
    tabBarRef.current = bar;

    const onDragOut = vi.fn();
    const onReorder = vi.fn();
    const { result } = renderHook(() =>
      useTabDragOut({ tabBarRef, onDragOut, onReorder })
    );

    act(() => {
      result.current.getTabDragHandlers("tab-1", false).onPointerDown(
        createPointerDownEvent({ clientX: 30, clientY: 20, pointerType: "touch" })
      );
      dispatchPointer("pointermove", 30, 100);
      dispatchPointer("pointerup", 30, 100);
      vi.advanceTimersByTime(250);
    });
    expect(onDragOut).not.toHaveBeenCalled();
  });

  it("starts drag after touch long-press", () => {
    vi.useFakeTimers();
    const bar = createTabBar({
      barTop: 0,
      barHeight: 40,
      tabRects: [{ left: 0, width: 120 }],
    });
    const tabBarRef = createRef<HTMLElement>();
    tabBarRef.current = bar;

    const onDragOut = vi.fn();
    const onReorder = vi.fn();
    const { result } = renderHook(() =>
      useTabDragOut({ tabBarRef, onDragOut, onReorder })
    );

    act(() => {
      result.current.getTabDragHandlers("tab-1", false).onPointerDown(
        createPointerDownEvent({ clientX: 30, clientY: 20, pointerType: "touch" })
      );
      vi.advanceTimersByTime(220);
      dispatchPointer("pointermove", 30, 100);
      dispatchPointer("pointerup", 30, 100);
    });
    expect(onDragOut).toHaveBeenCalledTimes(1);
  });

  it("emits drag move payload during drag-out", () => {
    const bar = createTabBar({
      barTop: 0,
      barHeight: 40,
      tabRects: [{ left: 0, width: 120 }],
    });
    const tabBarRef = createRef<HTMLElement>();
    tabBarRef.current = bar;

    const onDragOut = vi.fn();
    const onReorder = vi.fn();
    const onDragMove = vi.fn();
    const { result } = renderHook(() =>
      useTabDragOut({ tabBarRef, onDragOut, onReorder, onDragMove })
    );

    act(() => {
      result.current.getTabDragHandlers("tab-1", false).onPointerDown(
        createPointerDownEvent({ clientX: 20, clientY: 20 })
      );
      dispatchPointer("pointermove", 20, 120);
    });

    expect(onDragMove).toHaveBeenCalled();
    expect(onDragMove.mock.calls.at(-1)?.[0].mode).toBe("dragout");
  });

  it("ignores non-primary pointer button", () => {
    const bar = createTabBar({
      barTop: 0,
      barHeight: 40,
      tabRects: [{ left: 0, width: 120 }],
    });
    const tabBarRef = createRef<HTMLElement>();
    tabBarRef.current = bar;

    const onDragOut = vi.fn();
    const onReorder = vi.fn();
    const { result } = renderHook(() =>
      useTabDragOut({ tabBarRef, onDragOut, onReorder })
    );

    act(() => {
      result.current.getTabDragHandlers("tab-1", false).onPointerDown(
        createPointerDownEvent({ clientX: 20, clientY: 20, button: 2 })
      );
      dispatchPointer("pointermove", 20, 120);
      dispatchPointer("pointerup", 20, 120);
    });
    expect(onDragOut).not.toHaveBeenCalled();
    expect(onReorder).not.toHaveBeenCalled();
  });

  it("handles reorder mode updates and pointer capture release", () => {
    const bar = createTabBar({
      barTop: 0,
      barHeight: 40,
      tabRects: [
        { left: 0, width: 100 },
        { left: 100, width: 100 },
        { left: 200, width: 100 },
      ],
    });
    const tabBarRef = createRef<HTMLElement>();
    tabBarRef.current = bar;

    const onDragOut = vi.fn();
    const onReorder = vi.fn();
    const onDragMove = vi.fn();
    const { result } = renderHook(() =>
      useTabDragOut({ tabBarRef, onDragOut, onReorder, onDragMove })
    );

    act(() => {
      result.current.getTabDragHandlers("tab-1", false).onPointerDown(
        createPointerDownEvent({ clientX: 10, clientY: 20, hasPointerCapture: true })
      );
      dispatchPointer("pointermove", 220, 20); // enter reorder
      dispatchPointer("pointermove", 260, 20); // reorder branch + autoscroll path
      dispatchPointer("pointerup", 260, 20);
    });

    expect(onReorder).toHaveBeenCalled();
    expect(onDragOut).not.toHaveBeenCalled();
  });

  it("stays pending when tablist is not available", () => {
    const bar = document.createElement("div");
    withRect(bar, { top: 0, left: 0, width: 300, height: 40 });
    document.body.appendChild(bar);

    const tabBarRef = createRef<HTMLElement>();
    tabBarRef.current = bar;
    const onDragOut = vi.fn();
    const onReorder = vi.fn();
    const { result } = renderHook(() =>
      useTabDragOut({ tabBarRef, onDragOut, onReorder })
    );

    act(() => {
      result.current.getTabDragHandlers("tab-1", false).onPointerDown(
        createPointerDownEvent({ clientX: 20, clientY: 20 })
      );
      dispatchPointer("pointermove", 120, 20); // horizontal move but no tablist
      dispatchPointer("pointerup", 120, 20);
    });

    expect(onReorder).not.toHaveBeenCalled();
    expect(onDragOut).not.toHaveBeenCalled();
  });

  it("transitions from reorder to drag-out when leaving vertical band", () => {
    const bar = createTabBar({
      barTop: 0,
      barHeight: 40,
      tabRects: [
        { left: 0, width: 100 },
        { left: 100, width: 100 },
      ],
    });
    const tabBarRef = createRef<HTMLElement>();
    tabBarRef.current = bar;

    const onDragOut = vi.fn();
    const onReorder = vi.fn();
    const { result } = renderHook(() =>
      useTabDragOut({ tabBarRef, onDragOut, onReorder })
    );

    act(() => {
      result.current.getTabDragHandlers("tab-1", false).onPointerDown(
        createPointerDownEvent({ clientX: 20, clientY: 20 })
      );
      dispatchPointer("pointermove", 150, 20); // reorder mode
      dispatchPointer("pointermove", 150, 120); // escape to dragout
      dispatchPointer("pointerup", 150, 120);
    });

    expect(onDragOut).toHaveBeenCalledTimes(1);
    expect(onReorder).not.toHaveBeenCalled();
  });

  it("updates dragPoint via requestAnimationFrame", () => {
    const rafSpy = vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 1;
    });
    const cancelSpy = vi.spyOn(globalThis, "cancelAnimationFrame").mockImplementation(() => {});
    const bar = createTabBar({
      barTop: 0,
      barHeight: 40,
      tabRects: [{ left: 0, width: 120 }],
    });
    const tabBarRef = createRef<HTMLElement>();
    tabBarRef.current = bar;

    const onDragOut = vi.fn();
    const onReorder = vi.fn();
    const { result } = renderHook(() =>
      useTabDragOut({ tabBarRef, onDragOut, onReorder })
    );

    act(() => {
      result.current.getTabDragHandlers("tab-1", false).onPointerDown(
        createPointerDownEvent({ clientX: 20, clientY: 20 })
      );
      dispatchPointer("pointermove", 20, 120);
    });
    expect(result.current.dragPoint?.clientY).toBe(120);

    rafSpy.mockRestore();
    cancelSpy.mockRestore();
  });

  it("tolerates pointer-capture errors", () => {
    const bar = createTabBar({
      barTop: 0,
      barHeight: 40,
      tabRects: [{ left: 0, width: 120 }],
    });
    const tabBarRef = createRef<HTMLElement>();
    tabBarRef.current = bar;
    const onDragOut = vi.fn();
    const onReorder = vi.fn();
    const { result } = renderHook(() =>
      useTabDragOut({ tabBarRef, onDragOut, onReorder })
    );

    act(() => {
      result.current.getTabDragHandlers("tab-1", false).onPointerDown(
        createPointerDownEvent({
          clientX: 20,
          clientY: 20,
          hasPointerCapture: true,
          throwOnSetCapture: true,
          throwOnReleaseCapture: true,
        })
      );
      dispatchPointer("pointermove", 20, 120);
      dispatchPointer("pointerup", 20, 120);
    });

    expect(onDragOut).toHaveBeenCalledTimes(1);
  });

  it("auto-scrolls tablist near left edge in reorder mode", () => {
    const bar = createTabBar({
      barTop: 0,
      barHeight: 40,
      tabRects: [
        { left: 0, width: 120 },
        { left: 120, width: 120 },
        { left: 240, width: 120 },
      ],
    });
    const tabBarRef = createRef<HTMLElement>();
    tabBarRef.current = bar;
    const onDragOut = vi.fn();
    const onReorder = vi.fn();
    const { result } = renderHook(() =>
      useTabDragOut({ tabBarRef, onDragOut, onReorder })
    );
    const tablist = bar.querySelector("[role='tablist']") as HTMLElement;
    tablist.scrollLeft = 50;

    act(() => {
      result.current.getTabDragHandlers("tab-2", false).onPointerDown(
        createPointerDownEvent({ clientX: 180, clientY: 20 })
      );
      dispatchPointer("pointermove", 280, 20); // enter reorder
      dispatchPointer("pointermove", -30, 20); // trigger left autoscroll
      dispatchPointer("pointerup", -30, 20);
    });

    expect(tablist.scrollLeft).toBeLessThan(50);
  });

  it("does not autoscroll when pointer stays in safe center zone", () => {
    const bar = createTabBar({
      barTop: 0,
      barHeight: 40,
      tabRects: [
        { left: 0, width: 120 },
        { left: 120, width: 120 },
      ],
    });
    const tabBarRef = createRef<HTMLElement>();
    tabBarRef.current = bar;
    const onDragOut = vi.fn();
    const onReorder = vi.fn();
    const { result } = renderHook(() =>
      useTabDragOut({ tabBarRef, onDragOut, onReorder })
    );
    const tablist = bar.querySelector("[role='tablist']") as HTMLElement;
    tablist.scrollLeft = 10;

    act(() => {
      result.current.getTabDragHandlers("tab-1", false).onPointerDown(
        createPointerDownEvent({ clientX: 20, clientY: 20 })
      );
      dispatchPointer("pointermove", 170, 20); // enter reorder
      dispatchPointer("pointermove", 150, 20); // center, no autoscroll
      dispatchPointer("pointerup", 150, 20);
    });

    expect(tablist.scrollLeft).toBe(10);
  });

  it("auto-scrolls tablist near right edge in reorder mode", () => {
    const bar = createTabBar({
      barTop: 0,
      barHeight: 40,
      tabRects: [
        { left: 0, width: 120 },
        { left: 120, width: 120 },
        { left: 240, width: 120 },
      ],
    });
    const tabBarRef = createRef<HTMLElement>();
    tabBarRef.current = bar;
    const onDragOut = vi.fn();
    const onReorder = vi.fn();
    const { result } = renderHook(() =>
      useTabDragOut({ tabBarRef, onDragOut, onReorder })
    );
    const tablist = bar.querySelector("[role='tablist']") as HTMLElement;
    tablist.scrollLeft = 0;

    act(() => {
      result.current.getTabDragHandlers("tab-1", false).onPointerDown(
        createPointerDownEvent({ clientX: 20, clientY: 20 })
      );
      dispatchPointer("pointermove", 180, 20); // enter reorder
      dispatchPointer("pointermove", 380, 20); // trigger right autoscroll
      dispatchPointer("pointerup", 380, 20);
    });

    expect(tablist.scrollLeft).toBeGreaterThan(0);
  });
});
