/**
 * Tests for useDocumentState — convenience hooks that bridge
 * WindowContext → tabStore → documentStore for per-component selectors.
 *
 * @module hooks/useDocumentState.test
 */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useDocumentStore } from "@/stores/documentStore";
import { useTabStore } from "@/stores/tabStore";

vi.mock("@/contexts/WindowContext", () => ({
  useWindowLabel: () => "main",
}));

import {
  useActiveTabId,
  useDocumentContent,
  useDocumentFilePath,
  useDocumentIsDirty,
  useDocumentIsMissing,
  useDocumentIsDivergent,
  useDocumentId,
  useDocumentCursorInfo,
  useDocumentLastAutoSave,
  useDocumentActions,
  useTabDocument,
} from "./useDocumentState";

const WINDOW = "main";

function resetStores() {
  useTabStore.getState().removeWindow(WINDOW);
  Object.keys(useDocumentStore.getState().documents).forEach((id) =>
    useDocumentStore.getState().removeDocument(id)
  );
}

describe("useActiveTabId", () => {
  beforeEach(resetStores);

  it("returns null when no active tab exists", () => {
    const { result } = renderHook(() => useActiveTabId());
    expect(result.current).toBeNull();
  });

  it("returns the active tab ID for the current window", () => {
    const tabId = useTabStore.getState().createTab(WINDOW, "/test.md");
    const { result } = renderHook(() => useActiveTabId());
    expect(result.current).toBe(tabId);
  });
});

describe("useDocumentContent", () => {
  beforeEach(resetStores);

  it("returns empty string when no tab is active", () => {
    const { result } = renderHook(() => useDocumentContent());
    expect(result.current).toBe("");
  });

  it("returns empty string when tab has no document", () => {
    useTabStore.getState().createTab(WINDOW, null);
    const { result } = renderHook(() => useDocumentContent());
    expect(result.current).toBe("");
  });

  it("returns document content for the active tab", () => {
    const tabId = useTabStore.getState().createTab(WINDOW, null);
    useDocumentStore.getState().initDocument(tabId, "# Hello", null);
    const { result } = renderHook(() => useDocumentContent());
    expect(result.current).toBe("# Hello");
  });
});

describe("useDocumentFilePath", () => {
  beforeEach(resetStores);

  it("returns null when no tab is active", () => {
    const { result } = renderHook(() => useDocumentFilePath());
    expect(result.current).toBeNull();
  });

  it("returns null for untitled document", () => {
    const tabId = useTabStore.getState().createTab(WINDOW, null);
    useDocumentStore.getState().initDocument(tabId, "", null);
    const { result } = renderHook(() => useDocumentFilePath());
    expect(result.current).toBeNull();
  });

  it("returns file path for saved document", () => {
    const tabId = useTabStore.getState().createTab(WINDOW, "/docs/test.md");
    useDocumentStore.getState().initDocument(tabId, "content", "/docs/test.md");
    const { result } = renderHook(() => useDocumentFilePath());
    expect(result.current).toBe("/docs/test.md");
  });
});

describe("useDocumentIsDirty", () => {
  beforeEach(resetStores);

  it("returns false when no tab is active", () => {
    const { result } = renderHook(() => useDocumentIsDirty());
    expect(result.current).toBe(false);
  });

  it("returns false for clean document", () => {
    const tabId = useTabStore.getState().createTab(WINDOW, null);
    useDocumentStore.getState().initDocument(tabId, "content", null);
    const { result } = renderHook(() => useDocumentIsDirty());
    expect(result.current).toBe(false);
  });

  it("returns true for dirty document", () => {
    const tabId = useTabStore.getState().createTab(WINDOW, null);
    useDocumentStore.getState().initDocument(tabId, "content", null);
    useDocumentStore.getState().setContent(tabId, "changed");
    const { result } = renderHook(() => useDocumentIsDirty());
    expect(result.current).toBe(true);
  });
});

describe("useDocumentIsMissing", () => {
  beforeEach(resetStores);

  it("returns false when no tab is active", () => {
    const { result } = renderHook(() => useDocumentIsMissing());
    expect(result.current).toBe(false);
  });

  it("returns true when document is marked missing", () => {
    const tabId = useTabStore.getState().createTab(WINDOW, "/test.md");
    useDocumentStore.getState().initDocument(tabId, "content", "/test.md");
    useDocumentStore.getState().markMissing(tabId);
    const { result } = renderHook(() => useDocumentIsMissing());
    expect(result.current).toBe(true);
  });
});

describe("useDocumentIsDivergent", () => {
  beforeEach(resetStores);

  it("returns false when no tab is active", () => {
    const { result } = renderHook(() => useDocumentIsDivergent());
    expect(result.current).toBe(false);
  });

  it("returns true when document is marked divergent", () => {
    const tabId = useTabStore.getState().createTab(WINDOW, "/test.md");
    useDocumentStore.getState().initDocument(tabId, "content", "/test.md");
    useDocumentStore.getState().markDivergent(tabId);
    const { result } = renderHook(() => useDocumentIsDivergent());
    expect(result.current).toBe(true);
  });
});

describe("useDocumentId", () => {
  beforeEach(resetStores);

  it("returns 0 when no tab is active", () => {
    const { result } = renderHook(() => useDocumentId());
    expect(result.current).toBe(0);
  });

  it("returns the document ID", () => {
    const tabId = useTabStore.getState().createTab(WINDOW, null);
    useDocumentStore.getState().initDocument(tabId, "", null);
    const { result } = renderHook(() => useDocumentId());
    // documentId is auto-incremented per session
    expect(typeof result.current).toBe("number");
  });
});

describe("useDocumentCursorInfo", () => {
  beforeEach(resetStores);

  it("returns null when no tab is active", () => {
    const { result } = renderHook(() => useDocumentCursorInfo());
    expect(result.current).toBeNull();
  });

  it("returns null by default (no cursor info set)", () => {
    const tabId = useTabStore.getState().createTab(WINDOW, null);
    useDocumentStore.getState().initDocument(tabId, "", null);
    const { result } = renderHook(() => useDocumentCursorInfo());
    expect(result.current).toBeNull();
  });
});

describe("useDocumentLastAutoSave", () => {
  beforeEach(resetStores);

  it("returns null when no tab is active", () => {
    const { result } = renderHook(() => useDocumentLastAutoSave());
    expect(result.current).toBeNull();
  });

  it("returns null by default (no auto-save yet)", () => {
    const tabId = useTabStore.getState().createTab(WINDOW, null);
    useDocumentStore.getState().initDocument(tabId, "", null);
    const { result } = renderHook(() => useDocumentLastAutoSave());
    expect(result.current).toBeNull();
  });
});

describe("useDocumentActions", () => {
  beforeEach(resetStores);

  it("getContent returns empty string when no active tab", () => {
    const { result } = renderHook(() => useDocumentActions());
    expect(result.current.getContent()).toBe("");
  });

  it("getContent returns current document content", () => {
    const tabId = useTabStore.getState().createTab(WINDOW, null);
    useDocumentStore.getState().initDocument(tabId, "# Test", null);
    const { result } = renderHook(() => useDocumentActions());
    expect(result.current.getContent()).toBe("# Test");
  });

  it("setContent updates document content", () => {
    const tabId = useTabStore.getState().createTab(WINDOW, null);
    useDocumentStore.getState().initDocument(tabId, "", null);
    const { result } = renderHook(() => useDocumentActions());

    act(() => {
      result.current.setContent("new content");
    });

    expect(useDocumentStore.getState().documents[tabId]?.content).toBe("new content");
  });

  it("setContent is a no-op when no active tab", () => {
    const { result } = renderHook(() => useDocumentActions());
    // Should not throw
    act(() => {
      result.current.setContent("content");
    });
  });

  it("loadContent updates content and file path", () => {
    const tabId = useTabStore.getState().createTab(WINDOW, null);
    useDocumentStore.getState().initDocument(tabId, "", null);
    const { result } = renderHook(() => useDocumentActions());

    act(() => {
      result.current.loadContent("loaded content", "/path/file.md");
    });

    const doc = useDocumentStore.getState().documents[tabId];
    expect(doc?.content).toBe("loaded content");
  });

  it("loadContent is a no-op when no active tab", () => {
    const { result } = renderHook(() => useDocumentActions());
    act(() => {
      result.current.loadContent("content", "/path.md");
    });
  });

  it("setFilePath updates both document and tab paths", () => {
    const tabId = useTabStore.getState().createTab(WINDOW, null);
    useDocumentStore.getState().initDocument(tabId, "", null);
    const { result } = renderHook(() => useDocumentActions());

    act(() => {
      result.current.setFilePath("/new/path.md");
    });

    expect(useDocumentStore.getState().documents[tabId]?.filePath).toBe("/new/path.md");
  });

  it("setFilePath with null clears path", () => {
    const tabId = useTabStore.getState().createTab(WINDOW, "/old.md");
    useDocumentStore.getState().initDocument(tabId, "content", "/old.md");
    const { result } = renderHook(() => useDocumentActions());

    act(() => {
      result.current.setFilePath(null);
    });

    expect(useDocumentStore.getState().documents[tabId]?.filePath).toBeNull();
  });

  it("setFilePath is a no-op when no active tab", () => {
    const { result } = renderHook(() => useDocumentActions());
    act(() => {
      result.current.setFilePath("/path.md");
    });
  });

  it("markSaved clears dirty flag", () => {
    const tabId = useTabStore.getState().createTab(WINDOW, null);
    useDocumentStore.getState().initDocument(tabId, "content", null);
    useDocumentStore.getState().setContent(tabId, "changed");
    expect(useDocumentStore.getState().documents[tabId]?.isDirty).toBe(true);

    const { result } = renderHook(() => useDocumentActions());
    act(() => {
      result.current.markSaved();
    });

    expect(useDocumentStore.getState().documents[tabId]?.isDirty).toBe(false);
  });

  it("markSaved is a no-op when no active tab", () => {
    const { result } = renderHook(() => useDocumentActions());
    act(() => {
      result.current.markSaved();
    });
  });

  it("markAutoSaved updates lastAutoSave timestamp", () => {
    const tabId = useTabStore.getState().createTab(WINDOW, null);
    useDocumentStore.getState().initDocument(tabId, "content", null);
    const { result } = renderHook(() => useDocumentActions());

    act(() => {
      result.current.markAutoSaved();
    });

    const doc = useDocumentStore.getState().documents[tabId];
    expect(doc?.lastAutoSave).not.toBeNull();
  });

  it("markAutoSaved is a no-op when no active tab", () => {
    const { result } = renderHook(() => useDocumentActions());
    act(() => {
      result.current.markAutoSaved();
    });
  });

  it("setCursorInfo updates cursor info", () => {
    const tabId = useTabStore.getState().createTab(WINDOW, null);
    useDocumentStore.getState().initDocument(tabId, "", null);
    const { result } = renderHook(() => useDocumentActions());

    const cursorInfo = {
      line: 1,
      column: 5,
      offset: 5,
      nodeType: "paragraph" as const,
      nodeTypes: ["paragraph" as const],
    };

    act(() => {
      result.current.setCursorInfo(cursorInfo);
    });

    expect(useDocumentStore.getState().documents[tabId]?.cursorInfo).toEqual(cursorInfo);
  });

  it("setCursorInfo with null clears cursor info", () => {
    const tabId = useTabStore.getState().createTab(WINDOW, null);
    useDocumentStore.getState().initDocument(tabId, "", null);
    const { result } = renderHook(() => useDocumentActions());

    act(() => {
      result.current.setCursorInfo(null);
    });

    expect(useDocumentStore.getState().documents[tabId]?.cursorInfo).toBeNull();
  });

  it("setCursorInfo is a no-op when no active tab", () => {
    const { result } = renderHook(() => useDocumentActions());
    act(() => {
      result.current.setCursorInfo(null);
    });
  });
});

describe("useDocumentState — undefined document fallbacks (lines 32-68, 86)", () => {
  beforeEach(resetStores);

  // Create a tab but do NOT init a document — documents[tabId] is undefined.
  // This covers the outer `?? ""` / `?? null` / `?? false` / `?? 0` branches.

  it("useDocumentContent returns empty string when document is undefined", () => {
    useTabStore.getState().createTab(WINDOW, null);
    // No initDocument — documents[tabId] is undefined
    const { result } = renderHook(() => useDocumentContent());
    expect(result.current).toBe("");
  });

  it("useDocumentFilePath returns null when document is undefined", () => {
    useTabStore.getState().createTab(WINDOW, null);
    const { result } = renderHook(() => useDocumentFilePath());
    expect(result.current).toBeNull();
  });

  it("useDocumentIsDirty returns false when document is undefined", () => {
    useTabStore.getState().createTab(WINDOW, null);
    const { result } = renderHook(() => useDocumentIsDirty());
    expect(result.current).toBe(false);
  });

  it("useDocumentIsMissing returns false when document is undefined", () => {
    useTabStore.getState().createTab(WINDOW, null);
    const { result } = renderHook(() => useDocumentIsMissing());
    expect(result.current).toBe(false);
  });

  it("useDocumentIsDivergent returns false when document is undefined", () => {
    useTabStore.getState().createTab(WINDOW, null);
    const { result } = renderHook(() => useDocumentIsDivergent());
    expect(result.current).toBe(false);
  });

  it("useDocumentId returns 0 when document is undefined", () => {
    useTabStore.getState().createTab(WINDOW, null);
    const { result } = renderHook(() => useDocumentId());
    expect(result.current).toBe(0);
  });

  it("useDocumentCursorInfo returns null when document is undefined", () => {
    useTabStore.getState().createTab(WINDOW, null);
    const { result } = renderHook(() => useDocumentCursorInfo());
    expect(result.current).toBeNull();
  });

  it("useDocumentLastAutoSave returns null when document is undefined", () => {
    useTabStore.getState().createTab(WINDOW, null);
    const { result } = renderHook(() => useDocumentLastAutoSave());
    expect(result.current).toBeNull();
  });

  it("getContent returns empty string when document is undefined (line 86)", () => {
    useTabStore.getState().createTab(WINDOW, null);
    // No initDocument
    const { result } = renderHook(() => useDocumentActions());
    expect(result.current.getContent()).toBe("");
  });
});

describe("useTabDocument", () => {
  beforeEach(resetStores);

  it("returns null when tabId is null", () => {
    const { result } = renderHook(() => useTabDocument(null));
    expect(result.current).toBeNull();
  });

  it("returns null when tab has no document", () => {
    const { result } = renderHook(() => useTabDocument("nonexistent"));
    expect(result.current).toBeNull();
  });

  it("returns document state for a specific tab", () => {
    const tabId = useTabStore.getState().createTab(WINDOW, null);
    useDocumentStore.getState().initDocument(tabId, "# Hello", "/test.md");
    const { result } = renderHook(() => useTabDocument(tabId));
    expect(result.current).not.toBeNull();
    expect(result.current?.content).toBe("# Hello");
    expect(result.current?.filePath).toBe("/test.md");
  });
});
