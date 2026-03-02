/**
 * Tests for Markmap Export
 *
 * Covers the setupMarkmapExport function which renders markmap SVG,
 * converts to PNG, and saves via Tauri dialog.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

const mockSave = vi.fn();
const mockWriteFile = vi.fn();
const mockRenderMarkmapToSvgString = vi.fn();
const mockSvgToPngBytes = vi.fn();
const mockDiagramWarn = vi.fn();
const mockSetupDiagramExport = vi.fn();

vi.mock("@tauri-apps/plugin-dialog", () => ({
  save: (...args: unknown[]) => mockSave(...args),
}));

vi.mock("@tauri-apps/plugin-fs", () => ({
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
}));

vi.mock("./index", () => ({
  renderMarkmapToSvgString: (...args: unknown[]) =>
    mockRenderMarkmapToSvgString(...args),
}));

vi.mock("@/utils/svgToPng", () => ({
  svgToPngBytes: (...args: unknown[]) => mockSvgToPngBytes(...args),
}));

vi.mock("@/utils/debug", () => ({
  diagramWarn: (...args: unknown[]) => mockDiagramWarn(...args),
}));

vi.mock("@/plugins/shared/diagramExport", () => ({
  setupDiagramExport: (...args: unknown[]) => mockSetupDiagramExport(...args),
  LIGHT_BG: "#ffffff",
  DARK_BG: "#1e1e1e",
}));

import { setupMarkmapExport } from "./markmapExport";

let container: HTMLElement;
let capturedDoExport: ((theme: "light" | "dark") => Promise<void>) | null;

beforeEach(() => {
  vi.clearAllMocks();
  container = document.createElement("div");
  capturedDoExport = null;

  mockSetupDiagramExport.mockImplementation(
    (_container: HTMLElement, doExport: (theme: "light" | "dark") => Promise<void>) => {
      capturedDoExport = doExport;
      return { destroy: vi.fn() };
    },
  );
});

afterEach(() => {
  capturedDoExport = null;
});

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
describe("setupMarkmapExport", () => {
  it("calls setupDiagramExport with container and callback", () => {
    setupMarkmapExport(container, "# Hello");

    expect(mockSetupDiagramExport).toHaveBeenCalledWith(
      container,
      expect.any(Function),
    );
  });

  it("returns the ExportInstance from setupDiagramExport", () => {
    const mockDestroy = vi.fn();
    mockSetupDiagramExport.mockReturnValue({ destroy: mockDestroy });

    const instance = setupMarkmapExport(container, "# Hello");
    expect(instance.destroy).toBe(mockDestroy);
  });
});

// ---------------------------------------------------------------------------
// Export callback - light theme
// ---------------------------------------------------------------------------
describe("export callback - light theme", () => {
  it("renders SVG, converts to PNG, and saves file", async () => {
    const svgString = "<svg>test</svg>";
    const pngData = new Uint8Array([137, 80, 78, 71]);
    mockRenderMarkmapToSvgString.mockResolvedValue(svgString);
    mockSvgToPngBytes.mockResolvedValue(pngData);
    mockSave.mockResolvedValue("/output/mindmap.png");
    mockWriteFile.mockResolvedValue(undefined);

    setupMarkmapExport(container, "# Hello");
    await capturedDoExport!("light");

    expect(mockRenderMarkmapToSvgString).toHaveBeenCalledWith(
      "# Hello",
      "light",
    );
    expect(mockSvgToPngBytes).toHaveBeenCalledWith(svgString, 2, "#ffffff");
    expect(mockSave).toHaveBeenCalledWith({
      defaultPath: "mindmap.png",
      filters: [{ name: "PNG Image", extensions: ["png"] }],
    });
    expect(mockWriteFile).toHaveBeenCalledWith("/output/mindmap.png", pngData);
  });
});

// ---------------------------------------------------------------------------
// Export callback - dark theme
// ---------------------------------------------------------------------------
describe("export callback - dark theme", () => {
  it("uses dark background color", async () => {
    mockRenderMarkmapToSvgString.mockResolvedValue("<svg>dark</svg>");
    mockSvgToPngBytes.mockResolvedValue(new Uint8Array([1]));
    mockSave.mockResolvedValue("/output/mindmap.png");
    mockWriteFile.mockResolvedValue(undefined);

    setupMarkmapExport(container, "# Dark");
    await capturedDoExport!("dark");

    expect(mockRenderMarkmapToSvgString).toHaveBeenCalledWith(
      "# Dark",
      "dark",
    );
    expect(mockSvgToPngBytes).toHaveBeenCalledWith(
      "<svg>dark</svg>",
      2,
      "#1e1e1e",
    );
  });
});

// ---------------------------------------------------------------------------
// Error paths
// ---------------------------------------------------------------------------
describe("error paths", () => {
  it("returns early when render returns no SVG", async () => {
    mockRenderMarkmapToSvgString.mockResolvedValue(null);

    setupMarkmapExport(container, "# Empty");
    await capturedDoExport!("light");

    expect(mockDiagramWarn).toHaveBeenCalledWith("render returned no SVG");
    expect(mockSvgToPngBytes).not.toHaveBeenCalled();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("returns early when render returns undefined", async () => {
    mockRenderMarkmapToSvgString.mockResolvedValue(undefined);

    setupMarkmapExport(container, "");
    await capturedDoExport!("light");

    expect(mockDiagramWarn).toHaveBeenCalledWith("render returned no SVG");
    expect(mockSvgToPngBytes).not.toHaveBeenCalled();
  });

  it("returns early when SVG to PNG conversion fails", async () => {
    mockRenderMarkmapToSvgString.mockResolvedValue("<svg>test</svg>");
    mockSvgToPngBytes.mockRejectedValue(new Error("Canvas error"));

    setupMarkmapExport(container, "# Test");
    await capturedDoExport!("light");

    expect(mockDiagramWarn).toHaveBeenCalledWith(
      "SVG->PNG conversion failed",
      expect.any(Error),
    );
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("returns early when user cancels save dialog", async () => {
    mockRenderMarkmapToSvgString.mockResolvedValue("<svg>test</svg>");
    mockSvgToPngBytes.mockResolvedValue(new Uint8Array([1]));
    mockSave.mockResolvedValue(null);

    setupMarkmapExport(container, "# Test");
    await capturedDoExport!("light");

    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it("logs warning when file write fails", async () => {
    mockRenderMarkmapToSvgString.mockResolvedValue("<svg>test</svg>");
    mockSvgToPngBytes.mockResolvedValue(new Uint8Array([1]));
    mockSave.mockResolvedValue("/output/mindmap.png");
    mockWriteFile.mockRejectedValue(new Error("Disk full"));

    setupMarkmapExport(container, "# Test");
    await capturedDoExport!("light");

    expect(mockDiagramWarn).toHaveBeenCalledWith(
      "failed to write file",
      expect.any(Error),
    );
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------
describe("edge cases", () => {
  it("handles empty markmap source", async () => {
    mockRenderMarkmapToSvgString.mockResolvedValue("<svg></svg>");
    mockSvgToPngBytes.mockResolvedValue(new Uint8Array([1]));
    mockSave.mockResolvedValue("/out.png");
    mockWriteFile.mockResolvedValue(undefined);

    setupMarkmapExport(container, "");
    await capturedDoExport!("light");

    expect(mockRenderMarkmapToSvgString).toHaveBeenCalledWith("", "light");
  });

  it("handles unicode/CJK content in markmap source", async () => {
    const source = "# \\u4F60\\u597D\\u4E16\\u754C";
    mockRenderMarkmapToSvgString.mockResolvedValue("<svg>cjk</svg>");
    mockSvgToPngBytes.mockResolvedValue(new Uint8Array([1]));
    mockSave.mockResolvedValue("/out.png");
    mockWriteFile.mockResolvedValue(undefined);

    setupMarkmapExport(container, source);
    await capturedDoExport!("light");

    expect(mockRenderMarkmapToSvgString).toHaveBeenCalledWith(source, "light");
  });
});
