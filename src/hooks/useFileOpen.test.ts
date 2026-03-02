/**
 * Tests for useFileOpen utilities
 *
 * Tests openFileInNewTabCore, openFileInNewTab, handleOpenFile, handleNew.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

const mockReadTextFile = vi.fn();
vi.mock("@tauri-apps/plugin-fs", () => ({
  readTextFile: (...args: unknown[]) => mockReadTextFile(...args),
}));

const mockOpen = vi.fn();
vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: (...args: unknown[]) => mockOpen(...args),
}));

const mockInvoke = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/utils/perfLog", () => ({
  perfReset: vi.fn(),
  perfStart: vi.fn(),
  perfEnd: vi.fn(),
  perfMark: vi.fn(),
}));

vi.mock("@/utils/linebreakDetection", () => ({
  detectLinebreaks: () => ({ kind: "lf" }),
}));

vi.mock("@/utils/reentryGuard", () => ({
  withReentryGuard: vi.fn(
    async (_wl: string, _key: string, fn: () => Promise<void>) => fn()
  ),
}));

const mockResolveOpenAction = vi.fn();
vi.mock("@/utils/openPolicy", () => ({
  resolveOpenAction: (...args: unknown[]) => mockResolveOpenAction(...args),
}));

const mockOpenWorkspaceWithConfig = vi.fn();
vi.mock("@/hooks/openWorkspaceWithConfig", () => ({
  openWorkspaceWithConfig: (...args: unknown[]) => mockOpenWorkspaceWithConfig(...args),
}));

const mockGetReplaceableTab = vi.fn(() => null);
const mockFindExistingTabForPath = vi.fn(() => null);
vi.mock("@/hooks/useReplaceableTab", () => ({
  getReplaceableTab: (...args: unknown[]) => mockGetReplaceableTab(...args),
  findExistingTabForPath: (...args: unknown[]) => mockFindExistingTabForPath(...args),
}));

const mockCreateUntitledTab = vi.fn();
vi.mock("@/utils/newFile", () => ({
  createUntitledTab: (...args: unknown[]) => mockCreateUntitledTab(...args),
}));

import {
  openFileInNewTabCore,
  openFileInNewTab,
  handleOpenFile,
  handleNew,
} from "./useFileOpen";
import { useDocumentStore } from "@/stores/documentStore";
import { useTabStore } from "@/stores/tabStore";
import { useRecentFilesStore } from "@/stores/recentFilesStore";

const WINDOW = "main";

describe("openFileInNewTabCore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset stores
    useTabStore.getState().removeWindow(WINDOW);
    Object.keys(useDocumentStore.getState().documents).forEach((id) =>
      useDocumentStore.getState().removeDocument(id)
    );
  });

  it("creates a tab, reads file, and initializes document", async () => {
    mockReadTextFile.mockResolvedValue("# Hello");
    const initDocSpy = vi.spyOn(useDocumentStore.getState(), "initDocument");
    const addFileSpy = vi.spyOn(useRecentFilesStore.getState(), "addFile");

    await openFileInNewTabCore(WINDOW, "/docs/hello.md");

    expect(mockReadTextFile).toHaveBeenCalledWith("/docs/hello.md");
    expect(initDocSpy).toHaveBeenCalled();
    expect(addFileSpy).toHaveBeenCalledWith("/docs/hello.md");
  });

  it("cleans up orphaned tab on read failure", async () => {
    mockReadTextFile.mockRejectedValue(new Error("ENOENT"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const tabsBefore = useTabStore.getState().getTabsByWindow(WINDOW).length;
    await openFileInNewTabCore(WINDOW, "/docs/missing.md");
    const tabsAfter = useTabStore.getState().getTabsByWindow(WINDOW).length;

    // Tab should be cleaned up (detached)
    expect(tabsAfter).toBe(tabsBefore);
    errorSpy.mockRestore();
  });

  it("skips content loading when tab is deduped", async () => {
    // Create a tab first for the same path
    useTabStore.getState().createTab(WINDOW, "/docs/existing.md");

    await openFileInNewTabCore(WINDOW, "/docs/existing.md");

    // Should not read the file since it was deduped
    expect(mockReadTextFile).not.toHaveBeenCalled();
  });
});

describe("openFileInNewTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTabStore.getState().removeWindow(WINDOW);
    Object.keys(useDocumentStore.getState().documents).forEach((id) =>
      useDocumentStore.getState().removeDocument(id)
    );
  });

  it("activates existing tab if file already open", async () => {
    const tabId = useTabStore.getState().createTab(WINDOW, "/docs/open.md");
    mockFindExistingTabForPath.mockReturnValue(tabId);
    const setActiveSpy = vi.spyOn(useTabStore.getState(), "setActiveTab");

    await openFileInNewTab(WINDOW, "/docs/open.md");

    expect(setActiveSpy).toHaveBeenCalledWith(WINDOW, tabId);
    expect(mockReadTextFile).not.toHaveBeenCalled();
  });

  it("creates new tab when no existing tab found", async () => {
    mockFindExistingTabForPath.mockReturnValue(null);
    mockReadTextFile.mockResolvedValue("content");

    await openFileInNewTab(WINDOW, "/docs/new.md");

    expect(mockReadTextFile).toHaveBeenCalledWith("/docs/new.md");
  });
});

describe("handleOpenFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTabStore.getState().removeWindow(WINDOW);
  });

  it("activates existing tab if found", async () => {
    const tabId = useTabStore.getState().createTab(WINDOW, "/docs/file.md");
    mockFindExistingTabForPath.mockReturnValue(tabId);
    const setActiveSpy = vi.spyOn(useTabStore.getState(), "setActiveTab");

    await handleOpenFile(WINDOW, "/docs/file.md");

    expect(setActiveSpy).toHaveBeenCalledWith(WINDOW, tabId);
  });

  it("opens in new tab when no existing tab", async () => {
    mockFindExistingTabForPath.mockReturnValue(null);
    mockReadTextFile.mockResolvedValue("# Content");

    await handleOpenFile(WINDOW, "/docs/new.md");

    expect(mockReadTextFile).toHaveBeenCalledWith("/docs/new.md");
  });
});

describe("handleNew", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an untitled tab", () => {
    handleNew(WINDOW);
    expect(mockCreateUntitledTab).toHaveBeenCalledWith(WINDOW);
  });
});
