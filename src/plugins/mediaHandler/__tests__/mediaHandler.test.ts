/**
 * Tests for mediaHandler — media type detection, handleDrop, handlePaste, and extension structure.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { hasVideoExtension, hasAudioExtension, getMediaType } from "@/utils/mediaPathDetection";
import { mediaHandlerExtension } from "../tiptap";
import type { EditorView } from "@tiptap/pm/view";

// Mock external dependencies
vi.mock("@/hooks/useMediaOperations", () => ({
  copyMediaToAssets: vi.fn(() => Promise.resolve("./assets/media.mp4")),
  saveMediaToAssets: vi.fn(() => Promise.resolve("./assets/media.mp4")),
  insertBlockVideoNode: vi.fn(),
  insertBlockAudioNode: vi.fn(),
}));

vi.mock("@/hooks/useWindowFocus", () => ({
  getWindowLabel: vi.fn(() => "main"),
}));

vi.mock("@/stores/documentStore", () => ({
  useDocumentStore: {
    getState: vi.fn(() => ({
      getDocument: vi.fn(() => ({ filePath: "/test/doc.md" })),
    })),
  },
}));

vi.mock("@/stores/tabStore", () => ({
  useTabStore: {
    getState: vi.fn(() => ({
      activeTabId: { main: "tab-1" },
    })),
  },
}));

describe("mediaHandlerExtension", () => {
  it("has the correct name", () => {
    expect(mediaHandlerExtension.name).toBe("mediaHandler");
  });

  it("has lower priority than default (90)", () => {
    expect(mediaHandlerExtension.options).toBeDefined();
    // Priority is set at extension level
    expect(mediaHandlerExtension.config.priority).toBe(90);
  });

  it("is an Extension type", () => {
    expect(mediaHandlerExtension.type).toBe("extension");
  });

  it("defines ProseMirror plugins", () => {
    expect(mediaHandlerExtension.config.addProseMirrorPlugins).toBeDefined();
  });
});

describe("mediaHandler handleDrop behavior", () => {
  let mockView: EditorView;

  beforeEach(() => {
    mockView = {
      state: {
        doc: { nodeSize: 10 },
        selection: { from: 0, to: 0 },
      },
      dispatch: vi.fn(),
    } as unknown as EditorView;
  });

  it("returns false when no files are dropped", () => {
    // The handleDrop function checks for dataTransfer.files
    // We test via the plugin props indirectly
    const plugins = mediaHandlerExtension.config.addProseMirrorPlugins!.call({
      name: "mediaHandler",
      options: {},
      storage: {},
      parent: null as never,
      editor: {} as never,
      type: "extension" as never,
    });
    expect(plugins).toHaveLength(1);
    expect(plugins[0].props.handleDrop).toBeDefined();
    expect(plugins[0].props.handlePaste).toBeDefined();
  });

  it("handleDrop returns false for empty file list", () => {
    const plugins = mediaHandlerExtension.config.addProseMirrorPlugins!.call({
      name: "mediaHandler",
      options: {},
      storage: {},
      parent: null as never,
      editor: {} as never,
      type: "extension" as never,
    });
    const handleDrop = plugins[0].props.handleDrop!;
    const event = {
      dataTransfer: { files: [] },
    } as unknown as DragEvent;
    expect(handleDrop(mockView, event, null as never, false)).toBe(false);
  });

  it("handleDrop returns false for non-media files", () => {
    const plugins = mediaHandlerExtension.config.addProseMirrorPlugins!.call({
      name: "mediaHandler",
      options: {},
      storage: {},
      parent: null as never,
      editor: {} as never,
      type: "extension" as never,
    });
    const handleDrop = plugins[0].props.handleDrop!;
    const event = {
      dataTransfer: {
        files: [new File(["content"], "readme.txt", { type: "text/plain" })],
      },
      preventDefault: vi.fn(),
    } as unknown as DragEvent;
    expect(handleDrop(mockView, event, null as never, false)).toBe(false);
  });

  it("handleDrop returns true for video files", () => {
    const plugins = mediaHandlerExtension.config.addProseMirrorPlugins!.call({
      name: "mediaHandler",
      options: {},
      storage: {},
      parent: null as never,
      editor: {} as never,
      type: "extension" as never,
    });
    const handleDrop = plugins[0].props.handleDrop!;
    const event = {
      dataTransfer: {
        files: [new File(["video"], "clip.mp4", { type: "video/mp4" })],
      },
      preventDefault: vi.fn(),
    } as unknown as DragEvent;
    expect(handleDrop(mockView, event, null as never, false)).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("handleDrop returns true for audio files", () => {
    const plugins = mediaHandlerExtension.config.addProseMirrorPlugins!.call({
      name: "mediaHandler",
      options: {},
      storage: {},
      parent: null as never,
      editor: {} as never,
      type: "extension" as never,
    });
    const handleDrop = plugins[0].props.handleDrop!;
    const event = {
      dataTransfer: {
        files: [new File(["audio"], "song.mp3", { type: "audio/mpeg" })],
      },
      preventDefault: vi.fn(),
    } as unknown as DragEvent;
    expect(handleDrop(mockView, event, null as never, false)).toBe(true);
  });

  it("handleDrop returns false when no dataTransfer", () => {
    const plugins = mediaHandlerExtension.config.addProseMirrorPlugins!.call({
      name: "mediaHandler",
      options: {},
      storage: {},
      parent: null as never,
      editor: {} as never,
      type: "extension" as never,
    });
    const handleDrop = plugins[0].props.handleDrop!;
    const event = {} as unknown as DragEvent;
    expect(handleDrop(mockView, event, null as never, false)).toBe(false);
  });
});

describe("mediaHandler handlePaste behavior", () => {
  let mockView: EditorView;

  beforeEach(() => {
    mockView = {
      state: {
        doc: { nodeSize: 10 },
        selection: { from: 0, to: 0 },
      },
      dispatch: vi.fn(),
    } as unknown as EditorView;
  });

  it("returns false for non-media text", () => {
    const plugins = mediaHandlerExtension.config.addProseMirrorPlugins!.call({
      name: "mediaHandler",
      options: {},
      storage: {},
      parent: null as never,
      editor: {} as never,
      type: "extension" as never,
    });
    const handlePaste = plugins[0].props.handlePaste!;
    const event = {
      clipboardData: {
        getData: vi.fn((type: string) => (type === "text/plain" ? "just some text" : "")),
      },
    } as unknown as ClipboardEvent;
    expect(handlePaste(mockView, event, null as never)).toBe(false);
  });

  it("returns false when no text in clipboard", () => {
    const plugins = mediaHandlerExtension.config.addProseMirrorPlugins!.call({
      name: "mediaHandler",
      options: {},
      storage: {},
      parent: null as never,
      editor: {} as never,
      type: "extension" as never,
    });
    const handlePaste = plugins[0].props.handlePaste!;
    const event = {
      clipboardData: {
        getData: vi.fn(() => ""),
      },
    } as unknown as ClipboardEvent;
    expect(handlePaste(mockView, event, null as never)).toBe(false);
  });

  it("returns true for video file path", () => {
    const plugins = mediaHandlerExtension.config.addProseMirrorPlugins!.call({
      name: "mediaHandler",
      options: {},
      storage: {},
      parent: null as never,
      editor: {} as never,
      type: "extension" as never,
    });
    const handlePaste = plugins[0].props.handlePaste!;
    const event = {
      clipboardData: {
        getData: vi.fn((type: string) => (type === "text/plain" ? "/path/to/video.mp4" : "")),
      },
      preventDefault: vi.fn(),
    } as unknown as ClipboardEvent;
    expect(handlePaste(mockView, event, null as never)).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("returns true for audio file path", () => {
    const plugins = mediaHandlerExtension.config.addProseMirrorPlugins!.call({
      name: "mediaHandler",
      options: {},
      storage: {},
      parent: null as never,
      editor: {} as never,
      type: "extension" as never,
    });
    const handlePaste = plugins[0].props.handlePaste!;
    const event = {
      clipboardData: {
        getData: vi.fn((type: string) => (type === "text/plain" ? "/path/to/audio.mp3" : "")),
      },
      preventDefault: vi.fn(),
    } as unknown as ClipboardEvent;
    expect(handlePaste(mockView, event, null as never)).toBe(true);
  });

  it("returns false for multiline text even with media extension", () => {
    const plugins = mediaHandlerExtension.config.addProseMirrorPlugins!.call({
      name: "mediaHandler",
      options: {},
      storage: {},
      parent: null as never,
      editor: {} as never,
      type: "extension" as never,
    });
    const handlePaste = plugins[0].props.handlePaste!;
    const event = {
      clipboardData: {
        getData: vi.fn((type: string) =>
          type === "text/plain" ? "line1.mp4\nline2.mp4" : ""
        ),
      },
    } as unknown as ClipboardEvent;
    expect(handlePaste(mockView, event, null as never)).toBe(false);
  });

  it("handles external URL for video", () => {
    const plugins = mediaHandlerExtension.config.addProseMirrorPlugins!.call({
      name: "mediaHandler",
      options: {},
      storage: {},
      parent: null as never,
      editor: {} as never,
      type: "extension" as never,
    });
    const handlePaste = plugins[0].props.handlePaste!;
    const event = {
      clipboardData: {
        getData: vi.fn((type: string) =>
          type === "text/plain" ? "https://example.com/video.mp4" : ""
        ),
      },
      preventDefault: vi.fn(),
    } as unknown as ClipboardEvent;
    expect(handlePaste(mockView, event, null as never)).toBe(true);
  });

  it("returns false for whitespace-only text", () => {
    const plugins = mediaHandlerExtension.config.addProseMirrorPlugins!.call({
      name: "mediaHandler",
      options: {},
      storage: {},
      parent: null as never,
      editor: {} as never,
      type: "extension" as never,
    });
    const handlePaste = plugins[0].props.handlePaste!;
    const event = {
      clipboardData: {
        getData: vi.fn((type: string) => (type === "text/plain" ? "   \t  " : "")),
      },
    } as unknown as ClipboardEvent;
    expect(handlePaste(mockView, event, null as never)).toBe(false);
  });

  it("handles Windows-style local path for video", () => {
    const plugins = mediaHandlerExtension.config.addProseMirrorPlugins!.call({
      name: "mediaHandler",
      options: {},
      storage: {},
      parent: null as never,
      editor: {} as never,
      type: "extension" as never,
    });
    const handlePaste = plugins[0].props.handlePaste!;
    const event = {
      clipboardData: {
        getData: vi.fn((type: string) =>
          type === "text/plain" ? "C:\\Users\\video.mp4" : ""
        ),
      },
      preventDefault: vi.fn(),
    } as unknown as ClipboardEvent;
    expect(handlePaste(mockView, event, null as never)).toBe(true);
  });

  it("handles relative path for audio", () => {
    const plugins = mediaHandlerExtension.config.addProseMirrorPlugins!.call({
      name: "mediaHandler",
      options: {},
      storage: {},
      parent: null as never,
      editor: {} as never,
      type: "extension" as never,
    });
    const handlePaste = plugins[0].props.handlePaste!;
    const event = {
      clipboardData: {
        getData: vi.fn((type: string) =>
          type === "text/plain" ? "./assets/song.mp3" : ""
        ),
      },
      preventDefault: vi.fn(),
    } as unknown as ClipboardEvent;
    expect(handlePaste(mockView, event, null as never)).toBe(true);
  });
});

describe("media type detection via mediaPathDetection", () => {
  describe("hasVideoExtension", () => {
    it.each([
      ["video.mp4", true],
      ["video.webm", true],
      ["video.mov", true],
      ["video.avi", true],
      ["video.mkv", true],
      ["video.m4v", true],
      ["video.ogv", true],
      ["video.MP4", true],
      ["audio.mp3", false],
      ["image.png", false],
      ["file.txt", false],
      ["", false],
    ])("hasVideoExtension(%s) => %s", (path, expected) => {
      expect(hasVideoExtension(path)).toBe(expected);
    });

    it("handles paths with query params", () => {
      expect(hasVideoExtension("video.mp4?t=123")).toBe(true);
    });

    it("handles paths with hash", () => {
      expect(hasVideoExtension("video.webm#section")).toBe(true);
    });

    it("handles full URLs", () => {
      expect(hasVideoExtension("https://example.com/video.mp4")).toBe(true);
    });
  });

  describe("hasAudioExtension", () => {
    it.each([
      ["audio.mp3", true],
      ["audio.m4a", true],
      ["audio.ogg", true],
      ["audio.wav", true],
      ["audio.flac", true],
      ["audio.aac", true],
      ["audio.opus", true],
      ["audio.MP3", true],
      ["video.mp4", false],
      ["image.png", false],
      ["", false],
    ])("hasAudioExtension(%s) => %s", (path, expected) => {
      expect(hasAudioExtension(path)).toBe(expected);
    });
  });

  describe("getMediaType", () => {
    it.each([
      ["video.mp4", "video"],
      ["audio.mp3", "audio"],
      ["image.png", "image"],
      ["image.jpg", "image"],
      ["image.svg", "image"],
      ["file.txt", null],
      ["", null],
      ["noext", null],
    ])("getMediaType(%s) => %s", (path, expected) => {
      expect(getMediaType(path)).toBe(expected);
    });

    it("handles edge case of dot-only filename", () => {
      expect(getMediaType("file.")).toBeNull();
    });

    it("handles hidden files", () => {
      expect(getMediaType(".gitignore")).toBeNull();
    });
  });
});
