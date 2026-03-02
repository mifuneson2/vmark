import { describe, it, expect } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { applyFormat, hasFormat } from "./formatActions";

function createView(
  doc: string,
  anchor: number,
  head?: number
): EditorView {
  const state = EditorState.create({
    doc,
    selection: { anchor, head: head ?? anchor },
  });
  return new EditorView({ state, parent: document.createElement("div") });
}

describe("applyFormat", () => {
  describe("does nothing without selection", () => {
    it("returns early when from === to (no selection)", () => {
      const view = createView("hello world", 5);
      applyFormat(view, "bold");
      expect(view.state.doc.toString()).toBe("hello world");
      view.destroy();
    });
  });

  describe("bold formatting", () => {
    it("wraps selection with ** markers", () => {
      const view = createView("hello world", 0, 5); // select "hello"
      applyFormat(view, "bold");
      expect(view.state.doc.toString()).toBe("**hello** world");
      view.destroy();
    });

    it("unwraps already bold text", () => {
      const view = createView("**hello** world", 0, 9); // select "**hello**"
      applyFormat(view, "bold");
      expect(view.state.doc.toString()).toBe("hello world");
      view.destroy();
    });

    it("unwraps when surrounding text has markers", () => {
      const doc = "**hello** world";
      // select "hello" (inside the markers)
      const view = createView(doc, 2, 7);
      applyFormat(view, "bold");
      expect(view.state.doc.toString()).toBe("hello world");
      view.destroy();
    });
  });

  describe("italic formatting", () => {
    it("wraps selection with * markers", () => {
      const view = createView("hello world", 0, 5);
      applyFormat(view, "italic");
      expect(view.state.doc.toString()).toBe("*hello* world");
      view.destroy();
    });

    it("unwraps already italic text", () => {
      const view = createView("*hello* world", 0, 7);
      applyFormat(view, "italic");
      expect(view.state.doc.toString()).toBe("hello world");
      view.destroy();
    });
  });

  describe("code formatting", () => {
    it("wraps selection with backtick markers", () => {
      const view = createView("hello world", 0, 5);
      applyFormat(view, "code");
      expect(view.state.doc.toString()).toBe("`hello` world");
      view.destroy();
    });
  });

  describe("strikethrough formatting", () => {
    it("wraps selection with ~~ markers", () => {
      const view = createView("hello world", 0, 5);
      applyFormat(view, "strikethrough");
      expect(view.state.doc.toString()).toBe("~~hello~~ world");
      view.destroy();
    });
  });

  describe("highlight formatting", () => {
    it("wraps selection with == markers", () => {
      const view = createView("hello world", 0, 5);
      applyFormat(view, "highlight");
      expect(view.state.doc.toString()).toBe("==hello== world");
      view.destroy();
    });
  });

  describe("link formatting", () => {
    it("wraps selection as link with url placeholder", () => {
      const view = createView("hello world", 0, 5);
      applyFormat(view, "link");
      expect(view.state.doc.toString()).toBe("[hello](url) world");
      view.destroy();
    });
  });

  describe("image formatting", () => {
    it("inserts image syntax after selection", () => {
      const view = createView("hello world", 0, 5);
      applyFormat(view, "image");
      expect(view.state.doc.toString()).toBe("hello ![](url) world");
      view.destroy();
    });
  });

  describe("superscript / subscript", () => {
    it("wraps selection with ^ for superscript", () => {
      const view = createView("hello world", 0, 5);
      applyFormat(view, "superscript");
      expect(view.state.doc.toString()).toBe("^hello^ world");
      view.destroy();
    });

    it("wraps selection with ~ for subscript", () => {
      const view = createView("hello world", 0, 5);
      applyFormat(view, "subscript");
      expect(view.state.doc.toString()).toBe("~hello~ world");
      view.destroy();
    });

    it("removes opposite format (sub->super) before applying", () => {
      // If text is wrapped in superscript and we apply subscript,
      // it should unwrap superscript first
      const doc = "^hello^ world";
      const view = createView(doc, 0, 7); // select "^hello^"
      applyFormat(view, "subscript");
      // First unwraps ^hello^ to hello, then wraps as ~hello~
      const result = view.state.doc.toString();
      expect(result).toContain("~hello~");
      view.destroy();
    });
  });

  describe("CJK text", () => {
    it("wraps CJK text with bold markers", () => {
      const view = createView("你好世界", 0, 4);
      applyFormat(view, "bold");
      expect(view.state.doc.toString()).toBe("**你好世界**");
      view.destroy();
    });
  });
});

describe("hasFormat", () => {
  it("returns false when no selection", () => {
    const view = createView("**hello**", 4);
    expect(hasFormat(view, "bold")).toBe(false);
    view.destroy();
  });

  it("returns true when selection is wrapped in bold", () => {
    const view = createView("**hello**", 0, 9);
    expect(hasFormat(view, "bold")).toBe(true);
    view.destroy();
  });

  it("returns true when surrounding text has bold markers", () => {
    const view = createView("**hello**", 2, 7); // "hello" selected
    expect(hasFormat(view, "bold")).toBe(true);
    view.destroy();
  });

  it("returns false when text does not have format", () => {
    const view = createView("hello world", 0, 5);
    expect(hasFormat(view, "bold")).toBe(false);
    view.destroy();
  });

  it("returns false for footnote format (not toggleable)", () => {
    const view = createView("[^1] text", 0, 4);
    expect(hasFormat(view, "footnote")).toBe(false);
    view.destroy();
  });

  it("returns false for image format (not toggleable)", () => {
    const view = createView("![alt](url)", 0, 11);
    expect(hasFormat(view, "image")).toBe(false);
    view.destroy();
  });

  it("detects italic format", () => {
    const view = createView("*hello*", 0, 7);
    expect(hasFormat(view, "italic")).toBe(true);
    view.destroy();
  });

  it("detects code format", () => {
    const view = createView("`code`", 0, 6);
    expect(hasFormat(view, "code")).toBe(true);
    view.destroy();
  });

  it("returns false when markers are partially present", () => {
    const view = createView("**hello", 0, 7); // no closing **
    expect(hasFormat(view, "bold")).toBe(false);
    view.destroy();
  });

  it("returns false when marker check would exceed document bounds", () => {
    // Select just "h" at start - checking prefix would go negative
    const view = createView("h", 0, 1);
    expect(hasFormat(view, "bold")).toBe(false);
    view.destroy();
  });
});
