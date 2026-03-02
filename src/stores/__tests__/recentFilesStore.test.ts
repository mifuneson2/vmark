import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock Tauri invoke before importing the store
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@/utils/safeStorage", () => ({
  createSafeStorage: () => ({
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  }),
}));

vi.mock("@/utils/debug", () => ({
  recentWarn: vi.fn(),
}));

vi.mock("@/utils/pathUtils", () => ({
  getFileName: (path: string) => path.split("/").pop() ?? path,
}));

import { useRecentFilesStore } from "../recentFilesStore";

beforeEach(() => {
  useRecentFilesStore.setState({ files: [], maxFiles: 10 });
});

describe("recentFilesStore", () => {
  describe("addFile", () => {
    it("adds a file to the front of the list", () => {
      useRecentFilesStore.getState().addFile("/path/to/file.md");
      const files = useRecentFilesStore.getState().files;
      expect(files).toHaveLength(1);
      expect(files[0].path).toBe("/path/to/file.md");
      expect(files[0].name).toBe("file.md");
      expect(files[0].timestamp).toBeGreaterThan(0);
    });

    it("moves duplicate to front (MRU order)", () => {
      useRecentFilesStore.getState().addFile("/a.md");
      useRecentFilesStore.getState().addFile("/b.md");
      useRecentFilesStore.getState().addFile("/a.md");
      const files = useRecentFilesStore.getState().files;
      expect(files).toHaveLength(2);
      expect(files[0].path).toBe("/a.md");
      expect(files[1].path).toBe("/b.md");
    });

    it("enforces maxFiles limit", () => {
      useRecentFilesStore.setState({ maxFiles: 3 });
      useRecentFilesStore.getState().addFile("/1.md");
      useRecentFilesStore.getState().addFile("/2.md");
      useRecentFilesStore.getState().addFile("/3.md");
      useRecentFilesStore.getState().addFile("/4.md");
      const files = useRecentFilesStore.getState().files;
      expect(files).toHaveLength(3);
      expect(files[0].path).toBe("/4.md");
      expect(files.find((f) => f.path === "/1.md")).toBeUndefined();
    });

    it("handles empty path gracefully", () => {
      useRecentFilesStore.getState().addFile("");
      expect(useRecentFilesStore.getState().files).toHaveLength(1);
    });
  });

  describe("removeFile", () => {
    it("removes a file by path", () => {
      useRecentFilesStore.getState().addFile("/a.md");
      useRecentFilesStore.getState().addFile("/b.md");
      useRecentFilesStore.getState().removeFile("/a.md");
      const files = useRecentFilesStore.getState().files;
      expect(files).toHaveLength(1);
      expect(files[0].path).toBe("/b.md");
    });

    it("is a no-op for non-existent path", () => {
      useRecentFilesStore.getState().addFile("/a.md");
      useRecentFilesStore.getState().removeFile("/nonexistent.md");
      expect(useRecentFilesStore.getState().files).toHaveLength(1);
    });
  });

  describe("clearAll", () => {
    it("removes all files", () => {
      useRecentFilesStore.getState().addFile("/a.md");
      useRecentFilesStore.getState().addFile("/b.md");
      useRecentFilesStore.getState().clearAll();
      expect(useRecentFilesStore.getState().files).toHaveLength(0);
    });

    it("is safe on empty list", () => {
      useRecentFilesStore.getState().clearAll();
      expect(useRecentFilesStore.getState().files).toHaveLength(0);
    });
  });
});
