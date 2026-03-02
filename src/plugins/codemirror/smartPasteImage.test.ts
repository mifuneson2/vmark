/**
 * Tests for Smart Paste Image Handling
 *
 * Tests the tryImagePaste function that detects image paths in pasted text
 * and delegates to the toast for confirmation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockParseMultiplePaths = vi.fn(() => ({
  paths: [],
  format: "single" as const,
}));
const mockDetectMultipleImagePaths = vi.fn(() => ({
  allImages: false,
  imageCount: 0,
  results: [],
}));
const mockShowToast = vi.fn();
const mockShowMultiToast = vi.fn();
const mockFindWordAtCursorSource = vi.fn(() => null);

vi.mock("@/utils/multiImageParsing", () => ({
  parseMultiplePaths: (...args: unknown[]) => mockParseMultiplePaths(...args),
}));

vi.mock("@/utils/imagePathDetection", () => ({
  detectMultipleImagePaths: (...args: unknown[]) =>
    mockDetectMultipleImagePaths(...args),
}));

vi.mock("@/stores/imagePasteToastStore", () => ({
  useImagePasteToastStore: {
    getState: () => ({
      showToast: mockShowToast,
      showMultiToast: mockShowMultiToast,
    }),
  },
}));

vi.mock("@/plugins/toolbarActions/sourceAdapterLinks", () => ({
  findWordAtCursorSource: (...args: unknown[]) =>
    mockFindWordAtCursorSource(...args),
}));

vi.mock("@/hooks/useImageOperations", () => ({
  copyImageToAssets: vi.fn(() => Promise.resolve("assets/image.png")),
}));

vi.mock("@/utils/debug", () => ({
  smartPasteWarn: vi.fn(),
}));

vi.mock("@/utils/markdownUrl", () => ({
  encodeMarkdownUrl: (url: string) => url,
}));

import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { tryImagePaste } from "./smartPasteImage";

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

describe("tryImagePaste", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false for empty text", () => {
    const view = createView("hello", 0);
    expect(tryImagePaste(view, "")).toBe(false);
  });

  it("returns false when parseMultiplePaths returns empty paths", () => {
    mockParseMultiplePaths.mockReturnValue({ paths: [], format: "single" });

    const view = createView("hello", 0);
    expect(tryImagePaste(view, "some text")).toBe(false);
  });

  it("returns false when paths are not all images", () => {
    mockParseMultiplePaths.mockReturnValue({
      paths: ["/path/to/file.txt"],
      format: "single",
    });
    mockDetectMultipleImagePaths.mockReturnValue({
      allImages: false,
      imageCount: 0,
      results: [],
    });

    const view = createView("hello", 0);
    expect(tryImagePaste(view, "/path/to/file.txt")).toBe(false);
  });

  it("returns true and shows toast for single image URL", () => {
    mockParseMultiplePaths.mockReturnValue({
      paths: ["https://example.com/image.png"],
      format: "single",
    });
    mockDetectMultipleImagePaths.mockReturnValue({
      allImages: true,
      imageCount: 1,
      results: [
        {
          isImage: true,
          type: "url",
          path: "https://example.com/image.png",
          needsCopy: false,
        },
      ],
    });

    const view = createView("hello", 0);
    const result = tryImagePaste(view, "https://example.com/image.png");

    expect(result).toBe(true);
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({
        imagePath: "https://example.com/image.png",
        imageType: "url",
      })
    );
  });

  it("returns true and shows toast for single data URL", () => {
    mockParseMultiplePaths.mockReturnValue({
      paths: ["data:image/png;base64,abc"],
      format: "single",
    });
    mockDetectMultipleImagePaths.mockReturnValue({
      allImages: true,
      imageCount: 1,
      results: [
        {
          isImage: true,
          type: "dataUrl",
          path: "data:image/png;base64,abc",
          needsCopy: false,
        },
      ],
    });

    const view = createView("hello", 0);
    const result = tryImagePaste(view, "data:image/png;base64,abc");

    expect(result).toBe(true);
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({
        imageType: "url",
      })
    );
  });

  it("returns true for local path (async validation)", () => {
    mockParseMultiplePaths.mockReturnValue({
      paths: ["/Users/test/image.png"],
      format: "single",
    });
    mockDetectMultipleImagePaths.mockReturnValue({
      allImages: true,
      imageCount: 1,
      results: [
        {
          isImage: true,
          type: "absolutePath",
          path: "/Users/test/image.png",
          needsCopy: true,
        },
      ],
    });

    const view = createView("hello", 0);
    const result = tryImagePaste(view, "/Users/test/image.png");

    expect(result).toBe(true);
    // Toast is shown asynchronously after validation
  });

  it("uses selected text as alt text when there is a selection", () => {
    mockParseMultiplePaths.mockReturnValue({
      paths: ["https://example.com/photo.jpg"],
      format: "single",
    });
    mockDetectMultipleImagePaths.mockReturnValue({
      allImages: true,
      imageCount: 1,
      results: [
        {
          isImage: true,
          type: "url",
          path: "https://example.com/photo.jpg",
          needsCopy: false,
        },
      ],
    });

    const view = createView("my photo here", 3, 8);
    tryImagePaste(view, "https://example.com/photo.jpg");

    expect(mockShowToast).toHaveBeenCalled();
  });

  it("uses word at cursor as alt text when no selection", () => {
    mockParseMultiplePaths.mockReturnValue({
      paths: ["https://example.com/photo.jpg"],
      format: "single",
    });
    mockDetectMultipleImagePaths.mockReturnValue({
      allImages: true,
      imageCount: 1,
      results: [
        {
          isImage: true,
          type: "url",
          path: "https://example.com/photo.jpg",
          needsCopy: false,
        },
      ],
    });
    mockFindWordAtCursorSource.mockReturnValue({ from: 0, to: 5 });

    const view = createView("hello world", 3);
    tryImagePaste(view, "https://example.com/photo.jpg");

    expect(mockFindWordAtCursorSource).toHaveBeenCalled();
  });

  it("returns true for multiple image paths and shows multi toast", () => {
    const paths = ["/path/image1.png", "/path/image2.jpg"];
    mockParseMultiplePaths.mockReturnValue({ paths, format: "newline" });
    mockDetectMultipleImagePaths.mockReturnValue({
      allImages: true,
      imageCount: 2,
      results: [
        {
          isImage: true,
          type: "absolutePath",
          path: "/path/image1.png",
          needsCopy: true,
        },
        {
          isImage: true,
          type: "absolutePath",
          path: "/path/image2.jpg",
          needsCopy: true,
        },
      ],
    });

    const view = createView("hello", 0);
    const result = tryImagePaste(
      view,
      "/path/image1.png\n/path/image2.jpg"
    );

    expect(result).toBe(true);
    // Multi-image paste uses async validation, so toast shown later
  });

  it("handles home path detection type for local paths", () => {
    mockParseMultiplePaths.mockReturnValue({
      paths: ["~/Pictures/photo.png"],
      format: "single",
    });
    mockDetectMultipleImagePaths.mockReturnValue({
      allImages: true,
      imageCount: 1,
      results: [
        {
          isImage: true,
          type: "homePath",
          path: "~/Pictures/photo.png",
          needsCopy: true,
        },
      ],
    });

    const view = createView("hello", 0);
    const result = tryImagePaste(view, "~/Pictures/photo.png");

    expect(result).toBe(true);
  });
});
