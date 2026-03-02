/**
 * Tests for useImageContextMenu hook
 *
 * Tests the image context menu action handling: change, delete, copyPath, revealInFinder.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// --- Mocks (must be before imports) ---

const mockOpen = vi.fn();
const mockMessage = vi.fn();
vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: (...args: unknown[]) => mockOpen(...args),
  message: (...args: unknown[]) => mockMessage(...args),
}));

const mockRevealItemInDir = vi.fn();
vi.mock("@tauri-apps/plugin-opener", () => ({
  revealItemInDir: (...args: unknown[]) => mockRevealItemInDir(...args),
}));

vi.mock("@tauri-apps/api/path", () => ({
  dirname: vi.fn((p: string) => Promise.resolve(p.split("/").slice(0, -1).join("/") || "/")),
  join: vi.fn((...parts: string[]) => Promise.resolve(parts.join("/"))),
}));

const mockToastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: { success: (...args: unknown[]) => mockToastSuccess(...args) },
}));

const mockCopyImageToAssets = vi.fn();
vi.mock("@/hooks/useImageOperations", () => ({
  copyImageToAssets: (...args: unknown[]) => mockCopyImageToAssets(...args),
}));

vi.mock("@/hooks/useDocumentState", () => ({
  useDocumentFilePath: vi.fn(() => "/docs/test.md"),
}));

vi.mock("@/utils/debug", () => ({
  imageContextMenuWarn: vi.fn(),
}));

import { useImageContextMenu } from "./useImageContextMenu";
import { useImageContextMenuStore } from "@/stores/imageContextMenuStore";
import { useDocumentFilePath } from "@/hooks/useDocumentState";

// --- Helpers ---

function makeEditorView(overrides: Record<string, unknown> = {}) {
  const imageNode = {
    type: { name: "image" },
    attrs: { src: "old.png", alt: "" },
    nodeSize: 1,
  };
  return {
    state: {
      doc: {
        nodeAt: vi.fn(() => imageNode),
      },
      tr: {
        setNodeMarkup: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
      },
    },
    dispatch: vi.fn(),
    ...overrides,
  };
}

describe("useImageContextMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore mock return value after clearAllMocks
    vi.mocked(useDocumentFilePath).mockReturnValue("/docs/test.md");
    useImageContextMenuStore.setState({
      isOpen: true,
      position: { x: 100, y: 100 },
      imageSrc: "assets/photo.png",
      imageNodePos: 5,
    });
    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve()),
      },
    });
  });

  it("returns a handleAction function", () => {
    const view = makeEditorView();
    const getView = () => view as never;
    const { result } = renderHook(() => useImageContextMenu(getView));
    expect(typeof result.current).toBe("function");
  });

  it("does nothing when no editor view is available", async () => {
    const getView = () => null;
    const { result } = renderHook(() => useImageContextMenu(getView));

    await act(async () => {
      await result.current("delete");
    });

    // No dispatch should happen
    expect(mockOpen).not.toHaveBeenCalled();
  });

  // --- Delete action ---

  describe("delete action", () => {
    it("deletes the image node at the stored position", async () => {
      const view = makeEditorView();
      const getView = () => view as never;
      const { result } = renderHook(() => useImageContextMenu(getView));

      await act(async () => {
        await result.current("delete");
      });

      expect(view.state.doc.nodeAt).toHaveBeenCalledWith(5);
      expect(view.state.tr.delete).toHaveBeenCalledWith(5, 6); // pos + nodeSize(1)
      expect(view.dispatch).toHaveBeenCalled();
    });

    it("does nothing if no image node at position", async () => {
      const view = makeEditorView();
      view.state.doc.nodeAt = vi.fn(() => null);
      const getView = () => view as never;
      const { result } = renderHook(() => useImageContextMenu(getView));

      await act(async () => {
        await result.current("delete");
      });

      expect(view.dispatch).not.toHaveBeenCalled();
    });

    it("does nothing if node at position is not an image", async () => {
      const view = makeEditorView();
      view.state.doc.nodeAt = vi.fn(() => ({
        type: { name: "paragraph" },
        attrs: {},
        nodeSize: 1,
      }));
      const getView = () => view as never;
      const { result } = renderHook(() => useImageContextMenu(getView));

      await act(async () => {
        await result.current("delete");
      });

      expect(view.dispatch).not.toHaveBeenCalled();
    });
  });

  // --- Change action ---

  describe("change action", () => {
    it("opens a file dialog and updates the image src", async () => {
      mockOpen.mockResolvedValue("/new/image.png");
      mockCopyImageToAssets.mockResolvedValue("assets/image.png");

      const view = makeEditorView();
      const getView = () => view as never;
      const { result } = renderHook(() => useImageContextMenu(getView));

      await act(async () => {
        await result.current("change");
      });

      expect(mockOpen).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.arrayContaining([
            expect.objectContaining({ name: "Images" }),
          ]),
        })
      );
      expect(mockCopyImageToAssets).toHaveBeenCalledWith("/new/image.png", "/docs/test.md");
      expect(view.state.tr.setNodeMarkup).toHaveBeenCalled();
      expect(view.dispatch).toHaveBeenCalled();
    });

    it("does nothing when dialog is cancelled", async () => {
      mockOpen.mockResolvedValue(null);
      const view = makeEditorView();
      const getView = () => view as never;
      const { result } = renderHook(() => useImageContextMenu(getView));

      await act(async () => {
        await result.current("change");
      });

      expect(mockCopyImageToAssets).not.toHaveBeenCalled();
      expect(view.dispatch).not.toHaveBeenCalled();
    });

    it("shows warning when document is unsaved", async () => {
      mockOpen.mockResolvedValue("/new/image.png");
      vi.mocked(useDocumentFilePath).mockReturnValue(null);

      const view = makeEditorView();
      const getView = () => view as never;
      const { result } = renderHook(() => useImageContextMenu(getView));

      await act(async () => {
        await result.current("change");
      });

      expect(mockMessage).toHaveBeenCalledWith(
        "Please save the document first to change images.",
        expect.objectContaining({ kind: "warning" })
      );
    });

    it("shows error on failure", async () => {
      mockOpen.mockResolvedValue("/new/image.png");
      mockCopyImageToAssets.mockRejectedValue(new Error("copy failed"));

      const view = makeEditorView();
      const getView = () => view as never;
      const { result } = renderHook(() => useImageContextMenu(getView));

      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      await act(async () => {
        await result.current("change");
      });

      expect(mockMessage).toHaveBeenCalledWith(
        "Failed to change image.",
        expect.objectContaining({ kind: "error" })
      );
      errorSpy.mockRestore();
    });
  });

  // --- CopyPath action ---

  describe("copyPath action", () => {
    it("copies absolute path to clipboard for relative src", async () => {
      const view = makeEditorView();
      const getView = () => view as never;
      const { result } = renderHook(() => useImageContextMenu(getView));

      await act(async () => {
        await result.current("copyPath");
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(mockToastSuccess).toHaveBeenCalledWith("Image path copied to clipboard");
    });

    it("shows warning when document is unsaved", async () => {
      vi.mocked(useDocumentFilePath).mockReturnValue(null);
      const view = makeEditorView();
      const getView = () => view as never;
      const { result } = renderHook(() => useImageContextMenu(getView));

      await act(async () => {
        await result.current("copyPath");
      });

      expect(mockMessage).toHaveBeenCalledWith(
        "Document must be saved to copy image path.",
        expect.objectContaining({ kind: "warning" })
      );
    });

    it("copies absolute URL as-is", async () => {
      useImageContextMenuStore.setState({ imageSrc: "https://example.com/img.png" });
      const view = makeEditorView();
      const getView = () => view as never;
      const { result } = renderHook(() => useImageContextMenu(getView));

      await act(async () => {
        await result.current("copyPath");
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("https://example.com/img.png");
    });

    it("copies absolute local path as-is", async () => {
      useImageContextMenuStore.setState({ imageSrc: "/absolute/path/img.png" });
      const view = makeEditorView();
      const getView = () => view as never;
      const { result } = renderHook(() => useImageContextMenu(getView));

      await act(async () => {
        await result.current("copyPath");
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("/absolute/path/img.png");
    });

    it("shows error when clipboard write fails", async () => {
      (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("clipboard denied")
      );

      const view = makeEditorView();
      const getView = () => view as never;
      const { result } = renderHook(() => useImageContextMenu(getView));

      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      await act(async () => {
        await result.current("copyPath");
      });

      expect(mockMessage).toHaveBeenCalledWith(
        "Failed to copy image path.",
        expect.objectContaining({ kind: "error" })
      );
      errorSpy.mockRestore();
    });
  });

  // --- RevealInFinder action ---

  describe("revealInFinder action", () => {
    it("reveals image in Finder", async () => {
      const view = makeEditorView();
      const getView = () => view as never;
      const { result } = renderHook(() => useImageContextMenu(getView));

      await act(async () => {
        await result.current("revealInFinder");
      });

      expect(mockRevealItemInDir).toHaveBeenCalled();
    });

    it("shows warning when document is unsaved", async () => {
      vi.mocked(useDocumentFilePath).mockReturnValue(null);
      const view = makeEditorView();
      const getView = () => view as never;
      const { result } = renderHook(() => useImageContextMenu(getView));

      await act(async () => {
        await result.current("revealInFinder");
      });

      expect(mockMessage).toHaveBeenCalledWith(
        "Document must be saved to reveal image.",
        expect.objectContaining({ kind: "warning" })
      );
    });

    it("shows error when reveal fails", async () => {
      mockRevealItemInDir.mockRejectedValue(new Error("no such file"));
      const view = makeEditorView();
      const getView = () => view as never;
      const { result } = renderHook(() => useImageContextMenu(getView));

      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      await act(async () => {
        await result.current("revealInFinder");
      });

      expect(mockMessage).toHaveBeenCalledWith(
        "Failed to reveal image in Finder.",
        expect.objectContaining({ kind: "error" })
      );
      errorSpy.mockRestore();
    });
  });
});
