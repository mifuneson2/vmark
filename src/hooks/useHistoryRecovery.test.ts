/**
 * Tests for useHistoryRecovery
 *
 * Tests getDeletedDocuments, restoreDeletedDocument, deleteHistory,
 * clearAllHistory, deleteDocumentHistory, clearWorkspaceHistory.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

const mockExists = vi.fn();
const mockReadTextFile = vi.fn();
const mockWriteTextFile = vi.fn();
const mockReadDir = vi.fn();
const mockRemove = vi.fn();

vi.mock("@tauri-apps/plugin-fs", () => ({
  exists: (...args: unknown[]) => mockExists(...args),
  readTextFile: (...args: unknown[]) => mockReadTextFile(...args),
  writeTextFile: (...args: unknown[]) => mockWriteTextFile(...args),
  readDir: (...args: unknown[]) => mockReadDir(...args),
  remove: (...args: unknown[]) => mockRemove(...args),
}));

vi.mock("@tauri-apps/api/path", () => ({
  join: vi.fn((...parts: string[]) => Promise.resolve(parts.join("/"))),
}));

vi.mock("@/utils/debug", () => ({
  historyLog: vi.fn(),
}));

const mockGetHistoryBaseDir = vi.fn(() => Promise.resolve("/appdata/history"));
vi.mock("@/hooks/useHistoryOperations", () => ({
  getHistoryBaseDir: () => mockGetHistoryBaseDir(),
}));

vi.mock("@/utils/historyTypes", () => ({
  INDEX_FILE: "index.json",
  getDocumentName: (path: string) => path.split("/").pop() || "Untitled",
  hashPath: async (path: string) => `hash_${path.replace(/\//g, "_")}`,
  parseHistoryIndex: (raw: unknown) => {
    if (typeof raw !== "object" || raw === null) return null;
    const obj = raw as Record<string, unknown>;
    if (typeof obj.pathHash !== "string") return null;
    if (!Array.isArray(obj.snapshots)) return null;
    return raw;
  },
}));

vi.mock("@/utils/paths/paths", () => ({
  normalizePath: (p: string) => p.replace(/\\/g, "/").replace(/\/$/, ""),
  isWithinRoot: (root: string, path: string) => path.startsWith(root),
}));

import {
  getDeletedDocuments,
  restoreDeletedDocument,
  deleteHistory,
  clearAllHistory,
  deleteDocumentHistory,
  clearWorkspaceHistory,
} from "./useHistoryRecovery";

describe("getDeletedDocuments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when base dir does not exist", async () => {
    mockExists.mockResolvedValue(false);
    const result = await getDeletedDocuments();
    expect(result).toEqual([]);
  });

  it("returns empty array when no directory entries", async () => {
    mockExists.mockResolvedValue(true);
    mockReadDir.mockResolvedValue([]);
    const result = await getDeletedDocuments();
    expect(result).toEqual([]);
  });

  it("skips non-directory entries", async () => {
    mockExists.mockResolvedValue(true);
    mockReadDir.mockResolvedValue([
      { name: "file.txt", isDirectory: false },
    ]);
    const result = await getDeletedDocuments();
    expect(result).toEqual([]);
  });

  it("returns deleted documents sorted by deletedAt descending", async () => {
    mockExists.mockResolvedValue(true);
    mockReadDir.mockResolvedValue([
      { name: "hash1", isDirectory: true },
      { name: "hash2", isDirectory: true },
    ]);
    mockReadTextFile
      .mockResolvedValueOnce(
        JSON.stringify({
          pathHash: "hash1",
          documentName: "doc1.md",
          documentPath: "/docs/doc1.md",
          status: "deleted",
          deletedAt: 1000,
          snapshots: [{ id: "s1", timestamp: 1000, preview: "preview1" }],
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          pathHash: "hash2",
          documentName: "doc2.md",
          documentPath: "/docs/doc2.md",
          status: "deleted",
          deletedAt: 2000,
          snapshots: [{ id: "s2", timestamp: 2000, preview: "preview2" }],
        })
      );

    const result = await getDeletedDocuments();

    expect(result).toHaveLength(2);
    expect(result[0].pathHash).toBe("hash2"); // More recent first
    expect(result[1].pathHash).toBe("hash1");
  });

  it("skips entries with active status", async () => {
    mockExists.mockResolvedValue(true);
    mockReadDir.mockResolvedValue([{ name: "hash1", isDirectory: true }]);
    mockReadTextFile.mockResolvedValue(
      JSON.stringify({
        pathHash: "hash1",
        documentName: "active.md",
        documentPath: "/docs/active.md",
        status: "active",
        deletedAt: null,
        snapshots: [{ id: "s1", timestamp: 1000, preview: "content" }],
      })
    );

    const result = await getDeletedDocuments();
    expect(result).toEqual([]);
  });

  it("skips entries with no snapshots", async () => {
    mockExists.mockResolvedValue(true);
    mockReadDir.mockResolvedValue([{ name: "hash1", isDirectory: true }]);
    mockReadTextFile.mockResolvedValue(
      JSON.stringify({
        pathHash: "hash1",
        documentName: "empty.md",
        documentPath: "/docs/empty.md",
        status: "deleted",
        deletedAt: 1000,
        snapshots: [],
      })
    );

    const result = await getDeletedDocuments();
    expect(result).toEqual([]);
  });

  it("skips entries with no index file", async () => {
    mockExists
      .mockResolvedValueOnce(true) // baseDir exists
      .mockResolvedValueOnce(false); // index.json does not exist
    mockReadDir.mockResolvedValue([{ name: "hash1", isDirectory: true }]);

    const result = await getDeletedDocuments();
    expect(result).toEqual([]);
  });

  it("handles readDir errors gracefully", async () => {
    mockExists.mockResolvedValue(true);
    mockReadDir.mockRejectedValue(new Error("permission denied"));

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await getDeletedDocuments();
    expect(result).toEqual([]);
    errorSpy.mockRestore();
  });

  it("skips entries with invalid index JSON", async () => {
    mockExists.mockResolvedValue(true);
    mockReadDir.mockResolvedValue([{ name: "hash1", isDirectory: true }]);
    mockReadTextFile.mockResolvedValue("not valid json {{{");

    const result = await getDeletedDocuments();
    expect(result).toEqual([]);
  });
});

describe("restoreDeletedDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("restores latest snapshot and updates index", async () => {
    mockExists.mockResolvedValue(true);
    mockReadTextFile
      .mockResolvedValueOnce(
        JSON.stringify({
          pathHash: "abc123",
          documentName: "old.md",
          documentPath: "/old/path.md",
          status: "deleted",
          deletedAt: 1000,
          snapshots: [{ id: "snap1", timestamp: 1000, preview: "content" }],
        })
      )
      .mockResolvedValueOnce("# Restored content");

    const content = await restoreDeletedDocument("abc123", "/new/path.md");

    expect(content).toBe("# Restored content");
    expect(mockWriteTextFile).toHaveBeenCalled();
    // Check that the index was updated
    const writtenIndex = JSON.parse(mockWriteTextFile.mock.calls[0][1]);
    expect(writtenIndex.documentPath).toBe("/new/path.md");
    expect(writtenIndex.status).toBe("active");
    expect(writtenIndex.deletedAt).toBeNull();
  });

  it("returns null when index file does not exist", async () => {
    mockExists.mockResolvedValue(false);
    const result = await restoreDeletedDocument("missing", "/new/path.md");
    expect(result).toBeNull();
  });

  it("returns null when index is invalid", async () => {
    mockExists.mockResolvedValue(true);
    mockReadTextFile.mockResolvedValue("{}"); // Missing required fields

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await restoreDeletedDocument("bad", "/new/path.md");
    expect(result).toBeNull();
    errorSpy.mockRestore();
  });

  it("returns null when no snapshots available", async () => {
    mockExists.mockResolvedValue(true);
    mockReadTextFile.mockResolvedValue(
      JSON.stringify({
        pathHash: "abc",
        documentName: "empty.md",
        documentPath: "/docs/empty.md",
        status: "deleted",
        deletedAt: 1000,
        snapshots: [],
      })
    );

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await restoreDeletedDocument("abc", "/new/path.md");
    expect(result).toBeNull();
    errorSpy.mockRestore();
  });

  it("handles read error gracefully", async () => {
    mockExists.mockResolvedValue(true);
    mockReadTextFile.mockRejectedValue(new Error("read error"));

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await restoreDeletedDocument("abc", "/new/path.md");
    expect(result).toBeNull();
    errorSpy.mockRestore();
  });
});

describe("deleteHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("removes directory when it exists", async () => {
    mockExists.mockResolvedValue(true);
    await deleteHistory("abc123");
    expect(mockRemove).toHaveBeenCalledWith(
      expect.stringContaining("abc123"),
      { recursive: true }
    );
  });

  it("does nothing when directory does not exist", async () => {
    mockExists.mockResolvedValue(false);
    await deleteHistory("missing");
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it("handles remove error gracefully", async () => {
    mockExists.mockResolvedValue(true);
    mockRemove.mockRejectedValue(new Error("permission denied"));

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await deleteHistory("abc123");
    // Should not throw
    errorSpy.mockRestore();
  });
});

describe("clearAllHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("removes entire history directory", async () => {
    mockExists.mockResolvedValue(true);
    await clearAllHistory();
    expect(mockRemove).toHaveBeenCalledWith("/appdata/history", { recursive: true });
  });

  it("does nothing when directory does not exist", async () => {
    mockExists.mockResolvedValue(false);
    await clearAllHistory();
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it("handles error gracefully", async () => {
    mockExists.mockResolvedValue(true);
    mockRemove.mockRejectedValue(new Error("disk error"));

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await clearAllHistory();
    errorSpy.mockRestore();
  });
});

describe("deleteDocumentHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes history using hashed path", async () => {
    mockExists.mockResolvedValue(true);
    await deleteDocumentHistory("/docs/test.md");
    expect(mockRemove).toHaveBeenCalled();
  });

  it("handles error gracefully", async () => {
    mockExists.mockResolvedValue(true);
    mockRemove.mockRejectedValue(new Error("fail"));

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await deleteDocumentHistory("/docs/test.md");
    errorSpy.mockRestore();
  });
});

describe("clearWorkspaceHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 0 for empty workspace path", async () => {
    const count = await clearWorkspaceHistory("  ");
    expect(count).toBe(0);
  });

  it("returns 0 when base dir does not exist", async () => {
    mockExists.mockResolvedValue(false);
    const count = await clearWorkspaceHistory("/workspace");
    expect(count).toBe(0);
  });

  it("deletes history for documents within workspace", async () => {
    mockExists.mockResolvedValue(true);
    mockReadDir.mockResolvedValue([
      { name: "hash1", isDirectory: true },
      { name: "hash2", isDirectory: true },
    ]);
    mockReadTextFile
      .mockResolvedValueOnce(
        JSON.stringify({
          pathHash: "hash1",
          documentPath: "/workspace/docs/file1.md",
          snapshots: [{ id: "s1" }],
        })
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          pathHash: "hash2",
          documentPath: "/other/docs/file2.md",
          snapshots: [{ id: "s2" }],
        })
      );

    const count = await clearWorkspaceHistory("/workspace");

    expect(count).toBe(1); // Only file1.md is within workspace
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });

  it("skips entries with invalid index", async () => {
    mockExists.mockResolvedValue(true);
    mockReadDir.mockResolvedValue([{ name: "hash1", isDirectory: true }]);
    mockReadTextFile.mockResolvedValue("invalid json");

    const count = await clearWorkspaceHistory("/workspace");
    expect(count).toBe(0);
  });

  it("handles readDir error gracefully", async () => {
    mockExists.mockResolvedValue(true);
    mockReadDir.mockRejectedValue(new Error("fail"));

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const count = await clearWorkspaceHistory("/workspace");
    expect(count).toBe(0);
    errorSpy.mockRestore();
  });
});
