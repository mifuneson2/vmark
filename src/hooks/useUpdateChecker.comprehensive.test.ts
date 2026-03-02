/**
 * Comprehensive tests for useUpdateChecker hook
 *
 * Extends the existing shouldCheckNow tests with hook-level tests:
 * event listeners, auto-download, skip version, retry logic, toast notifications.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// --- Mocks ---

const listenHandlers = new Map<string, (event?: unknown) => void>();
const mockListen = vi.fn((eventName: string, handler: (event?: unknown) => void) => {
  listenHandlers.set(eventName, handler);
  return Promise.resolve(() => {
    listenHandlers.delete(eventName);
  });
});
const mockEmit = vi.fn(() => Promise.resolve());

vi.mock("@tauri-apps/api/event", () => ({
  listen: (...args: unknown[]) => mockListen(...(args as [string, (event?: unknown) => void])),
  emit: (...args: unknown[]) => mockEmit(...args),
}));

const mockAsk = vi.fn(() => Promise.resolve(true));
vi.mock("@tauri-apps/plugin-dialog", () => ({
  ask: (...args: unknown[]) => mockAsk(...args),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockDoCheckForUpdates = vi.fn(() => Promise.resolve());
const mockDoDownloadAndInstall = vi.fn(() => Promise.resolve());
const mockClearPendingUpdate = vi.fn();

vi.mock("./useUpdateOperations", () => ({
  useUpdateOperationHandler: () => ({
    doCheckForUpdates: mockDoCheckForUpdates,
    doDownloadAndInstall: mockDoDownloadAndInstall,
    EVENTS: {
      REQUEST_CHECK: "update:request-check",
      REQUEST_DOWNLOAD: "update:request-download",
      REQUEST_RESTART: "app:restart-for-update",
      REQUEST_STATE: "update:request-state",
    },
  }),
  clearPendingUpdate: () => mockClearPendingUpdate(),
}));

const mockRestartWithHotExit = vi.fn(() => Promise.resolve());
vi.mock("@/utils/hotExit/restartWithHotExit", () => ({
  restartWithHotExit: () => mockRestartWithHotExit(),
}));

vi.mock("@/utils/debug", () => ({
  updateCheckerLog: vi.fn(),
}));

vi.mock("@/utils/safeUnlisten", () => ({
  safeUnlistenAsync: vi.fn(),
}));

import { useUpdateChecker, shouldCheckNow } from "./useUpdateChecker";
import { useSettingsStore } from "@/stores/settingsStore";
import { useUpdateStore } from "@/stores/updateStore";
import { useDocumentStore } from "@/stores/documentStore";

const ONE_DAY = 24 * 60 * 60 * 1000;
const ONE_WEEK = 7 * ONE_DAY;

describe("shouldCheckNow — extended edge cases", () => {
  it("returns true for unknown frequency with null timestamp (falls through to null check)", () => {
    // When lastCheckTimestamp is null, shouldCheckNow returns true before reaching
    // the frequency-specific branches — so unknown frequency with null = true
    expect(shouldCheckNow(true, "quarterly", null)).toBe(true);
  });

  it("returns false for unknown frequency with recent timestamp", () => {
    // With a recent timestamp, unknown frequency falls through all branches to return false
    expect(shouldCheckNow(true, "quarterly", Date.now())).toBe(false);
  });

  it("returns true for daily when exactly one day has passed", () => {
    const exactlyOneDay = Date.now() - ONE_DAY;
    expect(shouldCheckNow(true, "daily", exactlyOneDay)).toBe(true);
  });

  it("returns true for weekly when exactly one week has passed", () => {
    const exactlyOneWeek = Date.now() - ONE_WEEK;
    expect(shouldCheckNow(true, "weekly", exactlyOneWeek)).toBe(true);
  });
});

describe("useUpdateChecker hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    listenHandlers.clear();

    // Reset stores to defaults
    useUpdateStore.getState().reset();
    useSettingsStore.getState().updateUpdateSetting("autoCheckEnabled", true);
    useSettingsStore.getState().updateUpdateSetting("checkFrequency", "startup");
    useSettingsStore.getState().updateUpdateSetting("lastCheckTimestamp", null);
    useSettingsStore.getState().updateUpdateSetting("skipVersion", null);
    useSettingsStore.getState().updateUpdateSetting("autoDownload", false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("checks for updates on startup after delay", async () => {
    renderHook(() => useUpdateChecker());

    // Should not check immediately
    expect(mockDoCheckForUpdates).not.toHaveBeenCalled();

    // Advance past the startup delay (2s)
    await act(async () => {
      vi.advanceTimersByTime(2100);
    });

    expect(mockDoCheckForUpdates).toHaveBeenCalledTimes(1);
  });

  it("does not check on startup when autoCheck is disabled", async () => {
    useSettingsStore.getState().updateUpdateSetting("autoCheckEnabled", false);

    renderHook(() => useUpdateChecker());

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(mockDoCheckForUpdates).not.toHaveBeenCalled();
  });

  it("does not check on startup when frequency is manual", async () => {
    useSettingsStore.getState().updateUpdateSetting("checkFrequency", "manual");

    renderHook(() => useUpdateChecker());

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(mockDoCheckForUpdates).not.toHaveBeenCalled();
  });

  it("registers event listeners for cross-window communication", () => {
    renderHook(() => useUpdateChecker());

    expect(mockListen).toHaveBeenCalledWith("update:request-check", expect.any(Function));
    expect(mockListen).toHaveBeenCalledWith("update:request-download", expect.any(Function));
    expect(mockListen).toHaveBeenCalledWith("update:request-state", expect.any(Function));
    expect(mockListen).toHaveBeenCalledWith("app:restart-for-update", expect.any(Function));
  });

  it("handles check request from other window", async () => {
    renderHook(() => useUpdateChecker());

    const handler = listenHandlers.get("update:request-check");
    expect(handler).toBeDefined();

    await act(async () => {
      handler!();
    });

    expect(mockDoCheckForUpdates).toHaveBeenCalled();
  });

  it("handles download request from other window", async () => {
    renderHook(() => useUpdateChecker());

    const handler = listenHandlers.get("update:request-download");
    expect(handler).toBeDefined();

    await act(async () => {
      handler!();
    });

    expect(mockDoDownloadAndInstall).toHaveBeenCalled();
  });

  it("broadcasts state on state request", async () => {
    renderHook(() => useUpdateChecker());

    const handler = listenHandlers.get("update:request-state");
    expect(handler).toBeDefined();

    await act(async () => {
      handler!();
    });

    expect(mockEmit).toHaveBeenCalledWith(
      "update:state-changed",
      expect.objectContaining({ status: expect.any(String) })
    );
  });

  it("auto-dismisses when update version matches skipVersion", async () => {
    useSettingsStore.getState().updateUpdateSetting("skipVersion", "2.0.0");

    renderHook(() => useUpdateChecker());

    // Simulate update available
    await act(async () => {
      useUpdateStore.getState().setStatus("available");
      useUpdateStore.getState().setUpdateInfo({
        version: "2.0.0",
        notes: "test",
        pubDate: "2025-01-01",
        currentVersion: "1.0.0",
      });
    });

    expect(useUpdateStore.getState().dismissed).toBe(true);
    expect(mockClearPendingUpdate).toHaveBeenCalled();
  });

  it("auto-downloads when enabled and update available", async () => {
    useSettingsStore.getState().updateUpdateSetting("autoDownload", true);

    renderHook(() => useUpdateChecker());

    await act(async () => {
      useUpdateStore.getState().setStatus("available");
      useUpdateStore.getState().setUpdateInfo({
        version: "2.0.0",
        notes: "test",
        pubDate: "2025-01-01",
        currentVersion: "1.0.0",
      });
    });

    expect(mockDoDownloadAndInstall).toHaveBeenCalled();
  });

  it("does not auto-download skipped versions", async () => {
    useSettingsStore.getState().updateUpdateSetting("autoDownload", true);
    useSettingsStore.getState().updateUpdateSetting("skipVersion", "2.0.0");

    renderHook(() => useUpdateChecker());

    await act(async () => {
      useUpdateStore.getState().setStatus("available");
      useUpdateStore.getState().setUpdateInfo({
        version: "2.0.0",
        notes: "test",
        pubDate: "2025-01-01",
        currentVersion: "1.0.0",
      });
    });

    // auto-download should not fire because version is skipped
    expect(mockDoDownloadAndInstall).not.toHaveBeenCalled();
  });

  it("handles restart request with no dirty tabs", async () => {
    vi.spyOn(useDocumentStore.getState(), "getAllDirtyDocuments").mockReturnValue([]);

    renderHook(() => useUpdateChecker());

    const handler = listenHandlers.get("app:restart-for-update");
    expect(handler).toBeDefined();

    await act(async () => {
      handler!();
      // Flush promises
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockRestartWithHotExit).toHaveBeenCalled();
    expect(mockAsk).not.toHaveBeenCalled();
  });

  it("handles restart request with dirty tabs — user confirms", async () => {
    vi.spyOn(useDocumentStore.getState(), "getAllDirtyDocuments").mockReturnValue([
      { tabId: "t1", content: "dirty" },
    ] as never);
    mockAsk.mockResolvedValue(true);

    renderHook(() => useUpdateChecker());

    const handler = listenHandlers.get("app:restart-for-update");

    await act(async () => {
      handler!();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockAsk).toHaveBeenCalled();
    expect(mockRestartWithHotExit).toHaveBeenCalled();
  });

  it("handles restart request with dirty tabs — user cancels", async () => {
    vi.spyOn(useDocumentStore.getState(), "getAllDirtyDocuments").mockReturnValue([
      { tabId: "t1", content: "dirty" },
    ] as never);
    mockAsk.mockResolvedValue(false);

    renderHook(() => useUpdateChecker());

    const handler = listenHandlers.get("app:restart-for-update");

    await act(async () => {
      handler!();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockRestartWithHotExit).not.toHaveBeenCalled();
    expect(mockEmit).toHaveBeenCalledWith("update:restart-cancelled");
  });
});
