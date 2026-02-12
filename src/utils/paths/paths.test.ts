/**
 * Unit tests for path normalization helpers
 *
 * Tests cover both POSIX (macOS/Linux) and Windows-style paths.
 */
import { describe, it, expect } from "vitest";
import {
  normalizePath,
  getFileName,
  getParentDir,
  getRelativePath,
  isWithinRoot,
  pathSegments,
  isPathExcluded,
} from "./paths";

describe("paths", () => {
  describe("normalizePath", () => {
    it("converts backslashes to forward slashes", () => {
      expect(normalizePath("C:\\Users\\test\\file.md")).toBe(
        "C:/Users/test/file.md"
      );
    });

    it("preserves forward slashes", () => {
      expect(normalizePath("/Users/test/file.md")).toBe("/Users/test/file.md");
    });

    it("removes trailing slashes", () => {
      expect(normalizePath("/Users/test/")).toBe("/Users/test");
    });

    it("handles Windows paths with trailing backslash", () => {
      expect(normalizePath("C:\\Users\\test\\")).toBe("C:/Users/test");
    });

    it("handles empty string", () => {
      expect(normalizePath("")).toBe("");
    });
  });

  describe("getFileName", () => {
    it("extracts filename from POSIX path", () => {
      expect(getFileName("/Users/test/document.md")).toBe("document.md");
    });

    it("extracts filename from Windows path", () => {
      expect(getFileName("C:\\Users\\test\\document.md")).toBe("document.md");
    });

    it("handles filename without directory", () => {
      expect(getFileName("document.md")).toBe("document.md");
    });

    it("handles path with trailing slash (normalized to last segment)", () => {
      // After normalization, trailing slash is removed, so we get "test"
      expect(getFileName("/Users/test/")).toBe("test");
    });

    it("handles root path", () => {
      expect(getFileName("/")).toBe("");
    });
  });

  describe("getParentDir", () => {
    it("gets parent from POSIX path", () => {
      expect(getParentDir("/Users/test/document.md")).toBe("/Users/test");
    });

    it("gets parent from Windows path", () => {
      expect(getParentDir("C:\\Users\\test\\document.md")).toBe(
        "C:/Users/test"
      );
    });

    it("returns empty for root path", () => {
      expect(getParentDir("/")).toBe("");
    });

    it("returns empty for single segment", () => {
      expect(getParentDir("document.md")).toBe("");
    });

    it("handles trailing slash", () => {
      expect(getParentDir("/Users/test/")).toBe("/Users");
    });
  });

  describe("getRelativePath", () => {
    it("calculates relative path on POSIX", () => {
      expect(getRelativePath("/Users/root", "/Users/root/docs/file.md")).toBe(
        "docs/file.md"
      );
    });

    it("calculates relative path on Windows", () => {
      expect(
        getRelativePath("C:\\Users\\root", "C:\\Users\\root\\docs\\file.md")
      ).toBe("docs/file.md");
    });

    it("handles same directory", () => {
      expect(getRelativePath("/Users/root", "/Users/root/file.md")).toBe(
        "file.md"
      );
    });

    it("returns full path when not within root", () => {
      expect(getRelativePath("/Users/root", "/Other/path/file.md")).toBe(
        "/Other/path/file.md"
      );
    });

    it("handles root with trailing slash", () => {
      expect(getRelativePath("/Users/root/", "/Users/root/file.md")).toBe(
        "file.md"
      );
    });
  });

  describe("isWithinRoot", () => {
    it("returns true for nested path", () => {
      expect(isWithinRoot("/Users/root", "/Users/root/docs/file.md")).toBe(
        true
      );
    });

    it("returns false for outside path", () => {
      expect(isWithinRoot("/Users/root", "/Other/path")).toBe(false);
    });

    it("returns false for partial match (not at boundary)", () => {
      expect(isWithinRoot("/Users/root", "/Users/rootother/file.md")).toBe(
        false
      );
    });

    it("returns true for exact match", () => {
      expect(isWithinRoot("/Users/root", "/Users/root")).toBe(true);
    });

    it("handles Windows paths", () => {
      expect(
        isWithinRoot("C:\\Users\\root", "C:\\Users\\root\\docs\\file.md")
      ).toBe(true);
    });
  });

  describe("pathSegments", () => {
    it("splits POSIX path into segments", () => {
      expect(pathSegments("/Users/test/file.md")).toEqual([
        "Users",
        "test",
        "file.md",
      ]);
    });

    it("splits Windows path into segments", () => {
      expect(pathSegments("C:\\Users\\test\\file.md")).toEqual([
        "C:",
        "Users",
        "test",
        "file.md",
      ]);
    });

    it("handles relative path", () => {
      expect(pathSegments("docs/file.md")).toEqual(["docs", "file.md"]);
    });

    it("filters empty segments", () => {
      expect(pathSegments("/Users//test/")).toEqual(["Users", "test"]);
    });
  });

  describe("isPathExcluded", () => {
    const excludeFolders = [".git", "node_modules"];

    it("excludes path containing .git", () => {
      expect(
        isPathExcluded("/Users/root/.git/config", "/Users/root", excludeFolders)
      ).toBe(true);
    });

    it("excludes path in node_modules", () => {
      expect(
        isPathExcluded(
          "/Users/root/node_modules/react/index.js",
          "/Users/root",
          excludeFolders
        )
      ).toBe(true);
    });

    it("does not exclude regular path", () => {
      expect(
        isPathExcluded("/Users/root/src/file.ts", "/Users/root", excludeFolders)
      ).toBe(false);
    });

    it("checks segments, not substrings", () => {
      // "git-notes" should NOT match ".git"
      expect(
        isPathExcluded(
          "/Users/root/git-notes/file.md",
          "/Users/root",
          excludeFolders
        )
      ).toBe(false);
    });

    it("handles Windows paths", () => {
      expect(
        isPathExcluded(
          "C:\\Users\\root\\.git\\config",
          "C:\\Users\\root",
          excludeFolders
        )
      ).toBe(true);
    });

    it("returns false when excludeFolders is empty", () => {
      expect(isPathExcluded("/Users/root/.git/config", "/Users/root", [])).toBe(
        false
      );
    });
  });
});
