/**
 * Tests for syntaxReveal/utils — createSyntaxWidget and addWidgetDecoration.
 */

vi.mock("@tiptap/pm/view", () => ({
  Decoration: {
    widget: vi.fn((_pos, toDOM, _spec) => ({
      type: "widget",
      pos: _pos,
      toDOM,
      spec: _spec,
    })),
  },
}));

import { describe, expect, it, vi, beforeEach } from "vitest";
import { createSyntaxWidget, addWidgetDecoration } from "./utils";
import { Decoration } from "@tiptap/pm/view";

// ---------------------------------------------------------------------------
// createSyntaxWidget
// ---------------------------------------------------------------------------

describe("createSyntaxWidget", () => {
  it("returns a function", () => {
    const factory = createSyntaxWidget("**", "open");
    expect(typeof factory).toBe("function");
  });

  it("returned function creates a span element", () => {
    const factory = createSyntaxWidget("**", "bold");
    const el = factory();
    expect(el).toBeInstanceOf(HTMLSpanElement);
  });

  it("sets correct className with type", () => {
    const el = createSyntaxWidget("~~", "strikethrough")();
    expect(el.className).toBe("syntax-marker syntax-marker-strikethrough");
  });

  it("sets textContent to the provided text", () => {
    const el = createSyntaxWidget("**", "open")();
    expect(el.textContent).toBe("**");
  });

  it("sets contentEditable to false", () => {
    const el = createSyntaxWidget("`", "code")();
    expect(el.contentEditable).toBe("false");
  });

  it("handles empty text", () => {
    const el = createSyntaxWidget("", "empty")();
    expect(el.textContent).toBe("");
    expect(el.className).toBe("syntax-marker syntax-marker-empty");
  });

  it("handles special characters in text", () => {
    const el = createSyntaxWidget("](http://example.com)", "link-close")();
    expect(el.textContent).toBe("](http://example.com)");
  });

  it("handles CJK text", () => {
    const el = createSyntaxWidget("【", "bracket")();
    expect(el.textContent).toBe("【");
  });
});

// ---------------------------------------------------------------------------
// addWidgetDecoration
// ---------------------------------------------------------------------------

describe("addWidgetDecoration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pushes a decoration to the array", () => {
    const decorations: unknown[] = [];
    addWidgetDecoration(decorations as Decoration[], 5, "**", "open");
    expect(decorations.length).toBe(1);
  });

  it("calls Decoration.widget with correct position", () => {
    const decorations: unknown[] = [];
    addWidgetDecoration(decorations as Decoration[], 42, "**", "open");
    expect(Decoration.widget).toHaveBeenCalledWith(42, expect.any(Function), { side: -1 });
  });

  it("uses side -1 by default (before position)", () => {
    const decorations: unknown[] = [];
    addWidgetDecoration(decorations as Decoration[], 0, "[", "link-open");
    expect(Decoration.widget).toHaveBeenCalledWith(0, expect.any(Function), { side: -1 });
  });

  it("accepts custom side parameter", () => {
    const decorations: unknown[] = [];
    addWidgetDecoration(decorations as Decoration[], 10, "**", "close", 1);
    expect(Decoration.widget).toHaveBeenCalledWith(10, expect.any(Function), { side: 1 });
  });

  it("creates widget factory using createSyntaxWidget", () => {
    const decorations: unknown[] = [];
    addWidgetDecoration(decorations as Decoration[], 0, "~~", "strike");

    // Get the toDOM function passed to Decoration.widget
    const call = (Decoration.widget as ReturnType<typeof vi.fn>).mock.calls[0];
    const toDOM = call[1] as () => HTMLElement;

    const el = toDOM();
    expect(el.className).toBe("syntax-marker syntax-marker-strike");
    expect(el.textContent).toBe("~~");
  });

  it("can add multiple decorations", () => {
    const decorations: unknown[] = [];
    addWidgetDecoration(decorations as Decoration[], 0, "**", "open", -1);
    addWidgetDecoration(decorations as Decoration[], 10, "**", "close", 1);
    expect(decorations.length).toBe(2);
  });

  it("handles position 0", () => {
    const decorations: unknown[] = [];
    addWidgetDecoration(decorations as Decoration[], 0, "*", "open");
    expect(Decoration.widget).toHaveBeenCalledWith(0, expect.any(Function), { side: -1 });
  });
});
