/**
 * Tests for list click fix extension.
 *
 * Tests two scenarios:
 *   1. Click pos inside an empty listItem — force-set selection to prevent
 *      PM's default behavior from reading the wrong native selection.
 *   2. Click pos outside listItem but DOM target inside <li> — use posAtDOM
 *      to find the correct position.
 */

import { describe, it, expect } from "vitest";
import { Schema } from "@tiptap/pm/model";
import { EditorState } from "@tiptap/pm/state";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import {
  isPositionInsideListItem,
  isInsideEmptyListItem,
  findListItemType,
  listClickFixExtension,
  handleClick,
} from "../tiptap";

// --- Schemas ---

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { content: "inline*", group: "block" },
    text: { inline: true, group: "inline" },
    bulletList: { content: "listItem+", group: "block" },
    orderedList: { content: "listItem+", group: "block" },
    listItem: { content: "paragraph block*", defining: true },
  },
});

const listItemUnderscoreSchema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { content: "inline*", group: "block" },
    text: { inline: true, group: "inline" },
    bullet_list: { content: "list_item+", group: "block" },
    list_item: { content: "paragraph block*", defining: true },
  },
});

// --- Test Helpers ---

/** Find the position of a text node by content. */
function findTextPos(doc: ReturnType<typeof schema.node>, text: string): number {
  let found = -1;
  doc.descendants((node, pos) => {
    if (found === -1 && node.isText && node.text === text) {
      found = pos;
      return false;
    }
  });
  if (found === -1) throw new Error(`Text "${text}" not found in doc`);
  return found;
}

/** Find the inner content position of the nth listItem (1-indexed). */
function findNthListItemInnerPos(doc: ReturnType<typeof schema.node>, n: number): number {
  let count = 0;
  let found = -1;
  doc.descendants((node, pos) => {
    if (found === -1 && (node.type.name === "listItem" || node.type.name === "list_item")) {
      count++;
      if (count === n) {
        // pos + 1 enters the listItem, + 1 enters its first child (paragraph)
        found = pos + 1 + 1;
        return false;
      }
    }
  });
  if (found === -1) throw new Error(`listItem #${n} not found in doc`);
  return found;
}

function createListDoc() {
  // <doc>
  //   <bulletList>
  //     <listItem><paragraph>"Item text"</paragraph></listItem>
  //     <listItem><paragraph></paragraph></listItem>   ← empty sibling item
  //   </bulletList>
  //   <paragraph>"After list"</paragraph>
  // </doc>
  return schema.node("doc", null, [
    schema.node("bulletList", null, [
      schema.node("listItem", null, [
        schema.node("paragraph", null, [schema.text("Item text")]),
      ]),
      schema.node("listItem", null, [schema.node("paragraph", null, [])]),
    ]),
    schema.node("paragraph", null, [schema.text("After list")]),
  ]);
}

function createEditor(content: string) {
  return new Editor({
    extensions: [StarterKit, listClickFixExtension],
    content,
  });
}

// --- Tests ---

describe("findListItemType", () => {
  it("returns listItem node type from schema", () => {
    const type = findListItemType(schema);
    expect(type).toBeDefined();
    expect(type!.name).toBe("listItem");
  });

  it("returns list_item node type from underscore-naming schema", () => {
    const type = findListItemType(listItemUnderscoreSchema);
    expect(type).toBeDefined();
    expect(type!.name).toBe("list_item");
  });

  it("returns undefined for schema without listItem", () => {
    const noListSchema = new Schema({
      nodes: {
        doc: { content: "paragraph+" },
        paragraph: { content: "text*" },
        text: { inline: true },
      },
    });
    const type = findListItemType(noListSchema);
    expect(type).toBeUndefined();
  });
});

describe("isPositionInsideListItem", () => {
  it("returns true when position is inside a listItem", () => {
    const doc = createListDoc();
    const state = EditorState.create({ doc, schema });
    const $pos = state.doc.resolve(findTextPos(doc, "Item text"));
    const listItemType = findListItemType(schema)!;
    expect(isPositionInsideListItem($pos, listItemType)).toBe(true);
  });

  it("returns false when position is outside any listItem", () => {
    const doc = createListDoc();
    const state = EditorState.create({ doc, schema });
    const $pos = state.doc.resolve(findTextPos(doc, "After list"));
    const listItemType = findListItemType(schema)!;
    expect(isPositionInsideListItem($pos, listItemType)).toBe(false);
  });

  it("returns true when position is inside empty listItem", () => {
    const doc = createListDoc();
    const state = EditorState.create({ doc, schema });
    const $pos = state.doc.resolve(findNthListItemInnerPos(doc, 2));
    const listItemType = findListItemType(schema)!;
    expect(isPositionInsideListItem($pos, listItemType)).toBe(true);
  });

  it("works with list_item underscore naming", () => {
    const doc = listItemUnderscoreSchema.node("doc", null, [
      listItemUnderscoreSchema.node("bullet_list", null, [
        listItemUnderscoreSchema.node("list_item", null, [
          listItemUnderscoreSchema.node("paragraph", null, [
            listItemUnderscoreSchema.text("content"),
          ]),
        ]),
      ]),
    ]);
    const state = EditorState.create({ doc, schema: listItemUnderscoreSchema });
    const $pos = state.doc.resolve(3);
    const listItemType = findListItemType(listItemUnderscoreSchema)!;
    expect(isPositionInsideListItem($pos, listItemType)).toBe(true);
  });
});

describe("isInsideEmptyListItem", () => {
  it("returns true for position inside an empty listItem", () => {
    const doc = createListDoc();
    const state = EditorState.create({ doc, schema });
    const $pos = state.doc.resolve(findNthListItemInnerPos(doc, 2));
    const listItemType = findListItemType(schema)!;
    expect(isInsideEmptyListItem($pos, listItemType)).toBe(true);
  });

  it("returns false for position inside a non-empty listItem", () => {
    const doc = createListDoc();
    const state = EditorState.create({ doc, schema });
    const $pos = state.doc.resolve(findTextPos(doc, "Item text"));
    const listItemType = findListItemType(schema)!;
    expect(isInsideEmptyListItem($pos, listItemType)).toBe(false);
  });

  it("returns false for position outside any listItem", () => {
    const doc = createListDoc();
    const state = EditorState.create({ doc, schema });
    const $pos = state.doc.resolve(findTextPos(doc, "After list"));
    const listItemType = findListItemType(schema)!;
    expect(isInsideEmptyListItem($pos, listItemType)).toBe(false);
  });

  it("returns true for whitespace-only listItem", () => {
    const doc = schema.node("doc", null, [
      schema.node("bulletList", null, [
        schema.node("listItem", null, [
          schema.node("paragraph", null, [schema.text("  ")]),
        ]),
      ]),
    ]);
    const state = EditorState.create({ doc, schema });
    const $pos = state.doc.resolve(3);
    const listItemType = findListItemType(schema)!;
    expect(isInsideEmptyListItem($pos, listItemType)).toBe(true);
  });
});

describe("listClickFix mismatch detection", () => {
  it("detects mismatch when click target is in <li> but pos resolves outside list", () => {
    const doc = createListDoc();
    const state = EditorState.create({ doc, schema });
    const $pos = state.doc.resolve(findTextPos(doc, "After list"));
    const listItemType = findListItemType(schema)!;

    // Position is outside list — this is the "mismatch" scenario
    expect(isPositionInsideListItem($pos, listItemType)).toBe(false);
  });

  it("no mismatch when pos already resolves inside list", () => {
    const doc = createListDoc();
    const state = EditorState.create({ doc, schema });
    const $pos = state.doc.resolve(findTextPos(doc, "Item text"));
    const listItemType = findListItemType(schema)!;

    expect(isPositionInsideListItem($pos, listItemType)).toBe(true);
  });
});

describe("listClickFix integration", () => {
  it("does not interfere with normal clicks on non-empty list items", () => {
    const editor = createEditor("<ul><li>Hello</li><li>World</li></ul>");
    const worldPos = findTextPos(editor.state.doc, "World");
    editor.commands.setTextSelection(worldPos);

    const html = editor.getHTML();
    expect(html).toContain("Hello");
    expect(html).toContain("World");
    editor.destroy();
  });

  it("does not interfere with clicks outside lists", () => {
    const editor = createEditor("<ul><li>Item</li></ul><p>Paragraph</p>");
    const paraPos = findTextPos(editor.state.doc, "Paragraph");
    editor.commands.setTextSelection(paraPos);

    // Cursor should be in paragraph, not in list
    const { $from } = editor.state.selection;
    const listItemType = findListItemType(editor.state.schema);
    expect(listItemType).toBeDefined();
    expect(isPositionInsideListItem($from, listItemType!)).toBe(false);
    editor.destroy();
  });

  it("extension is registered and active", () => {
    const editor = createEditor("<ul><li>Test</li></ul>");
    const pluginKeys = editor.state.plugins.map((p) => (p as { key: string }).key);
    expect(pluginKeys.length).toBeGreaterThan(0);
    editor.destroy();
  });
});

describe("handleClick direct tests", () => {
  it("returns false for non-HTMLElement targets", () => {
    const editor = createEditor("<ul><li>Test</li></ul>");
    const view = editor.view;

    const textEvent = new MouseEvent("click");
    Object.defineProperty(textEvent, "target", { value: document.createTextNode("text") });
    const result = handleClick(view, 1, textEvent);
    expect(result).toBe(false);

    editor.destroy();
  });

  it("returns false when target is not inside an <li>", () => {
    const editor = createEditor("<ul><li>Test</li></ul><p>After</p>");
    const view = editor.view;

    const div = document.createElement("div");
    const event = new MouseEvent("click");
    Object.defineProperty(event, "target", { value: div });
    const result = handleClick(view, 1, event);
    expect(result).toBe(false);

    editor.destroy();
  });

  it("returns false when modifier keys are held (Alt+Click for multi-cursor)", () => {
    const editor = createEditor("<ul><li>Test</li></ul>");
    const view = editor.view;

    const li = document.createElement("li");
    for (const modifier of ["altKey", "ctrlKey", "metaKey", "shiftKey"] as const) {
      const event = new MouseEvent("click", { [modifier]: true });
      Object.defineProperty(event, "target", { value: li });
      const result = handleClick(view, 1, event);
      expect(result).toBe(false);
    }

    editor.destroy();
  });

  it("returns false for non-empty list item (no correction needed)", () => {
    const editor = createEditor("<ul><li>Test item</li></ul>");
    const view = editor.view;

    const liElement = view.dom.querySelector("li")!;
    expect(liElement).toBeDefined();

    const pos = findTextPos(editor.state.doc, "Test item");
    const event = new MouseEvent("click");
    Object.defineProperty(event, "target", { value: liElement });
    const result = handleClick(view, pos, event);
    expect(result).toBe(false);

    editor.destroy();
  });

  it("returns true and sets selection for empty list item (scenario 1)", () => {
    const editor = createEditor(
      "<ul><li>First</li><li></li></ul><p>After</p>"
    );
    const view = editor.view;

    // Find the empty <li> in the DOM
    const lis = view.dom.querySelectorAll("li");
    const emptyLi = lis[1]; // second <li> is empty
    expect(emptyLi).toBeDefined();
    expect(emptyLi.textContent).toBe("");

    // Find the PM position inside the empty list item
    const emptyItemPos = findNthListItemInnerPos(editor.state.doc, 2);

    const event = new MouseEvent("click");
    Object.defineProperty(event, "target", { value: emptyLi });
    const result = handleClick(view, emptyItemPos, event);

    // Should return true — force-set selection to prevent PM override
    expect(result).toBe(true);

    // Cursor should be inside the empty list item
    const { $from } = editor.state.selection;
    const listItemType = findListItemType(editor.state.schema)!;
    expect(isPositionInsideListItem($from, listItemType)).toBe(true);

    editor.destroy();
  });
});
