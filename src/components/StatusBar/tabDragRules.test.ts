import { describe, expect, it } from "vitest";
import type { Tab } from "@/stores/tabStore";
import {
  getLastPinnedIndex,
  normalizeInsertionIndex,
  planReorder,
} from "./tabDragRules";

function createTab(id: string, isPinned = false): Tab {
  return {
    id,
    title: id,
    filePath: `${id}.md`,
    isPinned,
  };
}

describe("tabDragRules", () => {
  it("normalizes forward visual insertion index", () => {
    expect(normalizeInsertionIndex(0, 3, 4)).toBe(2);
  });

  it("normalizes backward visual insertion index", () => {
    expect(normalizeInsertionIndex(3, 1, 4)).toBe(1);
  });

  it("computes last pinned index", () => {
    const tabs = [createTab("a", true), createTab("b", true), createTab("c"), createTab("d")];
    expect(getLastPinnedIndex(tabs)).toBe(1);
  });

  it("blocks unpinned tab entering pinned zone", () => {
    const tabs = [createTab("a", true), createTab("b"), createTab("c")];
    const plan = planReorder(tabs, 2, 0);
    expect(plan.allowed).toBe(false);
    expect(plan.blockedReason).toBe("pinned-zone");
    expect(plan.toIndex).toBe(1);
  });

  it("allows unpinned tab reordering within unpinned zone", () => {
    const tabs = [createTab("a", true), createTab("b"), createTab("c")];
    const plan = planReorder(tabs, 2, 2);
    expect(plan.allowed).toBe(true);
    expect(plan.blockedReason).toBe("none");
    expect(plan.toIndex).toBe(2);
  });

  it("blocks pinned tab leaving pinned zone", () => {
    const tabs = [createTab("a", true), createTab("b", true), createTab("c")];
    const plan = planReorder(tabs, 0, 3);
    expect(plan.allowed).toBe(false);
    expect(plan.blockedReason).toBe("pinned-zone");
    expect(plan.toIndex).toBe(1);
  });

  it("rejects invalid from index", () => {
    const tabs = [createTab("a"), createTab("b")];
    const plan = planReorder(tabs, -1, 1);
    expect(plan.allowed).toBe(false);
    expect(plan.blockedReason).toBe("none");
  });

  it("clamps insertion index to bounds", () => {
    expect(normalizeInsertionIndex(0, -5, 2)).toBe(0);
    expect(normalizeInsertionIndex(0, 100, 2)).toBe(1);
  });
});
