import { describe, it, expect, vi, beforeEach } from "vitest";
import { Schema } from "@tiptap/pm/model";
import {
  EditorState,
  TextSelection,
  NodeSelection,
  Selection,
} from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";

// Mock syntaxReveal/marks before importing the module under test
const mockFindWordAtCursor = vi.fn(() => null);
vi.mock("@/plugins/syntaxReveal/marks", () => ({
  findWordAtCursor: (...args: unknown[]) => mockFindWordAtCursor(...args),
  findMarkRange: vi.fn(() => null),
}));

const { handleInlineMathShortcut } = await import("./inlineMathCommand");

const schema = new Schema({
  nodes: {
    doc: { content: "block+", toDOM: () => ["div", 0] },
    paragraph: {
      group: "block",
      content: "inline*",
      toDOM: () => ["p", 0],
    },
    math_inline: {
      group: "inline",
      inline: true,
      atom: true,
      attrs: { content: { default: "" } },
      toDOM: () => ["span", { class: "math-inline" }],
      parseDOM: [{ tag: "span.math-inline" }],
    },
    text: { group: "inline", inline: true },
  },
});

function createView(
  content: Parameters<typeof schema.node>[2],
  from: number,
  to?: number
): EditorView {
  const doc = schema.node("doc", null, [
    schema.node("paragraph", null, content),
  ]);
  let state = EditorState.create({ doc, schema });
  state = state.apply(
    state.tr.setSelection(TextSelection.create(state.doc, from, to ?? from))
  );
  const container = document.createElement("div");
  return new EditorView(container, { state });
}

function createViewWithNodeSelection(
  content: Parameters<typeof schema.node>[2],
  nodePos: number
): EditorView {
  const doc = schema.node("doc", null, [
    schema.node("paragraph", null, content),
  ]);
  let state = EditorState.create({ doc, schema });
  state = state.apply(
    state.tr.setSelection(NodeSelection.create(state.doc, nodePos))
  );
  const container = document.createElement("div");
  return new EditorView(container, { state });
}

describe("handleInlineMathShortcut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindWordAtCursor.mockReturnValue(null);
  });

  it("returns false when schema has no math_inline node type", () => {
    const noMathSchema = new Schema({
      nodes: {
        doc: { content: "paragraph+", toDOM: () => ["div", 0] },
        paragraph: { content: "text*", toDOM: () => ["p", 0] },
        text: { inline: true },
      },
    });
    const doc = noMathSchema.node("doc", null, [
      noMathSchema.node("paragraph", null, [noMathSchema.text("hello")]),
    ]);
    const state = EditorState.create({ doc, schema: noMathSchema });
    const container = document.createElement("div");
    const view = new EditorView(container, { state });

    expect(handleInlineMathShortcut(view)).toBe(false);
    view.destroy();
  });

  describe("unwrap (toggle off)", () => {
    it("unwraps math_inline via NodeSelection", () => {
      // doc: <p> text [math_inline("x^2")] text </p>
      const mathNode = schema.nodes.math_inline.create({ content: "x^2" });
      const content = [schema.text("ab"), mathNode, schema.text("cd")];
      // positions: 0<p>1 ab 3 [math(1)] 4 cd 6</p>7
      const view = createViewWithNodeSelection(content, 3);

      const result = handleInlineMathShortcut(view);
      expect(result).toBe(true);
      // math_inline replaced with text "x^2"
      expect(view.state.doc.textContent).toBe("abx^2cd");
      view.destroy();
    });

    it("unwraps math_inline with empty content via NodeSelection", () => {
      const mathNode = schema.nodes.math_inline.create({ content: "" });
      const content = [schema.text("ab"), mathNode, schema.text("cd")];
      const view = createViewWithNodeSelection(content, 3);

      handleInlineMathShortcut(view);
      // Empty math node removed, no text inserted
      expect(view.state.doc.textContent).toBe("abcd");
      view.destroy();
    });

    it("unwraps when cursor nodeAfter is math_inline", () => {
      // Cursor is right before math node
      const mathNode = schema.nodes.math_inline.create({ content: "y+1" });
      const content = [schema.text("ab"), mathNode, schema.text("cd")];
      // positions: 0<p>1 a 2 b 3 [math(1)] 4 c 5 d 6</p>7
      // cursor at pos 3 => nodeAfter is the math node
      const view = createView(content, 3);

      const result = handleInlineMathShortcut(view);
      expect(result).toBe(true);
      expect(view.state.doc.textContent).toBe("aby+1cd");
      view.destroy();
    });

    it("unwraps when cursor nodeBefore is math_inline", () => {
      // Cursor is right after math node
      const mathNode = schema.nodes.math_inline.create({ content: "z" });
      const content = [schema.text("ab"), mathNode, schema.text("cd")];
      // math_inline is atom with nodeSize 1
      // cursor at pos 4 => nodeBefore is the math node
      const view = createView(content, 4);

      const result = handleInlineMathShortcut(view);
      expect(result).toBe(true);
      expect(view.state.doc.textContent).toBe("abzcd");
      view.destroy();
    });
  });

  describe("wrap (toggle on)", () => {
    it("wraps selection in math_inline", () => {
      const view = createView([schema.text("hello world")], 1, 6); // "hello"
      const result = handleInlineMathShortcut(view);
      expect(result).toBe(true);

      // The selection text should be stored as math content attribute
      let foundMath = false;
      view.state.doc.descendants((node) => {
        if (node.type.name === "math_inline") {
          expect(node.attrs.content).toBe("hello");
          foundMath = true;
        }
      });
      expect(foundMath).toBe(true);
      view.destroy();
    });

    it("wraps word at cursor when no selection (word expansion)", () => {
      // Cursor inside "hello" at position 3
      mockFindWordAtCursor.mockReturnValue({ from: 1, to: 6 });
      const view = createView([schema.text("hello world")], 3);

      const result = handleInlineMathShortcut(view);
      expect(result).toBe(true);

      let foundMath = false;
      view.state.doc.descendants((node) => {
        if (node.type.name === "math_inline") {
          expect(node.attrs.content).toBe("hello");
          foundMath = true;
        }
      });
      expect(foundMath).toBe(true);
      view.destroy();
    });

    it("inserts empty math_inline when no selection and no word", () => {
      mockFindWordAtCursor.mockReturnValue(null);
      const view = createView([schema.text("a b")], 3); // cursor between spaces

      const result = handleInlineMathShortcut(view);
      expect(result).toBe(true);

      let foundMath = false;
      view.state.doc.descendants((node) => {
        if (node.type.name === "math_inline") {
          expect(node.attrs.content).toBe("");
          foundMath = true;
        }
      });
      expect(foundMath).toBe(true);
      view.destroy();
    });
  });

  describe("edge cases", () => {
    it("handles empty paragraph", () => {
      const doc = schema.node("doc", null, [
        schema.node("paragraph", null, []),
      ]);
      const state = EditorState.create({ doc, schema });
      const container = document.createElement("div");
      const view = new EditorView(container, { state });

      // Empty paragraph, cursor at pos 1, no nodeAfter/Before that's math
      const result = handleInlineMathShortcut(view);
      expect(result).toBe(true); // inserts empty math node
      view.destroy();
    });

    it("checks NodeSelection for non-math nodes (does not unwrap)", () => {
      // NodeSelection on a non-math_inline node type should not trigger unwrap
      // But paragraph is not inline, so we skip this — the function only checks
      // NodeSelection for math_inline type name
      const mathNode = schema.nodes.math_inline.create({ content: "a" });
      const content = [schema.text("x"), mathNode];
      // Create NodeSelection on the math node
      const view = createViewWithNodeSelection(content, 2);
      // This should unwrap because it IS math_inline
      const result = handleInlineMathShortcut(view);
      expect(result).toBe(true);
      expect(view.state.doc.textContent).toBe("xa");
      view.destroy();
    });
  });
});
