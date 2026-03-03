/**
 * Tests for sourceDetailsDecoration — details block detection and decoration.
 *
 * Tests findDetailsBlocks logic via the plugin:
 * - HTML <details> syntax with optional <summary>
 * - Directive :::details syntax
 * - Edge cases: unclosed blocks, empty doc, nested, max lookahead
 */

import { describe, it, expect, afterEach } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

import { createSourceDetailsDecorationPlugin } from "./sourceDetailsDecoration";

let pluginRef: ReturnType<typeof createSourceDetailsDecorationPlugin>;

function createView(content: string): EditorView {
  pluginRef = createSourceDetailsDecorationPlugin();
  const state = EditorState.create({
    doc: content,
    extensions: [pluginRef],
  });
  return new EditorView({ state, parent: document.createElement("div") });
}

function getDecorationSpecs(view: EditorView): Array<{ from: number; to: number; class: string }> {
  const value = view.plugin(pluginRef);
  if (!value) return [];

  const result: Array<{ from: number; to: number; class: string }> = [];
  const iter = value.decorations.iter();
  while (iter.value) {
    const spec = iter.value.spec as { class?: string };
    result.push({ from: iter.from, to: iter.to, class: spec.class ?? "" });
    iter.next();
  }
  return result;
}

const createdViews: EditorView[] = [];
function tracked(content: string): EditorView {
  const v = createView(content);
  createdViews.push(v);
  return v;
}

afterEach(() => {
  createdViews.forEach((v) => v.destroy());
  createdViews.length = 0;
});

describe("sourceDetailsDecoration", () => {
  describe("empty and no-match documents", () => {
    it("produces no decorations for empty document", () => {
      const view = tracked("");
      expect(getDecorationSpecs(view)).toHaveLength(0);
    });

    it("produces no decorations for plain text", () => {
      const view = tracked("Hello world\nJust text.");
      expect(getDecorationSpecs(view)).toHaveLength(0);
    });
  });

  describe("HTML <details> blocks", () => {
    it("detects basic <details> block", () => {
      const content = "<details>\nSome content\n</details>";
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(3);
      expect(specs[0].class).toContain("cm-details-start");
      expect(specs[2].class).toContain("cm-details-end");
    });

    it("detects <details> with <summary>", () => {
      const content = "<details>\n<summary>Title</summary>\nContent here\n</details>";
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(4);
      expect(specs[0].class).toContain("cm-details-start");
      expect(specs[1].class).toContain("cm-details-summary");
      expect(specs[3].class).toContain("cm-details-end");
    });

    it("all lines get cm-details-line class", () => {
      const content = "<details>\nLine 1\nLine 2\n</details>";
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      specs.forEach((s) => {
        expect(s.class).toContain("cm-details-line");
      });
    });

    it("first line gets both start and line classes", () => {
      const content = "<details>\nContent\n</details>";
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs[0].class).toContain("cm-details-line");
      expect(specs[0].class).toContain("cm-details-start");
    });

    it("last line gets both end and line classes", () => {
      const content = "<details>\nContent\n</details>";
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      const last = specs[specs.length - 1];
      expect(last.class).toContain("cm-details-line");
      expect(last.class).toContain("cm-details-end");
    });

    it("detects <details> with attributes", () => {
      const content = "<details open>\nContent\n</details>";
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(3);
    });

    it("detects case-insensitive <DETAILS>", () => {
      const content = "<DETAILS>\nContent\n</DETAILS>";
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(3);
    });

    it("detects indented <details>", () => {
      const content = "  <details>\n  Content\n  </details>";
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(3);
    });

    it("ignores unclosed <details> (no closing tag)", () => {
      const content = "<details>\nContent without close";
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs).toHaveLength(0);
    });
  });

  describe("directive :::details blocks", () => {
    it("detects :::details block", () => {
      const content = ":::details Title\nContent here\n:::";
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(3);
    });

    it("first line is both start and summary for directive", () => {
      const content = ":::details Title\nContent\n:::";
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs[0].class).toContain("cm-details-start");
      expect(specs[0].class).toContain("cm-details-summary");
    });

    it("last line gets end class for directive", () => {
      const content = ":::details Title\nContent\n:::";
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      const last = specs[specs.length - 1];
      expect(last.class).toContain("cm-details-end");
    });

    it("detects :::details without title text", () => {
      const content = ":::details\nContent\n:::";
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(3);
    });

    it("detects case-insensitive :::DETAILS", () => {
      const content = ":::DETAILS Title\nContent\n:::";
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(3);
    });

    it("ignores unclosed :::details", () => {
      const content = ":::details Title\nContent without close";
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs).toHaveLength(0);
    });
  });

  describe("multiple blocks", () => {
    it("detects two HTML details blocks", () => {
      const content = "<details>\nA\n</details>\n\n<details>\nB\n</details>";
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      // 3 lines each = 6 total
      expect(specs.length).toBe(6);
    });

    it("detects mixed HTML and directive blocks", () => {
      const content = "<details>\nA\n</details>\n\n:::details Title\nB\n:::";
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(6);
    });
  });

  describe("update on doc change", () => {
    it("rebuilds decorations when document changes", () => {
      const view = tracked("Hello");
      expect(getDecorationSpecs(view)).toHaveLength(0);

      view.dispatch({
        changes: { from: 0, to: 5, insert: "<details>\nNew\n</details>" },
      });

      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(3);
    });
  });

  describe("edge cases", () => {
    it("handles single-line document", () => {
      const view = tracked("<details>");
      expect(getDecorationSpecs(view)).toHaveLength(0);
    });

    it("minimal 2-line block has start and end decorations", () => {
      const content = "<details>\n</details>";
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(2);
      expect(specs[0].class).toContain("cm-details-start");
      expect(specs[1].class).toContain("cm-details-end");
    });
  });
});
