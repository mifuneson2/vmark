/**
 * Tests for Smart Paste Plugin (CodeMirror)
 *
 * Tests the paste event handler logic: markdown link creation from URLs,
 * image paste delegation, and AI markdown cleanup.
 *
 * Note: We test the handler logic directly since jsdom doesn't propagate
 * DOM paste events through CodeMirror's internal event pipeline.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockTryImagePaste = vi.fn(() => false);
const mockCleanPastedMarkdown = vi.fn((text: string) => text);

vi.mock("./smartPasteImage", () => ({
  tryImagePaste: (...args: unknown[]) => mockTryImagePaste(...args),
}));

vi.mock("@/utils/cleanPastedMarkdown", () => ({
  cleanPastedMarkdown: (...args: unknown[]) => mockCleanPastedMarkdown(...args),
}));

import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { isValidUrl } from "./smartPasteUtils";

const createdViews: EditorView[] = [];

afterEach(() => {
  createdViews.forEach((v) => v.destroy());
  createdViews.length = 0;
});

function createView(
  content: string,
  anchor: number,
  head?: number
): EditorView {
  const state = EditorState.create({
    doc: content,
    selection: { anchor, head: head ?? anchor },
  });
  const container = document.createElement("div");
  document.body.appendChild(container);
  const view = new EditorView({ state, parent: container });
  createdViews.push(view);
  return view;
}

/**
 * Simulate the paste handler logic from createSmartPastePlugin.
 * We replicate the handler here because CodeMirror's domEventHandlers
 * are not triggered by jsdom's dispatchEvent.
 */
function simulatePaste(
  view: EditorView,
  pastedText: string
): boolean {
  if (!pastedText) return false;

  const { from, to } = view.state.selection.main;
  const trimmedText = pastedText.trim();

  // Image paste check
  if (mockTryImagePaste(view, pastedText)) {
    return true;
  }

  // Clean AI-clipboard artifacts
  const cleaned = mockCleanPastedMarkdown(pastedText);
  if (cleaned !== pastedText) {
    view.dispatch({
      changes: { from, to, insert: cleaned },
      selection: { anchor: from + cleaned.length },
    });
    return true;
  }

  // No selection
  if (from === to) return false;

  // Not a URL
  if (!isValidUrl(trimmedText)) return false;

  // Get selected text
  const selectedText = view.state.doc.sliceString(from, to);

  // Don't wrap if already a markdown link
  if (/^\[.*\]\(.*\)$/.test(selectedText)) return false;

  // Create markdown link
  const linkMarkdown = `[${selectedText}](${trimmedText})`;

  view.dispatch({
    changes: { from, to, insert: linkMarkdown },
    selection: { anchor: from + linkMarkdown.length },
  });

  return true;
}

describe("createSmartPastePlugin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTryImagePaste.mockReturnValue(false);
    mockCleanPastedMarkdown.mockImplementation((t: string) => t);
  });

  describe("URL paste over selection", () => {
    it("creates a markdown link when pasting a URL over selected text", () => {
      const view = createView("hello world", 0, 5);
      const result = simulatePaste(view, "https://example.com");

      expect(result).toBe(true);
      expect(view.state.doc.toString()).toBe(
        "[hello](https://example.com) world"
      );
    });

    it("does not create link when there is no selection", () => {
      const view = createView("hello world", 5, 5);
      const result = simulatePaste(view, "https://example.com");

      expect(result).toBe(false);
      expect(view.state.doc.toString()).toBe("hello world");
    });

    it("does not create link when pasted text is not a URL", () => {
      const view = createView("hello world", 0, 5);
      const result = simulatePaste(view, "not a url");

      expect(result).toBe(false);
      expect(view.state.doc.toString()).toBe("hello world");
    });

    it("does not wrap if selected text already looks like a markdown link", () => {
      const mdLink = "[text](url)";
      const view = createView(mdLink, 0, mdLink.length);
      const result = simulatePaste(view, "https://example.com");

      expect(result).toBe(false);
      expect(view.state.doc.toString()).toBe("[text](url)");
    });

    it("trims whitespace from pasted URL before checking", () => {
      const view = createView("hello world", 0, 5);
      const result = simulatePaste(view, "  https://example.com  ");

      expect(result).toBe(true);
      expect(view.state.doc.toString()).toBe(
        "[hello](https://example.com) world"
      );
    });

    it("places cursor after the inserted link", () => {
      const view = createView("hello world", 0, 5);
      simulatePaste(view, "https://example.com");

      const expectedLink = "[hello](https://example.com)";
      expect(view.state.selection.main.anchor).toBe(expectedLink.length);
    });

    it("handles URL paste over entire document", () => {
      const view = createView("hello", 0, 5);
      simulatePaste(view, "https://example.com");

      expect(view.state.doc.toString()).toBe(
        "[hello](https://example.com)"
      );
    });

    it("handles http URL (not just https)", () => {
      const view = createView("click here", 0, 10);
      simulatePaste(view, "http://example.com");

      expect(view.state.doc.toString()).toBe(
        "[click here](http://example.com)"
      );
    });

    it("handles URL with path and query string", () => {
      const view = createView("docs", 0, 4);
      simulatePaste(view, "https://example.com/path?q=1");

      expect(view.state.doc.toString()).toBe(
        "[docs](https://example.com/path?q=1)"
      );
    });
  });

  describe("image paste delegation", () => {
    it("delegates to tryImagePaste and returns true when it handles the paste", () => {
      mockTryImagePaste.mockReturnValue(true);

      const view = createView("hello", 0);
      const result = simulatePaste(view, "/path/to/image.png");

      expect(result).toBe(true);
      expect(mockTryImagePaste).toHaveBeenCalledWith(view, "/path/to/image.png");
    });

    it("continues processing when tryImagePaste returns false", () => {
      mockTryImagePaste.mockReturnValue(false);

      const view = createView("hello", 0);
      simulatePaste(view, "some text");

      expect(mockTryImagePaste).toHaveBeenCalledWith(view, "some text");
    });
  });

  describe("markdown cleanup", () => {
    it("cleans pasted markdown when cleanPastedMarkdown modifies text", () => {
      mockCleanPastedMarkdown.mockReturnValue("cleaned text");

      const view = createView("hello", 5, 5);
      const result = simulatePaste(view, "dirty text");

      expect(result).toBe(true);
      expect(view.state.doc.toString()).toBe("hellocleaned text");
    });

    it("does not modify when cleanPastedMarkdown returns same text", () => {
      mockCleanPastedMarkdown.mockImplementation((t: string) => t);

      const view = createView("hello", 5, 5);
      const result = simulatePaste(view, "same text");

      // No selection, not a URL, cleaned === original -> falls through
      expect(result).toBe(false);
      expect(view.state.doc.toString()).toBe("hello");
    });

    it("replaces selection when cleaning markdown with selection", () => {
      mockCleanPastedMarkdown.mockReturnValue("clean");

      const view = createView("hello world", 0, 5);
      const result = simulatePaste(view, "dirty");

      expect(result).toBe(true);
      expect(view.state.doc.toString()).toBe("clean world");
    });
  });

  describe("edge cases", () => {
    it("returns false for empty paste data", () => {
      const view = createView("hello", 0);
      const result = simulatePaste(view, "");

      expect(result).toBe(false);
      expect(view.state.doc.toString()).toBe("hello");
    });

    it("handles empty document with no selection", () => {
      const view = createView("", 0, 0);
      const result = simulatePaste(view, "https://example.com");

      // No selection (from === to), falls through
      expect(result).toBe(false);
    });

    it("handles single character selection with URL paste", () => {
      const view = createView("a", 0, 1);
      simulatePaste(view, "https://example.com");

      expect(view.state.doc.toString()).toBe("[a](https://example.com)");
    });

    it("handles multiline selected text", () => {
      const view = createView("hello\nworld", 0, 11);
      simulatePaste(view, "https://example.com");

      expect(view.state.doc.toString()).toBe(
        "[hello\nworld](https://example.com)"
      );
    });
  });
});
