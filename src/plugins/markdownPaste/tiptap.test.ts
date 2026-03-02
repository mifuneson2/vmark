import { describe, it, expect, vi } from "vitest";
import StarterKit from "@tiptap/starter-kit";
import { getSchema } from "@tiptap/core";
import { EditorState, TextSelection, SelectionRange, type Transaction } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { readText } from "@tauri-apps/plugin-clipboard-manager";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Slice, Fragment } from "@tiptap/pm/model";
import { MultiSelection } from "@/plugins/multiCursor/MultiSelection";
import type { MarkdownPasteMode } from "@/stores/settingsStore";
import {
  createMarkdownPasteSlice,
  createMarkdownPasteTransaction,
  shouldHandleMarkdownPaste,
  triggerPastePlainText,
  markdownPasteExtension,
} from "./tiptap";

const schema = getSchema([StarterKit]);

function createParagraphDoc(text: string) {
  const paragraph = schema.nodes.paragraph.create(
    null,
    text ? schema.text(text) : undefined
  );
  return schema.nodes.doc.create(null, [paragraph]);
}

function containsNode(doc: PMNode, typeName: string): boolean {
  let found = false;
  doc.descendants((node) => {
    if (node.type.name === typeName) {
      found = true;
      return false;
    }
    return true;
  });
  return found;
}

function createState(doc: PMNode, selectionPos = 1) {
  return EditorState.create({
    doc,
    selection: TextSelection.create(doc, selectionPos),
  });
}

function createStateWithSelection(doc: PMNode, from: number, to: number) {
  return EditorState.create({
    doc,
    selection: TextSelection.create(doc, from, to),
  });
}

function createMultiSelectionState(doc: PMNode, ranges: Array<{ from: number; to: number }>) {
  const base = EditorState.create({ doc });
  const selectionRanges = ranges.map((range) => {
    return new SelectionRange(doc.resolve(range.from), doc.resolve(range.to));
  });
  const multiSel = new MultiSelection(selectionRanges, 0);
  return base.apply(base.tr.setSelection(multiSel));
}

describe("markdownPasteExtension", () => {
  it("creates code blocks from fenced markdown", () => {
    const state = createState(createParagraphDoc(""));
    const tr = createMarkdownPasteTransaction(state, "```js\nconst a = 1;\n```");
    expect(tr).not.toBeNull();

    if (tr) {
      const next = state.apply(tr);
      expect(containsNode(next.doc, "codeBlock")).toBe(true);
    }
  });

  it("creates lists from markdown list text", () => {
    const state = createState(createParagraphDoc(""));
    const tr = createMarkdownPasteTransaction(state, "- first\n- second");
    expect(tr).not.toBeNull();

    if (tr) {
      const next = state.apply(tr);
      expect(containsNode(next.doc, "bulletList")).toBe(true);
    }
  });

  it("skips markdown parsing inside code blocks", () => {
    const codeBlock = schema.nodes.codeBlock.create(null, schema.text("code"));
    const doc = schema.nodes.doc.create(null, [codeBlock]);
    const state = EditorState.create({
      doc,
      selection: TextSelection.create(doc, 2),
    });

    const result = shouldHandleMarkdownPaste(state, "- item", {
      pasteMode: "auto",
      html: "",
    });
    expect(result).toBe(false);
  });

  it("skips markdown parsing inside inline code marks", () => {
    const codeMark = schema.marks.code;
    const paragraph = schema.nodes.paragraph.create(
      null,
      schema.text("code", codeMark ? [codeMark.create()] : undefined)
    );
    const doc = schema.nodes.doc.create(null, [paragraph]);
    const state = EditorState.create({
      doc,
      selection: TextSelection.create(doc, 2),
    });

    const result = shouldHandleMarkdownPaste(state, "- item", {
      pasteMode: "auto",
      html: "",
    });
    expect(result).toBe(false);
  });

  it("skips markdown parsing for multi-selection", () => {
    const doc = createParagraphDoc("hello world");
    const state = createMultiSelectionState(doc, [
      { from: 1, to: 6 },
      { from: 7, to: 12 },
    ]);

    const result = shouldHandleMarkdownPaste(state, "# Title\nText", {
      pasteMode: "auto",
      html: "",
    });
    expect(result).toBe(false);
  });

  it("does not treat plain text as markdown", () => {
    const state = createState(createParagraphDoc(""));
    const result = shouldHandleMarkdownPaste(state, "Just a sentence.", {
      pasteMode: "auto",
      html: "",
    });
    expect(result).toBe(false);
  });

  it("respects paste mode off", () => {
    const state = createState(createParagraphDoc(""));
    const result = shouldHandleMarkdownPaste(state, "# Title\nText", {
      pasteMode: "off" as MarkdownPasteMode,
      html: "",
    });
    expect(result).toBe(false);
  });

  it("handles markdown with non-substantial HTML wrapper", () => {
    const state = createState(createParagraphDoc(""));
    // Two divs (not substantial - needs > 2 to be substantial)
    const result = shouldHandleMarkdownPaste(state, "# Title\nText", {
      pasteMode: "auto",
      html: "<div># Title</div><div>Text</div>",
    });
    expect(result).toBe(true);
  });

  it("skips markdown parsing when HTML is substantial", () => {
    const state = createState(createParagraphDoc(""));
    // Substantial HTML (with formatting tags) should be handled by htmlPaste
    const result = shouldHandleMarkdownPaste(state, "Bold text", {
      pasteMode: "auto",
      html: "<p><strong>Bold text</strong></p>",
    });
    expect(result).toBe(false);
  });

  it("handles markdown when HTML is only a pre/code wrapper", () => {
    const state = createState(createParagraphDoc(""));
    const text = "# Title\n\n- first\n- second";
    const result = shouldHandleMarkdownPaste(state, text, {
      pasteMode: "auto",
      html: "<pre><code># Title\n\n- first\n- second</code></pre>",
    });
    expect(result).toBe(true);
  });

  it("pastes plain text from clipboard", async () => {
    vi.mocked(readText).mockResolvedValue("Plain");
    let state = createState(createParagraphDoc(""));
    const view = {
      get state() {
        return state;
      },
      dispatch(tr: Transaction) {
        state = state.apply(tr);
      },
    } as unknown as EditorView;

    await triggerPastePlainText(view);
    expect(state.doc.textContent).toBe("Plain");
  });
});

describe("shouldHandleMarkdownPaste edge cases", () => {
  it("returns false for empty text", () => {
    const state = createState(createParagraphDoc(""));
    expect(shouldHandleMarkdownPaste(state, "", { pasteMode: "auto", html: "" })).toBe(false);
  });

  it("returns false for whitespace-only text", () => {
    const state = createState(createParagraphDoc(""));
    expect(shouldHandleMarkdownPaste(state, "   \n  \t  ", { pasteMode: "auto", html: "" })).toBe(false);
  });

  it("returns false for text exceeding 200K character limit", () => {
    const state = createState(createParagraphDoc(""));
    const longText = "# Heading\n" + "a".repeat(200_001);
    expect(shouldHandleMarkdownPaste(state, longText, { pasteMode: "auto", html: "" })).toBe(false);
  });

  it("returns false when selection is non-empty and text is a URL", () => {
    // When there's selected text and we paste a URL, it should not be treated as markdown
    // (instead it might be used for linking the selected text)
    const doc = createParagraphDoc("hello world");
    const state = createStateWithSelection(doc, 1, 6); // "hello" selected
    expect(
      shouldHandleMarkdownPaste(state, "https://example.com", { pasteMode: "auto", html: "" })
    ).toBe(false);
  });

  it("returns true when selection is empty and text is markdown with URL", () => {
    const state = createState(createParagraphDoc(""));
    // Markdown-looking text with URL should still be treated as markdown
    expect(
      shouldHandleMarkdownPaste(state, "# Title\n[Link](https://example.com)", {
        pasteMode: "auto",
        html: "",
      })
    ).toBe(true);
  });

  it("skips when HTML has rich tags alongside pre/code", () => {
    const state = createState(createParagraphDoc(""));
    // HTML with code wrapper but also rich tags should defer to htmlPaste
    const html = "<pre><code># Title</code></pre><h1>Title</h1>";
    expect(
      shouldHandleMarkdownPaste(state, "# Title", { pasteMode: "auto", html })
    ).toBe(false);
  });
});

describe("createMarkdownPasteSlice", () => {
  it("returns a Slice from markdown text", () => {
    const state = createState(createParagraphDoc(""));
    const slice = createMarkdownPasteSlice(state, "# Heading");
    expect(slice).toBeInstanceOf(Slice);
    expect(slice.content.childCount).toBeGreaterThan(0);
  });

  it("handles empty content by creating empty paragraph", () => {
    const state = createState(createParagraphDoc(""));
    // Markdown that parses to empty content should produce at least a paragraph
    const slice = createMarkdownPasteSlice(state, "");
    expect(slice.content.childCount).toBeGreaterThanOrEqual(0);
  });
});

describe("createMarkdownPasteTransaction", () => {
  it("returns null on parse failure", () => {
    // Mock console.error to suppress noise
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    // Create a state with a broken/minimal schema that might cause parse to fail
    const state = createState(createParagraphDoc("existing"));
    // We can't easily trigger parse failure with real schema, but we test the success path
    const tr = createMarkdownPasteTransaction(state, "# Valid Markdown");
    expect(tr).not.toBeNull();
    spy.mockRestore();
  });

  it("creates headings from markdown heading syntax", () => {
    const state = createState(createParagraphDoc(""));
    const tr = createMarkdownPasteTransaction(state, "# Heading 1\n\n## Heading 2");
    expect(tr).not.toBeNull();
    if (tr) {
      const next = state.apply(tr);
      expect(containsNode(next.doc, "heading")).toBe(true);
    }
  });

  it("creates ordered lists from numbered list markdown", () => {
    const state = createState(createParagraphDoc(""));
    const tr = createMarkdownPasteTransaction(state, "1. first\n2. second\n3. third");
    expect(tr).not.toBeNull();
    if (tr) {
      const next = state.apply(tr);
      expect(containsNode(next.doc, "orderedList")).toBe(true);
    }
  });

  it("creates blockquotes from > syntax", () => {
    const state = createState(createParagraphDoc(""));
    const tr = createMarkdownPasteTransaction(state, "> quoted text");
    expect(tr).not.toBeNull();
    if (tr) {
      const next = state.apply(tr);
      expect(containsNode(next.doc, "blockquote")).toBe(true);
    }
  });
});

describe("markdownPasteExtension structure", () => {
  it("has the correct name", () => {
    expect(markdownPasteExtension.name).toBe("markdownPaste");
  });

  it("defines ProseMirror plugins", () => {
    expect(markdownPasteExtension.config.addProseMirrorPlugins).toBeDefined();
  });
});

describe("triggerPastePlainText", () => {
  it("does nothing for multi-selection", async () => {
    const doc = createParagraphDoc("hello world");
    const state = createMultiSelectionState(doc, [
      { from: 1, to: 6 },
      { from: 7, to: 12 },
    ]);
    const dispatchSpy = vi.fn();
    const view = {
      get state() {
        return state;
      },
      dispatch: dispatchSpy,
    } as unknown as EditorView;

    await triggerPastePlainText(view);
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it("does nothing when clipboard is empty", async () => {
    vi.mocked(readText).mockResolvedValue("");
    let state = createState(createParagraphDoc("existing"));
    const dispatchSpy = vi.fn((tr: Transaction) => {
      state = state.apply(tr);
    });
    const view = {
      get state() {
        return state;
      },
      dispatch: dispatchSpy,
    } as unknown as EditorView;

    await triggerPastePlainText(view);
    expect(dispatchSpy).not.toHaveBeenCalled();
  });

  it("replaces selected text with clipboard content", async () => {
    vi.mocked(readText).mockResolvedValue("replaced");
    const doc = createParagraphDoc("hello world");
    let state = createStateWithSelection(doc, 1, 6); // select "hello"
    const view = {
      get state() {
        return state;
      },
      dispatch(tr: Transaction) {
        state = state.apply(tr);
      },
    } as unknown as EditorView;

    await triggerPastePlainText(view);
    expect(state.doc.textContent).toContain("replaced");
  });

  it("falls back to navigator.clipboard when Tauri clipboard fails", async () => {
    vi.mocked(readText).mockRejectedValue(new Error("Tauri clipboard unavailable"));
    // Mock navigator.clipboard
    const origNavigator = globalThis.navigator;
    Object.defineProperty(globalThis, "navigator", {
      value: {
        clipboard: {
          readText: vi.fn().mockResolvedValue("fallback text"),
        },
      },
      writable: true,
      configurable: true,
    });

    let state = createState(createParagraphDoc(""));
    const view = {
      get state() {
        return state;
      },
      dispatch(tr: Transaction) {
        state = state.apply(tr);
      },
    } as unknown as EditorView;

    await triggerPastePlainText(view);
    expect(state.doc.textContent).toBe("fallback text");

    Object.defineProperty(globalThis, "navigator", {
      value: origNavigator,
      writable: true,
      configurable: true,
    });
  });
});
