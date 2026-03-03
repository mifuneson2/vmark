import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import { handleTabKeyboard } from "./tabKeyboard";

function createKeyboardEvent(overrides: Partial<ReactKeyboardEvent> & { key: string }): ReactKeyboardEvent {
  const { key, ...rest } = overrides;
  return {
    key,
    altKey: false,
    shiftKey: false,
    preventDefault: vi.fn(),
    nativeEvent: { isComposing: false } as unknown as KeyboardEvent,
    ...rest,
  } as unknown as ReactKeyboardEvent;
}

describe("handleTabKeyboard", () => {
  it("reorders left with Alt+Shift+ArrowLeft", () => {
    const onReorder = vi.fn();
    const onActivate = vi.fn();
    const event = createKeyboardEvent({ key: "ArrowLeft", altKey: true, shiftKey: true });

    handleTabKeyboard({
      tabId: "tab-2",
      event,
      tabs: [
        { id: "tab-1", filePath: null, title: "One", isPinned: false },
        { id: "tab-2", filePath: null, title: "Two", isPinned: false },
      ],
      onReorder,
      onActivate,
    });

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(onReorder).toHaveBeenCalledWith("tab-2", 1);
    expect(onActivate).not.toHaveBeenCalled();
  });

  it("reorders right with Alt+Shift+ArrowRight", () => {
    const onReorder = vi.fn();
    const event = createKeyboardEvent({ key: "ArrowRight", altKey: true, shiftKey: true });

    handleTabKeyboard({
      tabId: "tab-2",
      event,
      tabs: [
        { id: "tab-1", filePath: null, title: "One", isPinned: false },
        { id: "tab-2", filePath: null, title: "Two", isPinned: false },
      ],
      onReorder,
      onActivate: vi.fn(),
    });

    expect(onReorder).toHaveBeenCalledWith("tab-2", 3);
  });

  it("activates the tab on Enter", () => {
    const onActivate = vi.fn();
    const event = createKeyboardEvent({ key: "Enter" });

    handleTabKeyboard({
      tabId: "tab-1",
      event,
      tabs: [{ id: "tab-1", filePath: null, title: "One", isPinned: false }],
      onReorder: vi.fn(),
      onActivate,
    });

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(onActivate).toHaveBeenCalledWith("tab-1");
  });

  it("activates the tab on Space", () => {
    const onActivate = vi.fn();
    const event = createKeyboardEvent({ key: " " });

    handleTabKeyboard({
      tabId: "tab-1",
      event,
      tabs: [{ id: "tab-1", filePath: null, title: "One", isPinned: false }],
      onReorder: vi.fn(),
      onActivate,
    });

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(onActivate).toHaveBeenCalledWith("tab-1");
  });

  it("does nothing when tabId is not found in tabs (fromIndex === -1)", () => {
    const onReorder = vi.fn();
    const onActivate = vi.fn();
    const event = createKeyboardEvent({ key: "ArrowLeft", altKey: true, shiftKey: true });

    handleTabKeyboard({
      tabId: "nonexistent",
      event,
      tabs: [{ id: "tab-1", filePath: null, title: "One", isPinned: false }],
      onReorder,
      onActivate,
    });

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(onReorder).not.toHaveBeenCalled();
  });

  it("does nothing for unrelated keys", () => {
    const onReorder = vi.fn();
    const onActivate = vi.fn();
    const event = createKeyboardEvent({ key: "a" });

    handleTabKeyboard({
      tabId: "tab-1",
      event,
      tabs: [{ id: "tab-1", filePath: null, title: "One", isPinned: false }],
      onReorder,
      onActivate,
    });

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(onReorder).not.toHaveBeenCalled();
    expect(onActivate).not.toHaveBeenCalled();
  });

  it("ignores key handling during IME composition", () => {
    const onReorder = vi.fn();
    const onActivate = vi.fn();
    const event = createKeyboardEvent({
      key: "ArrowRight",
      altKey: true,
      shiftKey: true,
      nativeEvent: { isComposing: true } as unknown as KeyboardEvent,
    });

    handleTabKeyboard({
      tabId: "tab-1",
      event,
      tabs: [{ id: "tab-1", filePath: null, title: "One", isPinned: false }],
      onReorder,
      onActivate,
    });

    expect(onReorder).not.toHaveBeenCalled();
    expect(onActivate).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});
