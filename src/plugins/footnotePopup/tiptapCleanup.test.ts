/**
 * Footnote Cleanup and Renumbering Tests
 *
 * Tests for getReferenceLabels, getDefinitionInfo,
 * createRenumberTransaction, and createCleanupAndRenumberTransaction.
 */

import { describe, it, expect } from "vitest";
import { Schema } from "@tiptap/pm/model";
import { EditorState } from "@tiptap/pm/state";
import {
  getReferenceLabels,
  getDefinitionInfo,
  createRenumberTransaction,
  createCleanupAndRenumberTransaction,
} from "./tiptapCleanup";

// Minimal schema with footnote nodes
const schema = new Schema({
  nodes: {
    doc: { content: "(block | footnote_definition)+" },
    paragraph: { group: "block", content: "inline*" },
    footnote_reference: {
      group: "inline",
      inline: true,
      atom: true,
      attrs: { label: { default: "1" } },
    },
    footnote_definition: {
      content: "block+",
      attrs: { label: { default: "1" } },
    },
    text: { group: "inline" },
  },
});

function createDoc(children: Array<ReturnType<typeof schema.node>>) {
  return schema.node("doc", null, children);
}

function p(text?: string) {
  return schema.node("paragraph", null, text ? [schema.text(text)] : []);
}

function fnRef(label: string) {
  return schema.node("footnote_reference", { label });
}

function fnDef(label: string, text?: string) {
  return schema.node("footnote_definition", { label }, [p(text ?? `Footnote ${label}`)]);
}

function pWithRef(text: string, label: string) {
  return schema.node("paragraph", null, [schema.text(text), fnRef(label)]);
}

function stateFrom(doc: ReturnType<typeof createDoc>) {
  return EditorState.create({ doc, schema });
}

describe("getReferenceLabels", () => {
  it("returns empty set for doc without footnote references", () => {
    const doc = createDoc([p("Hello world")]);
    expect(getReferenceLabels(doc)).toEqual(new Set());
  });

  it("collects all reference labels", () => {
    const doc = createDoc([
      pWithRef("Text", "1"),
      pWithRef("More", "2"),
    ]);
    expect(getReferenceLabels(doc)).toEqual(new Set(["1", "2"]));
  });

  it("deduplicates labels", () => {
    const doc = createDoc([
      pWithRef("Text", "1"),
      pWithRef("More", "1"),
    ]);
    expect(getReferenceLabels(doc)).toEqual(new Set(["1"]));
  });

  it("handles label attribute being null/undefined gracefully", () => {
    const doc = createDoc([
      schema.node("paragraph", null, [
        schema.node("footnote_reference", { label: null }),
      ]),
    ]);
    const labels = getReferenceLabels(doc);
    // null coerced to "" via String(null ?? "")
    expect(labels).toEqual(new Set([""]));
  });
});

describe("getDefinitionInfo", () => {
  it("returns empty array for doc without footnote definitions", () => {
    const doc = createDoc([p("Hello")]);
    expect(getDefinitionInfo(doc)).toEqual([]);
  });

  it("collects definition info with positions and sizes", () => {
    const doc = createDoc([
      p("Text"),
      fnDef("1"),
      fnDef("2"),
    ]);
    const defs = getDefinitionInfo(doc);
    expect(defs).toHaveLength(2);
    expect(defs[0].label).toBe("1");
    expect(defs[1].label).toBe("2");
    // Positions should be positive
    expect(defs[0].pos).toBeGreaterThan(0);
    expect(defs[1].pos).toBeGreaterThan(defs[0].pos);
    // Sizes should be positive
    expect(defs[0].size).toBeGreaterThan(0);
    expect(defs[1].size).toBeGreaterThan(0);
  });

  it("handles single definition", () => {
    const doc = createDoc([p("Text"), fnDef("5")]);
    const defs = getDefinitionInfo(doc);
    expect(defs).toHaveLength(1);
    expect(defs[0].label).toBe("5");
  });
});

describe("createRenumberTransaction", () => {
  const refType = schema.nodes.footnote_reference;
  const defType = schema.nodes.footnote_definition;

  it("returns null when there are no references", () => {
    const state = stateFrom(createDoc([p("No refs"), fnDef("1")]));
    const tr = createRenumberTransaction(state, refType, defType);
    expect(tr).toBeNull();
  });

  it("returns null when labels are already sequential", () => {
    const state = stateFrom(
      createDoc([
        pWithRef("A", "1"),
        pWithRef("B", "2"),
        fnDef("1"),
        fnDef("2"),
      ])
    );
    const tr = createRenumberTransaction(state, refType, defType);
    expect(tr).toBeNull();
  });

  it("renumbers references when labels are not sequential", () => {
    const state = stateFrom(
      createDoc([
        pWithRef("A", "2"),
        pWithRef("B", "5"),
        fnDef("2", "Def two"),
        fnDef("5", "Def five"),
      ])
    );
    const tr = createRenumberTransaction(state, refType, defType);
    expect(tr).not.toBeNull();

    // Apply and verify
    const newDoc = tr!.doc;
    const newRefLabels = getReferenceLabels(newDoc);
    expect(newRefLabels).toEqual(new Set(["1", "2"]));

    const newDefs = getDefinitionInfo(newDoc);
    expect(newDefs).toHaveLength(2);
    expect(newDefs[0].label).toBe("1");
    expect(newDefs[1].label).toBe("2");
  });

  it("preserves definition content during renumbering", () => {
    const state = stateFrom(
      createDoc([
        pWithRef("A", "3"),
        fnDef("3", "Important content"),
      ])
    );
    const tr = createRenumberTransaction(state, refType, defType);
    expect(tr).not.toBeNull();

    const newDoc = tr!.doc;
    const newDefs = getDefinitionInfo(newDoc);
    expect(newDefs).toHaveLength(1);
    expect(newDefs[0].label).toBe("1");
    // Content should be preserved
    const defNode = newDoc.nodeAt(newDefs[0].pos);
    expect(defNode?.textContent).toBe("Important content");
  });

  it("handles single reference needing renumber", () => {
    const state = stateFrom(
      createDoc([
        pWithRef("Text", "7"),
        fnDef("7", "Lucky seven"),
      ])
    );
    const tr = createRenumberTransaction(state, refType, defType);
    expect(tr).not.toBeNull();

    const newRefLabels = getReferenceLabels(tr!.doc);
    expect(newRefLabels).toEqual(new Set(["1"]));
  });
});

describe("createCleanupAndRenumberTransaction", () => {
  const refType = schema.nodes.footnote_reference;
  const defType = schema.nodes.footnote_definition;

  it("removes orphaned definitions and renumbers remaining", () => {
    // Simulate: ref "1" was deleted, only ref "2" remains
    const state = stateFrom(
      createDoc([
        pWithRef("A", "2"),
        fnDef("1", "Orphan"),
        fnDef("2", "Kept"),
      ])
    );
    const remainingRefLabels = new Set(["2"]);
    const tr = createCleanupAndRenumberTransaction(state, remainingRefLabels, refType, defType);
    expect(tr).not.toBeNull();

    const newDoc = tr!.doc;
    const newDefs = getDefinitionInfo(newDoc);
    // Only the kept definition should remain, renumbered to "1"
    expect(newDefs).toHaveLength(1);
    expect(newDefs[0].label).toBe("1");
    const defNode = newDoc.nodeAt(newDefs[0].pos);
    expect(defNode?.textContent).toBe("Kept");
  });

  it("handles multiple remaining references after deletion", () => {
    const state = stateFrom(
      createDoc([
        pWithRef("A", "1"),
        pWithRef("B", "3"),
        fnDef("1", "First"),
        fnDef("2", "Deleted ref"),
        fnDef("3", "Third"),
      ])
    );
    const remainingRefLabels = new Set(["1", "3"]);
    const tr = createCleanupAndRenumberTransaction(state, remainingRefLabels, refType, defType);
    expect(tr).not.toBeNull();

    const newDoc = tr!.doc;
    const newRefLabels = getReferenceLabels(newDoc);
    expect(newRefLabels).toEqual(new Set(["1", "2"]));

    const newDefs = getDefinitionInfo(newDoc);
    expect(newDefs).toHaveLength(2);
    expect(newDefs[0].label).toBe("1");
    expect(newDefs[1].label).toBe("2");
  });

  it("creates empty paragraph for definitions without matching content", () => {
    const state = stateFrom(
      createDoc([
        pWithRef("A", "5"),
        // No definition for "5" in remainingRefLabels set
        fnDef("3", "Orphan"),
      ])
    );
    const remainingRefLabels = new Set(["5"]);
    const tr = createCleanupAndRenumberTransaction(state, remainingRefLabels, refType, defType);
    expect(tr).not.toBeNull();

    const newDoc = tr!.doc;
    const newDefs = getDefinitionInfo(newDoc);
    expect(newDefs).toHaveLength(1);
    expect(newDefs[0].label).toBe("1");
  });

  it("handles empty remaining refs — removes all definitions", () => {
    const state = stateFrom(
      createDoc([
        p("No refs anymore"),
        fnDef("1", "Orphan one"),
        fnDef("2", "Orphan two"),
      ])
    );
    const remainingRefLabels = new Set<string>();
    const tr = createCleanupAndRenumberTransaction(state, remainingRefLabels, refType, defType);
    expect(tr).not.toBeNull();

    const newDoc = tr!.doc;
    const newDefs = getDefinitionInfo(newDoc);
    // No refs means no definitions should be re-created
    expect(newDefs).toHaveLength(0);
  });
});
