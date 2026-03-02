/**
 * Tests for useReplaceableTab — replaceable tab detection and existing tab lookup
 *
 * @module hooks/useReplaceableTab.test
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFindReplaceableTab } = vi.hoisted(() => ({
  mockFindReplaceableTab: vi.fn(() => null),
}));

vi.mock("@/stores/tabStore", () => ({
  useTabStore: {
    getState: vi.fn(),
  },
}));

vi.mock("@/stores/documentStore", () => ({
  useDocumentStore: {
    getState: vi.fn(),
  },
}));

vi.mock("@/utils/openPolicy", () => ({
  findReplaceableTab: mockFindReplaceableTab,
}));

vi.mock("@/utils/paths", () => ({
  normalizePath: vi.fn((path: string) => path.toLowerCase().replace(/\\/g, "/")),
}));

import { getReplaceableTab, findExistingTabForPath } from "./useReplaceableTab";
import { useTabStore } from "@/stores/tabStore";
import { useDocumentStore } from "@/stores/documentStore";

describe("getReplaceableTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no tabs exist for window", () => {
    vi.mocked(useTabStore.getState).mockReturnValue({
      tabs: {},
    } as unknown as ReturnType<typeof useTabStore.getState>);

    vi.mocked(useDocumentStore.getState).mockReturnValue({
      documents: {},
    } as unknown as ReturnType<typeof useDocumentStore.getState>);

    mockFindReplaceableTab.mockReturnValue(null);

    const result = getReplaceableTab("main");

    expect(result).toBeNull();
    expect(mockFindReplaceableTab).toHaveBeenCalledWith([]);
  });

  it("passes correctly mapped tab info to findReplaceableTab", () => {
    vi.mocked(useTabStore.getState).mockReturnValue({
      tabs: {
        main: [
          { id: "tab-1", filePath: null },
          { id: "tab-2", filePath: "/path/to/file.md" },
        ],
      },
    } as unknown as ReturnType<typeof useTabStore.getState>);

    vi.mocked(useDocumentStore.getState).mockReturnValue({
      documents: {
        "tab-1": { isDirty: false },
        "tab-2": { isDirty: true },
      },
    } as unknown as ReturnType<typeof useDocumentStore.getState>);

    mockFindReplaceableTab.mockReturnValue(null);

    getReplaceableTab("main");

    expect(mockFindReplaceableTab).toHaveBeenCalledWith([
      { id: "tab-1", filePath: null, isDirty: false },
      { id: "tab-2", filePath: "/path/to/file.md", isDirty: true },
    ]);
  });

  it("returns replaceable tab info when found", () => {
    vi.mocked(useTabStore.getState).mockReturnValue({
      tabs: {
        main: [{ id: "tab-1", filePath: null }],
      },
    } as unknown as ReturnType<typeof useTabStore.getState>);

    vi.mocked(useDocumentStore.getState).mockReturnValue({
      documents: {
        "tab-1": { isDirty: false },
      },
    } as unknown as ReturnType<typeof useDocumentStore.getState>);

    mockFindReplaceableTab.mockReturnValue({ tabId: "tab-1" });

    const result = getReplaceableTab("main");

    expect(result).toEqual({ tabId: "tab-1" });
  });

  it("handles missing document for a tab gracefully", () => {
    vi.mocked(useTabStore.getState).mockReturnValue({
      tabs: {
        main: [{ id: "tab-1", filePath: null }],
      },
    } as unknown as ReturnType<typeof useTabStore.getState>);

    vi.mocked(useDocumentStore.getState).mockReturnValue({
      documents: {}, // No document for tab-1
    } as unknown as ReturnType<typeof useDocumentStore.getState>);

    mockFindReplaceableTab.mockReturnValue(null);

    getReplaceableTab("main");

    // isDirty defaults to false when document not found
    expect(mockFindReplaceableTab).toHaveBeenCalledWith([
      { id: "tab-1", filePath: null, isDirty: false },
    ]);
  });

  it("uses empty array for undefined window tabs", () => {
    vi.mocked(useTabStore.getState).mockReturnValue({
      tabs: { "doc-1": [{ id: "tab-1" }] },
    } as unknown as ReturnType<typeof useTabStore.getState>);

    vi.mocked(useDocumentStore.getState).mockReturnValue({
      documents: {},
    } as unknown as ReturnType<typeof useDocumentStore.getState>);

    mockFindReplaceableTab.mockReturnValue(null);

    getReplaceableTab("main"); // "main" doesn't exist in tabs

    expect(mockFindReplaceableTab).toHaveBeenCalledWith([]);
  });
});

describe("findExistingTabForPath", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns tab ID when file is already open", () => {
    vi.mocked(useTabStore.getState).mockReturnValue({
      getTabsByWindow: vi.fn(() => [
        { id: "tab-1" },
        { id: "tab-2" },
      ]),
    } as unknown as ReturnType<typeof useTabStore.getState>);

    vi.mocked(useDocumentStore.getState).mockReturnValue({
      getDocument: vi.fn((id: string) => {
        if (id === "tab-1") return { filePath: "/path/to/file.md" };
        if (id === "tab-2") return { filePath: "/path/to/other.md" };
        return null;
      }),
    } as unknown as ReturnType<typeof useDocumentStore.getState>);

    const result = findExistingTabForPath("main", "/path/to/file.md");

    expect(result).toBe("tab-1");
  });

  it("returns null when file is not open in any tab", () => {
    vi.mocked(useTabStore.getState).mockReturnValue({
      getTabsByWindow: vi.fn(() => [{ id: "tab-1" }]),
    } as unknown as ReturnType<typeof useTabStore.getState>);

    vi.mocked(useDocumentStore.getState).mockReturnValue({
      getDocument: vi.fn(() => ({ filePath: "/different/file.md" })),
    } as unknown as ReturnType<typeof useDocumentStore.getState>);

    const result = findExistingTabForPath("main", "/path/to/file.md");

    expect(result).toBeNull();
  });

  it("returns null when window has no tabs", () => {
    vi.mocked(useTabStore.getState).mockReturnValue({
      getTabsByWindow: vi.fn(() => []),
    } as unknown as ReturnType<typeof useTabStore.getState>);

    const result = findExistingTabForPath("main", "/path/to/file.md");

    expect(result).toBeNull();
  });

  it("skips tabs with null filePath (untitled)", () => {
    vi.mocked(useTabStore.getState).mockReturnValue({
      getTabsByWindow: vi.fn(() => [
        { id: "tab-1" },
        { id: "tab-2" },
      ]),
    } as unknown as ReturnType<typeof useTabStore.getState>);

    vi.mocked(useDocumentStore.getState).mockReturnValue({
      getDocument: vi.fn((id: string) => {
        if (id === "tab-1") return { filePath: null };
        if (id === "tab-2") return { filePath: "/path/to/file.md" };
        return null;
      }),
    } as unknown as ReturnType<typeof useDocumentStore.getState>);

    const result = findExistingTabForPath("main", "/path/to/file.md");

    expect(result).toBe("tab-2");
  });

  it("skips tabs with no document", () => {
    vi.mocked(useTabStore.getState).mockReturnValue({
      getTabsByWindow: vi.fn(() => [{ id: "tab-1" }]),
    } as unknown as ReturnType<typeof useTabStore.getState>);

    vi.mocked(useDocumentStore.getState).mockReturnValue({
      getDocument: vi.fn(() => null),
    } as unknown as ReturnType<typeof useDocumentStore.getState>);

    const result = findExistingTabForPath("main", "/path/to/file.md");

    expect(result).toBeNull();
  });

  it("matches paths case-insensitively via normalizePath", () => {
    vi.mocked(useTabStore.getState).mockReturnValue({
      getTabsByWindow: vi.fn(() => [{ id: "tab-1" }]),
    } as unknown as ReturnType<typeof useTabStore.getState>);

    vi.mocked(useDocumentStore.getState).mockReturnValue({
      getDocument: vi.fn(() => ({ filePath: "/Path/To/File.md" })),
    } as unknown as ReturnType<typeof useDocumentStore.getState>);

    // normalizePath mock lowercases and normalizes slashes
    const result = findExistingTabForPath("main", "/path/to/file.md");

    expect(result).toBe("tab-1");
  });

  it("normalizes backslashes in file paths", () => {
    vi.mocked(useTabStore.getState).mockReturnValue({
      getTabsByWindow: vi.fn(() => [{ id: "tab-1" }]),
    } as unknown as ReturnType<typeof useTabStore.getState>);

    vi.mocked(useDocumentStore.getState).mockReturnValue({
      getDocument: vi.fn(() => ({ filePath: "C:\\Users\\test\\file.md" })),
    } as unknown as ReturnType<typeof useDocumentStore.getState>);

    const result = findExistingTabForPath("main", "c:/users/test/file.md");

    expect(result).toBe("tab-1");
  });
});
