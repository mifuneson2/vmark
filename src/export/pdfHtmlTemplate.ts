/**
 * PDF HTML Template Builder
 *
 * Builds self-contained HTML pages for PDF preview (Paged.js) and export (native createPDF).
 * Both templates include @page CSS rules, typography overrides, and light theme forcing.
 *
 * @module export/pdfHtmlTemplate
 * @coordinates-with pdf_export/renderer.rs — WKWebView loads export HTML, creates PDF
 * @coordinates-with PdfExportDialog.tsx — passes options from the dialog UI
 */

import pagedPolyfillRaw from "./assets/paged.polyfill.js?raw";
import _katexCSSRaw from "katex/dist/katex.min.css?raw";

// Rewrite relative font URLs to absolute CDN paths so they resolve in srcdoc iframes
const KATEX_FONT_BASE = "https://cdn.jsdelivr.net/npm/katex@0.16.28/dist/";
const katexCSS = _katexCSSRaw.replace(
  /url\(fonts\//g,
  `url(${KATEX_FONT_BASE}fonts/`,
);

/** Get bundled KaTeX CSS with CDN font URLs (for use in print/export iframes). */
export function getKatexCSS(): string {
  return katexCSS;
}

export interface PdfOptions {
  pageSize: "a4" | "letter" | "a3" | "legal";
  orientation: "portrait" | "landscape";
  marginTop: number;    // mm
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  showPageNumbers: boolean;
  showHeader: boolean;
  showDate: boolean;
  title?: string;
  fontSize: number;
  lineHeight: number;
  cjkLetterSpacing: string;
  latinFont: string;
  cjkFont: string;
}

/** Named margin presets (values in mm). */
export const MARGIN_PRESETS: Record<string, { top: number; right: number; bottom: number; left: number }> = {
  normal: { top: 25.4, right: 25.4, bottom: 25.4, left: 25.4 },
  narrow: { top: 12.7, right: 12.7, bottom: 12.7, left: 12.7 },
  wide:   { top: 25.4, right: 38.1, bottom: 25.4, left: 38.1 },
};

const PAGE_SIZES: Record<string, string> = {
  a4: "210mm 297mm",
  letter: "8.5in 11in",
  a3: "297mm 420mm",
  legal: "8.5in 14in",
};


/** Escape a string for use in CSS `content: "..."` property. */
function escapeCSSString(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\a ")
    .replace(/\r/g, "")
    .replace(/\t/g, " ");
}

/** Resolve font name to a CSS font-family value. */
function resolveFontFamily(font: string, fallback: string): string {
  if (!font || font === "system" || font === "System Default") {
    return fallback;
  }
  // Wrap in quotes if it contains spaces
  return font.includes(" ") ? `"${font}"` : font;
}

/** Build @page CSS rules from options. */
function buildPageCSS(options: PdfOptions): string {
  const sizeSpec = PAGE_SIZES[options.pageSize] ?? PAGE_SIZES.a4;
  const size =
    options.orientation === "landscape"
      ? `${sizeSpec} landscape`
      : sizeSpec;
  const margin = `${options.marginTop}mm ${options.marginRight}mm ${options.marginBottom}mm ${options.marginLeft}mm`;

  const marginBoxes: string[] = [];

  if (options.showHeader && options.title) {
    marginBoxes.push(`
    @top-center {
      content: "${escapeCSSString(options.title)}";
      font-size: 9pt;
      color: #999;
    }`);
  }

  if (options.showPageNumbers) {
    marginBoxes.push(`
    @bottom-center {
      content: counter(page) " / " counter(pages);
      font-size: 9pt;
      color: #999;
    }`);
  }

  if (options.showDate) {
    marginBoxes.push(`
    @bottom-right {
      content: "${new Date().toLocaleDateString()}";
      font-size: 8pt;
      color: #bbb;
    }`);
  }

  return `
@page {
  size: ${size};
  margin: ${margin};
  ${marginBoxes.join("\n  ")}
}`;
}

/** Shared CSS for table layout, page breaks, and content surface — used by both preview and export. */
function sharedContentCSS(): string {
  return `
.export-surface {
  max-width: none;
  padding: 0;
}

.export-surface-editor .table-scroll-wrapper {
  overflow-x: visible;
}
.export-surface-editor .table-scroll-wrapper table {
  width: 100% !important;
  table-layout: fixed;
}
.export-surface-editor td,
.export-surface-editor th {
  overflow-wrap: break-word;
  word-break: break-word;
}
.export-surface-editor td img {
  max-width: 100%;
  height: auto;
}

pre, .code-block-wrapper {
  break-inside: avoid;
}
img {
  break-inside: avoid;
}
h1, h2, h3, h4, h5, h6 {
  break-after: avoid;
}`;
}

/** Build typography CSS overrides from options. */
function buildTypographyCSS(options: PdfOptions): string {
  const latin = resolveFontFamily(options.latinFont, "system-ui");
  const cjk = resolveFontFamily(options.cjkFont, "system-ui");
  const fontStack = `${latin}, ${cjk}, system-ui, -apple-system, sans-serif`;
  const fs = options.fontSize;
  const lh = options.lineHeight;

  return `
:root {
  --editor-font-size: ${fs}pt;
  --editor-font-size-sm: ${fs * 0.9}pt;
  --editor-font-size-mono: ${fs * 0.85}pt;
  --editor-line-height: ${lh};
  --editor-line-height-px: ${fs * lh}pt;
  --cjk-letter-spacing: ${options.cjkLetterSpacing};
  --font-sans: ${fontStack};
}`;
}

/**
 * Force light theme CSS variables for PDF output.
 * This ensures readable output even when the app is in dark theme,
 * because captureThemeCSS() captures the current (possibly dark) computed values.
 */
function forceLightThemeCSS(): string {
  return `
:root {
  --bg-color: #ffffff;
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-tertiary: #f0f0f0;
  --text-color: #1a1a1a;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --text-tertiary: #999999;
  --primary-color: #0066cc;
  --border-color: #d5d4d4;
  --code-bg-color: #f5f5f5;
  --code-text-color: #1a1a1a;
  --code-border-color: #d5d4d4;
  --strong-color: rgb(63,86,99);
  --emphasis-color: rgb(91,4,17);
  --md-char-color: #777777;
  --table-border-color: #d5d4d4;
  --highlight-bg: #fff3a3;
  --highlight-text: inherit;
  --accent-primary: #0066cc;
  --accent-bg: rgba(0,102,204,0.1);
  --error-color: #cf222e;
  --warning-color: #9a6700;
  --success-color: #16a34a;
  --alert-note: #0969da;
  --alert-tip: #1a7f37;
  --alert-important: #8250df;
  --alert-warning: #9a6700;
  --alert-caution: #cf222e;
}`;
}

/**
 * Build lightweight HTML for the Rust WKWebView PDF renderer.
 *
 * No Paged.js — relies on WebKit's native print pipeline
 * (printOperationWithPrintInfo) which respects @page CSS rules
 * for page size, margins, and pagination. All CSS (including KaTeX)
 * is inlined so the off-screen WKWebView needs no network access.
 *
 * Note: @page margin boxes (@top-center, @bottom-center) are NOT
 * supported by WebKit's native print — headers/footers/page numbers
 * are only rendered in the Paged.js preview template.
 *
 * @coordinates-with renderer.rs — loads HTML via WKWebView, uses printOperationWithPrintInfo
 */
export function buildPdfExportHtml(
  content: string,
  themeCSS: string,
  contentCSS: string,
  options: PdfOptions,
): string {
  const pageCSS = buildPageCSS(options);
  const typographyCSS = buildTypographyCSS(options);
  const lightOverrides = forceLightThemeCSS();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PDF Export</title>
  <style>
/* KaTeX (bundled) */
${katexCSS}
  </style>
  <style>
${themeCSS}
${lightOverrides}
${typographyCSS}
${pageCSS}
${contentCSS}

body {
  background: white;
  color: #1a1a1a;
  margin: 0;
  padding: 0;
}
${sharedContentCSS()}
  </style>
</head>
<body>
  <div class="export-surface">
    <div class="export-surface-editor">
${content}
    </div>
  </div>
</body>
</html>`;
}

/**
 * Build a complete HTML document for PDF preview via Paged.js.
 *
 * @param content - Rendered HTML content (from ExportSurface)
 * @param themeCSS - Captured theme CSS variables (light theme only)
 * @param contentCSS - Editor content CSS styles
 * @param options - PDF configuration options
 * @returns Complete HTML string ready for iframe preview
 */
export function buildPdfHtml(
  content: string,
  themeCSS: string,
  contentCSS: string,
  options: PdfOptions,
): string {
  const pageCSS = buildPageCSS(options);
  const typographyCSS = buildTypographyCSS(options);
  const lightOverrides = forceLightThemeCSS();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rendering...</title>
  <style>
/* KaTeX (bundled) */
${katexCSS}
  </style>
  <style>
/* Theme Variables (captured from app) */
${themeCSS}

/* Force light theme for PDF — overrides any dark values above */
${lightOverrides}

/* Typography Overrides */
${typographyCSS}

/* Page Rules */
${pageCSS}

/* Content Styles */
${contentCSS}

/* PDF-specific overrides */
body {
  background: transparent;
  color: #1a1a1a;
  margin: 0;
  padding: 0;
}
/* No horizontal scroll; hide vertical scrollbar but keep programmatic scroll */
html, body {
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
html::-webkit-scrollbar,
body::-webkit-scrollbar {
  display: none;
}

/* Separate pages visually in preview (does not affect exported PDF) */
.pagedjs_page {
  background: white;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
}
${sharedContentCSS()}
  </style>
</head>
<body>
  <div class="export-surface">
    <div class="export-surface-editor">
${content}
    </div>
  </div>
  <script>
${pagedPolyfillRaw}
  </script>
  <script>
// Completion signal — notifies parent iframe that Paged.js rendering is done
class CompletionHandler extends Paged.Handler {
  afterRendered(pages) {
    document.title = "PDF Preview (" + pages.length + " pages)";
    // Notify parent iframe (for live preview in dialog)
    try {
      if (window.parent !== window) {
        window.parent.postMessage(
          {
            type: "pagedjs-complete",
            pageCount: pages.length,
            contentHeight: document.body.scrollHeight,
          },
          "*"
        );
      }
    } catch (e) {
      // Cross-origin restriction — ignore
    }
  }
}
Paged.registerHandlers(CompletionHandler);
  </script>
</body>
</html>`;
}
