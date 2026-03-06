# Quick Open Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Spotlight-style Quick Open overlay (`Cmd+O`) that fuzzy-searches recent files, open tabs, and workspace files.

**Architecture:** Zustand store for visibility toggle, custom path-aware fuzzy matcher, React component with portal rendering. Reuses existing `recentFilesStore`, `tabStore`, and `useFileTree` infrastructure. GeniePicker is the reference implementation for overlay pattern.

**Tech Stack:** React 19, Zustand v5, TypeScript, Vitest, CSS custom properties

**Design Doc:** `docs/plans/2026-03-06-quick-open-design.md`

## Codex Review Fixes (v2)

Changes from v1 based on Codex architecture review (`019cc302-53d9-72f3-919d-b1b7eb409c98`):

1. **Shortcut consistency**: `openFile` gets `defaultKey: ""` (no shortcut). `Mod-Shift-o` stays as "Open Workspace". No conflict.
2. **Empty-query behavior**: Empty query shows recent files + current-window open tabs only. Workspace tier excluded on empty query.
3. **Result model**: Rank up to 50 items, render all (CSS scrollable), max 10 visible without scroll. Matches design.
4. **Store location**: Co-located at `src/components/QuickOpen/quickOpenStore.ts` (per codebase convention: feature-local stores).
5. **menu_events.rs**: Added to Task 2 — `quick-open` added to the `open`/`open-folder` special routing.
6. **macos_menu.rs**: Added to Task 2 — SF Symbol icon for "Quick Open" menu item.
7. **Cmd+O toggle**: Uses dedicated `useQuickOpenShortcuts` hook with global `window.addEventListener("keydown", ...)` — same pattern as `useGenieShortcuts`. No INPUT/TEXTAREA guard issue.
8. **Component tests**: Added Task 6 for `QuickOpen.test.tsx`.
9. **Open tabs scoped to current window**: `getTabsByWindow(windowLabel)` instead of `getAllOpenFilePaths()`.
10. **Workspace files**: Reuse `useFileTree` hook + `flattenFileTree` utility. Shared filtering via `fileTreeFilters.ts`.
11. **Stale file handling**: Catch open failure, remove from recent files, show toast.
12. **Non-markdown files**: QuickOpen filters to markdown only (same as FileExplorer default).
13. **Gate after each task**: `pnpm vitest run <file>` after each task, `pnpm check:all` at integration points.

---

### Task 1: Fuzzy Match Algorithm

**Files:**
- Create: `src/components/QuickOpen/fuzzyMatch.ts`
- Create: `src/components/QuickOpen/fuzzyMatch.test.ts`

Pure functions, no dependencies, fully testable in isolation.

**Step 1: Write failing tests**

```typescript
// src/components/QuickOpen/fuzzyMatch.test.ts
import { describe, it, expect } from "vitest";
import { fuzzyMatch } from "./fuzzyMatch";

describe("fuzzyMatch", () => {
  describe("basic matching", () => {
    it("returns null for empty query", () => {
      expect(fuzzyMatch("", "hello.md")).toBeNull();
    });

    it("returns null when query has no subsequence match", () => {
      expect(fuzzyMatch("xyz", "hello.md")).toBeNull();
    });

    it("matches exact filename", () => {
      const result = fuzzyMatch("hello", "hello.md");
      expect(result).not.toBeNull();
      expect(result!.score).toBeGreaterThan(0);
      expect(result!.indices).toEqual([0, 1, 2, 3, 4]);
    });

    it("matches subsequence", () => {
      const result = fuzzyMatch("hlo", "hello.md");
      expect(result).not.toBeNull();
      expect(result!.indices).toEqual([0, 3, 4]);
    });

    it("is case insensitive", () => {
      expect(fuzzyMatch("HeLLo", "hello.md")).not.toBeNull();
    });
  });

  describe("scoring bonuses", () => {
    it("scores consecutive matches higher than scattered", () => {
      const consecutive = fuzzyMatch("hel", "hello.md")!;
      const scattered = fuzzyMatch("hlo", "hello.md")!;
      expect(consecutive.score).toBeGreaterThan(scattered.score);
    });

    it("scores word boundary matches higher", () => {
      const boundary = fuzzyMatch("ft", "fileTree.ts")!;
      const scattered = fuzzyMatch("ft", "offset.ts")!;
      expect(boundary.score).toBeGreaterThan(scattered.score);
    });

    it("gives bonus for first character match", () => {
      const firstChar = fuzzyMatch("f", "foo.md")!;
      const midChar = fuzzyMatch("o", "foo.md")!;
      expect(firstChar.score).toBeGreaterThan(midChar.score);
    });

    it("gives bonus for exact filename prefix", () => {
      const prefix = fuzzyMatch("read", "readme.md")!;
      const nonPrefix = fuzzyMatch("eadm", "readme.md")!;
      expect(prefix.score).toBeGreaterThan(nonPrefix.score);
    });
  });

  describe("path-aware matching", () => {
    it("matches against relative path", () => {
      const result = fuzzyMatch("store", "tabStore.ts", "src/stores/tabStore.ts");
      expect(result).not.toBeNull();
    });

    it("splits query on / for path segment matching", () => {
      const result = fuzzyMatch("s/ft", "fileTree.ts", "src/fileTree.ts");
      expect(result).not.toBeNull();
    });

    it("fails path segment match when directory doesn't match", () => {
      expect(fuzzyMatch("lib/ft", "fileTree.ts", "src/fileTree.ts")).toBeNull();
    });

    it("weights filename matches higher than path matches", () => {
      const nameMatch = fuzzyMatch("tab", "tabStore.ts", "src/stores/tabStore.ts")!;
      const pathMatch = fuzzyMatch("tab", "other.ts", "src/tabs/other.ts")!;
      expect(nameMatch.score).toBeGreaterThan(pathMatch.score);
    });
  });

  describe("word boundary detection", () => {
    it("detects camelCase boundaries", () => {
      expect(fuzzyMatch("qoi", "quickOpenItems.ts")).not.toBeNull();
    });

    it("detects hyphen boundaries", () => {
      expect(fuzzyMatch("gp", "genie-picker.css")).not.toBeNull();
    });

    it("detects underscore boundaries", () => {
      expect(fuzzyMatch("fs", "file_store.ts")).not.toBeNull();
    });

    it("detects dot boundaries", () => {
      expect(fuzzyMatch("ft", "file.test.ts")).not.toBeNull();
    });
  });

  describe("CJK and Unicode", () => {
    it("matches CJK characters", () => {
      expect(fuzzyMatch("笔记", "我的笔记.md")).not.toBeNull();
    });

    it("matches mixed CJK and ASCII", () => {
      expect(fuzzyMatch("test", "测试test.md")).not.toBeNull();
    });
  });

  describe("edge cases", () => {
    it("handles single character query", () => {
      const result = fuzzyMatch("a", "abc.md");
      expect(result).not.toBeNull();
      expect(result!.indices).toEqual([0]);
    });

    it("handles query longer than target", () => {
      expect(fuzzyMatch("abcdefgh", "abc.md")).toBeNull();
    });

    it("handles special regex characters in query", () => {
      expect(fuzzyMatch(".", "file.md")).not.toBeNull();
    });

    it("handles query equal to filename", () => {
      expect(fuzzyMatch("readme.md", "readme.md")).not.toBeNull();
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/components/QuickOpen/fuzzyMatch.test.ts`
Expected: FAIL — module not found

**Step 3: Implement fuzzyMatch**

Create `src/components/QuickOpen/fuzzyMatch.ts` with:
- `FuzzyMatchResult` interface: `{ score: number; indices: number[]; pathIndices?: number[] }`
- `fuzzyMatch(query, filename, relPath?)` — main entry point
- `scoreSubsequence(query, target)` — inner subsequence scorer
- `matchWithPathSegments(query, filename, relPath)` — handles `/`-split queries
- `isWordBoundary(text, index)` — camelCase, `-`, `_`, `.`, `/`, space detection

Scoring constants (from VS Code FuzzyScorer heuristics):
- `SCORE_FIRST_CHAR = 8`, `SCORE_CONSECUTIVE = 5`, `SCORE_WORD_BOUNDARY = 10`
- `SCORE_EXACT_PREFIX = 25`, `PENALTY_GAP = -1`, `FILENAME_WEIGHT = 3`

**Step 4: Run tests**

Run: `pnpm vitest run src/components/QuickOpen/fuzzyMatch.test.ts`
Expected: All PASS

**Step 5: Commit**

```bash
git add src/components/QuickOpen/fuzzyMatch.ts src/components/QuickOpen/fuzzyMatch.test.ts
git commit -m "feat(quick-open): add path-aware fuzzy matching algorithm (#328)"
```

---

### Task 2: Rust Menu Plumbing (All Rust Changes)

**Files:**
- Modify: `src-tauri/src/menu/default_menu.rs` (2 places) — add `quick-open` item, remove `open` accelerator
- Modify: `src-tauri/src/menu/custom_menu.rs` (2 places) — same
- Modify: `src-tauri/src/menu_events.rs:427` — add `quick-open` to special no-window routing
- Modify: `src-tauri/src/macos_menu.rs` — add SF Symbol icon for "Quick Open"

All Rust menu changes consolidated into one task to avoid partial integration.

**Step 1: Update default_menu.rs**

In BOTH menu creation locations, find:
```rust
&MenuItem::with_id(app, "open", "Open...", true, Some("CmdOrCtrl+O"))?,
```

Replace with:
```rust
&MenuItem::with_id(app, "quick-open", "Quick Open", true, Some("CmdOrCtrl+O"))?,
&MenuItem::with_id(app, "open", "Open File...", true, None::<&str>)?,
```

**Step 2: Update custom_menu.rs**

In BOTH menu creation locations, find:
```rust
&MenuItem::with_id(app, "open", "Open...", true, get_accel("open", "CmdOrCtrl+O"))?,
```

Replace with:
```rust
&MenuItem::with_id(app, "quick-open", "Quick Open", true, get_accel("quick-open", "CmdOrCtrl+O"))?,
&MenuItem::with_id(app, "open", "Open File...", true, get_accel("open", ""))?,
```

Note: Using `get_accel("open", "")` preserves user re-bindability.

**Step 3: Update menu_events.rs**

At line 427, change:
```rust
if matches!(id, "open" | "open-folder") {
```

To:
```rust
if matches!(id, "open" | "open-folder" | "quick-open") {
```

This ensures Quick Open works even when no window exists (creates window first).

**Step 4: Update macos_menu.rs**

In `MENU_ICONS` array, after the `("Open...", "folder")` line, add:
```rust
("Quick Open", "magnifyingglass"),
```

And update the existing Open entry:
```rust
("Open File...", "folder"),
```

**Step 5: Verify Rust compiles**

Run: `cargo check --manifest-path src-tauri/Cargo.toml`
Expected: PASS

**Step 6: Commit**

```bash
git add src-tauri/src/menu/default_menu.rs src-tauri/src/menu/custom_menu.rs \
  src-tauri/src/menu_events.rs src-tauri/src/macos_menu.rs
git commit -m "feat(quick-open): add menu item and event routing (#328)"
```

---

### Task 3: Quick Open Store + Shortcut Hook

**Files:**
- Create: `src/components/QuickOpen/quickOpenStore.ts`
- Create: `src/components/QuickOpen/quickOpenStore.test.ts`
- Create: `src/hooks/useQuickOpenShortcuts.ts`
- Create: `src/hooks/useQuickOpenShortcuts.test.ts`

**Step 1: Write store tests**

```typescript
// src/components/QuickOpen/quickOpenStore.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { useQuickOpenStore } from "./quickOpenStore";

beforeEach(() => {
  useQuickOpenStore.setState({ isOpen: false });
});

describe("quickOpenStore", () => {
  it("starts closed", () => {
    expect(useQuickOpenStore.getState().isOpen).toBe(false);
  });

  it("opens", () => {
    useQuickOpenStore.getState().open();
    expect(useQuickOpenStore.getState().isOpen).toBe(true);
  });

  it("closes", () => {
    useQuickOpenStore.getState().open();
    useQuickOpenStore.getState().close();
    expect(useQuickOpenStore.getState().isOpen).toBe(false);
  });

  it("toggles open then closed", () => {
    useQuickOpenStore.getState().toggle();
    expect(useQuickOpenStore.getState().isOpen).toBe(true);
    useQuickOpenStore.getState().toggle();
    expect(useQuickOpenStore.getState().isOpen).toBe(false);
  });
});
```

**Step 2: Implement store**

```typescript
// src/components/QuickOpen/quickOpenStore.ts
import { create } from "zustand";

interface QuickOpenState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useQuickOpenStore = create<QuickOpenState>((set, get) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set({ isOpen: !get().isOpen }),
}));
```

**Step 3: Write shortcut hook tests**

```typescript
// src/hooks/useQuickOpenShortcuts.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useQuickOpenStore } from "@/components/QuickOpen/quickOpenStore";

// Mock dependencies
vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(() => Promise.resolve(vi.fn())),
}));

vi.mock("@/stores/shortcutsStore", () => ({
  useShortcutsStore: {
    getState: () => ({ getShortcut: (id: string) => id === "quickOpen" ? "Mod-o" : "" }),
  },
}));

vi.mock("@/utils/shortcutMatch", () => ({
  matchesShortcutEvent: vi.fn((e: KeyboardEvent, key: string) => {
    return key === "Mod-o" && e.key === "o" && e.metaKey;
  }),
}));

vi.mock("@/utils/imeGuard", () => ({
  isImeKeyEvent: vi.fn(() => false),
}));

import { useQuickOpenShortcuts } from "./useQuickOpenShortcuts";

beforeEach(() => {
  useQuickOpenStore.setState({ isOpen: false });
});

describe("useQuickOpenShortcuts", () => {
  it("toggles Quick Open on Cmd+O keydown", () => {
    renderHook(() => useQuickOpenShortcuts());

    const event = new KeyboardEvent("keydown", { key: "o", metaKey: true });
    window.dispatchEvent(event);

    expect(useQuickOpenStore.getState().isOpen).toBe(true);
  });

  it("closes Quick Open on second Cmd+O", () => {
    useQuickOpenStore.setState({ isOpen: true });
    renderHook(() => useQuickOpenShortcuts());

    const event = new KeyboardEvent("keydown", { key: "o", metaKey: true });
    window.dispatchEvent(event);

    expect(useQuickOpenStore.getState().isOpen).toBe(false);
  });
});
```

**Step 4: Implement shortcut hook**

Follow `useGenieShortcuts` pattern exactly — global `window.addEventListener("keydown", ...)` without INPUT/TEXTAREA guard:

```typescript
// src/hooks/useQuickOpenShortcuts.ts
/**
 * Quick Open Shortcuts Hook
 *
 * Purpose: Global keyboard shortcut (Cmd+O) to toggle Quick Open,
 *   and menu:quick-open event listener.
 *
 * Pattern: Same as useGenieShortcuts — global keydown listener
 *   without INPUT/TEXTAREA guard, so it fires even when an input
 *   is focused (needed because QuickOpen itself has an input).
 *
 * @coordinates-with quickOpenStore.ts — toggles visibility
 * @coordinates-with useGenieShortcuts.ts — same pattern
 * @module hooks/useQuickOpenShortcuts
 */

import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { safeUnlistenAsync } from "@/utils/safeUnlisten";
import { useShortcutsStore } from "@/stores/shortcutsStore";
import { useQuickOpenStore } from "@/components/QuickOpen/quickOpenStore";
import { matchesShortcutEvent } from "@/utils/shortcutMatch";
import { isImeKeyEvent } from "@/utils/imeGuard";

export function useQuickOpenShortcuts(): void {
  // Keyboard shortcut — global, no INPUT guard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isImeKeyEvent(e)) return;
      const quickOpenKey = useShortcutsStore.getState().getShortcut("quickOpen");
      if (matchesShortcutEvent(e, quickOpenKey)) {
        e.preventDefault();
        useQuickOpenStore.getState().toggle();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Menu event listener
  useEffect(() => {
    const unlisten = listen("menu:quick-open", () => {
      useQuickOpenStore.getState().toggle();
    });
    return () => safeUnlistenAsync(unlisten);
  }, []);
}
```

**Step 5: Run tests**

Run: `pnpm vitest run src/components/QuickOpen/quickOpenStore.test.ts src/hooks/useQuickOpenShortcuts.test.ts`
Expected: All PASS

**Step 6: Commit**

```bash
git add src/components/QuickOpen/quickOpenStore.ts src/components/QuickOpen/quickOpenStore.test.ts \
  src/hooks/useQuickOpenShortcuts.ts src/hooks/useQuickOpenShortcuts.test.ts
git commit -m "feat(quick-open): add store and global shortcut hook (#328)"
```

---

### Task 4: Item Builder + Ranker

**Files:**
- Create: `src/components/QuickOpen/useQuickOpenItems.ts`
- Create: `src/components/QuickOpen/useQuickOpenItems.test.ts`

**Key decisions from review:**
- Open tabs scoped to current window: accepts `windowLabel` parameter, uses `getTabsByWindow(windowLabel)`
- Empty query: returns recent + open tabs only (no workspace tier)
- Workspace files: filtered to markdown only (via shared `fileTreeFilters` logic)
- `flattenFileTree` utility included here

**Step 1: Write failing tests**

```typescript
// src/components/QuickOpen/useQuickOpenItems.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/stores/recentFilesStore", () => ({
  useRecentFilesStore: { getState: vi.fn(() => ({ files: [] })) },
}));
vi.mock("@/stores/tabStore", () => ({
  useTabStore: { getState: vi.fn(() => ({ getTabsByWindow: () => [] })) },
}));
vi.mock("@/stores/workspaceStore", () => ({
  useWorkspaceStore: { getState: vi.fn(() => ({ rootPath: null })) },
}));

import { useRecentFilesStore } from "@/stores/recentFilesStore";
import { useTabStore } from "@/stores/tabStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import {
  buildQuickOpenItems,
  filterAndRankItems,
  flattenFileTree,
} from "./useQuickOpenItems";
import type { FileNode } from "@/components/Sidebar/FileExplorer/types";

const mockRecentFiles = vi.mocked(useRecentFilesStore.getState);
const mockTabStore = vi.mocked(useTabStore.getState);
const mockWorkspaceStore = vi.mocked(useWorkspaceStore.getState);

beforeEach(() => {
  vi.clearAllMocks();
  mockRecentFiles.mockReturnValue({ files: [] } as any);
  mockTabStore.mockReturnValue({ getTabsByWindow: () => [] } as any);
  mockWorkspaceStore.mockReturnValue({ rootPath: null } as any);
});

describe("flattenFileTree", () => {
  it("returns empty for empty tree", () => {
    expect(flattenFileTree([])).toEqual([]);
  });

  it("flattens nested tree, skipping folders", () => {
    const tree: FileNode[] = [
      {
        id: "/p/src", name: "src", isFolder: true,
        children: [
          { id: "/p/src/a.md", name: "a", isFolder: false },
          { id: "/p/src/b.md", name: "b", isFolder: false },
        ],
      },
      { id: "/p/readme.md", name: "readme", isFolder: false },
    ];
    const paths = flattenFileTree(tree);
    expect(paths).toEqual(["/p/src/a.md", "/p/src/b.md", "/p/readme.md"]);
  });

  it("returns empty for folders-only tree", () => {
    const tree: FileNode[] = [
      { id: "/p/src", name: "src", isFolder: true, children: [] },
    ];
    expect(flattenFileTree(tree)).toEqual([]);
  });
});

describe("buildQuickOpenItems", () => {
  it("returns empty when no sources", () => {
    expect(buildQuickOpenItems("win", [])).toEqual([]);
  });

  it("includes recent files as tier 'recent'", () => {
    mockRecentFiles.mockReturnValue({
      files: [{ path: "/a.md", name: "a", timestamp: 100 }],
    } as any);
    const items = buildQuickOpenItems("win", []);
    expect(items).toHaveLength(1);
    expect(items[0].tier).toBe("recent");
  });

  it("includes current-window open tabs as tier 'open'", () => {
    mockTabStore.mockReturnValue({
      getTabsByWindow: (wl: string) =>
        wl === "win" ? [{ filePath: "/b.md" }] : [],
    } as any);
    const items = buildQuickOpenItems("win", []);
    expect(items.filter((i) => i.tier === "open")).toHaveLength(1);
  });

  it("deduplicates: recent wins over open", () => {
    mockRecentFiles.mockReturnValue({
      files: [{ path: "/a.md", name: "a", timestamp: 100 }],
    } as any);
    mockTabStore.mockReturnValue({
      getTabsByWindow: () => [{ filePath: "/a.md" }],
    } as any);
    const items = buildQuickOpenItems("win", ["/a.md"]);
    expect(items.filter((i) => i.path === "/a.md")).toHaveLength(1);
    expect(items.find((i) => i.path === "/a.md")!.tier).toBe("recent");
  });

  it("marks items open in current window", () => {
    mockRecentFiles.mockReturnValue({
      files: [{ path: "/a.md", name: "a", timestamp: 100 }],
    } as any);
    mockTabStore.mockReturnValue({
      getTabsByWindow: () => [{ filePath: "/a.md" }],
    } as any);
    const items = buildQuickOpenItems("win", []);
    expect(items[0].isOpenTab).toBe(true);
  });
});

describe("filterAndRankItems", () => {
  it("returns recent + open only when query is empty (no workspace)", () => {
    const items = [
      { path: "/a.md", filename: "a.md", relPath: "a.md", tier: "recent" as const, isOpenTab: false },
      { path: "/b.md", filename: "b.md", relPath: "b.md", tier: "workspace" as const, isOpenTab: false },
    ];
    const result = filterAndRankItems(items, "");
    expect(result).toHaveLength(1); // workspace excluded on empty query
    expect(result[0].item.tier).toBe("recent");
  });

  it("includes workspace tier when query is non-empty", () => {
    const items = [
      { path: "/b.md", filename: "b.md", relPath: "b.md", tier: "workspace" as const, isOpenTab: false },
    ];
    const result = filterAndRankItems(items, "b");
    expect(result).toHaveLength(1);
  });

  it("filters by fuzzy match", () => {
    const items = [
      { path: "/tab.md", filename: "tab.md", relPath: "tab.md", tier: "workspace" as const, isOpenTab: false },
      { path: "/xyz.md", filename: "xyz.md", relPath: "xyz.md", tier: "workspace" as const, isOpenTab: false },
    ];
    const result = filterAndRankItems(items, "tab");
    expect(result).toHaveLength(1);
    expect(result[0].item.filename).toBe("tab.md");
  });

  it("limits results to maxResults", () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      path: `/f${i}.md`, filename: `f${i}.md`, relPath: `f${i}.md`,
      tier: "workspace" as const, isOpenTab: false,
    }));
    expect(filterAndRankItems(items, "f", 10)).toHaveLength(10);
  });
});
```

**Step 2: Implement**

```typescript
// src/components/QuickOpen/useQuickOpenItems.ts
import { useRecentFilesStore } from "@/stores/recentFilesStore";
import { useTabStore } from "@/stores/tabStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { fuzzyMatch, type FuzzyMatchResult } from "./fuzzyMatch";
import type { FileNode } from "@/components/Sidebar/FileExplorer/types";

export type QuickOpenTier = "recent" | "open" | "workspace";

export interface QuickOpenItem {
  path: string;
  filename: string;
  relPath: string;
  tier: QuickOpenTier;
  isOpenTab: boolean;
}

export interface RankedItem {
  item: QuickOpenItem;
  tier: QuickOpenTier;
  match: FuzzyMatchResult | null;
}

const TIER_ORDER: Record<QuickOpenTier, number> = { recent: 0, open: 1, workspace: 2 };

function getFilename(path: string): string {
  return path.split("/").pop() || path;
}

function getRelativePath(path: string, rootPath: string | null): string {
  if (rootPath && path.startsWith(rootPath)) {
    const rel = path.slice(rootPath.length);
    return rel.startsWith("/") ? rel.slice(1) : rel;
  }
  return path;
}

export function flattenFileTree(nodes: FileNode[]): string[] {
  const paths: string[] = [];
  const walk = (items: FileNode[]) => {
    for (const node of items) {
      if (node.isFolder && node.children) walk(node.children);
      else if (!node.isFolder) paths.push(node.id);
    }
  };
  walk(nodes);
  return paths;
}

export function buildQuickOpenItems(
  windowLabel: string,
  workspaceFilePaths: string[]
): QuickOpenItem[] {
  const rootPath = useWorkspaceStore.getState().rootPath;
  const recentFiles = useRecentFilesStore.getState().files;
  const windowTabs = useTabStore.getState().getTabsByWindow(windowLabel);
  const openPathSet = new Set(windowTabs.filter((t) => t.filePath).map((t) => t.filePath!));

  const seen = new Set<string>();
  const items: QuickOpenItem[] = [];

  for (const rf of recentFiles) {
    if (seen.has(rf.path)) continue;
    seen.add(rf.path);
    items.push({
      path: rf.path, filename: getFilename(rf.path),
      relPath: getRelativePath(rf.path, rootPath),
      tier: "recent", isOpenTab: openPathSet.has(rf.path),
    });
  }

  for (const path of openPathSet) {
    if (seen.has(path)) continue;
    seen.add(path);
    items.push({
      path, filename: getFilename(path),
      relPath: getRelativePath(path, rootPath),
      tier: "open", isOpenTab: true,
    });
  }

  for (const path of workspaceFilePaths) {
    if (seen.has(path)) continue;
    seen.add(path);
    items.push({
      path, filename: getFilename(path),
      relPath: getRelativePath(path, rootPath),
      tier: "workspace", isOpenTab: openPathSet.has(path),
    });
  }

  return items;
}

export function filterAndRankItems(
  items: QuickOpenItem[],
  query: string,
  maxResults = 50
): RankedItem[] {
  if (!query.trim()) {
    // Empty query: recent + open only, no workspace
    return items
      .filter((i) => i.tier !== "workspace")
      .sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier])
      .slice(0, maxResults)
      .map((item) => ({ item, tier: item.tier, match: null }));
  }

  const scored: RankedItem[] = [];
  for (const item of items) {
    const match = fuzzyMatch(query, item.filename, item.relPath);
    if (match) scored.push({ item, tier: item.tier, match });
  }

  scored.sort((a, b) => {
    const tierDiff = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
    if (tierDiff !== 0) return tierDiff;
    return (b.match?.score ?? 0) - (a.match?.score ?? 0);
  });

  return scored.slice(0, maxResults);
}
```

**Step 3: Run tests**

Run: `pnpm vitest run src/components/QuickOpen/useQuickOpenItems.test.ts`
Expected: All PASS

**Step 4: Commit**

```bash
git add src/components/QuickOpen/useQuickOpenItems.ts src/components/QuickOpen/useQuickOpenItems.test.ts
git commit -m "feat(quick-open): add item builder, ranker, and tree flattener (#328)"
```

---

### Task 5: QuickOpen Component + CSS

**Files:**
- Create: `src/components/QuickOpen/QuickOpen.tsx`
- Create: `src/components/QuickOpen/QuickOpen.css`

Follows GeniePicker pattern: portal to `document.body`, click-outside close, keyboard navigation, IME-safe. Uses `useFileTree` hook for workspace paths (shared filtering logic).

**Key implementation details:**
- Component accepts `windowLabel` prop
- Uses `useFileTree` from existing infrastructure (reuses `fileTreeFilters.ts` for `excludeFolders`, hidden files, markdown-only)
- `flattenFileTree` called in `useMemo` when tree changes
- `Cmd+O` toggle handled by `useQuickOpenShortcuts` (Task 3), NOT inside this component
- Stale file handling: if `openFileInNewTabCore` fails, call `useRecentFilesStore.getState().removeFile(path)` and show toast
- "Browse..." row always pinned at bottom
- Arrow key wrap-around navigation
- `aria-*` attributes for accessibility

**Step 1: Create CSS** (`src/components/QuickOpen/QuickOpen.css`)

Spotlight-style overlay: `.quick-open-backdrop` (fixed, inset 0, z-9999, flex center, padding-top 15vh), `.quick-open` (540px, max-height 60vh, blur backdrop, radius-lg, popup-shadow), dark theme shadow override, input wrapper with bottom border, list items at 36px height, selected = accent-bg, match highlights in accent-primary bold, open-tab dot indicator, separator before Browse row.

**Step 2: Create component** (`src/components/QuickOpen/QuickOpen.tsx`)

- Portal to `document.body`
- `useFileTree(rootPath, { excludeFolders, showHidden, showAllFiles: false, watchId: windowLabel })` for workspace
- `flattenFileTree(tree)` in useMemo
- `buildQuickOpenItems(windowLabel, workspacePaths)` in useMemo
- `filterAndRankItems(allItems, filter)` in useMemo
- `handleSelectItem`: close + `openFileInNewTabCore`, catch → `removeFile` + toast
- `handleBrowse`: close + `handleOpen(windowLabel)`
- `renderHighlighted(text, indices)` helper for match highlighting
- Inline SVG icons (FileIcon, FolderIcon) to avoid import complexity

**Step 3: Commit**

```bash
git add src/components/QuickOpen/QuickOpen.tsx src/components/QuickOpen/QuickOpen.css
git commit -m "feat(quick-open): add QuickOpen component and styles (#328)"
```

---

### Task 6: Component Tests

**Files:**
- Create: `src/components/QuickOpen/QuickOpen.test.tsx`

Test keyboard navigation, selection, browse row, click-outside, IME guard, empty states.

**Tests to write:**
1. Renders nothing when store is closed
2. Renders portal when store is open
3. Escape closes the overlay
4. Arrow Down moves selection
5. Arrow Up wraps to Browse row
6. Enter on file item calls openFileInNewTabCore
7. Enter on Browse row calls handleOpen
8. Click outside closes overlay
9. Shows "No files found" when filter has no matches
10. Shows placeholder based on workspace mode
11. IME composition events suppress keyboard handling
12. Stale file open failure removes from recent and shows toast

**Step 1: Write tests, Step 2: Run to verify PASS**

Run: `pnpm vitest run src/components/QuickOpen/QuickOpen.test.tsx`

**Step 3: Commit**

```bash
git add src/components/QuickOpen/QuickOpen.test.tsx
git commit -m "test(quick-open): add component interaction tests (#328)"
```

---

### Task 7: Wire Into App + Update Shortcuts Store

**Files:**
- Modify: `src/App.tsx` — mount `<QuickOpen />` and call `useQuickOpenShortcuts()`
- Modify: `src/stores/shortcutsStore.ts` — add `quickOpen` entry, set `openFile.defaultKey` to `""`

**Step 1: Update shortcutsStore.ts**

In `DEFAULT_SHORTCUTS`, replace:
```typescript
{ id: "openFile", label: "Open File", category: "file", defaultKey: "Mod-o", menuId: "open", scope: "global" },
```

With:
```typescript
{ id: "quickOpen", label: "Quick Open", category: "file", defaultKey: "Mod-o", menuId: "quick-open", scope: "global" },
{ id: "openFile", label: "Open File...", category: "file", defaultKey: "", menuId: "open", scope: "global" },
```

**Step 2: Mount in App.tsx**

Add import and render alongside GeniePicker:
```tsx
import { QuickOpen } from "@/components/QuickOpen/QuickOpen";
import { useQuickOpenShortcuts } from "@/hooks/useQuickOpenShortcuts";

// Inside App component:
useQuickOpenShortcuts();

// In JSX, near <GeniePicker />:
<QuickOpen windowLabel={windowLabel} />
```

**Step 3: Update useFileShortcuts.ts if needed**

The `menu:open` listener remains — it now handles "Open File..." (the native dialog item, no accelerator). No changes needed if the menu ID stays `"open"`.

**Step 4: Run full gate**

Run: `pnpm check:all`
Expected: All tests pass, coverage thresholds met, build succeeds

**Step 5: Commit**

```bash
git add src/App.tsx src/stores/shortcutsStore.ts
git commit -m "feat(quick-open): mount component and update shortcuts (#328)"
```

---

### Task 8: Update Documentation

**Files:**
- Modify: `website/guide/shortcuts.md` — update `Mod + O` from "Open File" to "Quick Open"

**Step 1: Find the `Mod + O` row and change label**

Before: `| Mod + O | Open File |`
After: `| Mod + O | Quick Open |`

Add note that "Open File..." is available via Quick Open's "Browse..." or File menu.

**Step 2: Commit**

```bash
git add website/guide/shortcuts.md
git commit -m "docs: update shortcuts for Quick Open (#328)"
```

---

### Task 9: Final Verification + Push

**Step 1: Run full gate**

Run: `pnpm check:all`
Expected: PASS

**Step 2: Manual testing checklist** (ask user to test)

- [ ] `Cmd+O` opens Quick Open overlay
- [ ] `Cmd+O` again closes it (toggle)
- [ ] Works when focus is in editor (TipTap), source mode (CodeMirror), or sidebar
- [ ] Typing filters results with fuzzy matching
- [ ] Path-segment query works (`s/ft` matches `src/fileTree`)
- [ ] Arrow keys navigate with wrap-around, Enter opens file
- [ ] Escape closes overlay
- [ ] "Browse..." row always visible, opens native file dialog
- [ ] Recent files appear first on empty input
- [ ] Open tab dot indicator shows correctly
- [ ] Workspace files only appear when typing (not on empty query)
- [ ] Works in both light and dark themes
- [ ] Works in non-workspace mode (shows recent files + Browse only)
- [ ] CJK input works correctly (IME composition not intercepted)
- [ ] File opens in existing tab if already open (dedup)
- [ ] Opening a deleted file shows toast and removes from recent

**Step 3: Push**

```bash
git push origin feature/quick-open
```
