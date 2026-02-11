/**
 * Markmap Plugin
 *
 * Adds markmap mindmap support to the editor.
 * Renders ```markmap code blocks as interactive SVG mindmap trees.
 * Lazy-loads markmap-lib + markmap-view on first render.
 *
 * Unlike Mermaid (which renders to an SVG string), Markmap renders to a live
 * SVG DOM element with built-in D3 pan/zoom/collapse. This means:
 * - WYSIWYG preview: mount a live Markmap instance for interactivity
 * - Export: serialize the SVG element to string, then convert to PNG
 * - No @panzoom/panzoom needed — Markmap has its own pan/zoom
 */

import type { Transformer } from "markmap-lib";
import type { Markmap, IMarkmapOptions } from "markmap-view";
import type { INode } from "markmap-common";

// Lazy-loaded module references
let transformerInstance: Transformer | null = null;
let markmapViewModule: typeof import("markmap-view") | null = null;
let loadPromise: Promise<void> | null = null;

// Track active markmap instances for theme re-rendering
const activeInstances = new Map<SVGElement, { mm: Markmap; content: string }>();

// Current theme state
let currentIsDark = false;

/**
 * Detect if dark mode is active by checking document class
 */
function isDarkMode(): boolean {
  return document.documentElement.classList.contains("dark");
}

/**
 * Get color options for the current theme
 */
function getColorOptions(dark: boolean): Partial<IMarkmapOptions> {
  const lightColors = ["#0969da", "#1a7f37", "#8250df", "#9a6700", "#cf222e", "#0550ae"];
  const darkColors = ["#58a6ff", "#3fb950", "#a371f7", "#d29922", "#f85149", "#79c0ff"];
  const palette = dark ? darkColors : lightColors;

  return {
    color: (node: INode) => {
      const depth = (node.state?.path || "").split(".").length - 1;
      return palette[depth % palette.length];
    },
  };
}

/**
 * Lazy-load markmap-lib and markmap-view
 */
async function loadMarkmap(): Promise<void> {
  if (transformerInstance && markmapViewModule) return;
  if (loadPromise) return loadPromise;

  loadPromise = Promise.all([
    import("markmap-lib"),
    import("markmap-view"),
  ]).then(([lib, view]) => {
    transformerInstance = new lib.Transformer();
    markmapViewModule = view;
  });

  return loadPromise;
}

/**
 * Render markmap content into a live SVG element.
 * Returns a dispose function to clean up the instance.
 *
 * @param svgEl  An SVG element to mount into (must be attached to DOM)
 * @param content  Markdown content with headings
 * @returns Object with dispose function and fit method, or null on failure
 */
export async function renderMarkmapToElement(
  svgEl: SVGSVGElement,
  content: string,
): Promise<{ dispose: () => void; fit: () => void } | null> {
  await loadMarkmap();
  if (!transformerInstance || !markmapViewModule) return null;

  const trimmed = content.trim();
  if (!trimmed) return null;

  try {
    const { root } = transformerInstance.transform(trimmed);
    currentIsDark = isDarkMode();
    const options = getColorOptions(currentIsDark);

    const mm = markmapViewModule.Markmap.create(svgEl, options, root);

    activeInstances.set(svgEl, { mm, content: trimmed });

    return {
      dispose: () => {
        activeInstances.delete(svgEl);
        mm.destroy();
      },
      fit: () => {
        mm.fit();
      },
    };
  } catch (error) {
    console.warn("[Markmap] Failed to render mindmap:", error);
    return null;
  }
}

/**
 * Render markmap to an SVG string for export.
 * Creates an off-screen SVG, renders, serializes, then cleans up.
 */
export async function renderMarkmapToSvgString(
  content: string,
  theme: "light" | "dark",
): Promise<string | null> {
  await loadMarkmap();
  if (!transformerInstance || !markmapViewModule) return null;

  const trimmed = content.trim();
  if (!trimmed) return null;

  // Create off-screen container
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  container.style.width = "800px";
  container.style.height = "600px";
  document.body.appendChild(container);

  const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svgEl.setAttribute("width", "800");
  svgEl.setAttribute("height", "600");
  container.appendChild(svgEl);

  try {
    const { root } = transformerInstance.transform(trimmed);
    const dark = theme === "dark";
    const options = getColorOptions(dark);

    const mm = markmapViewModule.Markmap.create(svgEl, options, root);
    mm.fit();

    // Wait a frame for D3 transitions to settle
    await new Promise((r) => requestAnimationFrame(r));

    // Set background for export
    const bgColor = dark ? "#1e1e1e" : "#ffffff";
    const textColor = dark ? "#e6e6e6" : "#1a1a1a";
    svgEl.style.backgroundColor = bgColor;
    svgEl.style.color = textColor;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgEl);

    mm.destroy();
    return svgString;
  } catch (error) {
    console.warn("[Markmap] Failed to render for export:", error);
    return null;
  } finally {
    container.remove();
  }
}

/**
 * Dispose all markmap instances whose SVG is a descendant of `container`.
 * Call before clearing a container's innerHTML that may hold markmap SVGs.
 */
export function disposeMarkmapInContainer(container: Element): void {
  for (const [svgEl, { mm }] of activeInstances) {
    if (container.contains(svgEl)) {
      mm.destroy();
      activeInstances.delete(svgEl);
    }
  }
}

/**
 * Dispose markmap instances whose SVG has been detached from the DOM.
 * Sweeps stale entries left behind when ProseMirror removes widget nodes.
 */
export function disposeDetachedInstances(): void {
  for (const [svgEl, { mm }] of activeInstances) {
    if (!svgEl.isConnected) {
      mm.destroy();
      activeInstances.delete(svgEl);
    }
  }
}

/**
 * Update markmap theme when app theme changes.
 * Re-renders all active instances with new colors.
 * Returns true if theme changed.
 */
export async function updateMarkmapTheme(isDark: boolean): Promise<boolean> {
  if (isDark === currentIsDark) return false;
  currentIsDark = isDark;

  if (!transformerInstance) return false;

  // Re-render all active instances
  for (const [svgEl, { mm, content }] of activeInstances) {
    try {
      const { root } = transformerInstance.transform(content);
      const options = getColorOptions(isDark);
      mm.setOptions(options);
      mm.setData(root);
      mm.fit();
    } catch {
      // If re-render fails, remove the stale instance
      activeInstances.delete(svgEl);
    }
  }

  return true;
}
