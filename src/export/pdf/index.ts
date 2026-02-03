/**
 * PDF Export Module
 *
 * Main entry point for PDF export functionality.
 * Orchestrates CSS transformation, SVG handling, and TOC generation.
 */

// Re-export all public APIs
export { transformCssForPdf, resolveCssVariables, resolveColorMix } from "./cssResolver";
export { transformSvgForPdf, transformAllSvgs, transformSvgString, hasForeignObject } from "./svgTransformer";
export { extractTOC, renderTOC, generateTOC, insertTOC } from "./tocGenerator";
export type { TOCItem, TOCOptions } from "./tocGenerator";

// Import CSS files (to be used with Vite's ?raw import)
// These will be imported by the consumer with ?raw suffix

import { transformCssForPdf } from "./cssResolver";
import { transformAllSvgs } from "./svgTransformer";
import { insertTOC, type TOCOptions } from "./tocGenerator";

export interface PdfExportOptions {
  /** Include table of contents. Default: true */
  includeToc?: boolean;
  /** TOC options */
  tocOptions?: TOCOptions;
  /** Transform SVGs for WeasyPrint compatibility. Default: true */
  transformSvgs?: boolean;
}

const DEFAULT_OPTIONS: Required<PdfExportOptions> = {
  includeToc: true,
  tocOptions: {
    title: "Contents",
    maxDepth: 2,
    minDepth: 1,
  },
  transformSvgs: true,
};

/**
 * Prepare HTML document for PDF export.
 *
 * This function:
 * 1. Transforms CSS for WeasyPrint compatibility
 * 2. Converts SVG foreignObject elements to text
 * 3. Optionally inserts a table of contents
 *
 * @param html - The HTML string to prepare
 * @param css - The CSS string to transform
 * @param options - PDF export options
 * @returns Object with transformed HTML and CSS
 */
export function preparePdfExport(
  html: string,
  css: string,
  options: PdfExportOptions = {}
): { html: string; css: string; tocCount: number; svgCount: number } {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Transform CSS for WeasyPrint
  const transformedCss = transformCssForPdf(css);

  // Parse HTML for DOM manipulation
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Transform SVGs
  let svgCount = 0;
  if (opts.transformSvgs) {
    svgCount = transformAllSvgs(doc);
  }

  // Insert TOC
  let tocCount = 0;
  if (opts.includeToc) {
    tocCount = insertTOC(doc, opts.tocOptions);
  }

  // Serialize back to HTML
  const transformedHtml = doc.documentElement.outerHTML;

  return {
    html: transformedHtml,
    css: transformedCss,
    tocCount,
    svgCount,
  };
}

/**
 * Get CSS imports for PDF export.
 *
 * This returns the paths to CSS files that should be imported
 * with Vite's ?raw suffix for embedding in the PDF HTML.
 */
export function getPdfCssImports(): string[] {
  return [
    "../styles/content.css",
    "../styles/alert.css",
    "../styles/syntax.css",
    "../styles/toc.css",
  ];
}

/**
 * Combine multiple CSS strings into one.
 */
export function combineCss(...cssStrings: string[]): string {
  return cssStrings.filter(Boolean).join("\n\n");
}
