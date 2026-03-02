/**
 * Tests for Mermaid Export
 *
 * Covers the setupMermaidExport function which renders mermaid SVG,
 * converts to PNG, and saves via Tauri dialog.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

const mockSave = vi.fn();
const mockWriteFile = vi.fn();
const mockRenderMermaidForExport = vi.fn();
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
  renderMermaidForExport: (...args: unknown[]) =>
    mockRenderMermaidForExport(...args),
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

import { setupMermaidExport } from "./mermaidExport";

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
describe("setupMermaidExport", () => {
  it("calls setupDiagramExport with container and callback", () => {
    setupMermaidExport(container, "graph TD; A-->B");

    expect(mockSetupDiagramExport).toHaveBeenCalledWith(
      container,
      expect.any(Function),
    );
  });

  it("returns the ExportInstance from setupDiagramExport", () => {
    const mockDestroy = vi.fn();
    mockSetupDiagramExport.mockReturnValue({ destroy: mockDestroy });

    const instance = setupMermaidExport(container, "graph TD; A-->B");
    expect(instance.destroy).toBe(mockDestroy);
  });
});

// ---------------------------------------------------------------------------
// Export callback - light theme
// ---------------------------------------------------------------------------
describe("export callback - light theme", () => {
  it("renders SVG, converts to PNG, and saves file", async () => {
    const svgString = "<svg>mermaid</svg>";
    const pngData = new Uint8Array([137, 80, 78, 71]);
    mockRenderMermaidForExport.mockResolvedValue(svgString);
    mockSvgToPngBytes.mockResolvedValue(pngData);
    mockSave.mockResolvedValue("/output/diagram.png");
    mockWriteFile.mockResolvedValue(undefined);

    setupMermaidExport(container, "graph TD; A-->B");
    await capturedDoExport!("light");

    expect(mockRenderMermaidForExport).toHaveBeenCalledWith(
      "graph TD; A-->B",
      "light",
    );
    expect(mockSvgToPngBytes).toHaveBeenCalledWith(svgString, 2, "#ffffff");
    expect(mockSave).toHaveBeenCalledWith({
      defaultPath: "diagram.png",
      filters: [{ name: "PNG Image", extensions: ["png"] }],
    });
    expect(mockWriteFile).toHaveBeenCalledWith("/output/diagram.png", pngData);
  });
});

// ---------------------------------------------------------------------------
// Export callback - dark theme
// ---------------------------------------------------------------------------
describe("export callback - dark theme", () => {
  it("uses dark background color", async () => {
    mockRenderMermaidForExport.mockResolvedValue("<svg>dark</svg>");
    mockSvgToPngBytes.mockResolvedValue(new Uint8Array([1]));
    mockSave.mockResolvedValue("/output/diagram.png");
    mockWriteFile.mockResolvedValue(undefined);

    setupMermaidExport(container, "graph LR; X-->Y");
    await capturedDoExport!("dark");

    expect(mockRenderMermaidForExport).toHaveBeenCalledWith(
      "graph LR; X-->Y",
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
    mockRenderMermaidForExport.mockResolvedValue(null);

    setupMermaidExport(container, "invalid");
    await capturedDoExport!("light");

    expect(mockDiagramWarn).toHaveBeenCalledWith("render returned no SVG");
    expect(mockSvgToPngBytes).not.toHaveBeenCalled();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("returns early when render returns undefined", async () => {
    mockRenderMermaidForExport.mockResolvedValue(undefined);

    setupMermaidExport(container, "");
    await capturedDoExport!("light");

    expect(mockDiagramWarn).toHaveBeenCalledWith("render returned no SVG");
    expect(mockSvgToPngBytes).not.toHaveBeenCalled();
  });

  it("returns early when SVG to PNG conversion fails", async () => {
    mockRenderMermaidForExport.mockResolvedValue("<svg>test</svg>");
    mockSvgToPngBytes.mockRejectedValue(new Error("Canvas error"));

    setupMermaidExport(container, "graph TD; A-->B");
    await capturedDoExport!("light");

    expect(mockDiagramWarn).toHaveBeenCalledWith(
      expect.stringContaining("PNG conversion failed"),
      expect.any(Error),
    );
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("returns early when user cancels save dialog", async () => {
    mockRenderMermaidForExport.mockResolvedValue("<svg>test</svg>");
    mockSvgToPngBytes.mockResolvedValue(new Uint8Array([1]));
    mockSave.mockResolvedValue(null);

    setupMermaidExport(container, "graph TD; A-->B");
    await capturedDoExport!("light");

    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it("returns early when save dialog returns empty string", async () => {
    mockRenderMermaidForExport.mockResolvedValue("<svg>test</svg>");
    mockSvgToPngBytes.mockResolvedValue(new Uint8Array([1]));
    mockSave.mockResolvedValue("");

    setupMermaidExport(container, "graph TD; A-->B");
    await capturedDoExport!("light");

    // Empty string is falsy, so writeFile should not be called
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it("logs warning when file write fails", async () => {
    mockRenderMermaidForExport.mockResolvedValue("<svg>test</svg>");
    mockSvgToPngBytes.mockResolvedValue(new Uint8Array([1]));
    mockSave.mockResolvedValue("/output/diagram.png");
    mockWriteFile.mockRejectedValue(new Error("Permission denied"));

    setupMermaidExport(container, "graph TD; A-->B");
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
  it("handles empty mermaid source", async () => {
    mockRenderMermaidForExport.mockResolvedValue("<svg></svg>");
    mockSvgToPngBytes.mockResolvedValue(new Uint8Array([1]));
    mockSave.mockResolvedValue("/out.png");
    mockWriteFile.mockResolvedValue(undefined);

    setupMermaidExport(container, "");
    await capturedDoExport!("light");

    expect(mockRenderMermaidForExport).toHaveBeenCalledWith("", "light");
  });

  it("handles complex mermaid diagram source", async () => {
    const source = `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[OK]
    B -->|No| D[End]`;
    mockRenderMermaidForExport.mockResolvedValue("<svg>complex</svg>");
    mockSvgToPngBytes.mockResolvedValue(new Uint8Array([1]));
    mockSave.mockResolvedValue("/out.png");
    mockWriteFile.mockResolvedValue(undefined);

    setupMermaidExport(container, source);
    await capturedDoExport!("dark");

    expect(mockRenderMermaidForExport).toHaveBeenCalledWith(source, "dark");
  });

  it("handles special characters in mermaid source", async () => {
    const source = 'graph TD; A["Label with (parens) & <angle>"]-->B';
    mockRenderMermaidForExport.mockResolvedValue("<svg>special</svg>");
    mockSvgToPngBytes.mockResolvedValue(new Uint8Array([1]));
    mockSave.mockResolvedValue("/out.png");
    mockWriteFile.mockResolvedValue(undefined);

    setupMermaidExport(container, source);
    await capturedDoExport!("light");

    expect(mockRenderMermaidForExport).toHaveBeenCalledWith(source, "light");
  });
});
