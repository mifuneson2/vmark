/**
 * Tests for SVG Export
 *
 * Covers the setupSvgExport function which sanitizes SVG content,
 * converts to PNG, and saves via Tauri dialog.
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

const mockSave = vi.fn();
const mockWriteFile = vi.fn();
const mockSanitizeSvg = vi.fn();
const mockSvgToPngBytes = vi.fn();
const mockDiagramWarn = vi.fn();
const mockSetupDiagramExport = vi.fn();

vi.mock("@tauri-apps/plugin-dialog", () => ({
  save: (...args: unknown[]) => mockSave(...args),
}));

vi.mock("@tauri-apps/plugin-fs", () => ({
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
}));

vi.mock("@/utils/sanitize", () => ({
  sanitizeSvg: (...args: unknown[]) => mockSanitizeSvg(...args),
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

import { setupSvgExport } from "./svgExport";

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

  // Default: sanitize returns input unchanged
  mockSanitizeSvg.mockImplementation((svg: string) => svg);
});

afterEach(() => {
  capturedDoExport = null;
});

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
describe("setupSvgExport", () => {
  it("calls setupDiagramExport with container and callback", () => {
    setupSvgExport(container, "<svg>test</svg>");

    expect(mockSetupDiagramExport).toHaveBeenCalledWith(
      container,
      expect.any(Function),
    );
  });

  it("returns the ExportInstance from setupDiagramExport", () => {
    const mockDestroy = vi.fn();
    mockSetupDiagramExport.mockReturnValue({ destroy: mockDestroy });

    const instance = setupSvgExport(container, "<svg>test</svg>");
    expect(instance.destroy).toBe(mockDestroy);
  });
});

// ---------------------------------------------------------------------------
// Export callback - light theme
// ---------------------------------------------------------------------------
describe("export callback - light theme", () => {
  it("sanitizes SVG, converts to PNG, and saves file", async () => {
    const svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>';
    const sanitized = '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>';
    const pngData = new Uint8Array([137, 80, 78, 71]);

    mockSanitizeSvg.mockReturnValue(sanitized);
    mockSvgToPngBytes.mockResolvedValue(pngData);
    mockSave.mockResolvedValue("/output/image.png");
    mockWriteFile.mockResolvedValue(undefined);

    setupSvgExport(container, svgContent);
    await capturedDoExport!("light");

    expect(mockSanitizeSvg).toHaveBeenCalledWith(svgContent);
    expect(mockSvgToPngBytes).toHaveBeenCalledWith(sanitized, 2, "#ffffff");
    expect(mockSave).toHaveBeenCalledWith({
      defaultPath: "image.png",
      filters: [{ name: "PNG Image", extensions: ["png"] }],
    });
    expect(mockWriteFile).toHaveBeenCalledWith("/output/image.png", pngData);
  });
});

// ---------------------------------------------------------------------------
// Export callback - dark theme
// ---------------------------------------------------------------------------
describe("export callback - dark theme", () => {
  it("uses dark background color", async () => {
    const svgContent = "<svg><circle/></svg>";
    mockSanitizeSvg.mockReturnValue(svgContent);
    mockSvgToPngBytes.mockResolvedValue(new Uint8Array([1]));
    mockSave.mockResolvedValue("/output/image.png");
    mockWriteFile.mockResolvedValue(undefined);

    setupSvgExport(container, svgContent);
    await capturedDoExport!("dark");

    expect(mockSvgToPngBytes).toHaveBeenCalledWith(
      svgContent,
      2,
      "#1e1e1e",
    );
  });
});

// ---------------------------------------------------------------------------
// Sanitization
// ---------------------------------------------------------------------------
describe("sanitization", () => {
  it("passes SVG through sanitizeSvg before conversion", async () => {
    const malicious = '<svg><script>alert("xss")</script></svg>';
    const clean = "<svg></svg>";
    mockSanitizeSvg.mockReturnValue(clean);
    mockSvgToPngBytes.mockResolvedValue(new Uint8Array([1]));
    mockSave.mockResolvedValue("/out.png");
    mockWriteFile.mockResolvedValue(undefined);

    setupSvgExport(container, malicious);
    await capturedDoExport!("light");

    expect(mockSanitizeSvg).toHaveBeenCalledWith(malicious);
    // Conversion should use sanitized output, not original
    expect(mockSvgToPngBytes).toHaveBeenCalledWith(clean, 2, "#ffffff");
  });
});

// ---------------------------------------------------------------------------
// Error paths
// ---------------------------------------------------------------------------
describe("error paths", () => {
  it("returns early when SVG to PNG conversion fails", async () => {
    mockSanitizeSvg.mockReturnValue("<svg>test</svg>");
    mockSvgToPngBytes.mockRejectedValue(new Error("Canvas error"));

    setupSvgExport(container, "<svg>test</svg>");
    await capturedDoExport!("light");

    expect(mockDiagramWarn).toHaveBeenCalledWith(
      expect.stringContaining("PNG conversion failed"),
      expect.any(Error),
    );
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("returns early when user cancels save dialog", async () => {
    mockSanitizeSvg.mockReturnValue("<svg>test</svg>");
    mockSvgToPngBytes.mockResolvedValue(new Uint8Array([1]));
    mockSave.mockResolvedValue(null);

    setupSvgExport(container, "<svg>test</svg>");
    await capturedDoExport!("light");

    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it("returns early when save dialog returns empty string", async () => {
    mockSanitizeSvg.mockReturnValue("<svg>test</svg>");
    mockSvgToPngBytes.mockResolvedValue(new Uint8Array([1]));
    mockSave.mockResolvedValue("");

    setupSvgExport(container, "<svg>test</svg>");
    await capturedDoExport!("light");

    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it("logs warning when file write fails", async () => {
    mockSanitizeSvg.mockReturnValue("<svg>test</svg>");
    mockSvgToPngBytes.mockResolvedValue(new Uint8Array([1]));
    mockSave.mockResolvedValue("/output/image.png");
    mockWriteFile.mockRejectedValue(new Error("Disk full"));

    setupSvgExport(container, "<svg>test</svg>");
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
  it("handles empty SVG content", async () => {
    mockSanitizeSvg.mockReturnValue("");
    mockSvgToPngBytes.mockResolvedValue(new Uint8Array([1]));
    mockSave.mockResolvedValue("/out.png");
    mockWriteFile.mockResolvedValue(undefined);

    setupSvgExport(container, "");
    await capturedDoExport!("light");

    expect(mockSanitizeSvg).toHaveBeenCalledWith("");
    expect(mockSvgToPngBytes).toHaveBeenCalledWith("", 2, "#ffffff");
  });

  it("handles SVG with inline styles and complex attributes", async () => {
    const complex =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style="background: red"><rect x="10" y="10" width="80" height="80" fill="blue"/></svg>';
    mockSanitizeSvg.mockReturnValue(complex);
    mockSvgToPngBytes.mockResolvedValue(new Uint8Array([1]));
    mockSave.mockResolvedValue("/out.png");
    mockWriteFile.mockResolvedValue(undefined);

    setupSvgExport(container, complex);
    await capturedDoExport!("dark");

    expect(mockSanitizeSvg).toHaveBeenCalledWith(complex);
  });

  it("handles SVG with Unicode/CJK text content", async () => {
    const svgWithCjk =
      '<svg><text x="10" y="20">\u4F60\u597D\u4E16\u754C</text></svg>';
    mockSanitizeSvg.mockReturnValue(svgWithCjk);
    mockSvgToPngBytes.mockResolvedValue(new Uint8Array([1]));
    mockSave.mockResolvedValue("/out.png");
    mockWriteFile.mockResolvedValue(undefined);

    setupSvgExport(container, svgWithCjk);
    await capturedDoExport!("light");

    expect(mockSanitizeSvg).toHaveBeenCalledWith(svgWithCjk);
  });

  it("handles very large SVG content without error", async () => {
    const largeSvg = "<svg>" + "<rect/>".repeat(10000) + "</svg>";
    mockSanitizeSvg.mockReturnValue(largeSvg);
    mockSvgToPngBytes.mockResolvedValue(new Uint8Array([1]));
    mockSave.mockResolvedValue("/out.png");
    mockWriteFile.mockResolvedValue(undefined);

    setupSvgExport(container, largeSvg);
    await capturedDoExport!("light");

    expect(mockSanitizeSvg).toHaveBeenCalledWith(largeSvg);
  });
});
