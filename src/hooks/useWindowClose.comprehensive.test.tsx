/**
 * Comprehensive tests for useWindowClose hook
 *
 * Tests window close-requested handling, quit-requested, dirty document
 * prompts, workspace session persistence, and re-entry guard.
 */

import { render, act, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { useTabStore } from "@/stores/tabStore";
import { useDocumentStore } from "@/stores/documentStore";

type EventHandler = (event: { payload: string }) => void | Promise<void>;
const listeners = new Map<string, EventHandler>();

vi.mock("@tauri-apps/api/webviewWindow", () => ({
  getCurrentWebviewWindow: () => ({
    label: "main",
    listen: vi.fn((eventName: string, handler: EventHandler) => {
      listeners.set(eventName, handler);
      return Promise.resolve(() => {});
    }),
  }),
}));

const mockCloseTabWithDirtyCheck = vi.fn(
  (_windowLabel: string, _tabId: string) => Promise.resolve(true)
);
vi.mock("@/hooks/useTabOperations", () => ({
  closeTabWithDirtyCheck: (windowLabel: string, tabId: string) =>
    mockCloseTabWithDirtyCheck(windowLabel, tabId),
}));

const mockPromptSaveForDirtyDocument = vi.fn();
const mockPromptSaveForMultipleDocuments = vi.fn();
vi.mock("@/hooks/closeSave", () => ({
  promptSaveForDirtyDocument: (...args: unknown[]) =>
    mockPromptSaveForDirtyDocument(...args),
  promptSaveForMultipleDocuments: (...args: unknown[]) =>
    mockPromptSaveForMultipleDocuments(...args),
}));

const mockPersistWorkspaceSession = vi.fn(() => Promise.resolve());
vi.mock("@/hooks/workspaceSession", () => ({
  persistWorkspaceSession: (...args: unknown[]) =>
    mockPersistWorkspaceSession(...args),
}));

vi.mock("@/contexts/WindowContext", () => ({
  useWindowLabel: () => "main",
}));

import { useWindowClose } from "./useWindowClose";

const WINDOW = "main";

function TestHarness() {
  useWindowClose();
  return null;
}

function resetStores() {
  useTabStore.getState().removeWindow(WINDOW);
  Object.keys(useDocumentStore.getState().documents).forEach((id) =>
    useDocumentStore.getState().removeDocument(id)
  );
}

describe("useWindowClose — window:close-requested", () => {
  beforeEach(() => {
    listeners.clear();
    resetStores();
    vi.clearAllMocks();
    vi.mocked(invoke).mockResolvedValue(undefined);
  });

  it("registers event listeners", async () => {
    await act(async () => {
      render(<TestHarness />);
    });
    await waitFor(() => {
      expect(listeners.has("menu:close")).toBe(true);
      expect(listeners.has("window:close-requested")).toBe(true);
      expect(listeners.has("app:quit-requested")).toBe(true);
    });
  });

  it("closes window with no tabs (no dirty check needed)", async () => {
    await act(async () => {
      render(<TestHarness />);
    });
    await waitFor(() => expect(listeners.has("window:close-requested")).toBe(true));

    await act(async () => {
      await listeners.get("window:close-requested")!({ payload: WINDOW });
    });

    expect(mockPersistWorkspaceSession).toHaveBeenCalledWith(WINDOW);
    expect(invoke).toHaveBeenCalledWith("close_window", { label: WINDOW });
  });

  it("closes window with clean tabs (no dirty documents)", async () => {
    const tabId = useTabStore.getState().createTab(WINDOW, null);
    useDocumentStore.getState().initDocument(tabId, "", null);
    // isDirty should be false for a fresh document

    await act(async () => {
      render(<TestHarness />);
    });
    await waitFor(() => expect(listeners.has("window:close-requested")).toBe(true));

    await act(async () => {
      await listeners.get("window:close-requested")!({ payload: WINDOW });
    });

    expect(invoke).toHaveBeenCalledWith("close_window", { label: WINDOW });
  });

  it("prompts save for a single dirty document", async () => {
    const tabId = useTabStore.getState().createTab(WINDOW, null);
    useDocumentStore.getState().initDocument(tabId, "initial", null);
    useDocumentStore.getState().setContent(tabId, "modified");

    mockPromptSaveForDirtyDocument.mockResolvedValue({ action: "saved" });

    await act(async () => {
      render(<TestHarness />);
    });
    await waitFor(() => expect(listeners.has("window:close-requested")).toBe(true));

    await act(async () => {
      await listeners.get("window:close-requested")!({ payload: WINDOW });
    });

    expect(mockPromptSaveForDirtyDocument).toHaveBeenCalled();
    expect(invoke).toHaveBeenCalledWith("close_window", { label: WINDOW });
  });

  it("does not close when single dirty save is cancelled", async () => {
    const tabId = useTabStore.getState().createTab(WINDOW, null);
    useDocumentStore.getState().initDocument(tabId, "initial", null);
    useDocumentStore.getState().setContent(tabId, "modified");

    mockPromptSaveForDirtyDocument.mockResolvedValue({ action: "cancelled" });

    await act(async () => {
      render(<TestHarness />);
    });
    await waitFor(() => expect(listeners.has("window:close-requested")).toBe(true));

    await act(async () => {
      await listeners.get("window:close-requested")!({ payload: WINDOW });
    });

    expect(invoke).not.toHaveBeenCalledWith("close_window", expect.anything());
  });

  it("prompts multi-save for multiple dirty documents", async () => {
    const tab1 = useTabStore.getState().createTab(WINDOW, null);
    const tab2 = useTabStore.getState().createTab(WINDOW, null);
    useDocumentStore.getState().initDocument(tab1, "initial1", null);
    useDocumentStore.getState().initDocument(tab2, "initial2", null);
    useDocumentStore.getState().setContent(tab1, "dirty1");
    useDocumentStore.getState().setContent(tab2, "dirty2");

    mockPromptSaveForMultipleDocuments.mockResolvedValue({ action: "saved" });

    await act(async () => {
      render(<TestHarness />);
    });
    await waitFor(() => expect(listeners.has("window:close-requested")).toBe(true));

    await act(async () => {
      await listeners.get("window:close-requested")!({ payload: WINDOW });
    });

    expect(mockPromptSaveForMultipleDocuments).toHaveBeenCalled();
    expect(invoke).toHaveBeenCalledWith("close_window", { label: WINDOW });
  });

  it("does not close when multi-save is cancelled", async () => {
    const tab1 = useTabStore.getState().createTab(WINDOW, null);
    const tab2 = useTabStore.getState().createTab(WINDOW, null);
    useDocumentStore.getState().initDocument(tab1, "initial1", null);
    useDocumentStore.getState().initDocument(tab2, "initial2", null);
    useDocumentStore.getState().setContent(tab1, "dirty1");
    useDocumentStore.getState().setContent(tab2, "dirty2");

    mockPromptSaveForMultipleDocuments.mockResolvedValue({ action: "cancelled" });

    await act(async () => {
      render(<TestHarness />);
    });
    await waitFor(() => expect(listeners.has("window:close-requested")).toBe(true));

    await act(async () => {
      await listeners.get("window:close-requested")!({ payload: WINDOW });
    });

    expect(invoke).not.toHaveBeenCalledWith("close_window", expect.anything());
  });

  it("ignores close-requested for a different window", async () => {
    await act(async () => {
      render(<TestHarness />);
    });
    await waitFor(() => expect(listeners.has("window:close-requested")).toBe(true));

    await act(async () => {
      await listeners.get("window:close-requested")!({ payload: "other-window" });
    });

    expect(invoke).not.toHaveBeenCalledWith("close_window", expect.anything());
  });

  it("cleans up documents on close", async () => {
    const tabId = useTabStore.getState().createTab(WINDOW, null);
    useDocumentStore.getState().initDocument(tabId, "content", null);

    await act(async () => {
      render(<TestHarness />);
    });
    await waitFor(() => expect(listeners.has("window:close-requested")).toBe(true));

    await act(async () => {
      await listeners.get("window:close-requested")!({ payload: WINDOW });
    });

    // Document should be removed
    expect(useDocumentStore.getState().getDocument(tabId)).toBeUndefined();
  });
});

describe("useWindowClose — app:quit-requested", () => {
  beforeEach(() => {
    listeners.clear();
    resetStores();
    vi.clearAllMocks();
    vi.mocked(invoke).mockResolvedValue(undefined);
  });

  it("closes window on quit request", async () => {
    await act(async () => {
      render(<TestHarness />);
    });
    await waitFor(() => expect(listeners.has("app:quit-requested")).toBe(true));

    await act(async () => {
      await listeners.get("app:quit-requested")!({ payload: WINDOW });
    });

    expect(invoke).toHaveBeenCalledWith("close_window", { label: WINDOW });
  });

  it("calls cancel_quit when close is cancelled", async () => {
    const tabId = useTabStore.getState().createTab(WINDOW, null);
    useDocumentStore.getState().initDocument(tabId, "initial", null);
    useDocumentStore.getState().setContent(tabId, "dirty");

    mockPromptSaveForDirtyDocument.mockResolvedValue({ action: "cancelled" });

    await act(async () => {
      render(<TestHarness />);
    });
    await waitFor(() => expect(listeners.has("app:quit-requested")).toBe(true));

    await act(async () => {
      await listeners.get("app:quit-requested")!({ payload: WINDOW });
    });

    expect(invoke).toHaveBeenCalledWith("cancel_quit");
  });

  it("ignores quit request for a different window", async () => {
    await act(async () => {
      render(<TestHarness />);
    });
    await waitFor(() => expect(listeners.has("app:quit-requested")).toBe(true));

    await act(async () => {
      await listeners.get("app:quit-requested")!({ payload: "other-window" });
    });

    expect(invoke).not.toHaveBeenCalledWith("close_window", expect.anything());
  });
});
