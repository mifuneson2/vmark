/**
 * Tests for workspaceHandlers — windows.list, windows.getFocused,
 * workspace.newDocument, workspace.getDocumentInfo, workspace.getInfo,
 * workspace.listRecentFiles.
 *
 * Note: handlers that call Tauri filesystem APIs (openDocument, saveDocument,
 * reloadDocument) are tested for argument validation and error paths only.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock utils
const mockRespond = vi.fn();
const mockGetEditor = vi.fn();
vi.mock("../utils", () => ({
  respond: (response: unknown) => mockRespond(response),
  getEditor: () => mockGetEditor(),
  resolveWindowId: (id?: string) => id ?? "main",
}));

// Mock stores
const mockTabStoreState = {
  activeTabId: { main: "tab-1" } as Record<string, string>,
  tabs: {
    main: [{ id: "tab-1", title: "Test", filePath: "/test.md" }],
  } as Record<string, Array<{ id: string; title: string; filePath: string | null }>>,
  createTab: vi.fn().mockReturnValue("tab-new"),
  closeTab: vi.fn(),
  updateTabPath: vi.fn(),
  updateTabTitle: vi.fn(),
};
vi.mock("@/stores/tabStore", () => ({
  useTabStore: {
    getState: () => mockTabStoreState,
  },
}));

const mockDocStoreState = {
  getDocument: vi.fn().mockReturnValue({
    filePath: "/test.md",
    isDirty: false,
  }),
  initDocument: vi.fn(),
  markSaved: vi.fn(),
  setFilePath: vi.fn(),
};
vi.mock("@/stores/documentStore", () => ({
  useDocumentStore: {
    getState: () => mockDocStoreState,
  },
}));

vi.mock("@/stores/recentFilesStore", () => ({
  useRecentFilesStore: {
    getState: () => ({
      files: ["/file1.md", "/file2.md"],
    }),
  },
}));

vi.mock("@/stores/workspaceStore", () => ({
  useWorkspaceStore: {
    getState: () => ({
      isWorkspaceMode: true,
      rootPath: "/Users/test/project",
    }),
  },
}));

vi.mock("@tauri-apps/plugin-fs", () => ({
  readTextFile: vi.fn().mockResolvedValue("# Content"),
  writeTextFile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    setFocus: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@/utils/markdownPipeline", () => ({
  serializeMarkdown: vi.fn().mockReturnValue("# Content"),
}));

vi.mock("@/utils/paths", () => ({
  getFileName: (path: string) => path.split("/").pop() ?? "",
}));

vi.mock("@/utils/reloadFromDisk", () => ({
  reloadTabFromDisk: vi.fn().mockResolvedValue(undefined),
}));

import {
  handleWindowsList,
  handleWindowsGetFocused,
  handleWindowsFocus,
  handleWorkspaceNewDocument,
  handleWorkspaceOpenDocument,
  handleWorkspaceSaveDocument,
  handleWorkspaceSaveDocumentAs,
  handleWorkspaceGetDocumentInfo,
  handleWorkspaceGetInfo,
  handleWorkspaceListRecentFiles,
  handleWorkspaceCloseWindow,
  handleWorkspaceReloadDocument,
} from "../workspaceHandlers";

describe("workspaceHandlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTabStoreState.activeTabId = { main: "tab-1" };
  });

  describe("handleWindowsList", () => {
    it("returns list of windows", async () => {
      await handleWindowsList("req-1");

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data).toHaveLength(1);
      expect(call.data[0].label).toBe("main");
      expect(call.data[0].isFocused).toBe(true);
    });
  });

  describe("handleWindowsGetFocused", () => {
    it("returns main as focused window", async () => {
      await handleWindowsGetFocused("req-2");

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-2",
        success: true,
        data: "main",
      });
    });
  });

  describe("handleWorkspaceNewDocument", () => {
    it("creates new tab and document", async () => {
      await handleWorkspaceNewDocument("req-3");

      expect(mockTabStoreState.createTab).toHaveBeenCalledWith("main", null);
      expect(mockDocStoreState.initDocument).toHaveBeenCalledWith(
        "tab-new",
        "",
        null
      );
      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-3",
        success: true,
        data: { windowId: "main" },
      });
    });
  });

  describe("handleWorkspaceGetDocumentInfo", () => {
    it("returns document info with word/char counts", async () => {
      const editor = {
        state: {
          doc: { textContent: "Hello world test" },
        },
      };
      mockGetEditor.mockReturnValue(editor);

      await handleWorkspaceGetDocumentInfo("req-4", {});

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.filePath).toBe("/test.md");
      expect(call.data.isDirty).toBe(false);
      expect(call.data.wordCount).toBe(3);
      expect(call.data.charCount).toBe(16);
    });

    it("returns error when no active document", async () => {
      mockTabStoreState.activeTabId = {};

      await handleWorkspaceGetDocumentInfo("req-5", {});

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-5",
        success: false,
        error: "No active document",
      });
    });
  });

  describe("handleWorkspaceGetInfo", () => {
    it("returns workspace info", async () => {
      await handleWorkspaceGetInfo("req-6");

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.isWorkspaceMode).toBe(true);
      expect(call.data.rootPath).toBe("/Users/test/project");
      expect(call.data.workspaceName).toBe("project");
    });
  });

  describe("handleWorkspaceListRecentFiles", () => {
    it("returns recent files list", async () => {
      await handleWorkspaceListRecentFiles("req-7");

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-7",
        success: true,
        data: ["/file1.md", "/file2.md"],
      });
    });
  });

  describe("handleWorkspaceCloseWindow", () => {
    it("closes the active tab", async () => {
      await handleWorkspaceCloseWindow("req-8", {});

      expect(mockTabStoreState.closeTab).toHaveBeenCalledWith("main", "tab-1");
      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-8",
        success: true,
        data: null,
      });
    });

    it("no-op when no active tab", async () => {
      mockTabStoreState.activeTabId = {};

      await handleWorkspaceCloseWindow("req-9", {});

      expect(mockTabStoreState.closeTab).not.toHaveBeenCalled();
      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-9",
        success: true,
        data: null,
      });
    });
  });

  describe("handleWindowsFocus", () => {
    it("returns error when windowId is missing", async () => {
      await handleWindowsFocus("req-20", {});

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-20",
        success: false,
        error: "windowId is required",
      });
    });

    it("focuses the current window", async () => {
      await handleWindowsFocus("req-21", { windowId: "main" });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-21",
        success: true,
        data: null,
      });
    });
  });

  describe("handleWorkspaceOpenDocument", () => {
    it("returns error when path is missing", async () => {
      await handleWorkspaceOpenDocument("req-30", {});

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-30",
        success: false,
        error: "path is required",
      });
    });

    it("opens a document from filesystem", async () => {
      await handleWorkspaceOpenDocument("req-31", {
        path: "/test/file.md",
      });

      expect(mockTabStoreState.createTab).toHaveBeenCalledWith(
        "main",
        "/test/file.md"
      );
      expect(mockDocStoreState.initDocument).toHaveBeenCalledWith(
        "tab-new",
        "# Content",
        "/test/file.md"
      );
      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-31",
        success: true,
        data: { windowId: "main" },
      });
    });
  });

  describe("handleWorkspaceSaveDocument", () => {
    it("returns error when no active document", async () => {
      mockTabStoreState.activeTabId = {};

      await handleWorkspaceSaveDocument("req-40");

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-40",
        success: false,
        error: "No active document",
      });
    });

    it("returns error when document has no file path", async () => {
      mockDocStoreState.getDocument.mockReturnValue({
        filePath: null,
        isDirty: true,
        content: "content",
      });

      await handleWorkspaceSaveDocument("req-41");

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-41",
        success: false,
        error: "Document has no file path (use save-as instead)",
      });
    });

    it("saves document successfully", async () => {
      mockDocStoreState.getDocument.mockReturnValue({
        filePath: "/test.md",
        isDirty: true,
        content: "# Saved content",
      });

      await handleWorkspaceSaveDocument("req-42");

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-42",
        success: true,
        data: null,
      });
    });
  });

  describe("handleWorkspaceSaveDocumentAs", () => {
    it("returns error when path is missing", async () => {
      await handleWorkspaceSaveDocumentAs("req-50", {});

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-50",
        success: false,
        error: "path is required",
      });
    });

    it("returns error when no active document", async () => {
      mockTabStoreState.activeTabId = {};

      await handleWorkspaceSaveDocumentAs("req-51", {
        path: "/new/path.md",
      });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-51",
        success: false,
        error: "No active document",
      });
    });

    it("returns error when getDocument returns null", async () => {
      mockDocStoreState.getDocument.mockReturnValue(null);

      await handleWorkspaceSaveDocumentAs("req-52", {
        path: "/new/path.md",
      });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-52",
        success: false,
        error: "No active document",
      });
    });
  });

  describe("handleWorkspaceReloadDocument", () => {
    it("returns error when no active document", async () => {
      mockTabStoreState.activeTabId = {};

      await handleWorkspaceReloadDocument("req-60", {});

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-60",
        success: false,
        error: "No active document",
      });
    });

    it("returns error when document has no file path", async () => {
      mockDocStoreState.getDocument.mockReturnValue({
        filePath: null,
        isDirty: false,
      });

      await handleWorkspaceReloadDocument("req-61", {});

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-61",
        success: false,
        error: "Document has no file path (untitled documents cannot be reloaded)",
      });
    });

    it("returns error when document is dirty and force is not set", async () => {
      mockDocStoreState.getDocument.mockReturnValue({
        filePath: "/test.md",
        isDirty: true,
      });

      await handleWorkspaceReloadDocument("req-62", {});

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(false);
      expect(call.error).toContain("unsaved changes");
    });

    it("reloads when document is dirty and force=true", async () => {
      mockDocStoreState.getDocument.mockReturnValue({
        filePath: "/test.md",
        isDirty: true,
      });

      await handleWorkspaceReloadDocument("req-63", { force: true });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.filePath).toBe("/test.md");
    });

    it("reloads clean document without force", async () => {
      mockDocStoreState.getDocument.mockReturnValue({
        filePath: "/test.md",
        isDirty: false,
      });

      await handleWorkspaceReloadDocument("req-64", {});

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.filePath).toBe("/test.md");
    });
  });

  describe("handleWindowsList — edge cases", () => {
    it("returns Untitled when no active tab", async () => {
      mockTabStoreState.activeTabId = {};

      await handleWindowsList("req-70");

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data[0].title).toBe("Untitled");
      expect(call.data[0].filePath).toBeNull();
    });

    it("returns Untitled when doc has no filePath", async () => {
      mockDocStoreState.getDocument.mockReturnValue({
        filePath: null,
        isDirty: false,
      });

      await handleWindowsList("req-71");

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data[0].title).toBe("Untitled");
    });
  });

  describe("handleWorkspaceGetDocumentInfo — edge cases", () => {
    it("returns zero counts when editor is null", async () => {
      mockGetEditor.mockReturnValue(null);
      mockDocStoreState.getDocument.mockReturnValue({
        filePath: "/test.md",
        isDirty: false,
      });

      await handleWorkspaceGetDocumentInfo("req-80", {});

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.wordCount).toBe(0);
      expect(call.data.charCount).toBe(0);
    });

    it("returns zero word count for empty text", async () => {
      mockGetEditor.mockReturnValue({
        state: {
          doc: { textContent: "" },
        },
      });
      mockDocStoreState.getDocument.mockReturnValue({
        filePath: "/test.md",
        isDirty: false,
      });

      await handleWorkspaceGetDocumentInfo("req-81", {});

      const call = mockRespond.mock.calls[0][0];
      expect(call.data.wordCount).toBe(0);
      expect(call.data.charCount).toBe(0);
    });
  });
});
