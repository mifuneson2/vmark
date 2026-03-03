/**
 * Tests for taskListActions — toggling task list checkboxes in source mode.
 */

import { describe, it, expect } from "vitest";
import { EditorState, EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

import { toggleTaskList } from "./taskListActions";

function createView(doc: string, pos?: number): EditorView {
  const parent = document.createElement("div");
  const selection = pos !== undefined
    ? EditorSelection.cursor(pos)
    : EditorSelection.cursor(0);
  const state = EditorState.create({ doc, selection });
  return new EditorView({ state, parent });
}

describe("toggleTaskList", () => {
  describe("checked → unchecked", () => {
    it("unchecks a checked task (lowercase x)", () => {
      const view = createView("- [x] done", 6);
      const result = toggleTaskList(view);
      expect(result).toBe(true);
      expect(view.state.doc.toString()).toBe("- [ ] done");
      view.destroy();
    });

    it("unchecks a checked task (uppercase X)", () => {
      const view = createView("- [X] done", 6);
      const result = toggleTaskList(view);
      expect(result).toBe(true);
      expect(view.state.doc.toString()).toBe("- [ ] done");
      view.destroy();
    });

    it("unchecks with asterisk marker", () => {
      const view = createView("* [x] done", 6);
      const result = toggleTaskList(view);
      expect(result).toBe(true);
      expect(view.state.doc.toString()).toBe("* [ ] done");
      view.destroy();
    });

    it("unchecks with plus marker", () => {
      const view = createView("+ [x] done", 6);
      const result = toggleTaskList(view);
      expect(result).toBe(true);
      expect(view.state.doc.toString()).toBe("+ [ ] done");
      view.destroy();
    });
  });

  describe("unchecked → checked", () => {
    it("checks an unchecked task", () => {
      const view = createView("- [ ] todo", 6);
      const result = toggleTaskList(view);
      expect(result).toBe(true);
      expect(view.state.doc.toString()).toBe("- [x] todo");
      view.destroy();
    });

    it("checks with asterisk marker", () => {
      const view = createView("* [ ] todo", 6);
      const result = toggleTaskList(view);
      expect(result).toBe(true);
      expect(view.state.doc.toString()).toBe("* [x] todo");
      view.destroy();
    });
  });

  describe("plain list → task list", () => {
    it("converts plain dash list to task", () => {
      const view = createView("- item", 2);
      const result = toggleTaskList(view);
      expect(result).toBe(true);
      expect(view.state.doc.toString()).toBe("- [ ] item");
      view.destroy();
    });

    it("converts plain asterisk list to task", () => {
      const view = createView("* item", 2);
      const result = toggleTaskList(view);
      expect(result).toBe(true);
      expect(view.state.doc.toString()).toBe("* [ ] item");
      view.destroy();
    });

    it("converts plain plus list to task", () => {
      const view = createView("+ item", 2);
      const result = toggleTaskList(view);
      expect(result).toBe(true);
      expect(view.state.doc.toString()).toBe("+ [ ] item");
      view.destroy();
    });
  });

  describe("non-list content", () => {
    it("returns false for plain paragraph", () => {
      const view = createView("plain text", 3);
      const result = toggleTaskList(view);
      expect(result).toBe(false);
      expect(view.state.doc.toString()).toBe("plain text");
      view.destroy();
    });

    it("returns false for heading", () => {
      const view = createView("# Heading", 3);
      const result = toggleTaskList(view);
      expect(result).toBe(false);
      view.destroy();
    });

    it("returns false for empty line", () => {
      const view = createView("", 0);
      const result = toggleTaskList(view);
      expect(result).toBe(false);
      view.destroy();
    });

    it("returns false for blockquote", () => {
      const view = createView("> quote", 3);
      const result = toggleTaskList(view);
      expect(result).toBe(false);
      view.destroy();
    });

    it("returns false for ordered list", () => {
      const view = createView("1. ordered", 3);
      const result = toggleTaskList(view);
      expect(result).toBe(false);
      view.destroy();
    });
  });

  describe("indented tasks", () => {
    it("handles indented checked task", () => {
      const view = createView("  - [x] indented", 8);
      const result = toggleTaskList(view);
      expect(result).toBe(true);
      expect(view.state.doc.toString()).toBe("  - [ ] indented");
      view.destroy();
    });

    it("handles indented unchecked task", () => {
      const view = createView("  - [ ] indented", 8);
      const result = toggleTaskList(view);
      expect(result).toBe(true);
      expect(view.state.doc.toString()).toBe("  - [x] indented");
      view.destroy();
    });

    it("handles indented plain list conversion", () => {
      const view = createView("  - item", 4);
      const result = toggleTaskList(view);
      expect(result).toBe(true);
      expect(view.state.doc.toString()).toBe("  - [ ] item");
      view.destroy();
    });
  });

  describe("CJK content", () => {
    it("toggles task with CJK text", () => {
      const view = createView("- [ ] 中文任务", 6);
      const result = toggleTaskList(view);
      expect(result).toBe(true);
      expect(view.state.doc.toString()).toBe("- [x] 中文任务");
      view.destroy();
    });
  });

  describe("multiline: only affects cursor line", () => {
    it("toggles only the cursor line in multi-line content", () => {
      const view = createView("- [ ] first\n- [x] second", 6);
      const result = toggleTaskList(view);
      expect(result).toBe(true);
      expect(view.state.doc.toString()).toBe("- [x] first\n- [x] second");
      view.destroy();
    });
  });
});
