import { describe, it, expect } from "vitest";
import { Schema } from "@tiptap/pm/model";
import { EditorState } from "@tiptap/pm/state";

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { content: "text*", group: "block" },
    code_block: {
      content: "text*",
      group: "block",
      code: true,
      attrs: { language: { default: "" } },
    },
    text: { inline: true },
  },
});

describe("code preview position mapping", () => {
  it("maps code block position after paragraph edit", () => {
    const doc = schema.node("doc", null, [
      schema.nodes.paragraph.create(null, [schema.text("hello")]),
      schema.nodes.code_block.create({ language: "mermaid" }, [
        schema.text("graph TD"),
      ]),
    ]);

    const state = EditorState.create({ doc, schema });
    let codePos = -1;
    doc.descendants((node, pos) => {
      if (node.type.name === "code_block") codePos = pos;
    });

    // Insert text in paragraph (before code block)
    const tr = state.tr.insertText(" world", 6);
    const mapped = tr.mapping.map(codePos);

    expect(tr.doc.nodeAt(mapped)?.type.name).toBe("code_block");
  });

  it("detects when change intersects code block", () => {
    const doc = schema.node("doc", null, [
      schema.nodes.paragraph.create(null, [schema.text("hello")]),
      schema.nodes.code_block.create({ language: "latex" }, [
        schema.text("x^2"),
      ]),
    ]);

    const state = EditorState.create({ doc, schema });
    let codePos = -1;
    let codeEnd = -1;
    doc.descendants((node, pos) => {
      if (node.type.name === "code_block") {
        codePos = pos;
        codeEnd = pos + node.nodeSize;
      }
    });

    // Edit inside code block
    const tr = state.tr.insertText("+y", codePos + 2);
    let intersectsCode = false;
    tr.mapping.maps[0].forEach((_oldFrom, _oldTo, newFrom, newTo) => {
      if (newFrom < codeEnd && newTo > codePos) intersectsCode = true;
    });

    expect(intersectsCode).toBe(true);
  });

  it("detects when change does NOT intersect code block", () => {
    const doc = schema.node("doc", null, [
      schema.nodes.paragraph.create(null, [schema.text("hello")]),
      schema.nodes.code_block.create({ language: "latex" }, [
        schema.text("x^2"),
      ]),
    ]);

    const state = EditorState.create({ doc, schema });
    let codePos = -1;
    let codeEnd = -1;
    doc.descendants((node, pos) => {
      if (node.type.name === "code_block") {
        codePos = pos;
        codeEnd = pos + node.nodeSize;
      }
    });

    // Edit in paragraph (before code block)
    const tr = state.tr.insertText(" world", 6);
    const mappedPos = tr.mapping.map(codePos);
    const mappedEnd = tr.mapping.map(codeEnd);
    let intersectsCode = false;
    tr.mapping.maps[0].forEach((_oldFrom, _oldTo, newFrom, newTo) => {
      if (newFrom < mappedEnd && newTo > mappedPos) intersectsCode = true;
    });

    expect(intersectsCode).toBe(false);
  });
});
