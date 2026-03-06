import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useQuickOpenStore } from "@/components/QuickOpen/quickOpenStore";

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(() => Promise.resolve(vi.fn())),
}));

vi.mock("@/stores/shortcutsStore", () => ({
  useShortcutsStore: {
    getState: () => ({ getShortcut: (id: string) => id === "quickOpen" ? "Mod-o" : "" }),
  },
}));

vi.mock("@/utils/shortcutMatch", () => ({
  matchesShortcutEvent: vi.fn((e: KeyboardEvent, key: string) => {
    return key === "Mod-o" && e.key === "o" && e.metaKey;
  }),
}));

vi.mock("@/utils/imeGuard", () => ({
  isImeKeyEvent: vi.fn(() => false),
}));

vi.mock("@/utils/safeUnlisten", () => ({
  safeUnlistenAsync: vi.fn(),
}));

import { useQuickOpenShortcuts } from "./useQuickOpenShortcuts";

beforeEach(() => {
  useQuickOpenStore.setState({ isOpen: false });
});

describe("useQuickOpenShortcuts", () => {
  it("toggles Quick Open on Cmd+O keydown", () => {
    renderHook(() => useQuickOpenShortcuts());

    const event = new KeyboardEvent("keydown", { key: "o", metaKey: true });
    window.dispatchEvent(event);

    expect(useQuickOpenStore.getState().isOpen).toBe(true);
  });

  it("closes Quick Open on second Cmd+O", () => {
    useQuickOpenStore.setState({ isOpen: true });
    renderHook(() => useQuickOpenShortcuts());

    const event = new KeyboardEvent("keydown", { key: "o", metaKey: true });
    window.dispatchEvent(event);

    expect(useQuickOpenStore.getState().isOpen).toBe(false);
  });
});
