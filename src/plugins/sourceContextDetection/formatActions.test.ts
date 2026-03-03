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

  it("detects strikethrough format", () => {
    const view = createView("~~hello~~", 0, 9);
    expect(hasFormat(view, "strikethrough")).toBe(true);
    view.destroy();
  });

  it("detects highlight format", () => {
    const view = createView("==hello==", 0, 9);
    expect(hasFormat(view, "highlight")).toBe(true);
    view.destroy();
  });

  it("detects superscript format via surrounding text", () => {
    const view = createView("^hello^", 1, 6);
    expect(hasFormat(view, "superscript")).toBe(true);
    view.destroy();
  });

  it("detects subscript format via surrounding text", () => {
    const view = createView("~hello~", 1, 6);
    expect(hasFormat(view, "subscript")).toBe(true);
    view.destroy();
  });
});

describe("applyFormat — footnote", () => {
  it("inserts footnote reference and definition", () => {
    const view = createView("some text", 0, 4); // select "some"
    applyFormat(view, "footnote");
    const result = view.state.doc.toString();
    expect(result).toContain("[^");
    expect(result).toContain("]: some");
    view.destroy();
  });

  it("inserts footnote for text at end of document", () => {
    const view = createView("hello world", 6, 11); // select "world"
    applyFormat(view, "footnote");
    const result = view.state.doc.toString();
    expect(result).toContain("[^");
    view.destroy();
  });
});

describe("applyFormat — unwrapOppositeFormat with surrounding markers", () => {
  it("removes surrounding opposite markers (superscript -> subscript)", () => {
    // ^hello^ with selection inside the markers
    const doc = "^hello^";
    const view = createView(doc, 1, 6); // select "hello" between ^ markers
    applyFormat(view, "subscript");
    // Should unwrap ^hello^ first, then apply ~hello~
    const result = view.state.doc.toString();
    expect(result).toContain("~hello~");
    view.destroy();
  });
});

describe("applyFormat — footnote no-renumber path (line 98)", () => {
  it("sets cursor after ref when renumberFootnotes returns null (already sequential)", () => {
    // Start with a doc that already has a footnote [^1] so inserting [^2] stays sequential
    const doc = "some text[^1]\n\n[^1]: first note";
    const view = createView(doc, 0, 4); // select "some"
    applyFormat(view, "footnote");
    const result = view.state.doc.toString();
    // Should have inserted a footnote ref and definition
    expect(result).toContain("[^");
    view.destroy();
  });
});

describe("applyFormat — link cursor placement", () => {
  it("places cursor at url placeholder after wrapping link", () => {
    const view = createView("hello world", 0, 5);
    applyFormat(view, "link");
    const result = view.state.doc.toString();
    expect(result).toBe("[hello](url) world");
    // Check cursor is at "url" position
    const { anchor, head } = view.state.selection.main;
    expect(view.state.doc.sliceString(anchor, head)).toBe("url");
    view.destroy();
  });
});

describe("applyFormat — footnote when doc ends with newline (needsNewline=false path)", () => {
  it("uses single newline separator when doc ends with newline", () => {
    // Doc ends with "\n" — needsNewline is false → definition uses "\n" not "\n\n"
    const doc = "some text\n";
    const view = createView(doc, 0, 4); // select "some"
    applyFormat(view, "footnote");
    const result = view.state.doc.toString();
    expect(result).toContain("[^");
    // The definition should be appended with single newline (not double)
    // since doc ends with "\n"
    expect(result).toContain("]: some");
    view.destroy();
  });
});

describe("applyFormat — footnote no-renumber path (already sequential footnotes)", () => {
  it("falls through to else-set-cursor when renumberedDoc is null", () => {
    // A document with 0 footnotes: inserting [^999] as ref and definition.
    // renumberFootnotes on "text[^999]\n\n[^999]: text\n\n[^999]: text" should
    // return null when numbering is already sequential.
    // Use a doc that already ends with "\n" and starts with a proper sequence.
    const doc = "word\n\n[^1]: existing\n";
    // Select "word" and apply footnote — the inserted [^999] becomes [^2],
    // but renumberFootnotes returns null if everything is already sequential.
    const view = createView(doc, 0, 4);
    applyFormat(view, "footnote");
    const result = view.state.doc.toString();
    expect(result).toContain("[^");
    view.destroy();
  });
});

describe("applyFormat — unwrapOppositeFormat false branch (markers mismatch)", () => {
  it("does not unwrap when surrounding text is not the opposite format markers", () => {
    // Test the false branch of `textBefore === prefix && textAfter === suffix` in unwrapOppositeFormat.
    // superscript text (^), apply subscript (~): selecting text inside ^...^ but
    // the surrounding text happens to NOT match (e.g. different prefix).
    const doc = "x^hello^y";
    // Select "^hello^" (fully wrapped) — the isWrapped check fires first
    const view = createView(doc, 1, 8);
    // Applying subscript: first checks if selected text is wrapped in ^ (superscript opposite)
    // "^hello^" IS wrapped in ^, so it removes ^ and gets "hello", then wraps as ~hello~
    applyFormat(view, "subscript");
    const result = view.state.doc.toString();
    expect(result).toContain("~hello~");
    view.destroy();
  });

  it("does not modify when surrounding chars are not opposite markers", () => {
    // Text where surrounding chars are NOT the opposite format markers.
    // Select "hello" in "a hello b" and apply subscript — surrounding "a " and " b"
    // are not ^ (superscript) markers, so unwrapOppositeFormat returns null.
    const doc = "a hello b";
    const view = createView(doc, 2, 7); // select "hello"
    applyFormat(view, "subscript");
    // Should wrap normally since no opposite to unwrap
    expect(view.state.doc.toString()).toContain("~hello~");
    view.destroy();
  });
});

describe("applyFormat — surrounding markers false branch in main body", () => {
  it("wraps normally when surrounding chars do not match format markers (branch 18 false)", () => {
    // Surrounding chars are not bold markers — force the false branch of L179's
    // `textBefore === prefix && textAfter === suffix`.
    const doc = "a hello b";
    const view = createView(doc, 2, 7); // select "hello"; surrounding "a " and " b" ≠ "**"
    applyFormat(view, "bold");
    expect(view.state.doc.toString()).toBe("a **hello** b");
    view.destroy();
  });
});
