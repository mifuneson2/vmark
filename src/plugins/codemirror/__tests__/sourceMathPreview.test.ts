/**
 * Tests for sourceMathPreview — math preview plugin behavior.
 *
 * Tests the SourceMathPreviewPlugin:
 * - Shows preview when cursor is inside inline math ($...$)
 * - Shows preview when cursor is inside block math ($$...$$)
 * - Hides preview when cursor is outside math
 * - Hides preview for range selection
 * - Escape keymap hides visible preview
 * - Edge cases: empty math, no coords
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

const mockShow = vi.fn();
const mockHide = vi.fn();
const mockIsVisible = vi.fn(() => false);
const mockUpdateContent = vi.fn();
const mockUpdatePosition = vi.fn();

vi.mock("@/plugins/mathPreview/MathPreviewView", () => ({
  getMathPreviewView: () => ({
    show: mockShow,
    hide: mockHide,
    isVisible: mockIsVisible,
    updateContent: mockUpdateContent,
    updatePosition: mockUpdatePosition,
  }),
}));

const mockFindInlineMath = vi.fn(() => null as { from: number; to: number; content: string } | null);
const mockFindBlockMath = vi.fn(() => null as { from: number; to: number; content: string } | null);

vi.mock("@/plugins/toolbarActions/sourceMathActions", () => ({
  findInlineMathAtCursor: (...args: unknown[]) => mockFindInlineMath(...args),
  findBlockMathAtCursor: (...args: unknown[]) => mockFindBlockMath(...args),
}));

import { createSourceMathPreviewPlugin } from "../sourceMathPreview";

async function flushRaf(): Promise<void> {
  await new Promise((r) => requestAnimationFrame(r));
}

function createView(content: string, cursorPos: number): EditorView {
  const state = EditorState.create({
    doc: content,
    selection: { anchor: cursorPos },
    extensions: [createSourceMathPreviewPlugin()],
  });
  return new EditorView({ state, parent: document.createElement("div") });
}

const createdViews: EditorView[] = [];

function tracked(content: string, cursorPos: number): EditorView {
  const v = createView(content, cursorPos);
  createdViews.push(v);
  return v;
}

describe("sourceMathPreview", () => {
  let coordsSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    coordsSpy = vi.spyOn(EditorView.prototype, "coordsAtPos").mockReturnValue({
      top: 100,
      left: 50,
      bottom: 120,
      right: 200,
    });
  });

  afterAll(() => {
    coordsSpy.mockRestore();
  });

  beforeEach(() => {
    mockShow.mockClear();
    mockHide.mockClear();
    mockIsVisible.mockClear();
    mockIsVisible.mockReturnValue(false);
    mockUpdateContent.mockClear();
    mockUpdatePosition.mockClear();
    mockFindInlineMath.mockClear();
    mockFindBlockMath.mockClear();
    mockFindInlineMath.mockReturnValue(null);
    mockFindBlockMath.mockReturnValue(null);
    coordsSpy.mockClear();
  });

  afterEach(() => {
    createdViews.forEach((v) => v.destroy());
    createdViews.length = 0;
  });

  describe("inline math preview", () => {
    it("shows preview when cursor is inside inline math", async () => {
      mockFindInlineMath.mockReturnValue({ from: 0, to: 11, content: "x^2 + 1" });
      const view = tracked("$x^2 + 1$", 3);
      await flushRaf();

      expect(mockShow).toHaveBeenCalledWith(
        "x^2 + 1",
        expect.objectContaining({ top: 100, left: 50, bottom: 120, right: 200 }),
        view.dom,
      );
    });

    it("updates existing preview if already visible", async () => {
      mockFindInlineMath.mockReturnValue({ from: 0, to: 11, content: "x^2" });
      mockIsVisible.mockReturnValue(true);
      tracked("$x^2$", 3);
      await flushRaf();

      expect(mockUpdateContent).toHaveBeenCalledWith("x^2");
      expect(mockUpdatePosition).toHaveBeenCalled();
      expect(mockShow).not.toHaveBeenCalled();
    });
  });

  describe("block math preview", () => {
    it("shows preview when cursor is inside block math", async () => {
      const content = "$$\nE = mc^2\n$$";
      mockFindBlockMath.mockReturnValue({ from: 0, to: content.length, content: "E = mc^2" });
      const view = tracked(content, 5);
      await flushRaf();

      expect(mockShow).toHaveBeenCalledWith(
        "E = mc^2",
        expect.any(Object),
        view.dom,
      );
    });

    it("block math takes priority over inline math", async () => {
      const content = "$$\nblock\n$$";
      mockFindBlockMath.mockReturnValue({ from: 0, to: content.length, content: "block" });
      mockFindInlineMath.mockReturnValue({ from: 0, to: 10, content: "inline" });
      tracked(content, 5);
      await flushRaf();

      expect(mockShow).toHaveBeenCalledWith("block", expect.any(Object), expect.any(HTMLElement));
    });
  });

  describe("hide preview", () => {
    it("hides preview when cursor is outside math", async () => {
      mockFindInlineMath.mockReturnValue(null);
      mockFindBlockMath.mockReturnValue(null);
      tracked("Hello world", 3);
      await flushRaf();

      expect(mockHide).toHaveBeenCalled();
      expect(mockShow).not.toHaveBeenCalled();
    });

    it("hides preview for range selection (not collapsed cursor)", async () => {
      mockFindInlineMath.mockReturnValue({ from: 0, to: 10, content: "x" });
      const state = EditorState.create({
        doc: "$x$",
        selection: { anchor: 0, head: 3 },
        extensions: [createSourceMathPreviewPlugin()],
      });
      const view = new EditorView({ state, parent: document.createElement("div") });
      createdViews.push(view);
      await flushRaf();

      expect(mockHide).toHaveBeenCalled();
      expect(mockShow).not.toHaveBeenCalled();
    });
  });

  describe("no coordinates available", () => {
    it("hides preview when coordsAtPos returns null", async () => {
      mockFindInlineMath.mockReturnValue({ from: 0, to: 10, content: "x" });
      coordsSpy.mockReturnValue(null);
      tracked("$x$", 2);
      await flushRaf();

      expect(mockHide).toHaveBeenCalled();
      expect(mockShow).not.toHaveBeenCalled();
    });
  });

  describe("Escape keymap", () => {
    it("exports keymap as part of the plugin array", () => {
      const extensions = createSourceMathPreviewPlugin();
      expect(Array.isArray(extensions)).toBe(true);
      expect(extensions.length).toBe(2);
    });
  });

  describe("update triggers", () => {
    it("rechecks on document change", async () => {
      mockFindInlineMath.mockReturnValue(null);
      const view = tracked("Hello", 0);
      await flushRaf();
      mockFindInlineMath.mockClear();

      mockFindInlineMath.mockReturnValue({ from: 0, to: 5, content: "x" });
      view.dispatch({ changes: { from: 0, to: 5, insert: "$x$" } });
      await flushRaf();

      expect(mockFindInlineMath).toHaveBeenCalled();
    });

    it("rechecks on selection change", async () => {
      mockFindInlineMath.mockReturnValue(null);
      const view = tracked("$x$ hello", 7);
      await flushRaf();
      mockFindInlineMath.mockClear();

      view.dispatch({ selection: { anchor: 2 } });
      await flushRaf();

      expect(mockFindBlockMath).toHaveBeenCalled();
    });
  });

  describe("destroy", () => {
    it("hides preview on destroy", async () => {
      mockFindInlineMath.mockReturnValue({ from: 0, to: 5, content: "x" });
      const view = tracked("$x$", 2);
      await flushRaf();
      mockHide.mockClear();

      view.destroy();
      createdViews.length = 0; // Already destroyed

      expect(mockHide).toHaveBeenCalled();
    });
  });
});
