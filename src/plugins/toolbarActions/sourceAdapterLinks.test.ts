import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/plugins/sourcePopup/sourcePopupUtils", () => ({
  getAnchorRectFromRange: vi.fn(() => ({ top: 0, bottom: 20, left: 0, right: 100 })),
}));

vi.mock("@/stores/headingPickerStore", () => ({
  useHeadingPickerStore: { getState: vi.fn(() => ({ openPicker: vi.fn() })) },
}));

vi.mock("@/stores/linkPopupStore", () => ({
  useLinkPopupStore: { getState: vi.fn(() => ({ openPopup: vi.fn() })) },
}));

vi.mock("@/stores/linkCreatePopupStore", () => ({
  useLinkCreatePopupStore: { getState: vi.fn(() => ({ isOpen: false, openPopup: vi.fn() })) },
}));

vi.mock("@/utils/popupPosition", () => ({
  getBoundaryRects: vi.fn(() => ({ top: 0, left: 0, width: 800, height: 600 })),
  getViewportBounds: vi.fn(() => ({ top: 0, left: 0, width: 800, height: 600 })),
}));

vi.mock("@/utils/clipboardUrl", () => ({
  readClipboardUrl: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@/utils/wordSegmentation", () => ({
  findWordBoundaries: vi.fn((text: string, offset: number) => {
    const wordRegex = /\w+/g;
    let match;
    while ((match = wordRegex.exec(text)) !== null) {
      if (offset >= match.index && offset <= match.index + match[0].length) {
        return { start: match.index, end: match.index + match[0].length };
      }
    }
    return null;
  }),
}));

import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import {
  findWordAtCursorSource,
  insertWikiSyntax,
  extractMarkdownHeadings,
  insertSourceBookmarkLink,
  insertLink,
} from "./sourceAdapterLinks";
import { readClipboardUrl } from "@/utils/clipboardUrl";
import { useLinkPopupStore } from "@/stores/linkPopupStore";
import { useLinkCreatePopupStore } from "@/stores/linkCreatePopupStore";
import { useHeadingPickerStore } from "@/stores/headingPickerStore";

function createView(doc: string, from: number, to?: number): EditorView {
  const parent = document.createElement("div");
  const state = EditorState.create({
    doc,
    selection: EditorSelection.single(from, to ?? from),
  });
  return new EditorView({ state, parent });
}

describe("findWordAtCursorSource", () => {
  it("returns word boundaries when cursor is inside a word", () => {
    const view = createView("hello world", 2);
    const result = findWordAtCursorSource(view, 2);
    expect(result).toEqual({ from: 0, to: 5 });
    view.destroy();
  });

  it("returns null when cursor is in whitespace", () => {
    const view = createView("hello  world", 6);
    const result = findWordAtCursorSource(view, 6);
    expect(result).toBeNull();
    view.destroy();
  });

  it("handles cursor at start of document", () => {
    const view = createView("hello", 0);
    const result = findWordAtCursorSource(view, 0);
    expect(result).toEqual({ from: 0, to: 5 });
    view.destroy();
  });

  it("handles cursor at end of word", () => {
    const view = createView("hello world", 5);
    const result = findWordAtCursorSource(view, 5);
    expect(result).toEqual({ from: 0, to: 5 });
    view.destroy();
  });

  it("returns null for empty document", () => {
    const view = createView("", 0);
    const result = findWordAtCursorSource(view, 0);
    expect(result).toBeNull();
    view.destroy();
  });

  it("finds word on second line", () => {
    const view = createView("line one\nline two", 10);
    const result = findWordAtCursorSource(view, 10);
    expect(result).toEqual({ from: 9, to: 13 });
    view.destroy();
  });
});

describe("insertWikiSyntax", () => {
  it("inserts wiki link with default value when no selection", () => {
    const view = createView("some text", 5);
    const result = insertWikiSyntax(view, "[[", "]]", "page");
    expect(result).toBe(true);
    expect(view.state.doc.toString()).toBe("some [[page]]text");
    view.destroy();
  });

  it("wraps selected text in wiki syntax", () => {
    const view = createView("my page name here", 3, 12);
    const result = insertWikiSyntax(view, "[[", "]]", "default");
    expect(result).toBe(true);
    expect(view.state.doc.toString()).toBe("my [[page name]] here");
    view.destroy();
  });

  it("inserts embed syntax with ![[...]]", () => {
    const view = createView("text", 4);
    const result = insertWikiSyntax(view, "![[", "]]", "file.png");
    expect(result).toBe(true);
    expect(view.state.doc.toString()).toBe("text![[file.png]]");
    view.destroy();
  });

  it("places cursor after the value before suffix", () => {
    const view = createView("", 0);
    insertWikiSyntax(view, "[[", "]]", "test");
    expect(view.state.selection.main.head).toBe(6);
    view.destroy();
  });

  it("handles empty selection at start of document", () => {
    const view = createView("hello", 0);
    insertWikiSyntax(view, "[[", "]]", "link");
    expect(view.state.doc.toString()).toBe("[[link]]hello");
    view.destroy();
  });

  it("handles empty selection at end of document", () => {
    const view = createView("hello", 5);
    insertWikiSyntax(view, "[[", "]]", "link");
    expect(view.state.doc.toString()).toBe("hello[[link]]");
    view.destroy();
  });
});

describe("extractMarkdownHeadings", () => {
  it("extracts headings with correct levels", () => {
    const text = "# Title\n## Subtitle\n### Section";
    const headings = extractMarkdownHeadings(text);
    expect(headings).toHaveLength(3);
    expect(headings[0]).toMatchObject({ level: 1, text: "Title" });
    expect(headings[1]).toMatchObject({ level: 2, text: "Subtitle" });
    expect(headings[2]).toMatchObject({ level: 3, text: "Section" });
  });

  it("generates unique slugs for duplicate headings", () => {
    const text = "# Hello\n## Hello\n### Hello";
    const headings = extractMarkdownHeadings(text);
    expect(headings[0].id).toBe("hello");
    expect(headings[1].id).toBe("hello-1");
    expect(headings[2].id).toBe("hello-2");
  });

  it("returns empty array for text without headings", () => {
    const text = "Just some paragraph text.\nNo headings here.";
    const headings = extractMarkdownHeadings(text);
    expect(headings).toHaveLength(0);
  });

  it("handles heading with special characters", () => {
    const text = "# Hello World!";
    const headings = extractMarkdownHeadings(text);
    expect(headings).toHaveLength(1);
    expect(headings[0].id).toBe("hello-world");
  });

  it("handles all six heading levels", () => {
    const text = "# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6";
    const headings = extractMarkdownHeadings(text);
    expect(headings).toHaveLength(6);
    for (let i = 0; i < 6; i++) {
      expect(headings[i].level).toBe(i + 1);
    }
  });

  it("records heading position in document", () => {
    const text = "# First\n\n# Second";
    const headings = extractMarkdownHeadings(text);
    expect(headings[0].pos).toBe(0);
    expect(headings[1].pos).toBe(9);
  });

  it("handles empty text", () => {
    const headings = extractMarkdownHeadings("");
    expect(headings).toHaveLength(0);
  });
});

describe("insertSourceBookmarkLink", () => {
  it("returns false when document has no headings", () => {
    const view = createView("No headings here", 0);
    const result = insertSourceBookmarkLink(view);
    expect(result).toBe(false);
    view.destroy();
  });

  it("returns true and opens picker when headings exist", () => {
    const view = createView("# Title\nSome text", 10);
    vi.spyOn(view, "coordsAtPos").mockReturnValue({
      top: 10,
      bottom: 30,
      left: 50,
      right: 60,
    });

    const openPicker = vi.fn();
    vi.mocked(useHeadingPickerStore.getState).mockReturnValue({ openPicker } as never);

    const result = insertSourceBookmarkLink(view);
    expect(result).toBe(true);
    expect(openPicker).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ text: "Title" })]),
      expect.any(Function),
      expect.any(Object),
    );
    view.destroy();
  });
});

describe("insertLink", () => {
  beforeEach(() => {
    vi.mocked(readClipboardUrl).mockResolvedValue(null);
    vi.mocked(useLinkCreatePopupStore.getState).mockReturnValue({
      isOpen: false,
      openPopup: vi.fn(),
    } as never);
  });

  it("returns true when create popup is already open", async () => {
    vi.mocked(useLinkCreatePopupStore.getState).mockReturnValue({
      isOpen: true,
      openPopup: vi.fn(),
    } as never);

    const view = createView("hello", 0);
    const result = await insertLink(view);
    expect(result).toBe(true);
    expect(view.state.doc.toString()).toBe("hello");
    view.destroy();
  });

  it("opens link popup when cursor is inside an existing link", async () => {
    const view = createView("[text](https://example.com)", 3);
    const openPopup = vi.fn();
    vi.mocked(useLinkPopupStore.getState).mockReturnValue({ openPopup } as never);

    const result = await insertLink(view);
    expect(result).toBe(true);
    expect(openPopup).toHaveBeenCalled();
    view.destroy();
  });

  it("wraps selection with clipboard URL when available", async () => {
    vi.mocked(readClipboardUrl).mockResolvedValue("https://example.com");
    const view = createView("click here for info", 6, 10);

    await insertLink(view);
    expect(view.state.doc.toString()).toBe("click [here](https://example.com) for info");
    view.destroy();
  });

  it("opens create popup when selection exists but no clipboard URL", async () => {
    const openPopup = vi.fn();
    vi.mocked(useLinkCreatePopupStore.getState).mockReturnValue({
      isOpen: false,
      openPopup,
    } as never);

    const view = createView("some text here", 5, 9);
    await insertLink(view);
    expect(openPopup).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "text",
        showTextInput: false,
      }),
    );
    view.destroy();
  });

  it("inserts empty link with clipboard URL when no selection and no word", async () => {
    vi.mocked(readClipboardUrl).mockResolvedValue("https://test.com");
    const view = createView("   ", 1);

    await insertLink(view);
    expect(view.state.doc.toString()).toContain("[](https://test.com)");
    expect(view.state.selection.main.head).toBe(2);
    view.destroy();
  });

  it("does not insert link inside image syntax", async () => {
    const view = createView("![alt](image.png)", 3);
    const result = await insertLink(view);
    expect(result).toBe(true);
    expect(view.state.doc.toString()).toBe("![alt](image.png)");
    view.destroy();
  });

  it("wraps word at cursor with clipboard URL when no selection", async () => {
    vi.mocked(readClipboardUrl).mockResolvedValue("https://example.com");
    const view = createView("click hello world", 8);

    await insertLink(view);
    expect(view.state.doc.toString()).toBe("click [hello](https://example.com) world");
    view.destroy();
  });

  it("opens create popup with text+URL inputs when no selection, no word, no URL", async () => {
    const openPopup = vi.fn();
    vi.mocked(useLinkCreatePopupStore.getState).mockReturnValue({
      isOpen: false,
      openPopup,
    } as never);

    const view = createView("   ", 1);
    await insertLink(view);
    expect(openPopup).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "",
        showTextInput: true,
      }),
    );
    view.destroy();
  });
});
