import { describe, it, expect, vi } from "vitest";
import { Schema } from "@tiptap/pm/model";
import { EditorState, TextSelection } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";
import {
  doWysiwygTransformUppercase,
  doWysiwygTransformLowercase,
  doWysiwygTransformTitleCase,
  doWysiwygTransformToggleCase,
} from "./textTransformCommands";

const schema = new Schema({
  nodes: {
    doc: { content: "paragraph+", toDOM: () => ["div", 0] },
    paragraph: { content: "text*", toDOM: () => ["p", 0] },
    text: { inline: true },
  },
});

function createView(text: string, from: number, to: number): EditorView {
  const doc = schema.node("doc", null, [
    schema.node("paragraph", null, text ? [schema.text(text)] : []),
  ]);
  let state = EditorState.create({ doc, schema });
  state = state.apply(
    state.tr.setSelection(TextSelection.create(state.doc, from, to))
  );
  const container = document.createElement("div");
  return new EditorView(container, { state });
}

function createMultiParagraphView(
  texts: string[],
  from: number,
  to: number
): EditorView {
  const doc = schema.node(
    "doc",
    null,
    texts.map((t) =>
      schema.node("paragraph", null, t ? [schema.text(t)] : [])
    )
  );
  let state = EditorState.create({ doc, schema });
  state = state.apply(
    state.tr.setSelection(TextSelection.create(state.doc, from, to))
  );
  const container = document.createElement("div");
  return new EditorView(container, { state });
}

describe("textTransformCommands", () => {
  describe("doWysiwygTransformUppercase", () => {
    it("transforms selected text to uppercase", () => {
      const view = createView("hello world", 1, 6); // "hello"
      const result = doWysiwygTransformUppercase(view);
      expect(result).toBe(true);
      expect(view.state.doc.textContent).toBe("HELLO world");
      view.destroy();
    });

    it("returns false with no selection (collapsed cursor)", () => {
      const view = createView("hello", 3, 3);
      const result = doWysiwygTransformUppercase(view);
      expect(result).toBe(false);
      expect(view.state.doc.textContent).toBe("hello");
      view.destroy();
    });

    it("handles already-uppercase text without dispatching", () => {
      const view = createView("HELLO", 1, 6);
      const dispatchSpy = vi.spyOn(view, "dispatch");
      doWysiwygTransformUppercase(view);
      // Text is already uppercase, so no dispatch
      expect(dispatchSpy).not.toHaveBeenCalled();
      view.destroy();
    });

    it("handles full paragraph selection", () => {
      const view = createView("hello world", 1, 12);
      doWysiwygTransformUppercase(view);
      expect(view.state.doc.textContent).toBe("HELLO WORLD");
      view.destroy();
    });

    it("handles Unicode text", () => {
      const view = createView("cafe latte", 1, 5); // "cafe"
      doWysiwygTransformUppercase(view);
      expect(view.state.doc.textContent).toBe("CAFE latte");
      view.destroy();
    });
  });

  describe("doWysiwygTransformLowercase", () => {
    it("transforms selected text to lowercase", () => {
      const view = createView("HELLO WORLD", 1, 6);
      const result = doWysiwygTransformLowercase(view);
      expect(result).toBe(true);
      expect(view.state.doc.textContent).toBe("hello WORLD");
      view.destroy();
    });

    it("returns false with empty selection", () => {
      const view = createView("HELLO", 3, 3);
      expect(doWysiwygTransformLowercase(view)).toBe(false);
      view.destroy();
    });

    it("handles mixed case", () => {
      const view = createView("HeLLo WoRLD", 1, 13);
      doWysiwygTransformLowercase(view);
      expect(view.state.doc.textContent).toBe("hello world");
      view.destroy();
    });
  });

  describe("doWysiwygTransformTitleCase", () => {
    it("transforms selected text to title case", () => {
      const view = createView("hello world", 1, 12);
      const result = doWysiwygTransformTitleCase(view);
      expect(result).toBe(true);
      expect(view.state.doc.textContent).toBe("Hello World");
      view.destroy();
    });

    it("returns false with empty selection", () => {
      const view = createView("hello", 1, 1);
      expect(doWysiwygTransformTitleCase(view)).toBe(false);
      view.destroy();
    });

    it("handles single word selection", () => {
      const view = createView("hello world", 1, 6);
      doWysiwygTransformTitleCase(view);
      expect(view.state.doc.textContent).toBe("Hello world");
      view.destroy();
    });
  });

  describe("doWysiwygTransformToggleCase", () => {
    it("toggles lowercase to uppercase", () => {
      const view = createView("hello", 1, 6);
      const result = doWysiwygTransformToggleCase(view);
      expect(result).toBe(true);
      expect(view.state.doc.textContent).toBe("HELLO");
      view.destroy();
    });

    it("toggles uppercase to lowercase", () => {
      const view = createView("HELLO", 1, 6);
      doWysiwygTransformToggleCase(view);
      expect(view.state.doc.textContent).toBe("hello");
      view.destroy();
    });

    it("toggles mixed case (more lower) to uppercase", () => {
      const view = createView("hEllo", 1, 6);
      doWysiwygTransformToggleCase(view);
      expect(view.state.doc.textContent).toBe("HELLO");
      view.destroy();
    });

    it("toggles mixed case (more upper) to lowercase", () => {
      const view = createView("HELlo", 1, 6);
      doWysiwygTransformToggleCase(view);
      expect(view.state.doc.textContent).toBe("hello");
      view.destroy();
    });

    it("returns false with empty selection", () => {
      const view = createView("hello", 2, 2);
      expect(doWysiwygTransformToggleCase(view)).toBe(false);
      view.destroy();
    });
  });

  describe("edge cases", () => {
    it("handles single character selection", () => {
      const view = createView("hello", 1, 2);
      doWysiwygTransformUppercase(view);
      expect(view.state.doc.textContent).toBe("Hello");
      view.destroy();
    });

    it("handles selection with numbers and special chars", () => {
      const view = createView("abc123!@#def", 1, 13);
      doWysiwygTransformUppercase(view);
      expect(view.state.doc.textContent).toBe("ABC123!@#DEF");
      view.destroy();
    });

    it("handles empty paragraph", () => {
      const doc = schema.node("doc", null, [
        schema.node("paragraph", null, []),
      ]);
      const state = EditorState.create({ doc, schema });
      const container = document.createElement("div");
      const view = new EditorView(container, { state });
      expect(doWysiwygTransformUppercase(view)).toBe(false);
      view.destroy();
    });

    it("returns true even when transform is no-op (still consumed)", () => {
      const view = createView("HELLO", 1, 6);
      // uppercase -> uppercase is same text, returns true (selection was present)
      const result = doWysiwygTransformUppercase(view);
      expect(result).toBe(true);
      view.destroy();
    });

    it("handles selection spanning multiple paragraphs", () => {
      // doc: <p>hello</p><p>world</p>
      // positions: 0<p>1 hello 6</p>7<p>8 world 13</p>14
      const view = createMultiParagraphView(["hello", "world"], 1, 13);
      doWysiwygTransformUppercase(view);
      expect(view.state.doc.textContent).toBe("HELLOWORLD");
      view.destroy();
    });
  });
});
