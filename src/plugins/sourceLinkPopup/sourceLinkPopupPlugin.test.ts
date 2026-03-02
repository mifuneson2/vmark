/**
 * Tests for sourceLinkPopupPlugin — link detection, data extraction,
 * CmdClick handler, and plugin factory.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

// Mock dependencies
vi.mock("@/plugins/sourcePopup", () => ({
  createSourcePopupPlugin: vi.fn((config) => {
    (createSourcePopupPlugin as ReturnType<typeof vi.fn>).__lastConfig = config;
    return { extension: {} };
  }),
}));

vi.mock("@/stores/linkPopupStore", () => ({
  useLinkPopupStore: {
    getState: () => ({ isOpen: false, anchorRect: null }),
    subscribe: vi.fn(() => () => {}),
  },
}));

vi.mock("./SourceLinkPopupView", () => ({
  SourceLinkPopupView: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
  })),
}));

vi.mock("@/utils/markdownLinkPatterns", () => ({
  findMarkdownLinkAtPosition: vi.fn(),
}));

vi.mock("@/plugins/toolbarActions/sourceAdapterLinks", () => ({
  extractMarkdownHeadings: vi.fn(() => []),
}));

vi.mock("@tauri-apps/plugin-opener", () => ({
  openUrl: vi.fn(() => Promise.resolve()),
}));

import { createSourcePopupPlugin } from "@/plugins/sourcePopup";
import { createSourceLinkPopupPlugin } from "./sourceLinkPopupPlugin";
import { findMarkdownLinkAtPosition } from "@/utils/markdownLinkPatterns";

// Helper to create a CM6 view
function createView(doc: string, cursorPos?: number): EditorView {
  const parent = document.createElement("div");
  const pos = cursorPos ?? 0;
  const state = EditorState.create({
    doc,
    selection: { anchor: pos },
  });
  return new EditorView({ state, parent });
}

describe("createSourceLinkPopupPlugin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an array extension (CmdClick + popup plugin)", () => {
    const result = createSourceLinkPopupPlugin();

    // Should be an array with 2 elements: CmdClick plugin + popup plugin
    expect(Array.isArray(result)).toBe(true);
    expect((result as unknown[]).length).toBe(2);
  });

  it("calls createSourcePopupPlugin with correct config", () => {
    createSourceLinkPopupPlugin();

    expect(createSourcePopupPlugin).toHaveBeenCalledTimes(1);
    const config = (createSourcePopupPlugin as ReturnType<typeof vi.fn>).mock.calls[0][0];

    expect(config.triggerOnClick).toBe(true);
    expect(config.triggerOnHover).toBe(false);
    expect(typeof config.detectTrigger).toBe("function");
    expect(typeof config.detectTriggerAtPos).toBe("function");
    expect(typeof config.extractData).toBe("function");
  });
});

describe("detectLinkTrigger (via plugin config)", () => {
  let detectTrigger: (view: EditorView) => { from: number; to: number } | null;

  beforeEach(() => {
    vi.clearAllMocks();
    createSourceLinkPopupPlugin();
    const config = (createSourcePopupPlugin as ReturnType<typeof vi.fn>).mock.calls[0][0];
    detectTrigger = config.detectTrigger;
  });

  it("detects markdown link [text](url)", () => {
    const doc = "Click [here](https://example.com) now";
    const view = createView(doc, 10);
    vi.mocked(findMarkdownLinkAtPosition).mockReturnValue({
      from: 6,
      to: 33,
      text: "here",
      url: "https://example.com",
      fullMatch: "[here](https://example.com)",
    });

    const result = detectTrigger(view);

    expect(result).toEqual({ from: 6, to: 33 });
  });

  it("returns null when cursor is not on a link", () => {
    const view = createView("Some plain text", 5);
    vi.mocked(findMarkdownLinkAtPosition).mockReturnValue(null);

    const result = detectTrigger(view);

    expect(result).toBeNull();
  });

  it("returns null when there is a selection", () => {
    const parent = document.createElement("div");
    const state = EditorState.create({
      doc: "[text](url)",
      selection: { anchor: 2, head: 8 },
    });
    const view = new EditorView({ state, parent });

    const result = detectTrigger(view);

    expect(result).toBeNull();
    view.destroy();
  });

  it("returns null when pos is beyond match.to", () => {
    const doc = "[link](url) after";
    const view = createView(doc, 15);
    vi.mocked(findMarkdownLinkAtPosition).mockReturnValue({
      from: 0,
      to: 11,
      text: "link",
      url: "url",
      fullMatch: "[link](url)",
    });

    const result = detectTrigger(view);

    // pos 15 > match.to 11, so should return null
    expect(result).toBeNull();
  });
});

describe("detectTriggerAtPos (via plugin config)", () => {
  let detectTriggerAtPos: (view: EditorView, pos: number) => { from: number; to: number } | null;

  beforeEach(() => {
    vi.clearAllMocks();
    createSourceLinkPopupPlugin();
    const config = (createSourcePopupPlugin as ReturnType<typeof vi.fn>).mock.calls[0][0];
    detectTriggerAtPos = config.detectTriggerAtPos;
  });

  it("detects link at arbitrary position", () => {
    const view = createView("[link](url) text", 0);
    vi.mocked(findMarkdownLinkAtPosition).mockReturnValue({
      from: 0,
      to: 11,
      text: "link",
      url: "url",
      fullMatch: "[link](url)",
    });

    const result = detectTriggerAtPos(view, 5);

    expect(result).toEqual({ from: 0, to: 11 });
  });

  it("returns null when no link at position", () => {
    const view = createView("No links here", 0);
    vi.mocked(findMarkdownLinkAtPosition).mockReturnValue(null);

    const result = detectTriggerAtPos(view, 5);

    expect(result).toBeNull();
  });
});

describe("extractLinkData (via plugin config)", () => {
  let extractData: (
    view: EditorView,
    range: { from: number; to: number }
  ) => { href: string; linkFrom: number; linkTo: number };

  beforeEach(() => {
    vi.clearAllMocks();
    createSourceLinkPopupPlugin();
    const config = (createSourcePopupPlugin as ReturnType<typeof vi.fn>).mock.calls[0][0];
    extractData = config.extractData;
  });

  it("extracts link href and range", () => {
    const doc = "[click me](https://example.com)";
    const view = createView(doc, 5);
    vi.mocked(findMarkdownLinkAtPosition).mockReturnValue({
      from: 0,
      to: 31,
      text: "click me",
      url: "https://example.com",
      fullMatch: "[click me](https://example.com)",
    });

    const result = extractData(view, { from: 0, to: 31 });

    expect(result.href).toBe("https://example.com");
    expect(result.linkFrom).toBe(0);
    expect(result.linkTo).toBe(31);
  });

  it("returns defaults when no link found at range", () => {
    const doc = "No link";
    const view = createView(doc, 0);
    vi.mocked(findMarkdownLinkAtPosition).mockReturnValue(null);

    const result = extractData(view, { from: 2, to: 5 });

    expect(result.href).toBe("");
    expect(result.linkFrom).toBe(2);
    expect(result.linkTo).toBe(5);
  });
});
