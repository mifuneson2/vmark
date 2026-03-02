import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

/**
 * useTabContextMenuActions test suite
 *
 * Tests menu item generation, enable/disable logic, conditional items
 * (restore to disk, revert to saved), and action callbacks.
 */

// ── Hoisted mocks ────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  closeTabWithDirtyCheck: vi.fn(() => Promise.resolve(true)),
  closeTabsWithDirtyCheck: vi.fn(() => Promise.resolve(true)),
  saveToPath: vi.fn(() => Promise.resolve(true)),
  reloadTabFromDisk: vi.fn(() => Promise.resolve()),
  ask: vi.fn(() => Promise.resolve(true)),
  writeText: vi.fn(() => Promise.resolve()),
  revealItemInDir: vi.fn(() => Promise.resolve()),
  invoke: vi.fn(() => Promise.resolve("new-window-label")),
  getCurrentWebviewWindow: vi.fn(() => ({ label: "main" })),
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    message: vi.fn(),
  },
  restoreTransferredTab: vi.fn(() => Promise.resolve()),
  togglePin: vi.fn(),
  detachTab: vi.fn(),
  removeDocument: vi.fn(),
  clearMissing: vi.fn(),
  getTabsByWindow: vi.fn(() => [{ id: "tab-2" }]),
}));

vi.mock("@/hooks/useTabOperations", () => ({
  closeTabWithDirtyCheck: mocks.closeTabWithDirtyCheck,
  closeTabsWithDirtyCheck: mocks.closeTabsWithDirtyCheck,
}));

vi.mock("@/utils/saveToPath", () => ({
  saveToPath: mocks.saveToPath,
}));

vi.mock("@/utils/reloadFromDisk", () => ({
  reloadTabFromDisk: mocks.reloadTabFromDisk,
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  ask: mocks.ask,
}));

vi.mock("@tauri-apps/plugin-clipboard-manager", () => ({
  writeText: mocks.writeText,
}));

vi.mock("@tauri-apps/plugin-opener", () => ({
  revealItemInDir: mocks.revealItemInDir,
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: mocks.invoke,
}));

vi.mock("@tauri-apps/api/webviewWindow", () => ({
  getCurrentWebviewWindow: mocks.getCurrentWebviewWindow,
}));

vi.mock("sonner", () => ({
  toast: mocks.toast,
}));

vi.mock("@/stores/tabStore", () => ({
  useTabStore: {
    getState: () => ({
      togglePin: mocks.togglePin,
      detachTab: mocks.detachTab,
      getTabsByWindow: mocks.getTabsByWindow,
    }),
  },
}));

vi.mock("@/stores/documentStore", () => ({
  useDocumentStore: {
    getState: () => ({
      removeDocument: mocks.removeDocument,
      clearMissing: mocks.clearMissing,
    }),
  },
}));

vi.mock("@/components/StatusBar/tabTransferActions", () => ({
  restoreTransferredTab: mocks.restoreTransferredTab,
}));

vi.mock("@/utils/debug", () => ({
  windowCloseWarn: vi.fn(),
}));

vi.mock("@/utils/paths", () => ({
  getRelativePath: (root: string, file: string) => {
    if (file.startsWith(root)) return file.slice(root.length + 1);
    return null;
  },
  isWithinRoot: (root: string, file: string) => file.startsWith(root),
}));

import { useTabContextMenuActions, type TabMenuItem } from "./useTabContextMenuActions";
import type { Tab } from "@/stores/tabStore";
import type { DocumentState } from "@/stores/documentStore";

// ── Helpers ──────────────────────────────────────────────────────────

function makeTab(overrides: Partial<Tab> = {}): Tab {
  return {
    id: "tab-1",
    title: "One.md",
    filePath: "/workspace/project/one.md",
    isPinned: false,
    ...overrides,
  };
}

function makeDoc(overrides: Partial<DocumentState> = {}): DocumentState {
  return {
    content: "# hello",
    savedContent: "# hello",
    lastDiskContent: "# hello",
    filePath: "/workspace/project/one.md",
    isDirty: false,
    documentId: 0,
    cursorInfo: null,
    lastAutoSave: null,
    isMissing: false,
    isDivergent: false,
    lineEnding: "unknown",
    hardBreakStyle: "unknown",
    ...overrides,
  };
}

function makeTabs(count: number): Tab[] {
  return Array.from({ length: count }, (_, i) => makeTab({ id: `tab-${i + 1}`, title: `Tab ${i + 1}` }));
}

interface HookOptions {
  tab?: Tab;
  tabs?: Tab[];
  doc?: DocumentState;
  filePath?: string | null;
  windowLabel?: string;
  workspaceRoot?: string | null;
  revealLabel?: string;
  closeShortcutLabel?: string;
  onClose?: () => void;
}

function renderActions(overrides: HookOptions = {}) {
  const defaults: HookOptions = {
    tab: makeTab(),
    tabs: makeTabs(3),
    doc: makeDoc(),
    filePath: "/workspace/project/one.md",
    windowLabel: "main",
    workspaceRoot: "/workspace",
    revealLabel: "Reveal in Finder",
    closeShortcutLabel: "Cmd+W",
    onClose: vi.fn(),
  };
  const opts = { ...defaults, ...overrides };

  const { result } = renderHook(() =>
    useTabContextMenuActions({
      tab: opts.tab!,
      tabs: opts.tabs!,
      doc: opts.doc,
      filePath: opts.filePath!,
      windowLabel: opts.windowLabel!,
      workspaceRoot: opts.workspaceRoot!,
      revealLabel: opts.revealLabel!,
      closeShortcutLabel: opts.closeShortcutLabel!,
      onClose: opts.onClose!,
    })
  );

  return { items: result.current, onClose: opts.onClose! };
}

function findItem(items: TabMenuItem[], id: string): TabMenuItem | undefined {
  return items.find((item) => item.id === id);
}

// ── Tests ────────────────────────────────────────────────────────────

describe("useTabContextMenuActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTabsByWindow.mockReturnValue([{ id: "tab-2" }]);
  });

  // ── Menu item generation ─────────────────────────────────────────

  it("returns standard menu items", () => {
    const { items } = renderActions();
    const ids = items.map((i) => i.id);
    expect(ids).toContain("moveToNewWindow");
    expect(ids).toContain("pin");
    expect(ids).toContain("copyPath");
    expect(ids).toContain("copyRelativePath");
    expect(ids).toContain("reveal");
    expect(ids).toContain("close");
    expect(ids).toContain("closeOthers");
    expect(ids).toContain("closeRight");
    expect(ids).toContain("closeAllUnpinned");
    expect(ids).toContain("closeAll");
  });

  it("includes a separator", () => {
    const { items } = renderActions();
    expect(items.some((i) => i.separator)).toBe(true);
  });

  // ── Pin/Unpin label ──────────────────────────────────────────────

  it("shows 'Pin' for unpinned tab", () => {
    const { items } = renderActions({ tab: makeTab({ isPinned: false }) });
    expect(findItem(items, "pin")?.label).toBe("Pin");
  });

  it("shows 'Unpin' for pinned tab", () => {
    const { items } = renderActions({ tab: makeTab({ isPinned: true }) });
    expect(findItem(items, "pin")?.label).toBe("Unpin");
  });

  // ── Close shortcut ───────────────────────────────────────────────

  it("shows shortcut on close item", () => {
    const { items } = renderActions({ closeShortcutLabel: "Cmd+W" });
    expect(findItem(items, "close")?.shortcut).toBe("Cmd+W");
  });

  // ── Disabled states ──────────────────────────────────────────────

  it("disables close for pinned tab", () => {
    const { items } = renderActions({ tab: makeTab({ isPinned: true }) });
    expect(findItem(items, "close")?.disabled).toBe(true);
  });

  it("disables moveToNewWindow when only one tab in main window", () => {
    const tab = makeTab();
    const { items } = renderActions({
      tab,
      tabs: [tab],
      windowLabel: "main",
    });
    expect(findItem(items, "moveToNewWindow")?.disabled).toBe(true);
  });

  it("enables moveToNewWindow for non-main window even with single tab", () => {
    const tab = makeTab();
    const { items } = renderActions({
      tab,
      tabs: [tab],
      windowLabel: "doc-1",
    });
    expect(findItem(items, "moveToNewWindow")?.disabled).toBe(false);
  });

  it("disables moveToNewWindow when doc is undefined", () => {
    const { items } = renderActions({ doc: undefined });
    expect(findItem(items, "moveToNewWindow")?.disabled).toBe(true);
  });

  it("disables copyPath when filePath is null", () => {
    const { items } = renderActions({ filePath: null });
    expect(findItem(items, "copyPath")?.disabled).toBe(true);
  });

  it("disables reveal when filePath is null", () => {
    const { items } = renderActions({ filePath: null });
    expect(findItem(items, "reveal")?.disabled).toBe(true);
  });

  it("disables copyRelativePath when file is outside workspace", () => {
    const { items } = renderActions({
      filePath: "/other/path/file.md",
      workspaceRoot: "/workspace",
    });
    expect(findItem(items, "copyRelativePath")?.disabled).toBe(true);
  });

  it("enables copyRelativePath when file is inside workspace", () => {
    const { items } = renderActions({
      filePath: "/workspace/project/file.md",
      workspaceRoot: "/workspace",
    });
    expect(findItem(items, "copyRelativePath")?.disabled).toBe(false);
  });

  it("disables closeOthers when no other unpinned tabs", () => {
    const tab = makeTab({ id: "tab-1" });
    const pinnedTab = makeTab({ id: "tab-2", isPinned: true });
    const { items } = renderActions({ tab, tabs: [tab, pinnedTab] });
    expect(findItem(items, "closeOthers")?.disabled).toBe(true);
  });

  it("disables closeRight when no unpinned tabs to the right", () => {
    const tabs = makeTabs(2);
    const { items } = renderActions({ tab: tabs[1], tabs });
    expect(findItem(items, "closeRight")?.disabled).toBe(true);
  });

  it("disables closeAllUnpinned when all tabs are pinned", () => {
    const tabs = [
      makeTab({ id: "tab-1", isPinned: true }),
      makeTab({ id: "tab-2", isPinned: true }),
    ];
    const { items } = renderActions({ tab: tabs[0], tabs });
    expect(findItem(items, "closeAllUnpinned")?.disabled).toBe(true);
  });

  // ── Conditional items ────────────────────────────────────────────

  it("shows restoreToDisk when document is missing", () => {
    const { items } = renderActions({
      doc: makeDoc({ isMissing: true }),
      filePath: "/workspace/project/one.md",
    });
    expect(findItem(items, "restoreToDisk")).toBeDefined();
  });

  it("hides restoreToDisk when document is not missing", () => {
    const { items } = renderActions({
      doc: makeDoc({ isMissing: false }),
    });
    expect(findItem(items, "restoreToDisk")).toBeUndefined();
  });

  it("hides restoreToDisk when filePath is null", () => {
    const { items } = renderActions({
      doc: makeDoc({ isMissing: true }),
      filePath: null,
    });
    expect(findItem(items, "restoreToDisk")).toBeUndefined();
  });

  it("shows revertToSaved when dirty and not missing", () => {
    const { items } = renderActions({
      doc: makeDoc({ isDirty: true, isMissing: false }),
      filePath: "/workspace/project/one.md",
    });
    expect(findItem(items, "revertToSaved")).toBeDefined();
  });

  it("hides revertToSaved when clean", () => {
    const { items } = renderActions({
      doc: makeDoc({ isDirty: false }),
    });
    expect(findItem(items, "revertToSaved")).toBeUndefined();
  });

  it("hides revertToSaved when dirty but missing", () => {
    const { items } = renderActions({
      doc: makeDoc({ isDirty: true, isMissing: true }),
    });
    expect(findItem(items, "revertToSaved")).toBeUndefined();
  });

  it("hides revertToSaved when filePath is null", () => {
    const { items } = renderActions({
      doc: makeDoc({ isDirty: true }),
      filePath: null,
    });
    expect(findItem(items, "revertToSaved")).toBeUndefined();
  });

  // ── Action callbacks ─────────────────────────────────────────────

  describe("actions", () => {
    it("handleClose calls closeTabWithDirtyCheck and onClose", async () => {
      const onClose = vi.fn();
      const { items } = renderActions({ onClose });
      await findItem(items, "close")!.action();
      expect(mocks.closeTabWithDirtyCheck).toHaveBeenCalledWith("main", "tab-1");
      expect(onClose).toHaveBeenCalled();
    });

    it("handleCloseOthers closes other unpinned tabs", async () => {
      const onClose = vi.fn();
      const tabs = makeTabs(3);
      const { items } = renderActions({ tab: tabs[0], tabs, onClose });
      await findItem(items, "closeOthers")!.action();
      expect(mocks.closeTabsWithDirtyCheck).toHaveBeenCalledWith("main", ["tab-2", "tab-3"]);
      expect(onClose).toHaveBeenCalled();
    });

    it("handleCloseOthers skips pinned tabs", async () => {
      const tabs = [
        makeTab({ id: "tab-1" }),
        makeTab({ id: "tab-2", isPinned: true }),
        makeTab({ id: "tab-3" }),
      ];
      const { items } = renderActions({ tab: tabs[0], tabs });
      await findItem(items, "closeOthers")!.action();
      expect(mocks.closeTabsWithDirtyCheck).toHaveBeenCalledWith("main", ["tab-3"]);
    });

    it("handleCloseToRight closes unpinned tabs to the right", async () => {
      const tabs = makeTabs(3);
      const { items } = renderActions({ tab: tabs[0], tabs });
      await findItem(items, "closeRight")!.action();
      expect(mocks.closeTabsWithDirtyCheck).toHaveBeenCalledWith("main", ["tab-2", "tab-3"]);
    });

    it("handleCloseAllUnpinned closes all unpinned tabs", async () => {
      const tabs = [
        makeTab({ id: "tab-1" }),
        makeTab({ id: "tab-2", isPinned: true }),
        makeTab({ id: "tab-3" }),
      ];
      const { items } = renderActions({ tab: tabs[0], tabs });
      await findItem(items, "closeAllUnpinned")!.action();
      expect(mocks.closeTabsWithDirtyCheck).toHaveBeenCalledWith("main", ["tab-1", "tab-3"]);
    });

    it("handleCloseAll closes all tabs including pinned", async () => {
      const tabs = [
        makeTab({ id: "tab-1", isPinned: true }),
        makeTab({ id: "tab-2" }),
      ];
      const { items } = renderActions({ tab: tabs[0], tabs });
      await findItem(items, "closeAll")!.action();
      expect(mocks.closeTabsWithDirtyCheck).toHaveBeenCalledWith("main", ["tab-1", "tab-2"]);
    });

    it("handlePin calls togglePin and onClose", () => {
      const onClose = vi.fn();
      const { items } = renderActions({ onClose });
      findItem(items, "pin")!.action();
      expect(mocks.togglePin).toHaveBeenCalledWith("main", "tab-1");
      expect(onClose).toHaveBeenCalled();
    });

    it("handleCopyPath copies file path to clipboard", async () => {
      const onClose = vi.fn();
      const { items } = renderActions({ onClose });
      await findItem(items, "copyPath")!.action();
      expect(mocks.writeText).toHaveBeenCalledWith("/workspace/project/one.md");
      expect(mocks.toast.success).toHaveBeenCalledWith("Path copied to clipboard.");
      expect(onClose).toHaveBeenCalled();
    });

    it("handleCopyPath shows error toast on failure", async () => {
      mocks.writeText.mockRejectedValueOnce(new Error("fail"));
      const { items } = renderActions();
      await findItem(items, "copyPath")!.action();
      expect(mocks.toast.error).toHaveBeenCalledWith("Failed to copy path.");
    });

    it("handleCopyPath is a no-op when filePath is null", async () => {
      const { items } = renderActions({ filePath: null });
      await findItem(items, "copyPath")!.action();
      expect(mocks.writeText).not.toHaveBeenCalled();
    });

    it("handleCopyRelativePath copies relative path", async () => {
      const { items } = renderActions({
        filePath: "/workspace/project/one.md",
        workspaceRoot: "/workspace",
      });
      await findItem(items, "copyRelativePath")!.action();
      expect(mocks.writeText).toHaveBeenCalledWith("project/one.md");
      expect(mocks.toast.success).toHaveBeenCalledWith("Relative path copied to clipboard.");
    });

    it("handleCopyRelativePath shows error on failure", async () => {
      mocks.writeText.mockRejectedValueOnce(new Error("fail"));
      const { items } = renderActions();
      await findItem(items, "copyRelativePath")!.action();
      expect(mocks.toast.error).toHaveBeenCalledWith("Failed to copy relative path.");
    });

    it("handleRevealInFileManager calls revealItemInDir", async () => {
      const { items } = renderActions();
      await findItem(items, "reveal")!.action();
      expect(mocks.revealItemInDir).toHaveBeenCalledWith("/workspace/project/one.md");
    });

    it("handleRevealInFileManager shows error on failure", async () => {
      mocks.revealItemInDir.mockRejectedValueOnce(new Error("fail"));
      const { items } = renderActions();
      await findItem(items, "reveal")!.action();
      expect(mocks.toast.error).toHaveBeenCalledWith("Failed to reveal file in file manager.");
    });

    it("handleRevealInFileManager is a no-op when filePath is null", async () => {
      const { items } = renderActions({ filePath: null });
      await findItem(items, "reveal")!.action();
      expect(mocks.revealItemInDir).not.toHaveBeenCalled();
    });

    it("handleRestoreToDisk saves and clears missing flag", async () => {
      const onClose = vi.fn();
      const { items } = renderActions({
        doc: makeDoc({ isMissing: true }),
        filePath: "/workspace/project/one.md",
        onClose,
      });
      await findItem(items, "restoreToDisk")!.action();
      expect(mocks.saveToPath).toHaveBeenCalledWith("tab-1", "/workspace/project/one.md", "# hello", "manual");
      expect(mocks.clearMissing).toHaveBeenCalledWith("tab-1");
      expect(mocks.toast.success).toHaveBeenCalledWith("File restored to disk.");
      expect(onClose).toHaveBeenCalled();
    });

    it("handleRestoreToDisk shows error when save fails", async () => {
      mocks.saveToPath.mockResolvedValueOnce(false);
      const { items } = renderActions({
        doc: makeDoc({ isMissing: true }),
        filePath: "/workspace/project/one.md",
      });
      await findItem(items, "restoreToDisk")!.action();
      expect(mocks.toast.error).toHaveBeenCalledWith("Failed to restore file to disk.");
    });

    it("handleRevertToSaved reloads on confirm", async () => {
      mocks.ask.mockResolvedValue(true);
      const onClose = vi.fn();
      const { items } = renderActions({
        doc: makeDoc({ isDirty: true }),
        onClose,
      });
      await findItem(items, "revertToSaved")!.action();
      expect(mocks.reloadTabFromDisk).toHaveBeenCalledWith("tab-1", "/workspace/project/one.md");
      expect(mocks.toast.success).toHaveBeenCalledWith("Reverted to saved version.");
      expect(onClose).toHaveBeenCalled();
    });

    it("handleRevertToSaved does nothing on cancel", async () => {
      mocks.ask.mockResolvedValue(false);
      const onClose = vi.fn();
      const { items } = renderActions({
        doc: makeDoc({ isDirty: true }),
        onClose,
      });
      await findItem(items, "revertToSaved")!.action();
      expect(mocks.reloadTabFromDisk).not.toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });

    it("handleRevertToSaved shows error on reload failure", async () => {
      mocks.ask.mockResolvedValue(true);
      mocks.reloadTabFromDisk.mockRejectedValueOnce(new Error("read failed"));
      const { items } = renderActions({
        doc: makeDoc({ isDirty: true }),
      });
      await findItem(items, "revertToSaved")!.action();
      expect(mocks.toast.error).toHaveBeenCalledWith("Failed to revert to saved version.");
    });

    it("handleMoveToNewWindow detaches tab and shows toast", async () => {
      const onClose = vi.fn();
      const tabs = makeTabs(2);
      const { items } = renderActions({ tab: tabs[0], tabs, onClose });
      await findItem(items, "moveToNewWindow")!.action();
      expect(mocks.invoke).toHaveBeenCalledWith("detach_tab_to_new_window", expect.any(Object));
      expect(mocks.detachTab).toHaveBeenCalledWith("main", "tab-1");
      expect(mocks.removeDocument).toHaveBeenCalledWith("tab-1");
      expect(mocks.toast.message).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });

    it("handleMoveToNewWindow shows error when doc is undefined", async () => {
      const onClose = vi.fn();
      const { items } = renderActions({ doc: undefined, onClose });
      await findItem(items, "moveToNewWindow")!.action();
      expect(mocks.toast.error).toHaveBeenCalledWith("Cannot move tab: document is not loaded.");
      expect(onClose).toHaveBeenCalled();
    });

    it("handleMoveToNewWindow shows error for last tab in main", async () => {
      const tab = makeTab();
      const onClose = vi.fn();
      const { items } = renderActions({ tab, tabs: [tab], windowLabel: "main", onClose });
      await findItem(items, "moveToNewWindow")!.action();
      expect(mocks.toast.error).toHaveBeenCalledWith("Cannot move the last tab in the main window.");
      expect(onClose).toHaveBeenCalled();
    });

    it("handleMoveToNewWindow shows error toast on invoke failure", async () => {
      mocks.invoke.mockRejectedValueOnce(new Error("ipc fail"));
      const tabs = makeTabs(2);
      const onClose = vi.fn();
      const { items } = renderActions({ tab: tabs[0], tabs, onClose });
      await findItem(items, "moveToNewWindow")!.action();
      expect(mocks.toast.error).toHaveBeenCalledWith("Failed to move tab to a new window.");
      expect(onClose).toHaveBeenCalled();
    });
  });
});
