import { useBlockMathEditingStore } from "../blockMathEditingStore";

beforeEach(() => {
  useBlockMathEditingStore.setState({
    editingPos: null,
    originalContent: null,
  });
});

describe("blockMathEditingStore", () => {
  describe("startEditing", () => {
    it("sets editing position and original content", () => {
      useBlockMathEditingStore.getState().startEditing(42, "x^2 + y^2");
      expect(useBlockMathEditingStore.getState().editingPos).toBe(42);
      expect(useBlockMathEditingStore.getState().originalContent).toBe("x^2 + y^2");
    });

    it("replaces previous editing state", () => {
      useBlockMathEditingStore.getState().startEditing(10, "old");
      useBlockMathEditingStore.getState().startEditing(20, "new");
      expect(useBlockMathEditingStore.getState().editingPos).toBe(20);
      expect(useBlockMathEditingStore.getState().originalContent).toBe("new");
    });

    it("handles empty content", () => {
      useBlockMathEditingStore.getState().startEditing(0, "");
      expect(useBlockMathEditingStore.getState().originalContent).toBe("");
    });
  });

  describe("exitEditing", () => {
    it("resets to initial state", () => {
      useBlockMathEditingStore.getState().startEditing(42, "content");
      useBlockMathEditingStore.getState().exitEditing();
      expect(useBlockMathEditingStore.getState().editingPos).toBeNull();
      expect(useBlockMathEditingStore.getState().originalContent).toBeNull();
    });

    it("is safe to call when not editing", () => {
      useBlockMathEditingStore.getState().exitEditing();
      expect(useBlockMathEditingStore.getState().editingPos).toBeNull();
    });
  });

  describe("isEditingAt", () => {
    it("returns true for matching position", () => {
      useBlockMathEditingStore.getState().startEditing(42, "content");
      expect(useBlockMathEditingStore.getState().isEditingAt(42)).toBe(true);
    });

    it("returns false for non-matching position", () => {
      useBlockMathEditingStore.getState().startEditing(42, "content");
      expect(useBlockMathEditingStore.getState().isEditingAt(99)).toBe(false);
    });

    it("returns false when nothing is being edited", () => {
      expect(useBlockMathEditingStore.getState().isEditingAt(0)).toBe(false);
    });
  });
});
