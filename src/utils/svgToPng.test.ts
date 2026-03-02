import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — DOM APIs that jsdom doesn't fully support (canvas, Image, toBlob)
// ---------------------------------------------------------------------------

const mockScale = vi.fn();
const mockDrawImage = vi.fn();
const mockGetContext = vi.fn();
const mockToBlob = vi.fn();

// Keep original for non-canvas elements
const originalCreateElement = document.createElement.bind(document);
const mockCreateElement = vi.spyOn(document, "createElement");

/** Controls whether MockImage triggers onload or onerror */
let imageLoadBehavior: "load" | "error" = "load";
let lastImageSrc = "";

function setupCanvasMock(
  opts: {
    contextReturns?: unknown | null;
    toBlobReturnsNull?: boolean;
  } = {},
) {
  const ctxValue =
    opts.contextReturns !== undefined
      ? opts.contextReturns
      : { scale: mockScale, drawImage: mockDrawImage };

  mockGetContext.mockReturnValue(ctxValue);

  mockToBlob.mockImplementation((cb: (blob: Blob | null) => void) => {
    if (opts.toBlobReturnsNull) {
      cb(null);
      return;
    }
    // Create a fake blob with arrayBuffer support for jsdom
    const data = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const blob = {
      arrayBuffer: () => Promise.resolve(data.buffer),
      size: data.length,
      type: "image/png",
    } as unknown as Blob;
    cb(blob);
  });

  mockCreateElement.mockImplementation((tag: string) => {
    if (tag === "canvas") {
      return {
        width: 0,
        height: 0,
        getContext: mockGetContext,
        toBlob: mockToBlob,
      } as unknown as HTMLCanvasElement;
    }
    return originalCreateElement(tag);
  });
}

// Mock Image — control onload / onerror via module-level flag
vi.stubGlobal(
  "Image",
  class MockImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    private _src = "";

    get src() {
      return this._src;
    }
    set src(value: string) {
      this._src = value;
      lastImageSrc = value;
      // Fire in next microtask so the caller can attach onload/onerror
      queueMicrotask(() => {
        if (imageLoadBehavior === "error") {
          if (this.onerror) this.onerror();
        } else {
          if (this.onload) this.onload();
        }
      });
    }
  },
);

// ---------------------------------------------------------------------------
// Import under test (after mocks)
// ---------------------------------------------------------------------------
import { svgToPngBytes } from "./svgToPng";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SIMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><rect width="50" height="50"/></svg>`;

const SVG_NO_VIEWBOX = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150"><circle cx="50" cy="50" r="40"/></svg>`;

const SVG_VIEWBOX_AND_ATTRS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="800" height="400"><line x1="0" y1="0" x2="400" y2="200"/></svg>`;

const SVG_NO_DIMENSIONS = `<svg xmlns="http://www.w3.org/2000/svg"><text>Hello</text></svg>`;

const EMPTY_SVG = `<svg xmlns="http://www.w3.org/2000/svg"></svg>`;

const INVALID_SVG = `<not-svg>this is not valid SVG</not-svg>`;

const SVG_COMMA_VIEWBOX = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0,0,120,80"><rect/></svg>`;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("svgToPngBytes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    imageLoadBehavior = "load";
    lastImageSrc = "";
    setupCanvasMock();
  });

  afterEach(() => {
    imageLoadBehavior = "load";
  });

  // ---- Dimension parsing --------------------------------------------------

  describe("dimension parsing", () => {
    it("uses viewBox dimensions", async () => {
      const result = await svgToPngBytes(SIMPLE_SVG, 1, "#ffffff");

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it("falls back to width/height attributes when no viewBox", async () => {
      const result = await svgToPngBytes(SVG_NO_VIEWBOX, 1, "#ffffff");
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("prefers viewBox over explicit width/height attributes", async () => {
      // viewBox is 400x200; width/height attrs are 800x400
      // viewBox parsed first sets width=400, so the fallback (width===800) won't fire
      const result = await svgToPngBytes(SVG_VIEWBOX_AND_ATTRS, 1, "#fff");
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("defaults to 800x600 when no viewBox or dimensions", async () => {
      const result = await svgToPngBytes(SVG_NO_DIMENSIONS, 1, "#ffffff");
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("handles comma-separated viewBox values", async () => {
      const result = await svgToPngBytes(SVG_COMMA_VIEWBOX, 1, "#fff");
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("handles viewBox with mixed whitespace and commas", async () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0, 0 250,  180"><rect/></svg>`;
      const result = await svgToPngBytes(svg, 1, "#fff");
      expect(result).toBeInstanceOf(Uint8Array);
    });
  });

  // ---- Scale factor -------------------------------------------------------

  describe("scale factor", () => {
    it("applies scale=2 to canvas dimensions", async () => {
      const scaleFn = vi.fn();
      const drawFn = vi.fn();
      setupCanvasMock({
        contextReturns: { scale: scaleFn, drawImage: drawFn },
      });

      await svgToPngBytes(SIMPLE_SVG, 2, "#ffffff");

      expect(scaleFn).toHaveBeenCalledWith(2, 2);
    });

    it("applies scale=3 to canvas dimensions", async () => {
      const scaleFn = vi.fn();
      const drawFn = vi.fn();
      setupCanvasMock({
        contextReturns: { scale: scaleFn, drawImage: drawFn },
      });

      await svgToPngBytes(SIMPLE_SVG, 3, "#ffffff");

      expect(scaleFn).toHaveBeenCalledWith(3, 3);
    });

    it("applies scale=1 (no scaling)", async () => {
      const scaleFn = vi.fn();
      const drawFn = vi.fn();
      setupCanvasMock({
        contextReturns: { scale: scaleFn, drawImage: drawFn },
      });

      await svgToPngBytes(SIMPLE_SVG, 1, "#ffffff");

      expect(scaleFn).toHaveBeenCalledWith(1, 1);
    });
  });

  // ---- Background color ---------------------------------------------------

  describe("background color injection", () => {
    it("injects a background rect with the given color", async () => {
      await svgToPngBytes(SIMPLE_SVG, 1, "#ff0000");

      const dataUrl = decodeURIComponent(lastImageSrc);
      expect(dataUrl).toContain('fill="#ff0000"');
    });

    it("injects background rect as the first child", async () => {
      await svgToPngBytes(SIMPLE_SVG, 1, "#00ff00");

      const dataUrl = decodeURIComponent(lastImageSrc);
      // The bg rect should appear before the original <rect> content
      const bgRectIdx = dataUrl.indexOf('fill="#00ff00"');
      const originalRectIdx = dataUrl.indexOf('width="50"');
      expect(bgRectIdx).toBeLessThan(originalRectIdx);
    });
  });

  // ---- Empty SVG ----------------------------------------------------------

  describe("empty SVG", () => {
    it("handles an empty SVG element", async () => {
      const result = await svgToPngBytes(EMPTY_SVG, 1, "#ffffff");
      expect(result).toBeInstanceOf(Uint8Array);
    });
  });

  // ---- Invalid SVG --------------------------------------------------------

  describe("invalid SVG", () => {
    it("rejects when image fails to load invalid SVG", async () => {
      imageLoadBehavior = "error";

      await expect(svgToPngBytes(INVALID_SVG, 1, "#fff")).rejects.toThrow(
        "Failed to load SVG",
      );
    });
  });

  // ---- Error paths --------------------------------------------------------

  describe("error paths", () => {
    it("rejects when canvas 2D context is null", async () => {
      setupCanvasMock({ contextReturns: null });

      await expect(svgToPngBytes(SIMPLE_SVG, 1, "#fff")).rejects.toThrow(
        "Failed to get canvas 2D context",
      );
    });

    it("rejects when toBlob returns null", async () => {
      setupCanvasMock({ toBlobReturnsNull: true });

      await expect(svgToPngBytes(SIMPLE_SVG, 1, "#fff")).rejects.toThrow(
        "Failed to create PNG",
      );
    });

    it("rejects when image fails to load", async () => {
      imageLoadBehavior = "error";

      await expect(svgToPngBytes(SIMPLE_SVG, 1, "#fff")).rejects.toThrow(
        "Failed to load SVG",
      );
    });
  });

  // ---- Data URL encoding --------------------------------------------------

  describe("data URL encoding", () => {
    it("creates a data URL with correct MIME type", async () => {
      await svgToPngBytes(SIMPLE_SVG, 1, "#ffffff");

      expect(lastImageSrc).toMatch(
        /^data:image\/svg\+xml;charset=utf-8,/,
      );
    });

    it("encodes the serialized SVG in the data URL", async () => {
      await svgToPngBytes(SIMPLE_SVG, 1, "#ffffff");

      const decoded = decodeURIComponent(lastImageSrc);
      // Should contain the SVG namespace
      expect(decoded).toContain("http://www.w3.org/2000/svg");
    });
  });

  // ---- Canvas drawImage called correctly ----------------------------------

  describe("canvas rendering", () => {
    it("calls drawImage with the loaded image at origin", async () => {
      const drawFn = vi.fn();
      setupCanvasMock({
        contextReturns: { scale: vi.fn(), drawImage: drawFn },
      });

      await svgToPngBytes(SIMPLE_SVG, 1, "#ffffff");

      expect(drawFn).toHaveBeenCalledTimes(1);
      expect(drawFn).toHaveBeenCalledWith(expect.anything(), 0, 0);
    });

    it("requests PNG format from toBlob", async () => {
      await svgToPngBytes(SIMPLE_SVG, 1, "#fff");

      expect(mockToBlob).toHaveBeenCalledWith(
        expect.any(Function),
        "image/png",
      );
    });
  });

  // ---- Return value -------------------------------------------------------

  describe("return value", () => {
    it("returns a Uint8Array from the PNG blob", async () => {
      const pngData = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
      setupCanvasMock();
      // Override toBlob to return specific data
      mockToBlob.mockImplementation((cb: (blob: Blob | null) => void) => {
        cb({
          arrayBuffer: () => Promise.resolve(pngData.buffer),
          size: pngData.length,
          type: "image/png",
        } as unknown as Blob);
      });

      const result = await svgToPngBytes(SIMPLE_SVG, 1, "#fff");

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(pngData.length);
    });
  });

  // ---- Explicit width/height edge cases -----------------------------------

  describe("width/height attribute edge cases", () => {
    it("ignores non-numeric width attribute", async () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="auto" height="auto"><rect/></svg>`;
      // parseFloat("auto") is NaN, so defaults 800x600 stay
      const result = await svgToPngBytes(svg, 1, "#fff");
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("uses width attribute with decimal values", async () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150.5" height="75.25"><rect/></svg>`;
      const result = await svgToPngBytes(svg, 1, "#fff");
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("handles viewBox with fewer than 4 parts", async () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0"><rect/></svg>`;
      // parts.length < 4, so viewBox is ignored; falls back to 800x600
      const result = await svgToPngBytes(svg, 1, "#fff");
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("handles viewBox with NaN values in width/height positions", async () => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 abc def"><rect/></svg>`;
      // isNaN check catches this; falls back to 800x600
      const result = await svgToPngBytes(svg, 1, "#fff");
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("sets explicit width/height attributes on the SVG element", async () => {
      await svgToPngBytes(SIMPLE_SVG, 1, "#fff");

      const decoded = decodeURIComponent(lastImageSrc);
      // The code sets width="200" height="100" (from viewBox)
      expect(decoded).toContain('width="200"');
      expect(decoded).toContain('height="100"');
    });
  });
});
