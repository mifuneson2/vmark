/**
 * Tests for markmap self-registration into the unified diagramCleanup system.
 *
 * Mocks markmap-lib and markmap-view to test the integration without
 * loading heavy D3 dependencies.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { _clearRegistry, _registrySize, cleanupDescendants } from "@/plugins/shared/diagramCleanup";

// Mock markmap destroy
const mockDestroy = vi.fn();
const mockFit = vi.fn();
const mockSetOptions = vi.fn();
const mockSetData = vi.fn();

vi.mock("markmap-lib", () => ({
  Transformer: class {
    transform(content: string) {
      return { root: { content, children: [] } };
    }
  },
}));

vi.mock("markmap-view", () => ({
  Markmap: {
    create: () => ({
      destroy: mockDestroy,
      fit: mockFit,
      setOptions: mockSetOptions,
      setData: mockSetData,
      svg: { on: vi.fn() },
    }),
  },
}));

import { renderMarkmapToElement } from "./index";

beforeEach(() => {
  _clearRegistry();
  vi.clearAllMocks();
});

describe("markmap self-registration", () => {
  it("registers into diagramCleanup on render", async () => {
    const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    document.body.appendChild(svgEl);

    const result = await renderMarkmapToElement(svgEl, "# Hello");

    expect(result).not.toBeNull();
    expect(_registrySize()).toBe(1);

    svgEl.remove();
  });

  it("cleanupDescendants triggers mm.destroy()", async () => {
    const container = document.createElement("div");
    const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    container.appendChild(svgEl);
    document.body.appendChild(container);

    await renderMarkmapToElement(svgEl, "# Hello");
    expect(_registrySize()).toBe(1);

    cleanupDescendants(container);

    expect(mockDestroy).toHaveBeenCalledOnce();
    expect(_registrySize()).toBe(0);

    container.remove();
  });

  it("return type has fit() but no dispose()", async () => {
    const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    document.body.appendChild(svgEl);

    const result = await renderMarkmapToElement(svgEl, "# Hello");

    expect(result).not.toBeNull();
    expect(typeof result!.fit).toBe("function");
    expect("dispose" in result!).toBe(false);

    svgEl.remove();
  });

  it("returns null for empty content", async () => {
    const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const result = await renderMarkmapToElement(svgEl, "   ");
    expect(result).toBeNull();
    expect(_registrySize()).toBe(0);
  });
});
