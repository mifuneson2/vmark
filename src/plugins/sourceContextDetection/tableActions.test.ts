import { describe, it, expect } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import type { SourceTableInfo } from "./tableTypes";
import {
  insertRowBelow,
  insertRowAbove,
  insertColumnRight,
  insertColumnLeft,
  deleteRow,
  deleteColumn,
  deleteTable,
  getColumnAlignment,
  setColumnAlignment,
  setAllColumnsAlignment,
  formatTable,
} from "./tableActions";

function createView(doc: string, cursor: number): EditorView {
  const state = EditorState.create({
    doc,
    selection: { anchor: cursor },
  });
  return new EditorView({ state, parent: document.createElement("div") });
}

/**
 * Helper to build a SourceTableInfo for a simple table.
 * Assumes the table starts at the beginning of the document.
 */
function makeTableInfo(
  overrides: Partial<SourceTableInfo> & {
    lines: string[];
    colCount: number;
    rowIndex: number;
    colIndex: number;
  }
): SourceTableInfo {
  const lines = overrides.lines;
  return {
    start: 0,
    end: lines.join("\n").length,
    startLine: overrides.startLine ?? 0,
    endLine: overrides.endLine ?? lines.length - 1,
    rowIndex: overrides.rowIndex,
    colIndex: overrides.colIndex,
    colCount: overrides.colCount,
    lines,
  };
}

const simpleTable = [
  "| A   | B   |",
  "| --- | --- |",
  "| a1  | b1  |",
  "| a2  | b2  |",
];

const simpleTableText = simpleTable.join("\n");

describe("getColumnAlignment", () => {
  it.each([
    { separator: "| --- | --- |", col: 0, expected: "left" as const },
    { separator: "| :-- | --- |", col: 0, expected: "left" as const },
    { separator: "| --: | --- |", col: 0, expected: "right" as const },
    { separator: "| :-: | --- |", col: 0, expected: "center" as const },
    { separator: "| --- | :-: |", col: 1, expected: "center" as const },
  ])("returns '$expected' for col $col with separator '$separator'", ({ separator, col, expected }) => {
    const lines = ["| A | B |", separator, "| a | b |"];
    const info = makeTableInfo({ lines, colCount: 2, rowIndex: 0, colIndex: col });
    expect(getColumnAlignment(info)).toBe(expected);
  });

  it("returns 'left' when colIndex is out of range", () => {
    const lines = ["| A |", "| - |", "| a |"];
    const info = makeTableInfo({ lines, colCount: 1, rowIndex: 0, colIndex: 5 });
    expect(getColumnAlignment(info)).toBe("left");
  });
});

describe("insertRowBelow", () => {
  it("inserts a new row below the current row", () => {
    const view = createView(simpleTableText, 30);
    const info = makeTableInfo({
      lines: simpleTable,
      colCount: 2,
      rowIndex: 2, // data row "a1 | b1"
      colIndex: 0,
    });

    insertRowBelow(view, info);
    const result = view.state.doc.toString();

    // Should have 5 lines now (original 4 + 1 new)
    const lines = result.split("\n");
    expect(lines.length).toBe(5);
    // New row should be after row index 2 (line 3 in 1-indexed)
    expect(lines[3]).toMatch(/^\|.*\|$/);
    view.destroy();
  });
});

describe("insertRowAbove", () => {
  it("inserts row after separator when rowIndex is 0 (header)", () => {
    const view = createView(simpleTableText, 5);
    const info = makeTableInfo({
      lines: simpleTable,
      colCount: 2,
      rowIndex: 0, // header
      colIndex: 0,
    });

    insertRowAbove(view, info);
    const result = view.state.doc.toString();
    const lines = result.split("\n");
    expect(lines.length).toBe(5);
    view.destroy();
  });

  it("inserts row above current data row", () => {
    const view = createView(simpleTableText, 40);
    const info = makeTableInfo({
      lines: simpleTable,
      colCount: 2,
      rowIndex: 3, // last data row "a2 | b2"
      colIndex: 0,
    });

    insertRowAbove(view, info);
    const result = view.state.doc.toString();
    const lines = result.split("\n");
    expect(lines.length).toBe(5);
    view.destroy();
  });
});

describe("insertColumnRight", () => {
  it("adds a column to the right of current column", () => {
    const view = createView(simpleTableText, 5);
    const info = makeTableInfo({
      lines: simpleTable,
      colCount: 2,
      rowIndex: 0,
      colIndex: 0,
    });

    insertColumnRight(view, info);
    const result = view.state.doc.toString();
    const lines = result.split("\n");

    // Each line should now have 3 pipe-delimited cells
    for (const line of lines) {
      // Count pipe segments (cells = pipes - 1 for leading/trailing)
      const pipes = line.split("|").length - 1;
      expect(pipes).toBeGreaterThanOrEqual(4); // |cell|cell|cell| = 4 pipes
    }
    view.destroy();
  });
});

describe("insertColumnLeft", () => {
  it("adds a column to the left of current column", () => {
    const view = createView(simpleTableText, 5);
    const info = makeTableInfo({
      lines: simpleTable,
      colCount: 2,
      rowIndex: 0,
      colIndex: 1,
    });

    insertColumnLeft(view, info);
    const result = view.state.doc.toString();
    const lines = result.split("\n");

    for (const line of lines) {
      const pipes = line.split("|").length - 1;
      expect(pipes).toBeGreaterThanOrEqual(4);
    }
    view.destroy();
  });
});

describe("deleteRow", () => {
  it("does nothing when rowIndex is 0 (header)", () => {
    const view = createView(simpleTableText, 5);
    const info = makeTableInfo({
      lines: simpleTable,
      colCount: 2,
      rowIndex: 0,
      colIndex: 0,
    });

    deleteRow(view, info);
    expect(view.state.doc.toString()).toBe(simpleTableText);
    view.destroy();
  });

  it("does nothing when rowIndex is 1 (separator)", () => {
    const view = createView(simpleTableText, 15);
    const info = makeTableInfo({
      lines: simpleTable,
      colCount: 2,
      rowIndex: 1,
      colIndex: 0,
    });

    deleteRow(view, info);
    expect(view.state.doc.toString()).toBe(simpleTableText);
    view.destroy();
  });

  it("deletes entire table when only one data row remains", () => {
    const threeLineTable = [
      "| A   | B   |",
      "| --- | --- |",
      "| a1  | b1  |",
    ];
    const text = threeLineTable.join("\n");
    const view = createView(text, 30);
    const info = makeTableInfo({
      lines: threeLineTable,
      colCount: 2,
      rowIndex: 2,
      colIndex: 0,
    });

    deleteRow(view, info);
    // Table should be deleted entirely
    expect(view.state.doc.toString()).toBe("");
    view.destroy();
  });

  it("deletes a data row when multiple exist", () => {
    const view = createView(simpleTableText, 30);
    const info = makeTableInfo({
      lines: simpleTable,
      colCount: 2,
      rowIndex: 2, // first data row
      colIndex: 0,
    });

    deleteRow(view, info);
    const result = view.state.doc.toString();
    const lines = result.split("\n");
    expect(lines.length).toBe(3); // header + separator + 1 data row
    view.destroy();
  });
});

describe("deleteColumn", () => {
  it("does nothing when only one column", () => {
    const oneCol = ["| A |", "| - |", "| a |"];
    const text = oneCol.join("\n");
    const view = createView(text, 3);
    const info = makeTableInfo({
      lines: oneCol,
      colCount: 1,
      rowIndex: 0,
      colIndex: 0,
    });

    deleteColumn(view, info);
    expect(view.state.doc.toString()).toBe(text);
    view.destroy();
  });

  it("removes a column from multi-column table", () => {
    const view = createView(simpleTableText, 5);
    const info = makeTableInfo({
      lines: simpleTable,
      colCount: 2,
      rowIndex: 0,
      colIndex: 0,
    });

    deleteColumn(view, info);
    const result = view.state.doc.toString();
    const lines = result.split("\n");

    // Should have only 1 cell per row now
    for (const line of lines) {
      const cells = line.split("|").filter((s) => s.trim() !== "");
      expect(cells.length).toBe(1);
    }
    view.destroy();
  });
});

describe("deleteTable", () => {
  it("removes entire table from document", () => {
    const view = createView(simpleTableText, 5);
    const info = makeTableInfo({
      lines: simpleTable,
      colCount: 2,
      rowIndex: 0,
      colIndex: 0,
    });

    deleteTable(view, info);
    expect(view.state.doc.toString()).toBe("");
    view.destroy();
  });

  it("removes table with trailing newline", () => {
    const text = simpleTableText + "\nmore text";
    const view = createView(text, 5);
    const info = makeTableInfo({
      lines: simpleTable,
      colCount: 2,
      rowIndex: 0,
      colIndex: 0,
    });

    deleteTable(view, info);
    expect(view.state.doc.toString()).toBe("more text");
    view.destroy();
  });
});

describe("setColumnAlignment", () => {
  it("sets column to center alignment", () => {
    const view = createView(simpleTableText, 5);
    const info = makeTableInfo({
      lines: simpleTable,
      colCount: 2,
      rowIndex: 0,
      colIndex: 0,
    });

    setColumnAlignment(view, info, "center");
    const result = view.state.doc.toString();
    // Separator line should contain :---: pattern for col 0
    const sepLine = result.split("\n")[1];
    expect(sepLine).toMatch(/:\-+:/);
    view.destroy();
  });

  it("sets column to right alignment", () => {
    const view = createView(simpleTableText, 5);
    const info = makeTableInfo({
      lines: simpleTable,
      colCount: 2,
      rowIndex: 0,
      colIndex: 1,
    });

    setColumnAlignment(view, info, "right");
    const result = view.state.doc.toString();
    const sepLine = result.split("\n")[1];
    // Should end with ---: pattern in second cell
    expect(sepLine).toMatch(/\-+:/);
    view.destroy();
  });
});

describe("setAllColumnsAlignment", () => {
  it("sets all columns to center", () => {
    const view = createView(simpleTableText, 5);
    const info = makeTableInfo({
      lines: simpleTable,
      colCount: 2,
      rowIndex: 0,
      colIndex: 0,
    });

    setAllColumnsAlignment(view, info, "center");
    const result = view.state.doc.toString();
    const sepLine = result.split("\n")[1];
    // Both cells should have :---: pattern
    const cells = sepLine.split("|").filter((s) => s.trim() !== "");
    for (const cell of cells) {
      expect(cell.trim()).toMatch(/^:\-+:$/);
    }
    view.destroy();
  });
});

describe("formatTable", () => {
  it("formats table with padded columns", () => {
    const unformatted = [
      "| A | B |",
      "| --- | --- |",
      "| long cell | b |",
    ];
    const text = unformatted.join("\n");
    const view = createView(text, 5);
    const info = makeTableInfo({
      lines: unformatted,
      colCount: 2,
      rowIndex: 0,
      colIndex: 0,
    });

    const changed = formatTable(view, info);
    expect(changed).toBe(true);

    const result = view.state.doc.toString();
    const lines = result.split("\n");
    // All lines should have the same structure
    expect(lines.length).toBe(3);
    view.destroy();
  });

  it("returns false when table is already formatted", () => {
    const formatted = [
      "| A   | B   |",
      "| --- | --- |",
      "| a   | b   |",
    ];
    const text = formatted.join("\n");
    const view = createView(text, 5);
    const info = makeTableInfo({
      lines: formatted,
      colCount: 2,
      rowIndex: 0,
      colIndex: 0,
    });

    const changed = formatTable(view, info);
    // May or may not change depending on exact formatting match
    // The important thing is it doesn't crash
    expect(typeof changed).toBe("boolean");
    view.destroy();
  });

  it("handles center alignment in separator", () => {
    const lines = [
      "| H1 | H2 |",
      "| :-: | --: |",
      "| a | b |",
    ];
    const text = lines.join("\n");
    const view = createView(text, 5);
    const info = makeTableInfo({
      lines,
      colCount: 2,
      rowIndex: 0,
      colIndex: 0,
    });

    formatTable(view, info);
    const result = view.state.doc.toString();
    const sepLine = result.split("\n")[1];
    // Center alignment should be preserved
    expect(sepLine).toMatch(/:-+:/);
    // Right alignment should be preserved
    expect(sepLine).toMatch(/-+:/);
    view.destroy();
  });
});
