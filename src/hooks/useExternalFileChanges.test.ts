/**
 * Tests for file reappearance after deletion in useExternalFileChanges
 *
 * When a deleted file reappears (Finder undo, git checkout, Trash restore),
 * the isMissing flag must be cleared and content reloaded.
 *
 * @module hooks/useExternalFileChanges.test
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// --- Hoisted mocks ---
const mocks = vi.hoisted(() => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
  readTextFile: vi.fn(),
  toastInfo: vi.fn(),
  matchesPendingSave: vi.fn(() => false),
  hasPendingSave: vi.fn(() => false),
  dialogMessage: vi.fn(),
  dialogSave: vi.fn(),
  saveToPath: vi.fn(),
  reloadTabFromDisk: vi.fn(),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: mocks.listen,
}));

vi.mock("@tauri-apps/plugin-fs", () => ({
  readTextFile: mocks.readTextFile,
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  message: mocks.dialogMessage,
  save: mocks.dialogSave,
}));

vi.mock("sonner", () => ({
  toast: {
    info: mocks.toastInfo,
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("@/utils/imeToast", () => ({
  imeToast: {
    info: mocks.toastInfo,
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("@/contexts/WindowContext", () => ({
  useWindowLabel: vi.fn(() => "main"),
}));

vi.mock("@/utils/pendingSaves", () => ({
  matchesPendingSave: mocks.matchesPendingSave,
  hasPendingSave: mocks.hasPendingSave,
}));

vi.mock("@/utils/saveToPath", () => ({
  saveToPath: mocks.saveToPath,
}));

vi.mock("@/utils/reloadFromDisk", () => ({
  reloadTabFromDisk: mocks.reloadTabFromDisk,
}));

import { useDocumentStore } from "@/stores/documentStore";
import { useTabStore } from "@/stores/tabStore";
import { useExternalFileChanges } from "./useExternalFileChanges";

type ListenCallback = (event: { payload: { watchId: string; rootPath: string; paths: string[]; kind: string } }) => Promise<void>;

function seedStores(overrides: { isMissing?: boolean; lastDiskContent?: string } = {}) {
  useTabStore.setState({
    tabs: {
      main: [{ id: "tab-1", title: "test.md", filePath: "/workspace/test.md", isPinned: false }],
    },
    activeTabId: { main: "tab-1" },
    untitledCounter: 0,
    closedTabs: {},
  });

  useDocumentStore.setState({
    documents: {
      "tab-1": {
        content: "# old content",
        savedContent: "# old content",
        lastDiskContent: overrides.lastDiskContent ?? "# old content",
        filePath: "/workspace/test.md",
        isDirty: false,
        documentId: 0,
        cursorInfo: null,
        lastAutoSave: null,
        isMissing: overrides.isMissing ?? false,
        isDivergent: false,
        lineEnding: "unknown",
        hardBreakStyle: "unknown",
      },
    },
  });
}

/** Extract the callback registered via listen("fs:changed", cb) */
function captureListenCallback(): ListenCallback {
  const calls = mocks.listen.mock.calls as unknown as unknown[][];
  const call = calls.find((c) => c[0] === "fs:changed");
  if (!call) throw new Error("listen('fs:changed') was not called");
  return call[1] as ListenCallback;
}

/** Render hook, wait for listener, and return the captured callback */
async function setupHookAndCallback(): Promise<ListenCallback> {
  renderHook(() => useExternalFileChanges());
  await vi.waitFor(() => expect(mocks.listen).toHaveBeenCalled());
  return captureListenCallback();
}

describe("useExternalFileChanges — file reappearance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears isMissing and reloads when a deleted file reappears with same content", async () => {
    seedStores({ isMissing: true, lastDiskContent: "# old content" });
    mocks.readTextFile.mockResolvedValue("# old content");

    const callback = await setupHookAndCallback();

    await callback({
      payload: {
        watchId: "main",
        rootPath: "/workspace",
        paths: ["/workspace/test.md"],
        kind: "create",
      },
    });

    const doc = useDocumentStore.getState().documents["tab-1"];
    expect(doc?.isMissing).toBe(false);
    expect(mocks.toastInfo).toHaveBeenCalledWith("Restored: test.md");
  });

  it("clears isMissing and reloads when a deleted file reappears with different content", async () => {
    seedStores({ isMissing: true, lastDiskContent: "# old content" });
    mocks.readTextFile.mockResolvedValue("# new content from git");

    const callback = await setupHookAndCallback();

    await callback({
      payload: {
        watchId: "main",
        rootPath: "/workspace",
        paths: ["/workspace/test.md"],
        kind: "create",
      },
    });

    const doc = useDocumentStore.getState().documents["tab-1"];
    expect(doc?.isMissing).toBe(false);
    expect(doc?.lastDiskContent).toBe("# new content from git");
    expect(mocks.toastInfo).toHaveBeenCalledWith("Restored: test.md");
  });

  it("skips reappearance logic when pending save matches (our own write)", async () => {
    seedStores({ isMissing: true });
    mocks.readTextFile.mockResolvedValue("# old content");
    mocks.matchesPendingSave.mockReturnValue(true);

    const callback = await setupHookAndCallback();

    await callback({
      payload: {
        watchId: "main",
        rootPath: "/workspace",
        paths: ["/workspace/test.md"],
        kind: "create",
      },
    });

    // isMissing should NOT have been cleared — it was our own save
    const doc = useDocumentStore.getState().documents["tab-1"];
    expect(doc?.isMissing).toBe(true);
    expect(mocks.toastInfo).not.toHaveBeenCalled();
  });

  it("does not trigger reappearance logic for non-missing files with same content", async () => {
    seedStores({ isMissing: false, lastDiskContent: "# old content" });
    mocks.readTextFile.mockResolvedValue("# old content");

    const callback = await setupHookAndCallback();

    await callback({
      payload: {
        watchId: "main",
        rootPath: "/workspace",
        paths: ["/workspace/test.md"],
        kind: "modify",
      },
    });

    // Should hit the lastDiskContent check and skip — no toast
    expect(mocks.toastInfo).not.toHaveBeenCalled();
  });
});

describe("useExternalFileChanges — rename events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips rename fallback when path has a pending save (atomic write)", async () => {
    seedStores();
    mocks.hasPendingSave.mockReturnValue(true);

    const callback = await setupHookAndCallback();

    // Simulate atomic write rename: temp file → target (unmatched pair)
    await callback({
      payload: {
        watchId: "main",
        rootPath: "/workspace",
        paths: ["/workspace/test.md"],
        kind: "rename",
      },
    });

    const doc = useDocumentStore.getState().documents["tab-1"];
    expect(doc?.isMissing).toBe(false);
    expect(mocks.readTextFile).not.toHaveBeenCalled();
  });

  it("treats rename fallback as modify when file still exists on disk", async () => {
    seedStores({ lastDiskContent: "# old content" });
    mocks.hasPendingSave.mockReturnValue(false);
    mocks.readTextFile.mockResolvedValue("# new external content");

    const callback = await setupHookAndCallback();

    // Odd-length paths array — fallback branch processes each path
    await callback({
      payload: {
        watchId: "main",
        rootPath: "/workspace",
        paths: ["/workspace/test.md"],
        kind: "rename",
      },
    });

    const doc = useDocumentStore.getState().documents["tab-1"];
    // Clean doc should auto-reload with new content
    expect(doc?.isMissing).toBe(false);
    expect(doc?.lastDiskContent).toBe("# new external content");
    expect(mocks.toastInfo).toHaveBeenCalledWith("Reloaded: test.md");
  });

  it("marks file as deleted when rename fallback cannot read the file", async () => {
    seedStores();
    mocks.hasPendingSave.mockReturnValue(false);
    mocks.readTextFile.mockRejectedValue(new Error("file not found"));

    const callback = await setupHookAndCallback();

    await callback({
      payload: {
        watchId: "main",
        rootPath: "/workspace",
        paths: ["/workspace/test.md"],
        kind: "rename",
      },
    });

    const doc = useDocumentStore.getState().documents["tab-1"];
    expect(doc?.isMissing).toBe(true);
  });

  it("handles paired rename (real file rename) by updating tab path", async () => {
    seedStores();

    const callback = await setupHookAndCallback();

    // Paired rename: old path → new path
    await callback({
      payload: {
        watchId: "main",
        rootPath: "/workspace",
        paths: ["/workspace/test.md", "/workspace/renamed.md"],
        kind: "rename",
      },
    });

    const doc = useDocumentStore.getState().documents["tab-1"];
    expect(doc?.isMissing).toBe(false);
    expect(doc?.filePath).toBe("/workspace/renamed.md");
  });

  it("rename fallback skips same-content file (no false reload)", async () => {
    seedStores({ lastDiskContent: "# old content" });
    mocks.hasPendingSave.mockReturnValue(false);
    // Disk content matches lastDiskContent — no change
    mocks.readTextFile.mockResolvedValue("# old content");

    const callback = await setupHookAndCallback();

    await callback({
      payload: {
        watchId: "main",
        rootPath: "/workspace",
        paths: ["/workspace/test.md"],
        kind: "rename",
      },
    });

    const doc = useDocumentStore.getState().documents["tab-1"];
    expect(doc?.isMissing).toBe(false);
    // No toast — content unchanged
    expect(mocks.toastInfo).not.toHaveBeenCalled();
  });
});

describe("useExternalFileChanges — remove events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks file as missing on remove event", async () => {
    seedStores();

    const callback = await setupHookAndCallback();

    await callback({
      payload: {
        watchId: "main",
        rootPath: "/workspace",
        paths: ["/workspace/test.md"],
        kind: "remove",
      },
    });

    const doc = useDocumentStore.getState().documents["tab-1"];
    expect(doc?.isMissing).toBe(true);
  });
});

describe("useExternalFileChanges — event filtering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ignores events from a different window watcher", async () => {
    seedStores();
    mocks.readTextFile.mockResolvedValue("# new content");

    const callback = await setupHookAndCallback();

    await callback({
      payload: {
        watchId: "other-window",
        rootPath: "/workspace",
        paths: ["/workspace/test.md"],
        kind: "modify",
      },
    });

    // Should not read the file since watchId doesn't match
    expect(mocks.readTextFile).not.toHaveBeenCalled();
  });

  it("ignores events for files that are not open", async () => {
    seedStores();
    mocks.readTextFile.mockResolvedValue("# new content");

    const callback = await setupHookAndCallback();

    await callback({
      payload: {
        watchId: "main",
        rootPath: "/workspace",
        paths: ["/workspace/other-file.md"],
        kind: "modify",
      },
    });

    // other-file.md is not open — should not attempt to read
    expect(mocks.readTextFile).not.toHaveBeenCalled();
  });

  it("skips modify events when file is unreadable", async () => {
    seedStores({ lastDiskContent: "# old content" });
    mocks.readTextFile.mockRejectedValue(new Error("file locked"));

    const callback = await setupHookAndCallback();

    await callback({
      payload: {
        watchId: "main",
        rootPath: "/workspace",
        paths: ["/workspace/test.md"],
        kind: "modify",
      },
    });

    // Should not crash, just skip
    const doc = useDocumentStore.getState().documents["tab-1"];
    expect(doc?.isMissing).toBe(false);
  });

  it("auto-reloads clean document on external modify", async () => {
    seedStores({ lastDiskContent: "# old content" });
    mocks.readTextFile.mockResolvedValue("# updated by external tool");
    mocks.matchesPendingSave.mockReturnValue(false);

    const callback = await setupHookAndCallback();

    await callback({
      payload: {
        watchId: "main",
        rootPath: "/workspace",
        paths: ["/workspace/test.md"],
        kind: "modify",
      },
    });

    // readTextFile should have been called for the changed file
    expect(mocks.readTextFile).toHaveBeenCalledWith("/workspace/test.md");
    // Should auto-reload: clean doc with different disk content
    const doc = useDocumentStore.getState().documents["tab-1"];
    expect(doc?.content).toBe("# updated by external tool");
    expect(mocks.toastInfo).toHaveBeenCalledWith("Reloaded: test.md");
  });
});

describe("useExternalFileChanges — dirty file prompt", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Restore default mock implementations after resetAllMocks clears them
    mocks.listen.mockImplementation(() => Promise.resolve(() => {}));
    mocks.matchesPendingSave.mockReturnValue(false);
    mocks.hasPendingSave.mockReturnValue(false);
  });

  function seedDirtyStores() {
    useTabStore.setState({
      tabs: {
        main: [{ id: "tab-1", title: "test.md", filePath: "/workspace/test.md", isPinned: false }],
      },
      activeTabId: { main: "tab-1" },
      untitledCounter: 0,
      closedTabs: {},
    });

    useDocumentStore.setState({
      documents: {
        "tab-1": {
          content: "# user edits",
          savedContent: "# old content",
          lastDiskContent: "# old content",
          filePath: "/workspace/test.md",
          isDirty: true,
          documentId: 0,
          cursorInfo: null,
          lastAutoSave: null,
          isMissing: false,
          isDivergent: false,
          lineEnding: "unknown",
          hardBreakStyle: "unknown",
        },
      },
    });
  }

  it("marks as divergent when user chooses Keep (cancel)", async () => {
    seedDirtyStores();
    mocks.readTextFile.mockResolvedValue("# external change");
    mocks.dialogMessage.mockResolvedValue("Cancel");

    const callback = await setupHookAndCallback();

    await callback({
      payload: {
        watchId: "main",
        rootPath: "/workspace",
        paths: ["/workspace/test.md"],
        kind: "modify",
      },
    });

    // Wait for batch debounce (300ms) + async processBatchedChanges
    await vi.waitFor(() => expect(mocks.dialogMessage).toHaveBeenCalled(), { timeout: 1000 });

    const doc = useDocumentStore.getState().documents["tab-1"];
    expect(doc?.isDivergent).toBe(true);
  });

  it("reloads from disk when user chooses Reload", async () => {
    seedDirtyStores();
    mocks.readTextFile.mockResolvedValue("# external change");
    mocks.dialogMessage.mockResolvedValue("Reload");
    mocks.reloadTabFromDisk.mockResolvedValue(undefined);

    const callback = await setupHookAndCallback();

    await callback({
      payload: {
        watchId: "main",
        rootPath: "/workspace",
        paths: ["/workspace/test.md"],
        kind: "modify",
      },
    });

    // Wait for batch debounce (300ms) + async processBatchedChanges
    await vi.waitFor(() => expect(mocks.dialogMessage).toHaveBeenCalled(), { timeout: 1000 });

    expect(mocks.reloadTabFromDisk).toHaveBeenCalledWith("tab-1", "/workspace/test.md");
  });
});
