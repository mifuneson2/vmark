/**
 * WindowContext Tests
 *
 * Tests for the WindowProvider, useWindowLabel, and useIsDocumentWindow hooks.
 * Covers: context provider/consumer pattern, label detection, error boundaries,
 * and settings/doc-window branching.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

// --- Mocks (must precede imports) ---

const {
  mockEmit,
  mockListen,
  mockCreateTab,
  mockGetTabsByWindow,
  mockInitDocument,
  mockSetLineMetadata,
  mockAddFile,
  mockRehydrate,
  mockCloseWorkspace,
} = vi.hoisted(() => ({
  mockEmit: vi.fn(),
  mockListen: vi.fn(() => Promise.resolve(vi.fn())),
  mockCreateTab: vi.fn(() => "tab-1"),
  mockGetTabsByWindow: vi.fn(() => [] as unknown[]),
  mockInitDocument: vi.fn(),
  mockSetLineMetadata: vi.fn(),
  mockAddFile: vi.fn(),
  mockRehydrate: vi.fn(),
  mockCloseWorkspace: vi.fn(),
}));

let mockWindowLabel = "main";

vi.mock("@tauri-apps/api/webviewWindow", () => ({
  getCurrentWebviewWindow: () => ({
    label: mockWindowLabel,
    emit: mockEmit,
    listen: mockListen,
    close: vi.fn(),
  }),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@tauri-apps/plugin-fs", () => ({
  readTextFile: vi.fn(() => Promise.resolve("")),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("../stores/documentStore", () => ({
  useDocumentStore: {
    getState: () => ({
      initDocument: mockInitDocument,
      setLineMetadata: mockSetLineMetadata,
      removeDocument: vi.fn(),
    }),
  },
}));

vi.mock("../stores/tabStore", () => ({
  useTabStore: {
    getState: () => ({
      createTab: mockCreateTab,
      getTabsByWindow: mockGetTabsByWindow,
      createTransferredTab: vi.fn(() => "tab-t"),
      updateTabTitle: vi.fn(),
      detachTab: vi.fn(),
    }),
  },
}));

vi.mock("../stores/recentFilesStore", () => ({
  useRecentFilesStore: {
    getState: () => ({ addFile: mockAddFile }),
  },
}));

vi.mock("../stores/workspaceStore", () => ({
  useWorkspaceStore: {
    getState: () => ({
      rootPath: null,
      isWorkspaceMode: false,
      closeWorkspace: mockCloseWorkspace,
    }),
    persist: { rehydrate: mockRehydrate },
  },
}));

vi.mock("../utils/workspaceStorage", () => ({
  setCurrentWindowLabel: vi.fn(),
  migrateWorkspaceStorage: vi.fn(),
  getWorkspaceStorageKey: vi.fn((label: string) => `vmark-workspace:${label}`),
  findActiveWorkspaceLabel: vi.fn(() => null),
}));

vi.mock("../utils/openPolicy", () => ({
  resolveWorkspaceRootForExternalFile: vi.fn(() => null),
}));

vi.mock("../utils/paths", () => ({
  isWithinRoot: vi.fn(() => false),
}));

vi.mock("../hooks/openWorkspaceWithConfig", () => ({
  openWorkspaceWithConfig: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/hooks/useWorkspaceSync", () => ({
  useWorkspaceSync: vi.fn(),
}));

vi.mock("../utils/linebreakDetection", () => ({
  detectLinebreaks: vi.fn(() => ({ type: "lf" })),
}));

vi.mock("@/utils/debug", () => ({
  windowCloseWarn: vi.fn(),
}));

// Now import components under test
import { WindowProvider, useWindowLabel, useIsDocumentWindow } from "./WindowContext";

// Helper wrapper
function Wrapper({ children }: { children: ReactNode }) {
  return <WindowProvider>{children}</WindowProvider>;
}

describe("WindowContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWindowLabel = "main";
    mockGetTabsByWindow.mockReturnValue([]);
    // Reset location.search
    Object.defineProperty(globalThis, "location", {
      value: { search: "" },
      writable: true,
      configurable: true,
    });
  });

  describe("WindowProvider", () => {
    it("renders children after initialization", async () => {
      render(
        <WindowProvider>
          <div data-testid="child">Hello</div>
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("child")).toBeInTheDocument();
      });
    });

    it("emits ready event to Rust after init", async () => {
      vi.useFakeTimers();

      render(
        <WindowProvider>
          <div>content</div>
        </WindowProvider>,
      );

      // Allow async init to complete
      await vi.advanceTimersByTimeAsync(200);

      expect(mockEmit).toHaveBeenCalledWith("ready", "main");

      vi.useRealTimers();
    });

    it("creates initial tab and empty document for main window", async () => {
      render(
        <WindowProvider>
          <div>content</div>
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(mockCreateTab).toHaveBeenCalledWith("main", null);
        expect(mockInitDocument).toHaveBeenCalledWith("tab-1", "", null);
      });
    });

    it("skips document init for settings window", async () => {
      mockWindowLabel = "settings";

      render(
        <WindowProvider>
          <div data-testid="child">Settings</div>
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("child")).toBeInTheDocument();
      });

      // Should not create tabs for settings window
      expect(mockCreateTab).not.toHaveBeenCalled();
    });

    it("skips document init when tabs already exist", async () => {
      mockGetTabsByWindow.mockReturnValue([{ id: "existing-tab" }]);

      render(
        <WindowProvider>
          <div>content</div>
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(mockCreateTab).not.toHaveBeenCalled();
      });
    });

    it("sets up tab:transfer and tab:remove-by-id listeners for doc windows", async () => {
      render(
        <WindowProvider>
          <div>content</div>
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(mockListen).toHaveBeenCalledWith("tab:transfer", expect.any(Function));
        expect(mockListen).toHaveBeenCalledWith("tab:remove-by-id", expect.any(Function));
      });
    });

    it("does not set up tab listeners for settings window", async () => {
      mockWindowLabel = "settings";

      render(
        <WindowProvider>
          <div>content</div>
        </WindowProvider>,
      );

      // Wait for render to settle
      await waitFor(() => {
        expect(screen.getByText("content")).toBeInTheDocument();
      });

      // tab:transfer listener should not be set for settings windows
      const transferCalls = mockListen.mock.calls.filter(
        (call) => call[0] === "tab:transfer",
      );
      expect(transferCalls).toHaveLength(0);
    });

    it("rehydrates workspace store on init", async () => {
      render(
        <WindowProvider>
          <div>content</div>
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(mockRehydrate).toHaveBeenCalled();
      });
    });

    it("closes workspace when main window opens with no file and no workspace param", async () => {
      mockWindowLabel = "main";

      render(
        <WindowProvider>
          <div>content</div>
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(mockCloseWorkspace).toHaveBeenCalled();
      });
    });
  });

  describe("useWindowLabel", () => {
    it("returns the window label from context", async () => {
      let label: string | undefined;

      function Consumer() {
        label = useWindowLabel();
        return <div>{label}</div>;
      }

      render(
        <WindowProvider>
          <Consumer />
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(label).toBe("main");
      });
    });

    it("throws when used outside WindowProvider", () => {
      // Suppress React error boundary console output
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        renderHook(() => useWindowLabel());
      }).toThrow("useWindowLabel must be used within WindowProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("useIsDocumentWindow", () => {
    it("returns true for main window", async () => {
      let isDoc: boolean | undefined;

      function Consumer() {
        isDoc = useIsDocumentWindow();
        return <div>{String(isDoc)}</div>;
      }

      render(
        <WindowProvider>
          <Consumer />
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(isDoc).toBe(true);
      });
    });

    it("returns true for doc-* windows", async () => {
      mockWindowLabel = "doc-123";
      let isDoc: boolean | undefined;

      function Consumer() {
        isDoc = useIsDocumentWindow();
        return <div>{String(isDoc)}</div>;
      }

      render(
        <WindowProvider>
          <Consumer />
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(isDoc).toBe(true);
      });
    });

    it("returns false for settings window", async () => {
      mockWindowLabel = "settings";
      let isDoc: boolean | undefined;

      function Consumer() {
        isDoc = useIsDocumentWindow();
        return <div>{String(isDoc)}</div>;
      }

      render(
        <WindowProvider>
          <Consumer />
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(isDoc).toBe(false);
      });
    });

    it("throws when used outside WindowProvider", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        renderHook(() => useIsDocumentWindow());
      }).toThrow("useIsDocumentWindow must be used within WindowProvider");

      consoleSpy.mockRestore();
    });
  });
});
