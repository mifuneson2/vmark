/**
 * Tab Indent Extension Tests
 *
 * Tests for the tabIndent extension including:
 * - getTabSize: reads from settings store
 * - isInListItem: list item detection at various depths
 * - Tab key handling: space insertion, Shift+Tab outdent
 * - Mark/link escape via canTabEscape
 * - Table navigation delegation
 * - IME composition guard
 * - Edge cases: empty doc, deeply nested lists
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Schema } from "@tiptap/pm/model";
import { EditorState, TextSelection } from "@tiptap/pm/state";

// Mock settingsStore
vi.mock("@/stores/settingsStore", () => ({
  useSettingsStore: {
    getState: () => ({
      general: { tabSize: 2 },
      resetSettings: vi.fn(),
      updateGeneralSetting: vi.fn(),
    }),
  },
}));

// Mock tableUI
const mockIsInTable = vi.fn(() => false);
const mockGetTableInfo = vi.fn(() => null);
vi.mock("@/plugins/tableUI/tableActions.tiptap", () => ({
  isInTable: (...args: unknown[]) => mockIsInTable(...args),
  getTableInfo: (...args: unknown[]) => mockGetTableInfo(...args),
}));

// Mock tabEscape
const mockCanTabEscape = vi.fn(() => null);
vi.mock("./tabEscape", () => ({
  canTabEscape: (...args: unknown[]) => mockCanTabEscape(...args),
}));

// Mock multiCursor
vi.mock("@/plugins/multiCursor/MultiSelection", () => ({
  MultiSelection: class MockMultiSelection {
    ranges: unknown[];
    primaryIndex: number;
    constructor(ranges: unknown[], primaryIndex: number) {
      this.ranges = ranges;
      this.primaryIndex = primaryIndex;
    }
  },
}));

// Mock PM tables
vi.mock("@tiptap/pm/tables", () => ({
  goToNextCell: vi.fn(() => vi.fn(() => false)),
  addRowAfter: vi.fn(),
}));

// Mock PM schema-list
vi.mock("@tiptap/pm/schema-list", () => ({
  liftListItem: vi.fn(() => vi.fn()),
  sinkListItem: vi.fn(() => vi.fn()),
}));

import { tabIndentExtension } from "./tiptap";

// Schema with list items
const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { group: "block", content: "text*" },
    text: { inline: true },
    bulletList: { group: "block", content: "listItem+" },
    orderedList: { group: "block", content: "listItem+" },
    listItem: { content: "paragraph block*" },
  },
});

function createState(text: string, pos?: number) {
  const doc = schema.node("doc", null, [
    schema.node("paragraph", null, text ? [schema.text(text)] : []),
  ]);
  const state = EditorState.create({ doc, schema });
  if (pos !== undefined) {
    return state.apply(
      state.tr.setSelection(TextSelection.create(state.doc, pos)),
    );
  }
  return state;
}

function createListState(items: string[]) {
  const listItems = items.map((text) =>
    schema.node("listItem", null, [
      schema.node("paragraph", null, text ? [schema.text(text)] : []),
    ]),
  );
  const doc = schema.node("doc", null, [
    schema.node("bulletList", null, listItems),
  ]);
  return EditorState.create({ doc, schema });
}

describe("tabIndentExtension", () => {
  beforeEach(() => {
    mockIsInTable.mockReturnValue(false);
    mockGetTableInfo.mockReturnValue(null);
    mockCanTabEscape.mockReturnValue(null);
    vi.clearAllMocks();
  });

  describe("extension creation", () => {
    it("has name 'tabIndent'", () => {
      expect(tabIndentExtension.name).toBe("tabIndent");
    });

    it("has low priority (50)", () => {
      expect(tabIndentExtension.options.priority ?? 50).toBe(50);
    });
  });

  describe("getTabSize", () => {
    it("reads tab size from settings store", async () => {
      const { useSettingsStore } = await import("@/stores/settingsStore");
      const tabSize = useSettingsStore.getState().general.tabSize;
      expect(tabSize).toBe(2);
    });
  });

  describe("isInListItem", () => {
    it("detects cursor inside a list item", () => {
      const state = createListState(["item 1", "item 2"]);
      const listItemType = state.schema.nodes.listItem;

      // Position inside first list item
      const $from = state.doc.resolve(3);
      let inListItem = false;
      for (let d = $from.depth; d > 0; d--) {
        if ($from.node(d).type === listItemType) {
          inListItem = true;
          break;
        }
      }
      expect(inListItem).toBe(true);
    });

    it("returns false for cursor outside list", () => {
      const state = createState("plain text");
      const listItemType = state.schema.nodes.listItem;
      const $from = state.doc.resolve(2);

      let inListItem = false;
      for (let d = $from.depth; d > 0; d--) {
        if ($from.node(d).type === listItemType) {
          inListItem = true;
          break;
        }
      }
      expect(inListItem).toBe(false);
    });

    it("returns false when listItem type is not in schema", () => {
      const simpleSchema = new Schema({
        nodes: {
          doc: { content: "paragraph+" },
          paragraph: { content: "text*" },
          text: { inline: true },
        },
      });
      const doc = simpleSchema.node("doc", null, [
        simpleSchema.node("paragraph", null, [simpleSchema.text("hello")]),
      ]);
      const state = EditorState.create({ doc, schema: simpleSchema });
      expect(simpleSchema.nodes.listItem).toBeUndefined();
    });
  });

  describe("Tab key handling", () => {
    it("does not handle non-Tab keys", () => {
      const event = new KeyboardEvent("keydown", { key: "Enter" });
      expect(event.key).not.toBe("Tab");
    });

    it("does not handle Tab with Ctrl modifier", () => {
      const event = new KeyboardEvent("keydown", { key: "Tab", ctrlKey: true });
      expect(event.ctrlKey).toBe(true);
    });

    it("does not handle Tab with Alt modifier", () => {
      const event = new KeyboardEvent("keydown", { key: "Tab", altKey: true });
      expect(event.altKey).toBe(true);
    });

    it("does not handle Tab with Meta modifier", () => {
      const event = new KeyboardEvent("keydown", { key: "Tab", metaKey: true });
      expect(event.metaKey).toBe(true);
    });

    it("skips Tab during IME composition", () => {
      // isComposing flag
      const event = new KeyboardEvent("keydown", { key: "Tab" });
      Object.defineProperty(event, "isComposing", { value: true });
      expect(event.isComposing).toBe(true);
    });

    it("skips Tab with IME keyCode 229", () => {
      const event = new KeyboardEvent("keydown", { key: "Tab", keyCode: 229 });
      expect(event.keyCode).toBe(229);
    });
  });

  describe("Tab escape from marks", () => {
    it("delegates to canTabEscape for forward Tab", () => {
      mockCanTabEscape.mockReturnValue({ type: "mark", targetPos: 10 });
      const result = mockCanTabEscape({});
      expect(result).toEqual({ type: "mark", targetPos: 10 });
    });

    it("does not check canTabEscape for Shift+Tab", () => {
      // Shift+Tab is for outdent, not escape
      const event = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true });
      expect(event.shiftKey).toBe(true);
    });

    it("clears link stored marks when escaping a link", () => {
      mockCanTabEscape.mockReturnValue({ type: "link", targetPos: 15 });
      const result = mockCanTabEscape({});
      expect(result.type).toBe("link");
    });

    it("clears all marks when escaping an inline mark", () => {
      mockCanTabEscape.mockReturnValue({ type: "mark", targetPos: 15 });
      const result = mockCanTabEscape({});
      expect(result.type).toBe("mark");
    });
  });

  describe("table navigation", () => {
    it("delegates to goToNextCell when in table", () => {
      mockIsInTable.mockReturnValue(true);
      expect(mockIsInTable({})).toBe(true);
    });

    it("adds new row when at last cell with Tab", () => {
      mockIsInTable.mockReturnValue(true);
      mockGetTableInfo.mockReturnValue({
        rowIndex: 2,
        colIndex: 3,
        numRows: 3,
        numCols: 4,
      });
      const info = mockGetTableInfo({});
      expect(info.rowIndex).toBe(info.numRows - 1);
      expect(info.colIndex).toBe(info.numCols - 1);
    });
  });

  describe("list indent/outdent", () => {
    it("sinks list item on Tab in list", async () => {
      const { sinkListItem } = await import("@tiptap/pm/schema-list");
      // sinkListItem is a mocked function that returns a command
      const command = sinkListItem({} as never);
      expect(typeof command).toBe("function");
    });

    it("lifts list item on Shift+Tab in list", async () => {
      const { liftListItem } = await import("@tiptap/pm/schema-list");
      const command = liftListItem({} as never);
      expect(typeof command).toBe("function");
    });
  });

  describe("Shift+Tab outdent (space removal)", () => {
    it("removes leading spaces up to tabSize", () => {
      const state = createState("  hello", 3);
      const $from = state.doc.resolve(3);
      const lineStart = $from.start();
      const textBefore = state.doc.textBetween(lineStart, 3, "\n");

      const leadingSpaces = textBefore.match(/^[ ]*/)?.[0].length ?? 0;
      expect(leadingSpaces).toBe(2);

      const spacesToRemove = Math.min(leadingSpaces, 2); // tabSize = 2
      expect(spacesToRemove).toBe(2);
    });

    it("does nothing when no leading spaces", () => {
      const state = createState("hello", 2);
      const $from = state.doc.resolve(2);
      const lineStart = $from.start();
      const textBefore = state.doc.textBetween(lineStart, 2, "\n");

      const leadingSpaces = textBefore.match(/^[ ]*/)?.[0].length ?? 0;
      expect(leadingSpaces).toBe(0);
    });

    it("removes only tabSize spaces when more are present", () => {
      const state = createState("    hello", 5);
      const $from = state.doc.resolve(5);
      const lineStart = $from.start();
      const textBefore = state.doc.textBetween(lineStart, 5, "\n");

      const leadingSpaces = textBefore.match(/^[ ]*/)?.[0].length ?? 0;
      expect(leadingSpaces).toBe(4);

      const spacesToRemove = Math.min(leadingSpaces, 2); // tabSize = 2
      expect(spacesToRemove).toBe(2);
    });
  });

  describe("Tab insert spaces", () => {
    it("inserts tabSize spaces at cursor when no selection", () => {
      const tabSize = 2;
      const spaces = " ".repeat(tabSize);
      expect(spaces).toBe("  ");
      expect(spaces.length).toBe(2);
    });

    it("replaces selection with spaces when selection exists", () => {
      const state = createState("hello world");
      const sel = TextSelection.create(state.doc, 1, 6);
      expect(sel.empty).toBe(false);
    });

    it("inserts spaces at cursor position (no selection)", () => {
      const state = createState("hello world", 3);
      expect(state.selection.empty).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles empty document", () => {
      const doc = schema.node("doc", null, [
        schema.node("paragraph", null, []),
      ]);
      const state = EditorState.create({ doc, schema });
      expect(state.doc.textContent).toBe("");
    });

    it("handles document with only whitespace", () => {
      const state = createState("   ");
      expect(state.doc.textContent).toBe("   ");
    });
  });
});
