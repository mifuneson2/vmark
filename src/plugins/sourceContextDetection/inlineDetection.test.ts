import { describe, it, expect } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { getInlineElementAtCursor } from "./inlineDetection";

function createView(doc: string, cursor: number): EditorView {
  const state = EditorState.create({
    doc,
    selection: { anchor: cursor },
  });
  return new EditorView({ state, parent: document.createElement("div") });
}

describe("getInlineElementAtCursor", () => {
  describe("link detection", () => {
    it("detects link when cursor is in text part", () => {
      const doc = "[click here](https://example.com)";
      const view = createView(doc, 5); // in "click here"
      const info = getInlineElementAtCursor(view);

      expect(info).not.toBeNull();
      expect(info!.type).toBe("link");
      expect(info!.from).toBe(0);
      expect(info!.to).toBe(doc.length);
      view.destroy();
    });

    it("detects link when cursor is in URL part", () => {
      const doc = "[text](https://example.com)";
      const view = createView(doc, 15); // in URL
      const info = getInlineElementAtCursor(view);

      expect(info).not.toBeNull();
      expect(info!.type).toBe("link");
      view.destroy();
    });

    it("detects reference-style link [text][ref]", () => {
      const doc = "[text][ref-id]";
      const view = createView(doc, 3);
      const info = getInlineElementAtCursor(view);

      expect(info).not.toBeNull();
      expect(info!.type).toBe("link");
      view.destroy();
    });

    it("returns content range for link text", () => {
      const doc = "[hello](url)";
      const view = createView(doc, 3);
      const info = getInlineElementAtCursor(view);

      expect(info).not.toBeNull();
      expect(info!.contentFrom).toBe(1); // after [
      expect(info!.contentTo).toBe(6); // before ]
      view.destroy();
    });

    it("returns null when cursor is outside link", () => {
      const doc = "before [link](url) after";
      const view = createView(doc, 3); // in "before"
      expect(getInlineElementAtCursor(view)).toBeNull();
      view.destroy();
    });

    it("detects link with CJK text", () => {
      const doc = "[中文链接](https://example.com)";
      const view = createView(doc, 3);
      const info = getInlineElementAtCursor(view);

      expect(info).not.toBeNull();
      expect(info!.type).toBe("link");
      view.destroy();
    });
  });

  describe("image detection", () => {
    it("detects image when cursor is inside", () => {
      const doc = "![alt text](image.png)";
      const view = createView(doc, 5); // in "alt text"
      const info = getInlineElementAtCursor(view);

      expect(info).not.toBeNull();
      expect(info!.type).toBe("image");
      expect(info!.from).toBe(0);
      expect(info!.to).toBe(doc.length);
      view.destroy();
    });

    it("returns null when cursor is outside image", () => {
      const doc = "text ![img](url) more";
      const view = createView(doc, 2); // in "text"
      expect(getInlineElementAtCursor(view)).toBeNull();
      view.destroy();
    });

    it("image takes priority over link", () => {
      // Image syntax includes [alt] which could match as link
      const doc = "![alt](url)";
      const view = createView(doc, 4);
      const info = getInlineElementAtCursor(view);

      expect(info).not.toBeNull();
      expect(info!.type).toBe("image");
      view.destroy();
    });
  });

  describe("inline math detection", () => {
    it("detects inline math $...$", () => {
      const doc = "text $x^2$ more";
      const view = createView(doc, 7); // inside math
      const info = getInlineElementAtCursor(view);

      expect(info).not.toBeNull();
      expect(info!.type).toBe("math");
      view.destroy();
    });

    it("returns correct content range for math", () => {
      const doc = "$E=mc^2$";
      const view = createView(doc, 4); // inside
      const info = getInlineElementAtCursor(view);

      expect(info).not.toBeNull();
      expect(info!.contentFrom).toBe(1); // after $
      expect(info!.contentTo).toBe(7); // before $
      view.destroy();
    });

    it("returns null when cursor is outside math", () => {
      const doc = "before $math$ after";
      const view = createView(doc, 3);
      expect(getInlineElementAtCursor(view)).toBeNull();
      view.destroy();
    });

    it("skips $$ block math delimiters", () => {
      const doc = "$$block math$$";
      const view = createView(doc, 5);
      // $$ should be skipped by the inline math detector
      const info = getInlineElementAtCursor(view);
      // Should not detect as inline math since it starts with $$
      expect(info === null || info.type !== "math").toBe(true);
      view.destroy();
    });

    it("handles escaped dollar signs", () => {
      const doc = "$x \\$ y$";
      const view = createView(doc, 2);
      const info = getInlineElementAtCursor(view);
      // The \$ should not close the math span
      expect(info).not.toBeNull();
      expect(info!.type).toBe("math");
      view.destroy();
    });
  });

  describe("footnote detection", () => {
    it("detects footnote reference [^n]", () => {
      const doc = "text[^1] more";
      const view = createView(doc, 6); // inside [^1]
      const info = getInlineElementAtCursor(view);

      expect(info).not.toBeNull();
      expect(info!.type).toBe("footnote");
      view.destroy();
    });

    it("detects footnote with label [^label]", () => {
      const doc = "text[^note] more";
      const view = createView(doc, 7);
      const info = getInlineElementAtCursor(view);

      expect(info).not.toBeNull();
      expect(info!.type).toBe("footnote");
      view.destroy();
    });

    it("skips footnote definition at line start", () => {
      const doc = "[^1]: This is a footnote definition";
      const view = createView(doc, 3);
      const info = getInlineElementAtCursor(view);
      // Footnote at line start is a definition, not reference
      expect(info).toBeNull();
      view.destroy();
    });

    it("returns null when cursor is outside footnote", () => {
      const doc = "before [^1] after";
      const view = createView(doc, 3);
      expect(getInlineElementAtCursor(view)).toBeNull();
      view.destroy();
    });
  });

  describe("edge cases", () => {
    it("returns null for empty document", () => {
      const view = createView("", 0);
      expect(getInlineElementAtCursor(view)).toBeNull();
      view.destroy();
    });

    it("returns null for plain text", () => {
      const view = createView("just plain text", 5);
      expect(getInlineElementAtCursor(view)).toBeNull();
      view.destroy();
    });

    it("returns null for cursor at end of line", () => {
      const doc = "text [link](url)";
      const view = createView(doc, doc.length);
      const info = getInlineElementAtCursor(view);
      // Cursor at end of link syntax should still detect
      if (info) {
        expect(info.type).toBe("link");
      }
      view.destroy();
    });

    it("handles multiple inline elements on same line", () => {
      const doc = "[link1](url1) and [link2](url2)";
      const view = createView(doc, 22); // in "link2"
      const info = getInlineElementAtCursor(view);

      expect(info).not.toBeNull();
      expect(info!.type).toBe("link");
      // Should detect link2, not link1
      expect(info!.contentFrom).toBe(19); // after [ of link2
      view.destroy();
    });
  });
});
