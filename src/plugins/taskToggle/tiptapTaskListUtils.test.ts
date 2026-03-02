/**
 * Tests for tiptapTaskListUtils — toggleTaskList and convertSelectionToTaskList.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { EditorState, TextSelection } from "@tiptap/pm/state";
import { taskListItemExtension } from "./tiptap";
import { toggleTaskList, convertSelectionToTaskList } from "./tiptapTaskListUtils";

// ---------------------------------------------------------------------------
// Schema + helpers
// ---------------------------------------------------------------------------

function createSchema() {
  return getSchema([StarterKit.configure({ listItem: false }), taskListItemExtension]);
}

/**
 * Build a mock Tiptap Editor-like object with real ProseMirror state.
 */
function createMockEditor(state: EditorState) {
  const dispatched: unknown[] = [];
  const view = {
    state,
    dispatch: vi.fn((tr) => {
      // Update the view's state after dispatch, mimicking EditorView behavior
      view.state = view.state.apply(tr);
    }),
    focus: vi.fn(),
  };

  const chainFns: Record<string, unknown> = {};
  const chainProxy = new Proxy(chainFns, {
    get: (_target, prop) => {
      if (prop === "run") return vi.fn(() => true);
      return vi.fn(() => chainProxy);
    },
  });

  const editor = {
    state,
    view,
    chain: vi.fn(() => chainProxy),
  };

  // Keep editor.state in sync with view.state
  Object.defineProperty(editor, "state", {
    get: () => view.state,
  });

  return editor;
}

function createTaskListState(items: Array<{ text: string; checked: boolean | null }>) {
  const schema = createSchema();
  const listItems = items.map((item) => {
    const para = schema.nodes.paragraph.create(null, item.text ? [schema.text(item.text)] : []);
    return schema.nodes.listItem.create({ checked: item.checked }, para);
  });
  const bulletList = schema.nodes.bulletList.create(null, listItems);
  const doc = schema.nodes.doc.create(null, [bulletList]);
  return EditorState.create({ doc });
}

function createParagraphState(text: string) {
  const schema = createSchema();
  const para = schema.nodes.paragraph.create(null, text ? [schema.text(text)] : []);
  const doc = schema.nodes.doc.create(null, [para]);
  return EditorState.create({ doc });
}

function setCursor(state: EditorState, pos: number): EditorState {
  return state.apply(state.tr.setSelection(TextSelection.create(state.doc, pos)));
}

// ---------------------------------------------------------------------------
// toggleTaskList
// ---------------------------------------------------------------------------

describe("toggleTaskList", () => {
  it("converts plain paragraph to task list via chain when not in a list", () => {
    const state = createParagraphState("Hello world");
    const stateWithCursor = setCursor(state, 3);
    const editor = createMockEditor(stateWithCursor);

    toggleTaskList(editor as never);

    // Should call chain().focus().toggleBulletList().run()
    expect(editor.chain).toHaveBeenCalled();
  });

  it("removes task list when already in a task list", () => {
    const state = createTaskListState([{ text: "Task item", checked: false }]);
    const stateWithCursor = setCursor(state, 4);
    const editor = createMockEditor(stateWithCursor);

    // toggleTaskList should detect it's in a task list and try to remove it
    toggleTaskList(editor as never);

    // Should dispatch transactions to lift list items
    expect(editor.view.dispatch).toHaveBeenCalled();
  });

  it("does not call chain when inside a task list", () => {
    const state = createTaskListState([{ text: "Task", checked: true }]);
    const stateWithCursor = setCursor(state, 4);
    const editor = createMockEditor(stateWithCursor);

    toggleTaskList(editor as never);

    // chain should NOT be called — we're removing, not creating
    expect(editor.chain).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// convertSelectionToTaskList
// ---------------------------------------------------------------------------

describe("convertSelectionToTaskList", () => {
  it("uses chain to create bullet list when not in any list", () => {
    const state = createParagraphState("Not a list");
    const stateWithCursor = setCursor(state, 3);
    const editor = createMockEditor(stateWithCursor);

    convertSelectionToTaskList(editor as never);

    expect(editor.chain).toHaveBeenCalled();
  });

  it("converts existing bullet list items to task items (checked: false)", () => {
    const schema = createSchema();
    const para = schema.nodes.paragraph.create(null, [schema.text("Item")]);
    const listItem = schema.nodes.listItem.create({ checked: null }, para);
    const bulletList = schema.nodes.bulletList.create(null, [listItem]);
    const doc = schema.nodes.doc.create(null, [bulletList]);
    const state = setCursor(EditorState.create({ doc }), 4);
    const editor = createMockEditor(state);

    convertSelectionToTaskList(editor as never);

    // Should dispatch a transaction that sets checked: false on the listItem
    expect(editor.view.dispatch).toHaveBeenCalled();
  });

  it("does not modify items that already have checked attribute", () => {
    const state = createTaskListState([{ text: "Already task", checked: true }]);
    const stateWithCursor = setCursor(state, 4);
    const editor = createMockEditor(stateWithCursor);

    convertSelectionToTaskList(editor as never);

    // Should dispatch but not change checked from true to false
    expect(editor.view.dispatch).toHaveBeenCalled();
    // Verify the item still has checked: true (not reset to false)
    const listItem = editor.view.state.doc.child(0).child(0);
    expect(listItem.attrs.checked).toBe(true);
  });

  it("converts ordered list to bullet list then adds checked attr", () => {
    const schema = createSchema();
    const para = schema.nodes.paragraph.create(null, [schema.text("Ordered")]);
    const listItem = schema.nodes.listItem.create({ checked: null }, para);
    const orderedList = schema.nodes.orderedList.create(null, [listItem]);
    const doc = schema.nodes.doc.create(null, [orderedList]);
    const state = setCursor(EditorState.create({ doc }), 4);
    const editor = createMockEditor(state);

    convertSelectionToTaskList(editor as never);

    expect(editor.view.dispatch).toHaveBeenCalled();
    // After dispatch, the list should be a bulletList
    const topChild = editor.view.state.doc.child(0);
    expect(topChild.type.name).toBe("bulletList");
  });

  it("handles multiple list items — sets checked on all unchecked items", () => {
    const schema = createSchema();
    const items = ["First", "Second", "Third"].map((text) => {
      const para = schema.nodes.paragraph.create(null, [schema.text(text)]);
      return schema.nodes.listItem.create({ checked: null }, para);
    });
    const bulletList = schema.nodes.bulletList.create(null, items);
    const doc = schema.nodes.doc.create(null, [bulletList]);
    const state = setCursor(EditorState.create({ doc }), 4);
    const editor = createMockEditor(state);

    convertSelectionToTaskList(editor as never);

    expect(editor.view.dispatch).toHaveBeenCalled();

    // All items should now have checked: false
    const list = editor.view.state.doc.child(0);
    list.forEach((item) => {
      expect(item.attrs.checked).toBe(false);
    });
  });

  it("falls back to chain when cursor is not inside any list", () => {
    // When not inside a list and schema has list types,
    // it should call chain().focus().toggleBulletList().run()
    const schema = createSchema();
    const para = schema.nodes.paragraph.create(null, [schema.text("Not in list")]);
    const doc = schema.nodes.doc.create(null, [para]);
    const state = setCursor(EditorState.create({ doc }), 3);
    const editor = createMockEditor(state);

    convertSelectionToTaskList(editor as never);

    // Should fall back to chain since listDepth is -1
    expect(editor.chain).toHaveBeenCalled();
  });
});
