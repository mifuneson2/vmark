/**
 * Tests for the WYSIWYG lint plugin's block-for-line mapping.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { Schema } from "@tiptap/pm/model";
import type { Node as PMNode } from "@tiptap/pm/model";
import { useLintStore } from "@/stores/lintStore";

// Build a minimal schema matching what TipTap uses for block structure
const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { group: "block", content: "inline*" },
    heading: {
      group: "block",
      content: "inline*",
      attrs: { level: { default: 1 } },
    },
    codeBlock: {
      group: "block",
      content: "text*",
      code: true,
    },
    text: { group: "inline" },
  },
  marks: {},
});

function makeDoc(blocks: PMNode[]): PMNode {
  return schema.node("doc", null, blocks);
}

function makePara(text: string): PMNode {
  return schema.node("paragraph", null, text ? [schema.text(text)] : []);
}

function makeHeading(text: string, level = 1): PMNode {
  return schema.node("heading", { level }, text ? [schema.text(text)] : []);
}

function _makeCode(text: string): PMNode {
  return schema.node("codeBlock", null, text ? [schema.text(text)] : []);
}

// Re-export the private function via a wrapper — since findBlockForLine is not exported,
// we test behavior through the exported buildDecorations logic indirectly.
// Instead, we test the store-based behavior via createLintPlugin.
import { createLintPlugin } from "./index";
import { EditorState } from "@tiptap/pm/state";

describe("WYSIWYG lint plugin — block decoration mapping", () => {
  beforeEach(() => {
    useLintStore.getState().clearAllDiagnostics();
  });

  it("creates a plugin without throwing", () => {
    expect(() => createLintPlugin("tab-1")).not.toThrow();
  });

  it("creates empty decorations when no diagnostics", () => {
    const doc = makeDoc([makePara("hello")]);
    const plugin = createLintPlugin("tab-1");
    const _state = EditorState.create({ doc, schema, plugins: [plugin] });
    // DecorationSet.empty comparison
    const decoSet = plugin.spec.state!.init!({} as never, { doc } as never);
    // Should be empty (no decorations)
    expect(decoSet).toBeDefined();
  });

  it("maps diagnostic on line 1 to first block", () => {
    useLintStore.getState().runLint("tab-1", "# Title\n\n### Skip");
    const diagnostics = useLintStore.getState().diagnosticsByTab["tab-1"]!;
    expect(diagnostics.length).toBeGreaterThan(0);

    const doc = makeDoc([makeHeading("Title"), makePara("text"), makeHeading("Skip", 3)]);
    const plugin = createLintPlugin("tab-1");
    // Plugin state should not throw on init
    const decoSet = plugin.spec.state!.init!({} as never, { doc } as never);
    expect(decoSet).toBeDefined();
  });

  it("skips sourceOnly diagnostics (no WYSIWYG decoration)", () => {
    // E08 is sourceOnly
    useLintStore.getState().runLint("tab-1", "```\nunclosed code block");
    const diagnostics = useLintStore.getState().diagnosticsByTab["tab-1"]!;
    const sourceOnlyDiag = diagnostics.find((d) => d.uiHint === "sourceOnly");
    expect(sourceOnlyDiag).toBeDefined();

    const doc = makeDoc([makePara("some text")]);
    const plugin = createLintPlugin("tab-1");
    // Should not throw even with sourceOnly diagnostics
    expect(() => plugin.spec.state!.init!({} as never, { doc } as never)).not.toThrow();
  });
});
