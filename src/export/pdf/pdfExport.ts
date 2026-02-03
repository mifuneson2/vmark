/**
 * PDF Export
 *
 * Generates HTML optimized for WeasyPrint PDF conversion.
 * Uses modular CSS with WeasyPrint-compatible transformations.
 */

import { invoke } from "@tauri-apps/api/core";
import { captureThemeCSS } from "../themeSnapshot";
import { resolveResources, getDocumentBaseDir } from "../resourceResolver";
import { transformCssForPdf } from "./cssResolver";
import { transformAllSvgs } from "./svgTransformer";
import { generateTOC, type TOCOptions } from "./tocGenerator";

// Import CSS files as raw strings (Vite ?raw import)
import contentCss from "../styles/content.css?raw";
import alertCss from "../styles/alert.css?raw";
import syntaxCss from "../styles/syntax.css?raw";
import tocCss from "../styles/toc.css?raw";

export interface PdfExportOptions {
  /** Document title */
  title?: string;
  /** Source file path (for resource resolution) */
  sourceFilePath?: string | null;
  /** Include table of contents */
  includeToc?: boolean;
  /** TOC options */
  tocOptions?: TOCOptions;
}

export interface PdfExportResult {
  /** Whether export succeeded */
  success: boolean;
  /** Output PDF path */
  pdfPath: string;
  /** Warning messages */
  warnings: string[];
  /** Error message (if failed) */
  error?: string;
}

/**
 * Check if WeasyPrint is available on the system.
 */
export async function checkWeasyprint(): Promise<boolean> {
  try {
    return await invoke<boolean>("check_weasyprint");
  } catch {
    return false;
  }
}

/**
 * Get WeasyPrint version string.
 */
export async function getWeasyprintVersion(): Promise<string | null> {
  try {
    return await invoke<string>("get_weasyprint_version");
  } catch {
    return null;
  }
}

/**
 * Sanitize HTML by removing editor-specific artifacts.
 */
function sanitizeExportHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const container = doc.body.firstElementChild as HTMLElement;

  // Remove ProseMirror internal elements
  container
    .querySelectorAll(".ProseMirror-separator, .ProseMirror-trailingBreak")
    .forEach((el) => el.remove());

  // Remove hidden HTML preview blocks
  container
    .querySelectorAll(".html-preview-block, .html-preview-inline")
    .forEach((el) => el.remove());

  // Remove editor-specific attributes
  const editorAttrs = [
    "contenteditable",
    "draggable",
    "sourceline",
    "data-render-mode",
  ];

  container.querySelectorAll("*").forEach((el) => {
    editorAttrs.forEach((attr) => el.removeAttribute(attr));

    // Clean up inline styles
    const style = el.getAttribute("style");
    if (style) {
      const cleanStyle = style.replace(/display:\s*none;?/gi, "").trim();
      if (cleanStyle) {
        el.setAttribute("style", cleanStyle);
      } else {
        el.removeAttribute("style");
      }
    }
  });

  // Clean empty paragraphs
  container.querySelectorAll("p").forEach((p) => {
    if (p.innerHTML.trim() === "" || p.innerHTML === "<br>") {
      p.innerHTML = "";
    }
  });

  return container.innerHTML;
}

/**
 * Escape HTML special characters.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Combine all CSS for PDF export.
 */
function getPdfCss(): string {
  const baseCss = [contentCss, alertCss, syntaxCss, tocCss].join("\n\n");

  // Capture current theme CSS variables
  const themeCss = captureThemeCSS();

  // Combine and transform for WeasyPrint
  const combinedCss = `${themeCss}\n\n${baseCss}`;
  return transformCssForPdf(combinedCss);
}

/**
 * Generate PDF-compatible HTML document.
 */
function generatePdfHtml(
  content: string,
  options: {
    title: string;
    css: string;
    toc?: string;
  }
): string {
  const { title, css, toc = "" } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" crossorigin="anonymous">
  <style>
${css}
  </style>
</head>
<body>
  <div class="export-surface">
    <div class="export-surface-editor">
${toc}
${content}
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate PDF HTML string optimized for WeasyPrint.
 *
 * This function:
 * 1. Sanitizes HTML content
 * 2. Resolves resources (images become data URIs)
 * 3. Transforms CSS for WeasyPrint compatibility
 * 4. Transforms SVGs (foreignObject → text)
 * 5. Optionally adds table of contents
 *
 * @param html - Rendered HTML from ExportSurface
 * @param options - Export options
 * @returns PDF-ready HTML string
 */
export async function generatePdfCompatibleHtml(
  html: string,
  options: PdfExportOptions = {}
): Promise<{ html: string; warnings: string[] }> {
  const {
    title = "Document",
    sourceFilePath,
    includeToc = false,
    tocOptions = { maxDepth: 2 },
  } = options;

  const warnings: string[] = [];

  // Sanitize HTML
  const sanitizedHtml = sanitizeExportHtml(html);

  // Resolve resources (embed images as data URIs)
  const baseDir = await getDocumentBaseDir(sourceFilePath ?? null);
  const { html: resolvedHtml, report } = await resolveResources(sanitizedHtml, {
    baseDir,
    mode: "single", // Embed as data URIs
  });

  if (report.missing.length > 0) {
    warnings.push(`${report.missing.length} resource(s) not found`);
  }

  // Parse resolved HTML for further processing
  const parser = new DOMParser();
  const doc = parser.parseFromString(
    `<div class="export-surface-editor">${resolvedHtml}</div>`,
    "text/html"
  );
  const container = doc.body.firstElementChild as HTMLElement;

  // Transform SVGs for WeasyPrint
  const svgCount = transformAllSvgs(doc);
  if (svgCount > 0) {
    console.log(`[PDF Export] Transformed ${svgCount} SVG(s) for WeasyPrint`);
  }

  // Generate TOC if requested
  let tocHtml = "";
  if (includeToc) {
    tocHtml = generateTOC(doc, tocOptions);
    if (tocHtml) {
      console.log(`[PDF Export] Generated TOC`);
    }
  }

  // Get transformed CSS
  const css = getPdfCss();

  // Get final HTML content
  const finalContent = container.innerHTML;

  // Generate complete HTML document
  const pdfHtml = generatePdfHtml(finalContent, {
    title,
    css,
    toc: tocHtml,
  });

  return { html: pdfHtml, warnings };
}

/**
 * Export HTML to PDF using WeasyPrint.
 *
 * @param html - Rendered HTML from ExportSurface
 * @param pdfPath - Output PDF file path
 * @param options - Export options
 * @returns Export result
 */
export async function exportToPdf(
  html: string,
  pdfPath: string,
  options: PdfExportOptions = {}
): Promise<PdfExportResult> {
  try {
    // Generate PDF-compatible HTML
    const { html: pdfHtml, warnings } = await generatePdfCompatibleHtml(
      html,
      options
    );

    // Convert to PDF via Rust backend
    await invoke<string>("convert_html_string_to_pdf", {
      htmlContent: pdfHtml,
      pdfPath,
    });

    return {
      success: true,
      pdfPath,
      warnings,
    };
  } catch (error) {
    return {
      success: false,
      pdfPath,
      warnings: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
