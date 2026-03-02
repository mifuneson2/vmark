/**
 * Tests for columnResize.ts
 *
 * Covers: ColumnResizeManager construction, handle creation, resize drag
 * lifecycle, debounced updates, cleanup, and edge cases.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { EditorView } from "@tiptap/pm/view";
import { ColumnResizeManager } from "./columnResize";

// ---------- helpers ----------

function createTable(rows: number, cols: number): HTMLTableElement {
  const table = document.createElement("table");
  for (let r = 0; r < rows; r++) {
    const tr = document.createElement("tr");
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement(r === 0 ? "th" : "td");
      cell.textContent = `r${r}c${c}`;
      // Simulate offsetWidth
      Object.defineProperty(cell, "offsetWidth", { value: 100, configurable: true });
      tr.appendChild(cell);
    }
    table.appendChild(tr);
  }
  return table;
}

function createMockView(table?: HTMLTableElement): EditorView {
  const dom = document.createElement("div");
  dom.className = "ProseMirror";
  if (table) dom.appendChild(table);

  return {
    dom,
    composing: false,
  } as unknown as EditorView;
}

// ---------- tests ----------

describe("ColumnResizeManager", () => {
  let manager: ColumnResizeManager;
  let view: EditorView;
  let table: HTMLTableElement;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.textContent = "";
    table = createTable(3, 3);
    view = createMockView(table);
    document.body.appendChild(view.dom);
    manager = new ColumnResizeManager(view);
  });

  afterEach(() => {
    manager.destroy();
    vi.useRealTimers();
  });

  describe("construction", () => {
    it("creates manager without errors", () => {
      expect(manager).toBeDefined();
    });
  });

  describe("scheduleUpdate", () => {
    it("adds resize handles to header cells after debounce", () => {
      manager.scheduleUpdate(table);
      vi.advanceTimersByTime(200);

      const handles = table.querySelectorAll(".table-resize-handle");
      // Handles on all header cells except last
      expect(handles.length).toBe(2); // 3 cols => 2 handles
    });

    it("does not add handles immediately (debounced)", () => {
      manager.scheduleUpdate(table);

      const handles = table.querySelectorAll(".table-resize-handle");
      expect(handles.length).toBe(0);
    });

    it("does not duplicate handles on repeated calls", () => {
      manager.scheduleUpdate(table);
      vi.advanceTimersByTime(200);
      manager.scheduleUpdate(table);
      vi.advanceTimersByTime(200);

      const handles = table.querySelectorAll(".table-resize-handle");
      expect(handles.length).toBe(2);
    });

    it("cancels previous debounce when called again quickly", () => {
      manager.scheduleUpdate(table);
      vi.advanceTimersByTime(100); // halfway
      manager.scheduleUpdate(table); // restart
      vi.advanceTimersByTime(100); // still not fired
      expect(table.querySelectorAll(".table-resize-handle").length).toBe(0);

      vi.advanceTimersByTime(100); // now fires
      expect(table.querySelectorAll(".table-resize-handle").length).toBe(2);
    });

    it("does nothing when table is null", () => {
      manager.scheduleUpdate(null);
      vi.advanceTimersByTime(200);

      const handles = table.querySelectorAll(".table-resize-handle");
      expect(handles.length).toBe(0);
    });

    it("defers when composing (IME active)", () => {
      (view as { composing: boolean }).composing = true;
      manager.scheduleUpdate(table);
      vi.advanceTimersByTime(200);

      // Should not add handles during composition
      expect(table.querySelectorAll(".table-resize-handle").length).toBe(0);

      // End composition
      (view as { composing: boolean }).composing = false;
      vi.advanceTimersByTime(200);

      // Now handles should appear
      expect(table.querySelectorAll(".table-resize-handle").length).toBe(2);
    });
  });

  describe("resize interaction", () => {
    beforeEach(() => {
      manager.scheduleUpdate(table);
      vi.advanceTimersByTime(200);
    });

    it("adds active class on mousedown", () => {
      const handle = table.querySelector(".table-resize-handle") as HTMLElement;
      expect(handle).not.toBeNull();

      handle.dispatchEvent(new MouseEvent("mousedown", { clientX: 100, bubbles: true }));

      expect(handle.classList.contains("active")).toBe(true);
    });

    it("applies column width on mousemove during drag", () => {
      const handle = table.querySelector(".table-resize-handle") as HTMLElement;
      handle.dispatchEvent(new MouseEvent("mousedown", { clientX: 100, bubbles: true }));

      // Simulate mousemove
      document.dispatchEvent(new MouseEvent("mousemove", { clientX: 150 }));

      // Check that width styles are applied
      const firstHeaderCell = table.querySelector("th") as HTMLElement;
      expect(firstHeaderCell.style.width).not.toBe("");
    });

    it("enforces minimum column width of 50px", () => {
      const handle = table.querySelector(".table-resize-handle") as HTMLElement;
      handle.dispatchEvent(new MouseEvent("mousedown", { clientX: 100, bubbles: true }));

      // Drag far to the left (negative delta larger than initial width)
      document.dispatchEvent(new MouseEvent("mousemove", { clientX: -200 }));

      const firstHeaderCell = table.querySelector("th") as HTMLElement;
      expect(parseInt(firstHeaderCell.style.width)).toBeGreaterThanOrEqual(50);
    });

    it("sets table to fixed layout during resize", () => {
      const handle = table.querySelector(".table-resize-handle") as HTMLElement;
      handle.dispatchEvent(new MouseEvent("mousedown", { clientX: 100, bubbles: true }));
      document.dispatchEvent(new MouseEvent("mousemove", { clientX: 150 }));

      expect(table.style.tableLayout).toBe("fixed");
    });

    it("sets cursor and user-select on body during drag", () => {
      const handle = table.querySelector(".table-resize-handle") as HTMLElement;
      handle.dispatchEvent(new MouseEvent("mousedown", { clientX: 100, bubbles: true }));

      expect(document.body.style.userSelect).toBe("none");
      expect(document.body.style.cursor).toBe("col-resize");
    });

    it("cleans up on mouseup", () => {
      const handle = table.querySelector(".table-resize-handle") as HTMLElement;
      handle.dispatchEvent(new MouseEvent("mousedown", { clientX: 100, bubbles: true }));

      document.dispatchEvent(new MouseEvent("mouseup"));

      expect(handle.classList.contains("active")).toBe(false);
      expect(document.body.style.userSelect).toBe("");
      expect(document.body.style.cursor).toBe("");
    });

    it("removes document listeners on mouseup", () => {
      const removeSpy = vi.spyOn(document, "removeEventListener");
      const handle = table.querySelector(".table-resize-handle") as HTMLElement;
      handle.dispatchEvent(new MouseEvent("mousedown", { clientX: 100, bubbles: true }));

      document.dispatchEvent(new MouseEvent("mouseup"));

      expect(removeSpy).toHaveBeenCalledWith("mousemove", expect.any(Function));
      expect(removeSpy).toHaveBeenCalledWith("mouseup", expect.any(Function));
    });

    it("prevents default and stops propagation on handle mousedown", () => {
      const handle = table.querySelector(".table-resize-handle") as HTMLElement;
      const event = new MouseEvent("mousedown", { clientX: 100, bubbles: true, cancelable: true });
      const preventSpy = vi.spyOn(event, "preventDefault");
      const stopSpy = vi.spyOn(event, "stopPropagation");

      handle.dispatchEvent(event);

      expect(preventSpy).toHaveBeenCalled();
      expect(stopSpy).toHaveBeenCalled();
    });
  });

  describe("destroy", () => {
    it("removes all handles from DOM", () => {
      manager.scheduleUpdate(table);
      vi.advanceTimersByTime(200);
      expect(table.querySelectorAll(".table-resize-handle").length).toBe(2);

      manager.destroy();
      expect(table.querySelectorAll(".table-resize-handle").length).toBe(0);
    });

    it("clears pending timeouts", () => {
      manager.scheduleUpdate(table);
      // Destroy before debounce fires
      manager.destroy();
      vi.advanceTimersByTime(200);

      expect(table.querySelectorAll(".table-resize-handle").length).toBe(0);
    });

    it("ends ongoing resize if active", () => {
      manager.scheduleUpdate(table);
      vi.advanceTimersByTime(200);

      const handle = table.querySelector(".table-resize-handle") as HTMLElement;
      handle.dispatchEvent(new MouseEvent("mousedown", { clientX: 100, bubbles: true }));

      // Destroy while dragging
      manager.destroy();

      expect(document.body.style.cursor).toBe("");
      expect(document.body.style.userSelect).toBe("");
    });
  });

  describe("edge cases", () => {
    it("handles table with no rows", () => {
      const emptyTable = document.createElement("table");
      const emptyView = createMockView(emptyTable);
      const emptyManager = new ColumnResizeManager(emptyView);

      emptyManager.scheduleUpdate(emptyTable);
      vi.advanceTimersByTime(200);

      expect(emptyTable.querySelectorAll(".table-resize-handle").length).toBe(0);
      emptyManager.destroy();
    });

    it("handles single-column table (no handles needed)", () => {
      const singleColTable = createTable(2, 1);
      const singleView = createMockView(singleColTable);
      const singleManager = new ColumnResizeManager(singleView);

      singleManager.scheduleUpdate(singleColTable);
      vi.advanceTimersByTime(200);

      // Single column => no handles (last cell excluded)
      expect(singleColTable.querySelectorAll(".table-resize-handle").length).toBe(0);
      singleManager.destroy();
    });

    it("handles two-column table (1 handle)", () => {
      const twoColTable = createTable(2, 2);
      const twoView = createMockView(twoColTable);
      const twoManager = new ColumnResizeManager(twoView);

      twoManager.scheduleUpdate(twoColTable);
      vi.advanceTimersByTime(200);

      expect(twoColTable.querySelectorAll(".table-resize-handle").length).toBe(1);
      twoManager.destroy();
    });

    it("mousemove without drag does nothing", () => {
      // No mousedown, so mousemove should be harmless
      document.dispatchEvent(new MouseEvent("mousemove", { clientX: 200 }));
      // Should not throw
    });

    it("applies width to all rows in the column", () => {
      manager.scheduleUpdate(table);
      vi.advanceTimersByTime(200);

      const handle = table.querySelector(".table-resize-handle") as HTMLElement;
      handle.dispatchEvent(new MouseEvent("mousedown", { clientX: 100, bubbles: true }));
      document.dispatchEvent(new MouseEvent("mousemove", { clientX: 150 }));

      // Check all rows have width set on first column
      const rows = table.querySelectorAll("tr");
      rows.forEach((r) => {
        const firstCell = r.querySelector("th, td") as HTMLElement;
        expect(firstCell.style.width).not.toBe("");
        expect(firstCell.style.minWidth).not.toBe("");
      });

      document.dispatchEvent(new MouseEvent("mouseup"));
    });
  });
});
