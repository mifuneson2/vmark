import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Schema } from "@tiptap/pm/model";
import { EditorState, TextSelection } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";

// --- Mocks ---

let mockLinkPopupIsOpen = false;
const mockLinkPopupOpen = vi.fn();

let mockLinkCreatePopupIsOpen = false;
const mockLinkCreatePopupOpen = vi.fn();

let mockWikiLinkPopupIsOpen = false;
const mockWikiLinkPopupOpen = vi.fn();

let mockHeadingPickerIsOpen = false;

vi.mock("@/stores/linkPopupStore", () => ({
  useLinkPopupStore: {
    getState: () => ({
      get isOpen() { return mockLinkPopupIsOpen; },
      openPopup: mockLinkPopupOpen,
    }),
  },
}));

vi.mock("@/stores/linkCreatePopupStore", () => ({
  useLinkCreatePopupStore: {
    getState: () => ({
      get isOpen() { return mockLinkCreatePopupIsOpen; },
      openPopup: mockLinkCreatePopupOpen,
    }),
  },
}));

vi.mock("@/stores/wikiLinkPopupStore", () => ({
  useWikiLinkPopupStore: {
    getState: () => ({
      get isOpen() { return mockWikiLinkPopupIsOpen; },
      openPopup: mockWikiLinkPopupOpen,
    }),
  },
}));

vi.mock("@/stores/headingPickerStore", () => ({
  useHeadingPickerStore: {
    getState: () => ({
      get isOpen() { return mockHeadingPickerIsOpen; },
    }),
  },
}));

const mockFindMarkRange = vi.fn(() => null);
const mockFindWordAtCursor = vi.fn(() => null);
vi.mock("@/plugins/syntaxReveal/marks", () => ({
  findMarkRange: (...args: unknown[]) => mockFindMarkRange(...args),
  findWordAtCursor: (...args: unknown[]) => mockFindWordAtCursor(...args),
}));

const mockReadClipboardUrl = vi.fn(() => Promise.resolve(null));
vi.mock("@/utils/clipboardUrl", () => ({
  readClipboardUrl: () => mockReadClipboardUrl(),
}));

vi.mock("@/utils/debug", () => ({
  wikiLinkPopupWarn: vi.fn(),
}));

const mockExpandedToggleMark = vi.fn(() => true);
vi.mock("@/plugins/editorPlugins/expandedToggleMark", () => ({
  expandedToggleMark: (...args: unknown[]) => mockExpandedToggleMark(...args),
}));

const {
  handleSmartLinkShortcut,
  handleUnlinkShortcut,
  handleWikiLinkShortcut,
} = await import("./linkCommands");

// --- Schema ---

const schema = new Schema({
  nodes: {
    doc: { content: "block+", toDOM: () => ["div", 0] },
    paragraph: {
      group: "block",
      content: "inline*",
      toDOM: () => ["p", 0],
    },
    wikiLink: {
      group: "inline",
      inline: true,
      atom: true,
      attrs: { value: { default: "" } },
      content: "text*",
      toDOM: () => ["span", { class: "wiki-link" }, 0],
    },
    text: { group: "inline", inline: true },
  },
  marks: {
    link: {
      attrs: { href: { default: "" } },
      toDOM: (mark) => ["a", { href: mark.attrs.href }, 0],
      parseDOM: [{ tag: "a[href]" }],
    },
  },
});

const mockCoords = { top: 100, bottom: 120, left: 200, right: 300 };

function createView(text: string, from: number, to?: number): EditorView {
  const doc = schema.node("doc", null, [
    schema.node("paragraph", null, text ? [schema.text(text)] : []),
  ]);
  let state = EditorState.create({ doc, schema });
  state = state.apply(
    state.tr.setSelection(
      TextSelection.create(state.doc, from, to ?? from)
    )
  );
  const container = document.createElement("div");
  const view = new EditorView(container, { state });
  view.coordsAtPos = vi.fn(() => mockCoords);
  return view;
}

function createViewWithLink(
  before: string,
  linkText: string,
  href: string,
  after: string,
  cursorInLink: boolean
): EditorView {
  const linkMark = schema.marks.link.create({ href });
  const nodes = [
    ...(before ? [schema.text(before)] : []),
    schema.text(linkText, [linkMark]),
    ...(after ? [schema.text(after)] : []),
  ];
  const doc = schema.node("doc", null, [
    schema.node("paragraph", null, nodes),
  ]);
  let state = EditorState.create({ doc, schema });

  const cursorPos = cursorInLink
    ? 1 + before.length + 1 // inside the link text
    : 1; // at the start
  state = state.apply(
    state.tr.setSelection(TextSelection.create(state.doc, cursorPos))
  );
  const container = document.createElement("div");
  const view = new EditorView(container, { state });
  view.coordsAtPos = vi.fn(() => mockCoords);
  return view;
}

describe("handleSmartLinkShortcut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLinkPopupIsOpen = false;
    mockLinkCreatePopupIsOpen = false;
    mockWikiLinkPopupIsOpen = false;
    mockHeadingPickerIsOpen = false;
    mockFindMarkRange.mockReturnValue(null);
    mockFindWordAtCursor.mockReturnValue(null);
    mockReadClipboardUrl.mockResolvedValue(null);
  });

  it("returns true (blocks) when link popup is already open", () => {
    mockLinkPopupIsOpen = true;
    const view = createView("hello", 2);
    const result = handleSmartLinkShortcut(view);
    expect(result).toBe(true);
    // Should not open anything new
    expect(mockLinkCreatePopupOpen).not.toHaveBeenCalled();
    view.destroy();
  });

  it("returns true (blocks) when link create popup is already open", () => {
    mockLinkCreatePopupIsOpen = true;
    const view = createView("hello", 2);
    expect(handleSmartLinkShortcut(view)).toBe(true);
    view.destroy();
  });

  it("returns true (blocks) when wiki link popup is already open", () => {
    mockWikiLinkPopupIsOpen = true;
    const view = createView("hello", 2);
    expect(handleSmartLinkShortcut(view)).toBe(true);
    view.destroy();
  });

  it("returns true (blocks) when heading picker is already open", () => {
    mockHeadingPickerIsOpen = true;
    const view = createView("hello", 2);
    expect(handleSmartLinkShortcut(view)).toBe(true);
    view.destroy();
  });

  it("opens create popup with showTextInput=true for no selection, no word, no clipboard URL", async () => {
    const view = createView("hello", 3);
    const result = handleSmartLinkShortcut(view);
    expect(result).toBe(true);

    await vi.waitFor(() => {
      expect(mockLinkCreatePopupOpen).toHaveBeenCalled();
    });

    expect(mockLinkCreatePopupOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "",
        showTextInput: true,
      })
    );
    view.destroy();
  });

  it("applies link directly when selection + clipboard URL", async () => {
    mockReadClipboardUrl.mockResolvedValue("https://example.com");
    const view = createView("hello world", 1, 6); // "hello" selected

    handleSmartLinkShortcut(view);

    await vi.waitFor(() => {
      const hasMark = view.state.doc.rangeHasMark(
        1,
        6,
        schema.marks.link
      );
      expect(hasMark).toBe(true);
    });
    view.destroy();
  });

  it("opens create popup when selection + no clipboard URL", async () => {
    mockReadClipboardUrl.mockResolvedValue(null);
    const view = createView("hello world", 1, 6);

    handleSmartLinkShortcut(view);

    await vi.waitFor(() => {
      expect(mockLinkCreatePopupOpen).toHaveBeenCalledWith(
        expect.objectContaining({
          text: "hello",
          showTextInput: false,
        })
      );
    });
    view.destroy();
  });

  it("applies link to word when no selection + word + clipboard URL", async () => {
    mockReadClipboardUrl.mockResolvedValue("https://test.org");
    mockFindWordAtCursor.mockReturnValue({ from: 1, to: 6 });

    const view = createView("hello world", 3);
    handleSmartLinkShortcut(view);

    await vi.waitFor(() => {
      const hasMark = view.state.doc.rangeHasMark(
        1,
        6,
        schema.marks.link
      );
      expect(hasMark).toBe(true);
    });
    view.destroy();
  });

  it("opens create popup for word when no selection + word + no clipboard URL", async () => {
    mockReadClipboardUrl.mockResolvedValue(null);
    mockFindWordAtCursor.mockReturnValue({ from: 1, to: 6 });

    const view = createView("hello world", 3);
    handleSmartLinkShortcut(view);

    await vi.waitFor(() => {
      expect(mockLinkCreatePopupOpen).toHaveBeenCalledWith(
        expect.objectContaining({
          text: "hello",
          showTextInput: false,
        })
      );
    });
    view.destroy();
  });

  it("inserts URL as linked text when no selection + no word + clipboard URL", async () => {
    mockReadClipboardUrl.mockResolvedValue("https://inserted.com");

    const view = createView("a b", 3);
    handleSmartLinkShortcut(view);

    await vi.waitFor(() => {
      expect(view.state.doc.textContent).toContain("https://inserted.com");
    });
    view.destroy();
  });

  it("opens existing link popup when cursor is inside a link mark", () => {
    const view = createViewWithLink("", "click here", "https://foo.com", "", true);
    mockFindMarkRange.mockReturnValue({ from: 1, to: 11 });

    handleSmartLinkShortcut(view);

    expect(mockLinkPopupOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        href: "https://foo.com",
        linkFrom: 1,
        linkTo: 11,
      })
    );
    view.destroy();
  });
});

describe("handleUnlinkShortcut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMarkRange.mockReturnValue(null);
  });

  it("returns false when schema has no link mark", () => {
    const noLinkSchema = new Schema({
      nodes: {
        doc: { content: "paragraph+", toDOM: () => ["div", 0] },
        paragraph: { content: "text*", toDOM: () => ["p", 0] },
        text: { inline: true },
      },
    });
    const doc = noLinkSchema.node("doc", null, [
      noLinkSchema.node("paragraph", null, [noLinkSchema.text("hello")]),
    ]);
    const state = EditorState.create({ doc, schema: noLinkSchema });
    const container = document.createElement("div");
    const view = new EditorView(container, { state });

    expect(handleUnlinkShortcut(view)).toBe(false);
    view.destroy();
  });

  it("returns false when cursor is not in a link", () => {
    const view = createView("hello world", 3);
    expect(handleUnlinkShortcut(view)).toBe(false);
    view.destroy();
  });

  it("removes link mark from text when cursor is in a link", () => {
    const view = createViewWithLink("", "linked text", "https://x.com", " after", true);
    mockFindMarkRange.mockReturnValue({ from: 1, to: 12 });

    const result = handleUnlinkShortcut(view);
    expect(result).toBe(true);

    // Link mark should be removed
    const hasMark = view.state.doc.rangeHasMark(1, 12, schema.marks.link);
    expect(hasMark).toBe(false);
    // Text should remain
    expect(view.state.doc.textContent).toContain("linked text");
    view.destroy();
  });

  it("returns false when findMarkRange returns null", () => {
    const view = createViewWithLink("", "linked", "https://y.com", "", true);
    mockFindMarkRange.mockReturnValue(null);
    expect(handleUnlinkShortcut(view)).toBe(false);
    view.destroy();
  });
});

describe("handleWikiLinkShortcut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns false when schema has no wikiLink node type", () => {
    const noWikiSchema = new Schema({
      nodes: {
        doc: { content: "paragraph+", toDOM: () => ["div", 0] },
        paragraph: { content: "text*", toDOM: () => ["p", 0] },
        text: { inline: true },
      },
    });
    const doc = noWikiSchema.node("doc", null, [
      noWikiSchema.node("paragraph", null, [noWikiSchema.text("hello")]),
    ]);
    const state = EditorState.create({ doc, schema: noWikiSchema });
    const container = document.createElement("div");
    const view = new EditorView(container, { state });

    expect(handleWikiLinkShortcut(view)).toBe(false);
    view.destroy();
  });

  it("inserts wikiLink node with default 'page' target when no selection", () => {
    const view = createView("hello", 3);
    const result = handleWikiLinkShortcut(view);
    expect(result).toBe(true);

    let foundWikiLink = false;
    view.state.doc.descendants((node) => {
      if (node.type.name === "wikiLink") {
        expect(node.attrs.value).toBe("page");
        foundWikiLink = true;
      }
    });
    expect(foundWikiLink).toBe(true);
    view.destroy();
  });

  it("inserts wikiLink with selected text as target", () => {
    const view = createView("hello world", 1, 6); // "hello" selected
    const result = handleWikiLinkShortcut(view);
    expect(result).toBe(true);

    let foundWikiLink = false;
    view.state.doc.descendants((node) => {
      if (node.type.name === "wikiLink") {
        expect(node.attrs.value).toBe("hello");
        foundWikiLink = true;
      }
    });
    expect(foundWikiLink).toBe(true);
    view.destroy();
  });

  it("replaces selection with wikiLink node", () => {
    const view = createView("hello world", 1, 6);
    handleWikiLinkShortcut(view);

    // Doc structure changed -- wikiLink node present
    let hasWikiLink = false;
    view.state.doc.descendants((node) => {
      if (node.type.name === "wikiLink") hasWikiLink = true;
    });
    expect(hasWikiLink).toBe(true);
    view.destroy();
  });
});
