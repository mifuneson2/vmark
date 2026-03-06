# Quick Open — Design Document

**Issue:** #328
**Branch:** `feature/quick-open`
**Date:** 2026-03-06

## Summary

A Spotlight-style Quick Open overlay that replaces the native file dialog on `Cmd+O`. Users type to fuzzy-search across recent files, open tabs, and workspace files. A pinned "Browse..." row provides fallback access to the native dialog.

## Prior Art & Rationale

| Editor | Shortcut | Behavior | Takeaway |
|--------|----------|----------|----------|
| VS Code | `Cmd+P` | Fuzzy file search, path-aware, recent-first | Gold standard for fuzzy scoring |
| Sublime Text | `Cmd+P` | Fuzzy with path splitting (`s/ft` = `src/fileTree`) | Path-segment matching is essential |
| Obsidian | `Cmd+O` | Quick switcher, substring match, recent-first | Writing-app precedent for `Cmd+O` |
| IntelliJ | `Cmd+Shift+O` | Fuzzy file, camelCase-aware | Word-boundary bonuses matter |
| Telescope.nvim | `<leader>ff` | Fuzzy finder with scoring | Consecutive-match bonus proven |

**Decision:** Follow Obsidian's `Cmd+O` binding (writing-app convention) with VS Code's fuzzy scoring quality.

## UX Specification

### Trigger

- **`Cmd+O`** opens Quick Open (replaces native file dialog)
- Toggle: `Cmd+O` again closes it
- Native "Open File..." dialog moves to `Cmd+Shift+O` and the "Browse..." row

### Layout

- **Position:** Fixed overlay, centered horizontally, 15vh from top
- **Size:** 540px wide, max-height 60vh
- **Style:** Translucent background (`color-mix(in srgb, var(--bg-color) 97%, transparent)`), `backdrop-filter: blur(20px)`, `--radius-lg` (8px), `--popup-shadow`
- **Animation:** 0.1s fade-in (existing `popup-fade-in` keyframes)
- **Backdrop:** Full-viewport, `--hover-bg-strong`, click-to-dismiss
- **Z-index:** 9999, portal to `document.body`

### Search Input

- Full-width, borderless, transparent background (popup-input pattern)
- 14px `--font-sans`, caret-only focus indicator
- Placeholder: `"Open file..."` (workspace) / `"Open recent file..."` (no workspace)

### Result List

- Max **10 visible items**, scrollable beyond that
- Row height: 36px
- Each row shows:
  - **Left:** File icon (document icon; folder icon for "Browse...")
  - **Center:** Filename with matched characters highlighted in `--accent-primary` bold
  - **Right:** Relative path from workspace root, dimmed `--text-secondary`, matched chars at increased opacity
- Open-tab indicator: subtle dot badge next to filename
- Selected row: `--accent-bg` background
- "Browse..." row pinned at bottom, always visible, unaffected by filter

### Empty / Edge States

| State | Behavior |
|-------|----------|
| Empty input | Show recent files (up to 10) + open tabs, no workspace scan |
| No matches | Show "No files found" message + "Browse..." |
| No workspace, no recents | Show only "Browse..." |
| File deleted since scan | Toast notification on failed open, remove from list |

## Keyboard Interaction

| Key | Action |
|-----|--------|
| `Arrow Down` / `Arrow Up` | Move selection (wrap around) |
| `Enter` | Open selected file, close Quick Open |
| `Escape` | Close without action |
| `Cmd+O` | Toggle (close if open) |

- IME-safe: skip all key handling during CJK composition (`isImeKeyEvent()`)
- Focus trapped inside panel while open

## Fuzzy Matching Algorithm

Custom path-aware scorer (~80 lines), no external dependency.

### Why Not fuse.js

`fuse.js` is designed for generic text search. It lacks:
- Path-segment awareness (`s/ft` matching `src/fileTree`)
- Filename vs. directory weighting
- CamelCase boundary detection tuned for filenames

### Scoring Rules

**Input preprocessing:**
- If query contains `/`, split into path segments. Last segment matches filename, earlier segments match directory components left-to-right.
- Otherwise, match against filename (primary) and relative path (secondary).

**Character matching (subsequence):**
- Characters must appear in order in the target string
- Each matched character contributes to score

**Bonuses:**
| Condition | Bonus | Rationale |
|-----------|-------|-----------|
| First character match | +8 | Strong intent signal |
| Consecutive match (2nd+ char) | +5 per char | Substring-like matches are high quality |
| Word boundary start (`-`, `_`, `.`, `/`, space, camelCase) | +10 | "ft" matching "**f**ile**T**ree" |
| Exact filename prefix | +25 | Typing the start of a name is the strongest signal |

**Penalties:**
| Condition | Penalty | Rationale |
|-----------|---------|-----------|
| Gap between matches | -1 per skipped char | Scattered matches are weaker |

**Weighting:**
- Filename match score weighted 3x vs. path match score
- Minimum score threshold filters garbage matches

### Match Highlighting

Return an array of matched character indices alongside the score. The component renders matched characters in `--accent-primary` (bold) and unmatched in default color.

## Ranking

Single flat list. Three tiers applied before fuzzy score:

1. **Recent files** — from `recentFilesStore` (up to 10, MRU order)
2. **Open tabs** — from `tabStore.getAllOpenFilePaths()`
3. **Workspace files** — flattened file tree

Deduplication: items appearing in multiple tiers show at highest tier only. Within each tier, sort by fuzzy match score descending. When input is empty, show recent files in MRU order, then open tabs alphabetically.

## Architecture

### Store

```typescript
// src/stores/quickOpenStore.ts
interface QuickOpenState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}
```

Minimal — just visibility. Filter text, selection index, and computed results are local component state (reset on each open).

### Component Structure

```
src/components/QuickOpen/
  QuickOpen.tsx              — Portal, keyboard handling, result list rendering
  QuickOpen.css              — Spotlight overlay styles
  quickOpenStore.ts          — Visibility toggle store
  quickOpenStore.test.ts     — Store tests
  fuzzyMatch.ts              — Scoring algorithm + highlight index extraction
  fuzzyMatch.test.ts         — Exhaustive: ASCII, CJK, paths, boundaries, edge cases
  useQuickOpenItems.ts       — Builds flat list, applies filter, returns ranked results
  useQuickOpenItems.test.ts  — Ranking tiers, dedup, empty states
```

### Data Flow

```
Cmd+O
  -> quickOpenStore.toggle()
  -> QuickOpen mounts (portal)
  -> useQuickOpenItems():
       1. Read recentFilesStore.files (paths + timestamps)
       2. Read tabStore.getAllOpenFilePaths()
       3. If workspace: flatten file tree (cached, built once on mount)
       4. Deduplicate by path, tag each with tier
       5. On filter change: score all items, sort by tier+score, slice top results
  -> User selects item
  -> openFileInNewTabCore(windowLabel, path)
  -> quickOpenStore.close()
```

**Performance:**
- File list flattened once on mount, not per keystroke
- Fuzzy scoring is O(n * m) where n = files, m = query length — fast for typical workspaces (<5000 files)
- If `fs:changed` fires while open, re-flatten

### Shortcut Changes

| File | Before | After |
|------|--------|-------|
| `shortcutsStore.ts` | `"openFile"` → `Mod-o` → `menuId: "open"` | `"quickOpen"` → `Mod-o` → `menuId: "quick-open"`, scope: `"global"` |
| `shortcutsStore.ts` | — | `"openFile"` keeps entry but `defaultKey: ""` (no shortcut; accessible via Quick Open Browse + File menu) |
| `menu/default_menu.rs` | `"open"` → `CmdOrCtrl+O` | `"quick-open"` → `CmdOrCtrl+O`; `"open"` → no accelerator |
| `menu/custom_menu.rs` | `"open"` → `CmdOrCtrl+O` | `"quick-open"` → accelerator from store; `"open"` → no accelerator |
| `website/guide/shortcuts.md` | `Mod + O` → Open File | `Mod + O` → Quick Open |

**Note:** `Mod-Shift-o` remains "Open Workspace" (`openFolder`) — unchanged.

### Accessibility

- Input: `role="combobox"`, `aria-expanded="true"`, `aria-controls="quick-open-list"`
- List: `role="listbox"`, `id="quick-open-list"`
- Items: `role="option"`, `aria-selected` on active item
- Panel: `aria-label="Quick Open"`
- `aria-activedescendant` on input tracks selected item
- Focus trapped while open

## Non-Workspace Mode

When `workspaceStore.isWorkspaceMode === false`:
- Workspace tier is empty (no file tree)
- Results: recent files + open tabs + "Browse..."
- Placeholder: `"Open recent file..."`
- Fully functional — just fewer results

## Out of Scope (Future)

- Command palette (`>` prefix for commands) — separate feature
- File preview on hover/selection
- Create new file from Quick Open
- Workspace-wide text search (grep) from Quick Open
