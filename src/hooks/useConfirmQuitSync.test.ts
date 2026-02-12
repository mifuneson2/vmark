import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSettingsStore } from "@/stores/settingsStore";

const mockInvoke = vi.fn().mockResolvedValue(undefined);
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

// Import AFTER mocks are set up (vitest hoists vi.mock)
const { useConfirmQuitSync } = await import("./useConfirmQuitSync");

beforeEach(() => {
  mockInvoke.mockClear();
  useSettingsStore.getState().resetSettings();
});

describe("useConfirmQuitSync", () => {
  it("calls set_confirm_quit on mount with default value", () => {
    renderHook(() => useConfirmQuitSync());

    expect(mockInvoke).toHaveBeenCalledWith("set_confirm_quit", { enabled: true });
  });

  it("calls set_confirm_quit when setting changes to false", () => {
    const { rerender } = renderHook(() => useConfirmQuitSync());
    mockInvoke.mockClear();

    act(() => {
      useSettingsStore.getState().updateGeneralSetting("confirmQuit", false);
    });
    rerender();

    expect(mockInvoke).toHaveBeenCalledWith("set_confirm_quit", { enabled: false });
  });

  it("calls set_confirm_quit when setting changes back to true", () => {
    act(() => {
      useSettingsStore.getState().updateGeneralSetting("confirmQuit", false);
    });
    const { rerender } = renderHook(() => useConfirmQuitSync());
    mockInvoke.mockClear();

    act(() => {
      useSettingsStore.getState().updateGeneralSetting("confirmQuit", true);
    });
    rerender();

    expect(mockInvoke).toHaveBeenCalledWith("set_confirm_quit", { enabled: true });
  });

  it("handles invoke rejection gracefully", () => {
    mockInvoke.mockRejectedValueOnce(new Error("command not found"));

    // Should not throw
    expect(() => renderHook(() => useConfirmQuitSync())).not.toThrow();
  });

  it("sends final value after rapid toggles", () => {
    const { rerender } = renderHook(() => useConfirmQuitSync());
    mockInvoke.mockClear();

    act(() => {
      useSettingsStore.getState().updateGeneralSetting("confirmQuit", false);
      useSettingsStore.getState().updateGeneralSetting("confirmQuit", true);
      useSettingsStore.getState().updateGeneralSetting("confirmQuit", false);
    });
    rerender();

    // Last call should reflect the final state
    const lastCall = mockInvoke.mock.calls[mockInvoke.mock.calls.length - 1];
    expect(lastCall).toEqual(["set_confirm_quit", { enabled: false }]);
  });
});
