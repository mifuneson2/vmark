/**
 * Tests for useImageDragDrop hook
 *
 * Tests image drag-drop handling: filtering image paths, generating filenames,
 * drag-drop event processing, and insertion into editors.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// --- Mocks ---

let dragDropHandler: ((event: unknown) => Promise<void>) | null = null;

vi.mock("@tauri-apps/api/webview", () => ({
  getCurrentWebview: () => ({
    onDragDropEvent: vi.fn(async (handler: (event: unknown) => Promise<void>) => {
      dragDropHandler = handler;
      return () => {};
    }),
  }),
}));

vi.mock("@tauri-apps/plugin-fs", () => ({
  readFile: vi.fn(() => Promise.resolve(new Uint8Array([0x89, 0x50]))),
}));

const mockMessage = vi.fn();
vi.mock("@tauri-apps/plugin-dialog", () => ({
  message: (...args: unknown[]) => mockMessage(...args),
}));

const mockSaveImageToAssets = vi.fn(() => Promise.resolve("assets/img.png"));
vi.mock("@/hooks/useImageOperations", () => ({
  saveImageToAssets: (...args: unknown[]) => mockSaveImageToAssets(...args),
}));

vi.mock("@/contexts/WindowContext", () => ({
  useWindowLabel: () => "main",
}));

vi.mock("@/stores/tabStore", () => ({
  useTabStore: {
    getState: () => ({
      activeTabId: { main: "tab-1" },
    }),
  },
}));

vi.mock("@/stores/documentStore", () => ({
  useDocumentStore: {
    getState: () => ({
      getDocument: () => ({ filePath: "/docs/test.md" }),
    }),
  },
}));

vi.mock("@/stores/settingsStore", () => ({
  useSettingsStore: {
    getState: () => ({
      image: { copyToAssets: true },
    }),
  },
}));

vi.mock("@/stores/dropZoneStore", () => {
  const reset = vi.fn();
  const setDragging = vi.fn();
  return {
    useDropZoneStore: {
      getState: () => ({ reset, setDragging }),
    },
    __mockReset: reset,
    __mockSetDragging: setDragging,
  };
});

vi.mock("@/utils/safeUnlisten", () => ({
  safeUnlisten: vi.fn(),
}));

vi.mock("@/utils/imagePathDetection", () => ({
  hasImageExtension: (p: string) => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(p),
}));

vi.mock("@/utils/imageUtils", () => ({
  getFilename: (p: string) => p.split("/").pop() || "",
}));

vi.mock("@/utils/markdownUrl", () => ({
  encodeMarkdownUrl: (p: string) => p,
}));

import { useImageDragDrop } from "./useImageDragDrop";
import { useDropZoneStore } from "@/stores/dropZoneStore";

describe("useImageDragDrop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dragDropHandler = null;
  });

  it("registers drag-drop listener when enabled", () => {
    renderHook(() =>
      useImageDragDrop({
        isSourceMode: false,
        enabled: true,
      })
    );
    expect(dragDropHandler).not.toBeNull();
  });

  it("does not register listener when disabled", () => {
    renderHook(() =>
      useImageDragDrop({
        isSourceMode: false,
        enabled: false,
      })
    );
    expect(dragDropHandler).toBeNull();
  });

  it("resets drop zone on leave event", async () => {
    renderHook(() =>
      useImageDragDrop({
        isSourceMode: false,
        enabled: true,
      })
    );

    await dragDropHandler!({ payload: { type: "leave" } });
    expect(useDropZoneStore.getState().reset).toHaveBeenCalled();
  });

  it("sets dragging on enter event", async () => {
    renderHook(() =>
      useImageDragDrop({
        isSourceMode: false,
        enabled: true,
      })
    );

    await dragDropHandler!({ payload: { type: "enter" } });
    expect(useDropZoneStore.getState().setDragging).toHaveBeenCalledWith(true, true, 1);
  });

  it("does nothing on over event", async () => {
    renderHook(() =>
      useImageDragDrop({
        isSourceMode: false,
        enabled: true,
      })
    );

    await dragDropHandler!({ payload: { type: "over" } });
    // Should not reset or setDragging on "over" — just keeps state
    expect(useDropZoneStore.getState().reset).not.toHaveBeenCalled();
  });

  it("resets drop zone on drop event", async () => {
    renderHook(() =>
      useImageDragDrop({
        isSourceMode: false,
        enabled: true,
      })
    );

    await dragDropHandler!({
      payload: { type: "drop", paths: ["/tmp/file.txt"] },
    });

    expect(useDropZoneStore.getState().reset).toHaveBeenCalled();
  });

  it("ignores drop with no image files", async () => {
    renderHook(() =>
      useImageDragDrop({
        isSourceMode: false,
        enabled: true,
      })
    );

    await dragDropHandler!({
      payload: { type: "drop", paths: ["/tmp/file.txt", "/tmp/doc.pdf"] },
    });

    // No image processing should occur
    expect(mockSaveImageToAssets).not.toHaveBeenCalled();
  });

  it("processes image drops and saves to assets in WYSIWYG mode", async () => {
    const mockInsertContent = vi.fn().mockReturnThis();
    const mockFocus = vi.fn(() => ({ insertContent: mockInsertContent, run: vi.fn() }));
    const tiptapEditor = {
      state: {
        schema: {
          nodes: { block_image: {} },
        },
      },
      chain: vi.fn(() => ({
        focus: mockFocus,
      })),
    };

    renderHook(() =>
      useImageDragDrop({
        tiptapEditor: tiptapEditor as never,
        isSourceMode: false,
        enabled: true,
      })
    );

    await dragDropHandler!({
      payload: { type: "drop", paths: ["/tmp/photo.png"] },
    });

    expect(mockSaveImageToAssets).toHaveBeenCalled();
  });

  it("shows warning for unsaved document when copyToAssets is enabled", async () => {
    // Override the document store mock to return null filePath
    const { useDocumentStore } = await import("@/stores/documentStore");
    const origGetState = useDocumentStore.getState;
    useDocumentStore.getState = () => ({
      getDocument: () => ({ filePath: null }),
    }) as never;

    renderHook(() =>
      useImageDragDrop({
        isSourceMode: false,
        enabled: true,
      })
    );

    await dragDropHandler!({
      payload: { type: "drop", paths: ["/tmp/photo.png"] },
    });

    expect(mockMessage).toHaveBeenCalledWith(
      expect.stringContaining("save the document first"),
      expect.objectContaining({ kind: "warning" })
    );

    // Restore
    useDocumentStore.getState = origGetState;
  });

  it("handles drop with null paths gracefully", async () => {
    renderHook(() =>
      useImageDragDrop({
        isSourceMode: false,
        enabled: true,
      })
    );

    await dragDropHandler!({
      payload: { type: "drop", paths: null },
    });

    expect(mockSaveImageToAssets).not.toHaveBeenCalled();
  });

  it("handles drop with empty paths array", async () => {
    renderHook(() =>
      useImageDragDrop({
        isSourceMode: false,
        enabled: true,
      })
    );

    await dragDropHandler!({
      payload: { type: "drop", paths: [] },
    });

    expect(mockSaveImageToAssets).not.toHaveBeenCalled();
  });

  it("inserts markdown in source mode", async () => {
    const mockDispatch = vi.fn();
    const mockFocus = vi.fn();
    const cmView = {
      current: {
        state: { selection: { main: { head: 0 } } },
        dispatch: mockDispatch,
        focus: mockFocus,
      },
    };

    renderHook(() =>
      useImageDragDrop({
        cmViewRef: cmView as never,
        isSourceMode: true,
        enabled: true,
      })
    );

    await dragDropHandler!({
      payload: { type: "drop", paths: ["/tmp/photo.png"] },
    });

    expect(mockSaveImageToAssets).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalled();
    expect(mockFocus).toHaveBeenCalled();
  });

  it("handles image save failure gracefully", async () => {
    mockSaveImageToAssets.mockRejectedValueOnce(new Error("disk full"));

    renderHook(() =>
      useImageDragDrop({
        isSourceMode: false,
        enabled: true,
      })
    );

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await dragDropHandler!({
      payload: { type: "drop", paths: ["/tmp/photo.png"] },
    });

    expect(mockMessage).toHaveBeenCalledWith(
      "Failed to insert dropped image.",
      expect.objectContaining({ kind: "error" })
    );
    errorSpy.mockRestore();
  });
});
