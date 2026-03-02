import { describe, expect, it, vi, beforeEach } from "vitest";
import { EditorState } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import { Editor, getSchema } from "@tiptap/core";
import { codePreviewExtension, clearPreviewCache, refreshPreviews } from "./tiptap";

function createStateWithCodeBlock(language: string, text: string) {
  const schema = getSchema([StarterKit]);
  const extensionContext = {
    name: codePreviewExtension.name,
    options: codePreviewExtension.options,
    storage: codePreviewExtension.storage,
    editor: {} as Editor,
    type: null,
    parent: undefined,
  };
  const plugins = codePreviewExtension.config.addProseMirrorPlugins?.call(extensionContext) ?? [];
  const emptyDoc = schema.nodes.doc.create(null, [schema.nodes.paragraph.create()]);
  const state = EditorState.create({ schema, doc: emptyDoc, plugins });

  const codeBlock = schema.nodes.codeBlock.create({ language }, schema.text(text));
  const nextState = state.apply(
    state.tr.replaceRangeWith(0, state.doc.content.size, codeBlock)
  );

  return { state: nextState, plugins, schema };
}

type DecorationLike = { type?: { attrs?: Record<string, string> } };

function findDecorationsByClass(decorations: DecorationLike[], className: string) {
  return decorations.filter((d) => d.type?.attrs?.class?.includes(className));
}

describe("codePreviewExtension", () => {
  it("adds preview-only class for mermaid code blocks", () => {
    const { state, plugins } = createStateWithCodeBlock("mermaid", "graph TD; A-->B");
    const pluginState = plugins[0].getState(state);
    const matches = findDecorationsByClass(pluginState.decorations.find(), "code-block-preview-only");
    expect(matches.length).toBeGreaterThan(0);
  });

  it("does not add preview-only class for non-preview languages", () => {
    const { state, plugins } = createStateWithCodeBlock("js", "const a = 1;");
    const pluginState = plugins[0].getState(state);
    const matches = findDecorationsByClass(pluginState.decorations.find(), "code-block-preview-only");
    expect(matches.length).toBe(0);
  });

  it("marks preview-only code blocks as non-editable", () => {
    const { state, plugins } = createStateWithCodeBlock("latex", "\\frac{1}{2}");
    const pluginState = plugins[0].getState(state);
    const match = pluginState.decorations.find().find((decoration: DecorationLike) => {
      const attrs = decoration.type?.attrs;
      return attrs?.class?.includes("code-block-preview-only");
    });
    const attrs = match?.type?.attrs ?? {};
    expect(attrs.contenteditable).toBe("false");
  });

  it("adds preview-only class for latex code blocks", () => {
    const { state, plugins } = createStateWithCodeBlock("latex", "E = mc^2");
    const pluginState = plugins[0].getState(state);
    const matches = findDecorationsByClass(pluginState.decorations.find(), "code-block-preview-only");
    expect(matches.length).toBeGreaterThan(0);
  });

  it("adds preview-only class for svg code blocks", () => {
    const { state, plugins } = createStateWithCodeBlock("svg", "<svg></svg>");
    const pluginState = plugins[0].getState(state);
    const matches = findDecorationsByClass(pluginState.decorations.find(), "code-block-preview-only");
    expect(matches.length).toBeGreaterThan(0);
  });

  it("adds preview-only class for markmap code blocks", () => {
    const { state, plugins } = createStateWithCodeBlock("markmap", "# Heading");
    const pluginState = plugins[0].getState(state);
    const matches = findDecorationsByClass(pluginState.decorations.find(), "code-block-preview-only");
    expect(matches.length).toBeGreaterThan(0);
  });

  it("adds preview-only class for $$math$$ sentinel language", () => {
    const { state, plugins } = createStateWithCodeBlock("$$math$$", "\\sum_{i=1}^n");
    const pluginState = plugins[0].getState(state);
    const matches = findDecorationsByClass(pluginState.decorations.find(), "code-block-preview-only");
    expect(matches.length).toBeGreaterThan(0);
  });

  it("sets data-language attribute on preview-only blocks", () => {
    const { state, plugins } = createStateWithCodeBlock("mermaid", "graph TD");
    const pluginState = plugins[0].getState(state);
    const match = pluginState.decorations.find().find((d: DecorationLike) =>
      d.type?.attrs?.class?.includes("code-block-preview-only")
    );
    expect(match?.type?.attrs?.["data-language"]).toBe("mermaid");
  });

  it("does not add decorations for python code blocks", () => {
    const { state, plugins } = createStateWithCodeBlock("python", "print('hello')");
    const pluginState = plugins[0].getState(state);
    const allDecorations = pluginState.decorations.find();
    expect(allDecorations.length).toBe(0);
  });

  it("does not add decorations for empty non-preview language code blocks", () => {
    const { state, plugins } = createStateWithCodeBlock("rust", "fn main() {}");
    const pluginState = plugins[0].getState(state);
    expect(pluginState.decorations.find().length).toBe(0);
  });

  it("creates placeholder for whitespace-only preview content", () => {
    const { state, plugins } = createStateWithCodeBlock("mermaid", "   ");
    const pluginState = plugins[0].getState(state);
    // Should have preview-only class but with a placeholder widget
    const allDecorations = pluginState.decorations.find();
    expect(allDecorations.length).toBeGreaterThan(0);
  });

  it("initializes with editingPos null", () => {
    const { state, plugins } = createStateWithCodeBlock("latex", "x^2");
    const pluginState = plugins[0].getState(state);
    expect(pluginState.editingPos).toBeNull();
  });
});

describe("clearPreviewCache", () => {
  it("does not throw when called", () => {
    expect(() => clearPreviewCache()).not.toThrow();
  });

  it("can be called multiple times", () => {
    clearPreviewCache();
    clearPreviewCache();
    // No error means success
  });
});

describe("refreshPreviews", () => {
  it("does not throw when no editor view is set", () => {
    // currentEditorView is null by default in test context
    expect(() => refreshPreviews()).not.toThrow();
  });
});
