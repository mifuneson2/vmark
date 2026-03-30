import { describe, it, expect, beforeEach } from "vitest";
import { useSourceMathPopupStore } from "./sourceMathPopupStore";

describe("sourceMathPopupStore", () => {
  beforeEach(() => {
    useSourceMathPopupStore.getState().closePopup();
  });

  it("opens popup with correct state", () => {
    const rect = { top: 10, left: 20, bottom: 30, right: 40 };
    useSourceMathPopupStore.getState().openPopup(rect, "x^2", 5, 10, false);

    const state = useSourceMathPopupStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.anchorRect).toEqual(rect);
    expect(state.latex).toBe("x^2");
    expect(state.originalLatex).toBe("x^2");
    expect(state.mathFrom).toBe(5);
    expect(state.mathTo).toBe(10);
    expect(state.isBlock).toBe(false);
  });

  it("closes popup and resets state", () => {
    const rect = { top: 10, left: 20, bottom: 30, right: 40 };
    useSourceMathPopupStore.getState().openPopup(rect, "x^2", 5, 10, false);
    useSourceMathPopupStore.getState().closePopup();

    const state = useSourceMathPopupStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.anchorRect).toBeNull();
    expect(state.latex).toBe("");
    expect(state.originalLatex).toBe("");
  });

  it("updates latex while keeping other state", () => {
    const rect = { top: 10, left: 20, bottom: 30, right: 40 };
    useSourceMathPopupStore.getState().openPopup(rect, "x^2", 5, 10, false);
    useSourceMathPopupStore.getState().updateLatex("x^3 + y");

    const state = useSourceMathPopupStore.getState();
    expect(state.latex).toBe("x^3 + y");
    expect(state.originalLatex).toBe("x^2");
    expect(state.isOpen).toBe(true);
  });

  it("sets isBlock flag for block math", () => {
    const rect = { top: 10, left: 20, bottom: 30, right: 40 };
    useSourceMathPopupStore.getState().openPopup(rect, "\\sum_{i=1}^n", 0, 20, true);

    expect(useSourceMathPopupStore.getState().isBlock).toBe(true);
  });
});
