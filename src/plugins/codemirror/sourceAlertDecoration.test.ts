/**
 * Tests for sourceAlertDecoration — alert block detection and decoration.
 *
 * Tests the findAlertBlocks logic (via the plugin) and decoration classes:
 * - All 5 alert types (NOTE, TIP, IMPORTANT, WARNING, CAUTION)
 * - Multi-line blockquote continuation
 * - Edge cases: empty doc, no alerts, unsupported type, adjacent blocks
 */

import { describe, it, expect, afterEach } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

import { createSourceAlertDecorationPlugin } from "./sourceAlertDecoration";

/** Store the plugin reference so we can access its value via view.plugin(). */
let pluginRef: ReturnType<typeof createSourceAlertDecorationPlugin>;

function createView(content: string): EditorView {
  pluginRef = createSourceAlertDecorationPlugin();
  const state = EditorState.create({
    doc: content,
    extensions: [pluginRef],
  });
  return new EditorView({ state, parent: document.createElement("div") });
}

/** Extract decoration specs from the plugin value. */
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

describe("sourceAlertDecoration", () => {
  describe("empty and no-match documents", () => {
    it("produces no decorations for empty document", () => {
      const view = tracked("");
      const specs = getDecorationSpecs(view);
      expect(specs).toHaveLength(0);
    });

    it("produces no decorations for plain text", () => {
      const view = tracked("Hello world\nThis is plain text.");
      const specs = getDecorationSpecs(view);
      expect(specs).toHaveLength(0);
    });

    it("produces no decorations for regular blockquote without alert type", () => {
      const view = tracked("> This is a regular blockquote\n> Second line");
      const specs = getDecorationSpecs(view);
      expect(specs).toHaveLength(0);
    });
  });

  describe("single alert block detection", () => {
    it.each([
      ["NOTE", "note"],
      ["TIP", "tip"],
      ["IMPORTANT", "important"],
      ["WARNING", "warning"],
      ["CAUTION", "caution"],
    ])("detects %s alert type with correct CSS class", (type, cssType) => {
      const content = `> [!${type}]\n> Alert content here`;
      const view = tracked(content);
      const specs = getDecorationSpecs(view);

      expect(specs.length).toBe(2);
      // First line gets cm-alert-first class
      expect(specs[0].class).toContain("cm-alert-line");
      expect(specs[0].class).toContain(`cm-alert-${cssType}`);
      expect(specs[0].class).toContain("cm-alert-first");
      // Second line does NOT get cm-alert-first
      expect(specs[1].class).toContain("cm-alert-line");
      expect(specs[1].class).toContain(`cm-alert-${cssType}`);
      expect(specs[1].class).not.toContain("cm-alert-first");
    });

    it("detects case-insensitive alert types", () => {
      const view = tracked("> [!note]\n> content");
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(2);
      expect(specs[0].class).toContain("cm-alert-note");
    });

    it("detects mixed-case alert types", () => {
      const view = tracked("> [!Note]\n> content");
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(2);
      expect(specs[0].class).toContain("cm-alert-note");
    });
  });

  describe("multi-line blockquote continuation", () => {
    it("decorates all continuation lines", () => {
      const content = "> [!WARNING]\n> Line 1\n> Line 2\n> Line 3";
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(4);
      specs.forEach((s) => {
        expect(s.class).toContain("cm-alert-warning");
      });
    });

    it("stops at non-blockquote line", () => {
      const content = "> [!TIP]\n> Tip content\n\nNormal paragraph";
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(2);
    });

    it("single-line alert with no continuation", () => {
      const content = "> [!NOTE]";
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(1);
      expect(specs[0].class).toContain("cm-alert-first");
    });
  });

  describe("unsupported alert types", () => {
    it("ignores unsupported alert type", () => {
      const view = tracked("> [!CUSTOM]\n> content");
      const specs = getDecorationSpecs(view);
      expect(specs).toHaveLength(0);
    });

    it("ignores incomplete alert syntax", () => {
      const view = tracked("> [!]\n> content");
      const specs = getDecorationSpecs(view);
      expect(specs).toHaveLength(0);
    });

    it("ignores non-blockquote alert syntax", () => {
      const view = tracked("[!NOTE]\nContent");
      const specs = getDecorationSpecs(view);
      expect(specs).toHaveLength(0);
    });
  });

  describe("multiple alert blocks", () => {
    it("detects adjacent alert blocks separated by blank line", () => {
      const content = "> [!NOTE]\n> Note content\n\n> [!WARNING]\n> Warning content";
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(4);
      expect(specs[0].class).toContain("cm-alert-note");
      expect(specs[1].class).toContain("cm-alert-note");
      expect(specs[2].class).toContain("cm-alert-warning");
      expect(specs[3].class).toContain("cm-alert-warning");
    });

    it("handles all five types in one document", () => {
      const types = ["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"];
      const content = types.map((t) => `> [!${t}]\n> ${t} content`).join("\n\n");
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      // 2 lines per alert x 5 alerts = 10
      expect(specs.length).toBe(10);
    });
  });

  describe("update on doc change", () => {
    it("rebuilds decorations when document changes", () => {
      const view = tracked("Hello");
      expect(getDecorationSpecs(view)).toHaveLength(0);

      // Dispatch a change that adds an alert block
      view.dispatch({
        changes: { from: 0, to: 5, insert: "> [!NOTE]\n> New alert" },
      });

      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(2);
      expect(specs[0].class).toContain("cm-alert-note");
    });
  });

  describe("edge cases", () => {
    it("does not match alert with extra text after type", () => {
      const view = tracked("> [!NOTE] extra text");
      const specs = getDecorationSpecs(view);
      expect(specs).toHaveLength(0);
    });

    it("handles document with only blockquote markers", () => {
      const view = tracked(">\n>\n>");
      const specs = getDecorationSpecs(view);
      expect(specs).toHaveLength(0);
    });

    it("handles alert with extra whitespace before type marker", () => {
      const view = tracked(">   [!NOTE]\n> content");
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(2);
      expect(specs[0].class).toContain("cm-alert-note");
    });
  });
});
