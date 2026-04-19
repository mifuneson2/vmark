/**
 * useWindowTitle — pure function tests
 *
 * Tests the title formatting logic extracted from useWindowTitle.ts:
 *   - Window title always includes "VMark — filename" for macOS Window menu
 *   - Dirty indicator (•) shown only when showFilename is true
 *   - Document title (for print PDF naming)
 *   - Various file path formats (POSIX, Windows, no extension)
 */

import { describe, it, expect } from "vitest";
import { formatWindowTitle, formatDocumentTitle } from "./useWindowTitle";

// ---------------------------------------------------------------------------
// formatWindowTitle
// ---------------------------------------------------------------------------
describe("formatWindowTitle", () => {
  it("returns 'VMark — filename' when showFilename is true and not dirty", () => {
    expect(formatWindowTitle("/path/to/readme.md", false, true)).toBe("VMark — readme.md");
  });

  it("prepends dirty indicator when showFilename is true and dirty", () => {
    expect(formatWindowTitle("/path/to/readme.md", true, true)).toBe("• VMark — readme.md");
  });

  it("returns 'VMark — filename' without dirty indicator when showFilename is false", () => {
    expect(formatWindowTitle("/path/to/readme.md", false, false)).toBe("VMark — readme.md");
  });

  it("suppresses dirty indicator when showFilename is false even if dirty", () => {
    expect(formatWindowTitle("/path/to/readme.md", true, false)).toBe("VMark — readme.md");
  });

  it('uses "VMark — Untitled" when filePath is null', () => {
    expect(formatWindowTitle(null, false, true)).toBe("VMark — Untitled");
  });

  it('uses "VMark — Untitled" when filePath is undefined', () => {
    expect(formatWindowTitle(undefined, false, true)).toBe("VMark — Untitled");
  });

  it('uses "VMark — Untitled" with dirty indicator', () => {
    expect(formatWindowTitle(null, true, true)).toBe("• VMark — Untitled");
  });

  it('uses "VMark — Untitled" when filePath is empty string', () => {
    expect(formatWindowTitle("", false, true)).toBe("VMark — Untitled");
  });

  it("handles Windows backslash paths", () => {
    expect(formatWindowTitle("C:\\Users\\test\\doc.md", false, true)).toBe("VMark — doc.md");
  });

  it("handles path with no directory", () => {
    expect(formatWindowTitle("notes.md", false, true)).toBe("VMark — notes.md");
  });

  it("handles file with multiple dots", () => {
    expect(formatWindowTitle("/path/my.notes.2024.md", false, true)).toBe("VMark — my.notes.2024.md");
  });
});

// ---------------------------------------------------------------------------
// formatDocumentTitle
// ---------------------------------------------------------------------------
describe("formatDocumentTitle", () => {
  it("returns filename without extension for print PDF naming", () => {
    expect(formatDocumentTitle("/path/to/readme.md")).toBe("readme");
  });

  it("strips extension from Windows path", () => {
    expect(formatDocumentTitle("C:\\Users\\test\\doc.md")).toBe("doc");
  });

  it('returns "Untitled" for null filePath', () => {
    expect(formatDocumentTitle(null)).toBe("Untitled");
  });

  it('returns "Untitled" for undefined filePath', () => {
    expect(formatDocumentTitle(undefined)).toBe("Untitled");
  });

  it('returns "Untitled" for empty string', () => {
    expect(formatDocumentTitle("")).toBe("Untitled");
  });

  it("strips only the last extension from multi-dot filenames", () => {
    expect(formatDocumentTitle("/path/my.notes.2024.md")).toBe("my.notes.2024");
  });

  it("returns full filename when there is no extension", () => {
    expect(formatDocumentTitle("/path/to/README")).toBe("README");
  });

  it("handles bare filename without path", () => {
    expect(formatDocumentTitle("notes.txt")).toBe("notes");
  });

  it("handles dotfile (extension-only name) correctly", () => {
    // .gitignore -> getFileName returns ".gitignore", removing extension = ".gitignore"
    // (no extension to strip since the dot is at position 0)
    expect(formatDocumentTitle("/path/.gitignore")).toBe(".gitignore");
  });
});
