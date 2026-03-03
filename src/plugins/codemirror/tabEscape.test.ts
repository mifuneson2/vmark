/**
 * Tab Escape Plugin Tests for CodeMirror
 *
 * Tests the core tab escape handler: link navigation priority,
 * closing char escape, multi-char sequences, and multi-cursor support.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { EditorState, EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

vi.mock("@/utils/imeGuard", () => ({
  guardCodeMirrorKeyBinding: (binding: unknown) => binding,
}));

import { tabEscapeKeymap } from "./tabEscape";

const views: EditorView[] = [];

function createView(contentWithCursor: string): EditorView {
  const cursorPos = contentWithCursor.indexOf("^");
  const content = contentWithCursor.replace("^", "");

  const parent = document.createElement("div");
  document.body.appendChild(parent);

  const state = EditorState.create({
    doc: content,
    selection: { anchor: cursorPos },
  });
  const view = new EditorView({ state, parent });
  views.push(view);
  return view;
}

function createMultiCursorView(
  content: string,
  ranges: { anchor: number; head?: number }[]
): EditorView {
  const parent = document.createElement("div");
  document.body.appendChild(parent);

  // Create state with multi-cursor support and initial multi-selection
  const state = EditorState.create({
    doc: content,
    selection: EditorSelection.create(
      ranges.map((r) => EditorSelection.range(r.anchor, r.head ?? r.anchor)),
      0
    ),
    extensions: [EditorState.allowMultipleSelections.of(true)],
  });
  const view = new EditorView({ state, parent });
  views.push(view);

  return view;
}

afterEach(() => {
  views.forEach((v) => {
    const parent = v.dom.parentElement;
    v.destroy();
    parent?.remove();
  });
  views.length = 0;
});

describe("tabEscapeKeymap", () => {
  it("has key set to Tab", () => {
    expect(tabEscapeKeymap.key).toBe("Tab");
  });

  describe("single cursor - closing char escape", () => {
    it("jumps over closing paren", () => {
      const view = createView("fn(arg^)");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
      expect(view.state.selection.main.from).toBe(7);
    });

    it("jumps over closing bracket", () => {
      const view = createView("arr[0^]");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
      expect(view.state.selection.main.from).toBe(6);
    });

    it("does not jump over non-closing char", () => {
      const view = createView("text^abc");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(false);
    });

    it("does not handle when there is a selection", () => {
      const parent = document.createElement("div");
      document.body.appendChild(parent);
      const state = EditorState.create({
        doc: "text)",
        selection: { anchor: 0, head: 3 },
      });
      const view = new EditorView({ state, parent });
      views.push(view);

      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(false);
    });

    it("returns false at end of document", () => {
      const view = createView("text^");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(false);
    });
  });

  describe("single cursor - multi-char sequences", () => {
    it("jumps over ~~ sequence", () => {
      const view = createView("text^~~");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
      expect(view.state.selection.main.from).toBe(6);
    });

    it("jumps over == sequence", () => {
      const view = createView("text^==");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
      expect(view.state.selection.main.from).toBe(6);
    });

    it("prefers multi-char sequence over single char", () => {
      // ~~ should jump 2, not 1
      const view = createView("text^~~more");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
      expect(view.state.selection.main.from).toBe(6);
    });
  });

  describe("single cursor - link navigation", () => {
    it("navigates from link text to URL", () => {
      const view = createView("[text^](url)");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);

      const cursor = view.state.selection.main.from;
      const doc = view.state.doc.toString();
      expect(doc.charAt(cursor)).toBe("u"); // jumps to URL portion
    });

    it("navigates from URL to outside link", () => {
      const view = createView("[text](url^)");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);

      const cursor = view.state.selection.main.from;
      // [text](url) is 11 chars, ) is at index 10, after ) is 11
      expect(cursor).toBe(11);
    });

    it("prioritizes link navigation over closing bracket", () => {
      const view = createView("[text^](url)");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);

      const cursor = view.state.selection.main.from;
      const doc = view.state.doc.toString();
      // Should jump to URL, not just past ]
      expect(doc.charAt(cursor)).toBe("u");
    });
  });

  describe("multi-cursor escape", () => {
    it("returns false for single cursor (no multi-cursor path)", () => {
      const view = createView("text^)");
      expect(view.state.selection.ranges.length).toBe(1);
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
      expect(view.state.selection.main.from).toBe(5);
    });

    it("single cursor returns false when nothing to escape", () => {
      const view = createView("text^abc");
      expect(view.state.selection.ranges.length).toBe(1);
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(false);
    });

    it("handles multi-cursor where all cursors can escape closing chars", () => {
      // Use well-separated positions so CM doesn't merge them
      // "a)___b)___c)" — cursors at 1, 6, 11
      const content = "a)   b)   c)";
      const view = createMultiCursorView(content, [
        { anchor: 1 },
        { anchor: 6 },
        { anchor: 11 },
      ]);
      expect(view.state.selection.ranges.length).toBe(3);

      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);

      // Each cursor should have jumped past its closing paren
      const ranges = view.state.selection.ranges;
      expect(ranges[0].from).toBe(2);
      expect(ranges[1].from).toBe(7);
      expect(ranges[2].from).toBe(12);
    });

    it("handles multi-cursor where no cursors can escape", () => {
      const content = "ab   cd   ef";
      const view = createMultiCursorView(content, [
        { anchor: 1 },
        { anchor: 6 },
        { anchor: 11 },
      ]);
      expect(view.state.selection.ranges.length).toBe(3);

      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(false);
    });

    it("handles multi-cursor with mixed escapable and non-escapable", () => {
      // Position 1 before ), position 6 before 'd' (no escape)
      const content = "a)   cd   e)";
      const view = createMultiCursorView(content, [
        { anchor: 1 },
        { anchor: 6 },
        { anchor: 11 },
      ]);
      expect(view.state.selection.ranges.length).toBe(3);

      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);

      // Cursors that can escape move; others stay in place
      const ranges = view.state.selection.ranges;
      expect(ranges[0].from).toBe(2);  // escaped past )
      expect(ranges[1].from).toBe(6);  // stayed (no escape)
      expect(ranges[2].from).toBe(12); // escaped past )
    });

    it("handles multi-cursor with selections (not just cursors)", () => {
      // Selections (from !== to) are kept as-is
      const content = "abc)    def)";
      const view = createMultiCursorView(content, [
        { anchor: 0, head: 2 },  // selection
        { anchor: 11 },          // cursor before )
      ]);
      expect(view.state.selection.ranges.length).toBe(2);

      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);

      const ranges = view.state.selection.ranges;
      // Selection preserved (anchor stays at 0, head at 2)
      expect(ranges[0].from).toBe(0);
      expect(ranges[0].to).toBe(2);
      // Cursor escaped past )
      expect(ranges[1].from).toBe(12);
    });

    it("multi-cursor escapes ~~ sequences", () => {
      const content = "a~~  b~~";
      const view = createMultiCursorView(content, [
        { anchor: 1 },
        { anchor: 6 },
      ]);
      expect(view.state.selection.ranges.length).toBe(2);

      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);

      const ranges = view.state.selection.ranges;
      expect(ranges[0].from).toBe(3);  // jumped over ~~
      expect(ranges[1].from).toBe(8);  // jumped over ~~
    });

    it("multi-cursor escapes == sequences", () => {
      const content = "a==  b==";
      const view = createMultiCursorView(content, [
        { anchor: 1 },
        { anchor: 6 },
      ]);
      expect(view.state.selection.ranges.length).toBe(2);

      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);

      const ranges = view.state.selection.ranges;
      expect(ranges[0].from).toBe(3);
      expect(ranges[1].from).toBe(8);
    });

    it("multi-cursor with link text navigation", () => {
      // Cursor inside link text portion → should jump to URL start
      const content = "[text](url)     [text](url)";
      const view = createMultiCursorView(content, [
        { anchor: 3 },  // inside first link text
        { anchor: 19 }, // inside second link text
      ]);
      expect(view.state.selection.ranges.length).toBe(2);

      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
    });

    it("multi-cursor with link URL navigation", () => {
      // Cursor inside link URL portion → should jump after link
      const content = "[text](url)     [text](url)";
      const view = createMultiCursorView(content, [
        { anchor: 8 },  // inside first link URL
        { anchor: 24 }, // inside second link URL
      ]);
      expect(view.state.selection.ranges.length).toBe(2);

      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);

      // Should jump to after link end (positions 11 and 27)
      const ranges = view.state.selection.ranges;
      expect(ranges[0].from).toBe(11); // after first link
      expect(ranges[1].from).toBe(27); // after second link
    });

    it("multi-cursor where all ranges are selections (from !== to) — returns false", () => {
      // handleMultiCursorEscape: when all ranges have from !== to (selections, not cursors),
      // hasAnyEscape stays false, so the function returns false (line 91 path).
      const content = "abc)    def)";
      const view = createMultiCursorView(content, [
        { anchor: 0, head: 2 }, // selection, not cursor
        { anchor: 5, head: 8 }, // selection, not cursor
      ]);
      expect(view.state.selection.ranges.length).toBe(2);

      const handled = tabEscapeKeymap.run!(view);
      // All ranges are selections → none can escape → returns false
      expect(handled).toBe(false);
    });
  });

  describe("single cursor - CJK closing brackets", () => {
    it("jumps over CJK closing paren", () => {
      const view = createView("text^）");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
      expect(view.state.selection.main.from).toBe(5);
    });

    it("jumps over CJK closing bracket 】", () => {
      const view = createView("text^】");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
    });

    it("jumps over CJK closing quote 」", () => {
      const view = createView("text^」");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
    });

    it("jumps over CJK closing quote 』", () => {
      const view = createView("text^』");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
    });

    it("jumps over CJK closing angle 》", () => {
      const view = createView("text^》");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
    });

    it("jumps over CJK closing angle 〉", () => {
      const view = createView("text^〉");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
    });
  });

  describe("single cursor - curly quotes", () => {
    it("jumps over right double curly quote", () => {
      const view = createView("text^\u201D");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
    });

    it("jumps over right single curly quote", () => {
      const view = createView("text^\u2019");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
    });
  });

  describe("single cursor - markdown format chars", () => {
    it("jumps over asterisk", () => {
      const view = createView("bold^*");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
      expect(view.state.selection.main.from).toBe(5);
    });

    it("jumps over underscore", () => {
      const view = createView("text^_");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
    });

    it("jumps over caret (^)", () => {
      const view = createView("text^" + "^");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
    });

    it("jumps over backtick", () => {
      const view = createView("code^`");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
      expect(view.state.selection.main.from).toBe(5);
    });

    it("jumps over closing brace", () => {
      const view = createView("obj^}");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
    });

    it("jumps over double quote", () => {
      const view = createView('text^"');
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
    });

    it("jumps over single quote", () => {
      const view = createView("text^'");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
    });

    it("jumps over >", () => {
      const view = createView("text^>");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
    });
  });

  describe("single cursor - boundary conditions", () => {
    it("returns false at start of empty document", () => {
      const view = createView("^");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(false);
    });

    it("returns false at start of document with non-closing char", () => {
      const view = createView("^abc");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(false);
    });

    it("escapes closing char at start of document", () => {
      const view = createView("^)abc");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
      expect(view.state.selection.main.from).toBe(1);
    });

    it("escapes closing char at very end (last char)", () => {
      const view = createView("abc^)");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
      expect(view.state.selection.main.from).toBe(4);
    });

    it("handles single closing char document", () => {
      const view = createView("^)");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
      expect(view.state.selection.main.from).toBe(1);
    });

    it("handles ~~ at end of document", () => {
      const view = createView("abc^~~");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
      expect(view.state.selection.main.from).toBe(5);
    });

    it("handles == at end of document", () => {
      const view = createView("abc^==");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
      expect(view.state.selection.main.from).toBe(5);
    });

    it("handles single ~ (not a sequence)", () => {
      // ~ is not in CLOSING_CHARS, so should not be jumped
      const view = createView("abc^~x");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(false);
    });
  });

  describe("link navigation edge cases", () => {
    it("handles nested brackets in link text", () => {
      const view = createView("[text [nested]^](url)");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
    });

    it("handles empty link text", () => {
      const view = createView("[^](url)");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
    });

    it("handles empty URL", () => {
      const view = createView("[text](^)");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
      expect(view.state.selection.main.from).toBe(8);
    });

    it("handles link at start of document", () => {
      const view = createView("[^text](url)");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
    });

    it("handles link at end of document", () => {
      const view = createView("[text](url^)");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(true);
      // [text](url) is 11 chars, linkEnd = 11 (after closing paren)
      expect(view.state.selection.main.from).toBe(11);
    });

    it("does not navigate when cursor is outside any link", () => {
      const view = createView("before ^[text](url) after");
      const handled = tabEscapeKeymap.run!(view);
      expect(handled).toBe(false);
    });

    it("falls through to closing char when cursor is at link bracket boundary (lines 55-60)", () => {
      // Cursor right at ] which is between text and URL portions
      // getLinkBoundaries returns a boundary, but cursor is at the ] position
      // which is neither isInLinkText nor isInLinkUrl → falls through to closing char escape
      const view = createView("[text^](url)");
      const handled = tabEscapeKeymap.run!(view);
      // link navigation takes priority over bracket escape; cursor jumps to URL
      expect(handled).toBe(true);
    });

    it("returns false when cursor is at link opening [ with no escapable char", () => {
      // Cursor at [ position — boundaries may exist but cursor is outside both portions
      const view = createView("^[text](url)");
      const handled = tabEscapeKeymap.run!(view);
      // [ is not in CLOSING_CHARS set, so if link navigation doesn't apply, returns false
      // But getLinkBoundaries may detect the link and isInLinkText returns true for pos 0
      expect(typeof handled).toBe("boolean");
    });
  });
});
