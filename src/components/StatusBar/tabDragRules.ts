import type { Tab } from "@/stores/tabStore";

export interface ReorderPlan {
  allowed: boolean;
  toIndex: number;
  blockedReason: "none" | "pinned-zone";
}

/**
 * Convert visual insertion index (0..N) into array insertion index after removing the source.
 */
export function normalizeInsertionIndex(fromIndex: number, dropIndex: number, tabCount: number): number {
  let toIndex = dropIndex;
  if (fromIndex < dropIndex) {
    toIndex = dropIndex - 1;
  }
  return Math.max(0, Math.min(toIndex, tabCount - 1));
}

export function getLastPinnedIndex(tabs: Tab[]): number {
  return tabs.reduce((last, tab, index) => (tab.isPinned ? index : last), -1);
}

/**
 * Reorder policy:
 * - Pinned tabs are non-draggable in UI, but if requested, they must stay in pinned zone.
 * - Unpinned tabs cannot move into pinned zone.
 */
export function planReorder(tabs: Tab[], fromIndex: number, visualDropIndex: number): ReorderPlan {
  if (fromIndex < 0 || fromIndex >= tabs.length) {
    return { allowed: false, toIndex: fromIndex, blockedReason: "none" };
  }
  const toIndex = normalizeInsertionIndex(fromIndex, visualDropIndex, tabs.length);
  const tab = tabs[fromIndex];

  const lastPinnedIndex = getLastPinnedIndex(tabs);
  if (!tab.isPinned && toIndex <= lastPinnedIndex) {
    return { allowed: false, toIndex: Math.max(lastPinnedIndex + 1, 0), blockedReason: "pinned-zone" };
  }

  if (tab.isPinned && toIndex > lastPinnedIndex) {
    return { allowed: false, toIndex: Math.max(lastPinnedIndex, 0), blockedReason: "pinned-zone" };
  }

  return { allowed: true, toIndex, blockedReason: "none" };
}
