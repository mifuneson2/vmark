import { describe, expect, it, vi, beforeEach } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { restoreTransferredTab, transferTabFromDragOut } from "./tabTransferActions";
import type { TabTransferPayload } from "@/types/tabTransfer";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    message: vi.fn(),
  },
}));

// Mock debug logger
vi.mock("@/utils/debug", () => ({
  windowCloseWarn: vi.fn(),
}));

// Mock stores
const mockCreateTransferredTab = vi.fn(() => "restored-tab-id");
const mockInitDocument = vi.fn();
const mockGetTabsByWindow = vi.fn();
const mockDetachTab = vi.fn();
const mockRemoveDocument = vi.fn();
const mockGetDocument = vi.fn();

vi.mock("@/stores/tabStore", () => ({
  useTabStore: {
    getState: () => ({
      createTransferredTab: mockCreateTransferredTab,
      getTabsByWindow: mockGetTabsByWindow,
      detachTab: mockDetachTab,
    }),
  },
}));

vi.mock("@/stores/documentStore", () => ({
  useDocumentStore: {
    getState: () => ({
      initDocument: mockInitDocument,
      getDocument: mockGetDocument,
      removeDocument: mockRemoveDocument,
    }),
  },
}));

vi.mock("@/stores/workspaceStore", () => ({
  useWorkspaceStore: {
    getState: () => ({
      rootPath: "/workspace",
    }),
  },
}));

const mockInvoke = vi.mocked(invoke);

const baseTransferData: TabTransferPayload = {
  tabId: "tab-1",
  title: "Test Document",
  filePath: "/path/to/file.md",
  content: "# Hello",
  savedContent: "# Hello",
  isDirty: false,
  workspaceRoot: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("restoreTransferredTab", () => {
  it("removes tab from target window via invoke", async () => {
    await restoreTransferredTab("main", "window-2", baseTransferData);
    expect(mockInvoke).toHaveBeenCalledWith("remove_tab_from_window", {
      targetWindowLabel: "window-2",
      tabId: "tab-1",
    });
  });

  it("creates transferred tab in source window", async () => {
    await restoreTransferredTab("main", "window-2", baseTransferData);
    expect(mockCreateTransferredTab).toHaveBeenCalledWith("main", {
      id: "tab-1",
      filePath: "/path/to/file.md",
      title: "Test Document",
      isPinned: false,
    });
  });

  it("initializes document with transfer data", async () => {
    await restoreTransferredTab("main", "window-2", baseTransferData);
    expect(mockInitDocument).toHaveBeenCalledWith(
      "restored-tab-id",
      "# Hello",
      "/path/to/file.md",
      "# Hello"
    );
  });

  it("handles null filePath", async () => {
    const data = { ...baseTransferData, filePath: null };
    await restoreTransferredTab("main", "window-2", data);
    expect(mockCreateTransferredTab).toHaveBeenCalledWith("main", {
      id: "tab-1",
      filePath: null,
      title: "Test Document",
      isPinned: false,
    });
    expect(mockInitDocument).toHaveBeenCalledWith(
      "restored-tab-id",
      "# Hello",
      null,
      "# Hello"
    );
  });
});

describe("transferTabFromDragOut", () => {
  const defaultOptions = {
    tabId: "tab-1",
    point: { screenX: 100, screenY: 200 },
    windowLabel: "main",
    triggerSnapback: vi.fn(),
    announce: vi.fn(),
  };

  function setupTabsAndDoc() {
    mockGetTabsByWindow.mockReturnValue([
      { id: "tab-1", title: "Doc 1", filePath: "/file1.md", isPinned: false },
      { id: "tab-2", title: "Doc 2", filePath: "/file2.md", isPinned: false },
    ]);
    mockGetDocument.mockReturnValue({
      content: "# Content",
      savedContent: "# Content",
      isDirty: false,
    });
  }

  it("does nothing if tab not found", async () => {
    mockGetTabsByWindow.mockReturnValue([]);
    await transferTabFromDragOut(defaultOptions);
    expect(mockInvoke).not.toHaveBeenCalled();
    expect(defaultOptions.triggerSnapback).not.toHaveBeenCalled();
  });

  it("blocks last tab in main window", async () => {
    mockGetTabsByWindow.mockReturnValue([
      { id: "tab-1", title: "Only Tab", filePath: null, isPinned: false },
    ]);
    await transferTabFromDragOut(defaultOptions);
    expect(defaultOptions.triggerSnapback).toHaveBeenCalledWith("tab-1");
    expect(defaultOptions.announce).toHaveBeenCalledWith(
      "Cannot move the last tab in the main window."
    );
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it("allows last tab from non-main window", async () => {
    mockGetTabsByWindow.mockReturnValue([
      { id: "tab-1", title: "Only Tab", filePath: null, isPinned: false },
    ]);
    mockGetDocument.mockReturnValue({
      content: "content",
      savedContent: "content",
      isDirty: false,
    });
    mockInvoke.mockResolvedValueOnce("window-2"); // find_drop_target_window
    mockInvoke.mockResolvedValueOnce(undefined); // transfer_tab_to_existing_window

    const opts = { ...defaultOptions, windowLabel: "secondary" };
    await transferTabFromDragOut(opts);
    // Should not trigger snapback — proceeds with transfer
    expect(opts.triggerSnapback).not.toHaveBeenCalled();
  });

  it("does nothing if document not found", async () => {
    mockGetTabsByWindow.mockReturnValue([
      { id: "tab-1", title: "Doc 1", filePath: null, isPinned: false },
      { id: "tab-2", title: "Doc 2", filePath: null, isPinned: false },
    ]);
    mockGetDocument.mockReturnValue(null);
    await transferTabFromDragOut(defaultOptions);
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it("transfers to existing window when drop target found", async () => {
    setupTabsAndDoc();
    mockInvoke.mockResolvedValueOnce("window-2"); // find_drop_target_window
    mockInvoke.mockResolvedValueOnce(undefined); // transfer_tab_to_existing_window

    await transferTabFromDragOut(defaultOptions);

    expect(mockInvoke).toHaveBeenCalledWith("find_drop_target_window", {
      sourceWindowLabel: "main",
      screenX: 100,
      screenY: 200,
    });
    expect(mockInvoke).toHaveBeenCalledWith("transfer_tab_to_existing_window", {
      targetWindowLabel: "window-2",
      data: expect.objectContaining({ tabId: "tab-1", title: "Doc 1" }),
    });
    expect(defaultOptions.announce).toHaveBeenCalledWith(
      "Moved tab Doc 1 to another window."
    );
    expect(mockDetachTab).toHaveBeenCalledWith("main", "tab-1");
    expect(mockRemoveDocument).toHaveBeenCalledWith("tab-1");
  });

  it("detaches to new window when no drop target", async () => {
    setupTabsAndDoc();
    mockInvoke.mockResolvedValueOnce(null); // find_drop_target_window returns null
    mockInvoke.mockResolvedValueOnce("new-window"); // detach_tab_to_new_window

    await transferTabFromDragOut(defaultOptions);

    expect(mockInvoke).toHaveBeenCalledWith("detach_tab_to_new_window", {
      data: expect.objectContaining({ tabId: "tab-1" }),
    });
    expect(defaultOptions.announce).toHaveBeenCalledWith(
      "Detached tab Doc 1 into a new window."
    );
    expect(mockDetachTab).toHaveBeenCalledWith("main", "tab-1");
    expect(mockRemoveDocument).toHaveBeenCalledWith("tab-1");
  });

  it("triggers snapback on invoke error", async () => {
    setupTabsAndDoc();
    mockInvoke.mockRejectedValueOnce(new Error("IPC failed"));

    await transferTabFromDragOut(defaultOptions);

    expect(defaultOptions.triggerSnapback).toHaveBeenCalledWith("tab-1");
    expect(defaultOptions.announce).toHaveBeenCalledWith(
      "Failed to move tab Doc 1."
    );
    expect(mockDetachTab).not.toHaveBeenCalled();
  });

  it("includes workspace root in transfer data", async () => {
    setupTabsAndDoc();
    mockInvoke.mockResolvedValueOnce(null);
    mockInvoke.mockResolvedValueOnce("new-win");

    await transferTabFromDragOut(defaultOptions);

    expect(mockInvoke).toHaveBeenCalledWith("detach_tab_to_new_window", {
      data: expect.objectContaining({ workspaceRoot: "/workspace" }),
    });
  });

  it("handles tab with null filePath", async () => {
    mockGetTabsByWindow.mockReturnValue([
      { id: "tab-1", title: "Untitled", filePath: undefined, isPinned: false },
      { id: "tab-2", title: "Doc 2", filePath: "/f.md", isPinned: false },
    ]);
    mockGetDocument.mockReturnValue({
      content: "hello",
      savedContent: "hello",
      isDirty: false,
    });
    mockInvoke.mockResolvedValueOnce(null);
    mockInvoke.mockResolvedValueOnce("new-win");

    await transferTabFromDragOut(defaultOptions);

    expect(mockInvoke).toHaveBeenCalledWith("detach_tab_to_new_window", {
      data: expect.objectContaining({ filePath: null }),
    });
  });
});
