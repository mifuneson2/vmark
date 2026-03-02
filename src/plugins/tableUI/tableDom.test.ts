import { describe, expect, it, afterEach } from "vitest";
import type { EditorView } from "@tiptap/pm/view";
import { getActiveTableElement } from "./tableDom";

type RectOverrides = Partial<DOMRect>;

function createRect(overrides: RectOverrides): DOMRect {
  const base = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  };
  return { ...base, ...overrides } as DOMRect;
}

function mockRect(el: Element, rect: DOMRect) {
  Object.defineProperty(el, "getBoundingClientRect", {
    value: () => rect,
    configurable: true,
  });
}

function setupTableDom(rects: { container: DOMRect; table: DOMRect }) {
  const container = document.createElement("div");
  container.className = "editor-content";
  const editorDom = document.createElement("div");
  editorDom.className = "ProseMirror";
  container.appendChild(editorDom);

  const table = document.createElement("table");
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.textContent = "cell";
  row.appendChild(cell);
  table.appendChild(row);
  editorDom.appendChild(table);
  document.body.appendChild(container);

  mockRect(container, rects.container);
  mockRect(table, rects.table);

  const textNode = cell.firstChild as Text;
  const range = document.createRange();
  range.setStart(textNode, 0);
  range.setEnd(textNode, 1);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);

  const view = { dom: editorDom, root: document } as unknown as EditorView;

  return {
    view,
    table,
    container,
    editorDom,
    cleanup: () => {
      selection?.removeAllRanges();
      container.remove();
    },
  };
}

describe("getActiveTableElement", () => {
  afterEach(() => {
    const sel = window.getSelection();
    sel?.removeAllRanges();
  });

  it("returns the table when selection is inside and visible", () => {
    const { view, table, cleanup } = setupTableDom({
      container: createRect({ top: 0, bottom: 200 }),
      table: createRect({ top: 40, bottom: 80 }),
    });

    expect(getActiveTableElement(view)).toBe(table);
    cleanup();
  });

  it("returns null when the table is outside the container viewport", () => {
    const { view, cleanup } = setupTableDom({
      container: createRect({ top: 0, bottom: 200 }),
      table: createRect({ top: 500, bottom: 560 }),
    });

    expect(getActiveTableElement(view)).toBeNull();
    cleanup();
  });

  it("returns null when there is no selection", () => {
    const { view, cleanup } = setupTableDom({
      container: createRect({ top: 0, bottom: 200 }),
      table: createRect({ top: 40, bottom: 80 }),
    });

    // Clear the selection
    window.getSelection()?.removeAllRanges();

    expect(getActiveTableElement(view)).toBeNull();
    cleanup();
  });

  it("returns table when no editor-content container exists (no scroll container)", () => {
    // Set up DOM without .editor-content wrapper
    const editorDom = document.createElement("div");
    editorDom.className = "ProseMirror";

    const table = document.createElement("table");
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.textContent = "cell";
    row.appendChild(cell);
    table.appendChild(row);
    editorDom.appendChild(table);
    document.body.appendChild(editorDom);

    const textNode = cell.firstChild as Text;
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, 1);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    const view = { dom: editorDom, root: document } as unknown as EditorView;

    // Without editor-content, should return table directly (no visibility check)
    expect(getActiveTableElement(view)).toBe(table);

    window.getSelection()?.removeAllRanges();
    editorDom.remove();
  });

  it("returns null when selection is in a non-table element", () => {
    const container = document.createElement("div");
    container.className = "editor-content";
    const editorDom = document.createElement("div");
    editorDom.className = "ProseMirror";
    container.appendChild(editorDom);

    const para = document.createElement("p");
    para.textContent = "not a table";
    editorDom.appendChild(para);
    document.body.appendChild(container);

    const textNode = para.firstChild as Text;
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, 3);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    const view = { dom: editorDom, root: document } as unknown as EditorView;

    expect(getActiveTableElement(view)).toBeNull();

    window.getSelection()?.removeAllRanges();
    container.remove();
  });

  it("returns table when partially visible (top overlaps container bottom)", () => {
    const { view, table, cleanup } = setupTableDom({
      container: createRect({ top: 0, bottom: 100 }),
      table: createRect({ top: 80, bottom: 160 }), // partially visible
    });

    expect(getActiveTableElement(view)).toBe(table);
    cleanup();
  });

  it("returns table when partially visible (bottom overlaps container top)", () => {
    const { view, table, cleanup } = setupTableDom({
      container: createRect({ top: 100, bottom: 300 }),
      table: createRect({ top: 50, bottom: 120 }), // partially visible
    });

    expect(getActiveTableElement(view)).toBe(table);
    cleanup();
  });

  it("returns null when table is entirely above container", () => {
    const { view, cleanup } = setupTableDom({
      container: createRect({ top: 200, bottom: 400 }),
      table: createRect({ top: 0, bottom: 50 }),
    });

    expect(getActiveTableElement(view)).toBeNull();
    cleanup();
  });

  it("handles selection on Element node (not text)", () => {
    const { view, table, cleanup } = setupTableDom({
      container: createRect({ top: 0, bottom: 200 }),
      table: createRect({ top: 40, bottom: 80 }),
    });

    // Set selection directly on the cell element
    const cell = table.querySelector("td") as HTMLElement;
    const range = document.createRange();
    range.selectNodeContents(cell);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);

    expect(getActiveTableElement(view)).toBe(table);
    cleanup();
  });

  it("uses window.getSelection when view.root is not a Document", () => {
    const { table, cleanup, container } = setupTableDom({
      container: createRect({ top: 0, bottom: 200 }),
      table: createRect({ top: 40, bottom: 80 }),
    });

    // view.root is not a Document
    const view = { dom: container.querySelector(".ProseMirror")!, root: {} } as unknown as EditorView;

    // Should fall back to window.getSelection()
    expect(getActiveTableElement(view)).toBe(table);
    cleanup();
  });
});
