import { describe, it, expect, beforeEach, vi } from "vitest";
import { useInlineMathEditingStore } from "../inlineMathEditingStore";
import type { InlineMathEditingCallbacks } from "../inlineMathEditingStore";

function makeCallbacks(overrides?: Partial<InlineMathEditingCallbacks>): InlineMathEditingCallbacks {
  return {
    forceExit: vi.fn(),
    getNodePos: vi.fn(() => 0),
    ...overrides,
  };
}

beforeEach(() => {
  useInlineMathEditingStore.setState({
    editingNodePos: null,
    activeCallbacks: null,
  });
});

describe("inlineMathEditingStore", () => {
  describe("startEditing", () => {
    it("sets editing position and callbacks", () => {
      const cb = makeCallbacks();
      useInlineMathEditingStore.getState().startEditing(10, cb);
      expect(useInlineMathEditingStore.getState().editingNodePos).toBe(10);
      expect(useInlineMathEditingStore.getState().activeCallbacks).toBe(cb);
    });

    it("force-exits previous editor when starting new one at different pos", () => {
      const cbOld = makeCallbacks();
      const cbNew = makeCallbacks();
      useInlineMathEditingStore.getState().startEditing(10, cbOld);
      useInlineMathEditingStore.getState().startEditing(20, cbNew);

      expect(cbOld.forceExit).toHaveBeenCalledOnce();
      expect(useInlineMathEditingStore.getState().editingNodePos).toBe(20);
      expect(useInlineMathEditingStore.getState().activeCallbacks).toBe(cbNew);
    });

    it("does NOT force-exit when re-entering same pos", () => {
      const cb = makeCallbacks();
      useInlineMathEditingStore.getState().startEditing(10, cb);
      useInlineMathEditingStore.getState().startEditing(10, cb);
      expect(cb.forceExit).not.toHaveBeenCalled();
    });
  });

  describe("stopEditing", () => {
    it("clears state when pos matches", () => {
      const cb = makeCallbacks();
      useInlineMathEditingStore.getState().startEditing(10, cb);
      useInlineMathEditingStore.getState().stopEditing(10);
      expect(useInlineMathEditingStore.getState().editingNodePos).toBeNull();
      expect(useInlineMathEditingStore.getState().activeCallbacks).toBeNull();
    });

    it("does NOT clear state when pos does not match (race condition guard)", () => {
      const cbNew = makeCallbacks();
      useInlineMathEditingStore.getState().startEditing(20, cbNew);
      // Stale stopEditing from pos 10 should not clear pos 20
      useInlineMathEditingStore.getState().stopEditing(10);
      expect(useInlineMathEditingStore.getState().editingNodePos).toBe(20);
      expect(useInlineMathEditingStore.getState().activeCallbacks).toBe(cbNew);
    });
  });

  describe("isEditingAt", () => {
    it("returns true for matching pos", () => {
      useInlineMathEditingStore.getState().startEditing(5, makeCallbacks());
      expect(useInlineMathEditingStore.getState().isEditingAt(5)).toBe(true);
    });

    it("returns false for non-matching pos", () => {
      useInlineMathEditingStore.getState().startEditing(5, makeCallbacks());
      expect(useInlineMathEditingStore.getState().isEditingAt(10)).toBe(false);
    });

    it("returns false when nothing is being edited", () => {
      expect(useInlineMathEditingStore.getState().isEditingAt(0)).toBe(false);
    });
  });

  describe("clear", () => {
    it("clears state when pos matches", () => {
      useInlineMathEditingStore.getState().startEditing(10, makeCallbacks());
      useInlineMathEditingStore.getState().clear(10);
      expect(useInlineMathEditingStore.getState().editingNodePos).toBeNull();
    });

    it("does not clear state when pos does not match", () => {
      useInlineMathEditingStore.getState().startEditing(10, makeCallbacks());
      useInlineMathEditingStore.getState().clear(20);
      expect(useInlineMathEditingStore.getState().editingNodePos).toBe(10);
    });
  });
});
