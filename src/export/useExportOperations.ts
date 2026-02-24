/**
 * Export Operations
 *
 * Print: Renders content in a hidden iframe and invokes the OS print dialog.
 * HTML Export: Uses ExportSurface for visual-parity rendering.
 */

import { save } from "@tauri-apps/plugin-dialog";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { toast } from "sonner";
import { createRoot } from "react-dom/client";
import React from "react";

import { ExportSurface, type ExportSurfaceRef } from "./ExportSurface";
import { exportWarn } from "@/utils/debug";
import { exportHtml } from "./htmlExport";
import { waitForAssets } from "./waitForAssets";
import { captureThemeCSS } from "./themeSnapshot";
import { useSettingsStore } from "@/stores/settingsStore";
import { joinPath } from "@/utils/pathUtils";
import { showError, FileErrors } from "@/utils/errorDialog";

/** Timeout for waiting on assets (fonts, images, math, diagrams) */
const ASSET_WAIT_TIMEOUT = 10000;

/** Maximum time to wait for render before giving up */
const RENDER_TIMEOUT = 15000;

/**
 * Render markdown to HTML using ExportSurface.
 * Creates a temporary DOM element, renders ExportSurface, waits for stability,
 * then extracts the HTML.
 */
async function renderMarkdownToHtml(
  markdown: string,
  lightTheme: boolean = true
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Guard against multiple resolution (timeout vs callback race)
    let settled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    // Create temporary container
    const container = document.createElement("div");
    container.style.cssText = "position: absolute; left: -9999px; top: -9999px;";
    document.body.appendChild(container);

    const surfaceRef = React.createRef<ExportSurfaceRef>();

    const cleanup = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      root.unmount();
      document.body.removeChild(container);
    };

    const complete = (html: string) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(html);
    };

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    const handleReady = async () => {
      if (settled) return;
      try {
        // Wait for assets
        const surfaceContainer = surfaceRef.current?.getContainer();
        if (surfaceContainer) {
          await waitForAssets(surfaceContainer, { timeout: ASSET_WAIT_TIMEOUT });
        }

        // Extract HTML
        const html = surfaceRef.current?.getHTML() ?? "";
        complete(html);
      } catch (error) {
        fail(error instanceof Error ? error : new Error(String(error)));
      }
    };

    const handleError = (error: Error) => {
      fail(error);
    };

    // Render ExportSurface
    const root = createRoot(container);
    root.render(
      React.createElement(ExportSurface, {
        ref: surfaceRef,
        markdown,
        lightTheme,
        onReady: handleReady,
        onError: handleError,
      })
    );

    // Timeout fallback
    timeoutId = setTimeout(() => {
      if (settled) return;
      const html = surfaceRef.current?.getHTML();
      if (html) {
        complete(html);
      } else {
        fail(new Error("Export rendering timeout"));
      }
    }, RENDER_TIMEOUT);
  });
}

export interface ExportToHtmlOptions {
  /** Markdown content */
  markdown: string;
  /** Default folder name (document title) */
  defaultName?: string;
  /** Default parent directory */
  defaultDirectory?: string;
  /** Source file path for resource resolution */
  sourceFilePath?: string | null;
}

/**
 * Export markdown to HTML folder.
 *
 * Creates:
 * - DocumentName/index.html (external CSS/JS/images)
 * - DocumentName/standalone.html (all embedded)
 * - DocumentName/assets/ (CSS, JS, images)
 */
export async function exportToHtml(
  options: ExportToHtmlOptions
): Promise<boolean> {
  const {
    markdown,
    defaultName = "document",
    defaultDirectory,
    sourceFilePath,
  } = options;

  // Check for empty content
  const trimmedContent = markdown.trim();
  if (!trimmedContent) {
    toast.error("No content to export!");
    return false;
  }

  try {
    // User picks/creates a folder
    // Note: On macOS, the save panel requires a file-like path to populate the filename field.
    // We append a placeholder extension that will be stripped from the final folder name.
    const safeName = `${defaultName}.html`;
    const defaultPath = defaultDirectory
      ? joinPath(defaultDirectory, safeName)
      : safeName;

    const selectedPath = await save({
      defaultPath,
      title: "Export HTML",
      filters: [{ name: "HTML Export", extensions: ["html"] }],
    });

    if (!selectedPath) return false;

    // Strip the .html extension if present (user might have edited the name)
    const folderPath = selectedPath.replace(/\.html$/i, "");

    // Render markdown to HTML
    const html = await renderMarkdownToHtml(markdown, true);

    // Get font settings
    const settings = useSettingsStore.getState();
    const fontSettings = {
      fontFamily: settings.appearance.latinFont,
      monoFontFamily: settings.appearance.monoFont,
    };

    // Export with options
    const result = await exportHtml(html, {
      title: defaultName.replace(/\.[^.]+$/, ""),
      sourceFilePath,
      outputPath: folderPath,
      fontSettings,
      forceLightTheme: true,
    });

    if (!result.success) {
      throw new Error(result.error ?? "Export failed");
    }

    if (result.warnings.length > 0) {
      exportWarn("Warnings:", result.warnings);
      const count = result.warnings.length;
      toast.warning(
        count === 1
          ? "1 resource could not be included"
          : `${count} resources could not be included`
      );
    }

    toast.success("Exported to folder");
    return true;
  } catch (error) {
    console.error("[Export] Failed to export HTML:", error);
    await showError(FileErrors.exportFailed("HTML"));
    return false;
  }
}

/**
 * Rewrite asset:// URLs to file:// so the system browser can load local images.
 *
 * In the Tauri webview, images are served via `asset://localhost/path` or
 * `https://asset.localhost/path`. Browsers can't resolve these, but they can
 * load `file:///path` from a locally-opened HTML file.
 */
function rewriteAssetUrls(html: string): string {
  return html
    .replace(/asset:\/\/localhost/g, "file://")
    .replace(/https:\/\/asset\.localhost/g, "file://");
}

export interface ExportToPdfOptions {
  /** Markdown content */
  markdown: string;
  /** Default file name (document title) */
  defaultName?: string;
  /** Source file path for resource resolution */
  sourceFilePath?: string | null;
}

/**
 * Print: opens a self-contained HTML in the system browser for printing.
 * Works on all platforms via `window.print()`.
 */
export async function exportToPdf(options: ExportToPdfOptions): Promise<void> {
  const { markdown } = options;

  const trimmedContent = markdown.trim();
  if (!trimmedContent) {
    toast.error("No content to export!");
    return;
  }

  await exportToPdfBrowser(markdown);
}

/**
 * Export PDF: opens a preview dialog with Paged.js pagination, then exports
 * via WKWebView's native createPDF API (macOS only).
 */
export async function exportToPdfNative(options: ExportToPdfOptions): Promise<void> {
  const { markdown, defaultName, sourceFilePath } = options;

  const trimmedContent = markdown.trim();
  if (!trimmedContent) {
    toast.error("No content to export!");
    return;
  }

  const isMacOS = navigator.platform.includes("Mac");

  if (!isMacOS) {
    toast.error("Native PDF export requires macOS. Use Print instead.");
    return;
  }

  try {
    // Render markdown to HTML (always light theme)
    const renderedHtml = await renderMarkdownToHtml(markdown, true);

    // Resolve images to data URIs for self-contained HTML
    const { resolveResources, getDocumentBaseDir } = await import(
      "./resourceResolver"
    );
    const baseDir = sourceFilePath
      ? await getDocumentBaseDir(sourceFilePath)
      : "/";
    const { html: resolvedHtml } = await resolveResources(renderedHtml, {
      baseDir,
      mode: "single",
    });

    // Open PDF export in native window
    const { openPdfExportWindow } = await import("@/utils/pdfExportWindow");
    await openPdfExportWindow({
      renderedHtml: resolvedHtml,
      defaultName,
    });
  } catch (error) {
    console.error("[PDF] Failed to open PDF dialog:", error);
    toast.error("Failed to prepare PDF export");
  }
}

/**
 * Print via hidden iframe: grabs editor HTML, invokes OS print dialog directly.
 *
 * Reads the editor's rendered HTML from the DOM (no re-render needed).
 * Uses a hidden iframe with srcdoc so contentWindow.print() triggers the native
 * macOS/Windows print dialog within the Tauri webview.
 */
async function exportToPdfBrowser(_markdown: string): Promise<void> {
  try {
    // Grab the already-rendered HTML from the active editor
    const editorEl = document.querySelector(".ProseMirror");
    if (!editorEl) {
      toast.error("No editor content to print");
      return;
    }
    const html = editorEl.innerHTML;
    const themeCSS = captureThemeCSS();
    const { getEditorContentCSS } = await import("./htmlExportStyles");
    const contentCSS = getEditorContentCSS();
    const resolvedHtml = rewriteAssetUrls(html);

    const { getKatexCSS } = await import("./pdfHtmlTemplate");

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Print</title>
  <style>
${getKatexCSS()}
${themeCSS}
${contentCSS}

@media print {
  @page { margin: 1.5cm; }
  body { background: white; }
  .export-surface { max-width: none; padding: 0; }
  .export-surface-editor .table-scroll-wrapper { overflow-x: visible; }
  .export-surface-editor .table-scroll-wrapper table { width: 100% !important; table-layout: fixed; }
  .export-surface-editor td, .export-surface-editor th { overflow-wrap: break-word; word-break: break-word; }
  .export-surface-editor td img { max-width: 100%; height: auto; }
}
body { background: white; color: #1a1a1a; margin: 0; padding: 2em; }
  </style>
</head>
<body>
  <div class="export-surface">
    <div class="export-surface-editor">
${resolvedHtml}
    </div>
  </div>
</body>
</html>`;

    // Create hidden iframe, load content, invoke print dialog
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position: fixed; left: -9999px; top: -9999px; width: 0; height: 0;";
    document.body.appendChild(iframe);

    iframe.srcdoc = fullHtml;
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Print iframe load timeout"));
      }, 10000);

      iframe.onload = () => {
        clearTimeout(timeout);
        try {
          iframe.contentWindow?.print();
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)));
          return;
        }
        // Remove iframe after a short delay to let the print dialog finish
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
        resolve();
      };
    });
  } catch (error) {
    console.error("[Print] Failed to print:", error);
    toast.error("Failed to open print dialog");
  }
}

/**
 * Copy rendered HTML to clipboard.
 */
export async function copyAsHtml(
  markdown: string,
  includeStyles: boolean = false
): Promise<boolean> {
  try {
    // Render markdown to HTML
    const html = await renderMarkdownToHtml(markdown, true);

    if (includeStyles) {
      const themeCSS = captureThemeCSS();
      const styledHtml = `<style>${themeCSS}</style>\n${html}`;
      await writeText(styledHtml);
    } else {
      await writeText(html);
    }

    toast.success("HTML copied to clipboard");
    return true;
  } catch (error) {
    console.error("[Export] Failed to copy HTML:", error);
    await showError(FileErrors.copyFailed);
    return false;
  }
}

/**
 * Get rendered HTML from markdown (for programmatic use).
 */
export async function getRenderedHtml(
  markdown: string,
  lightTheme: boolean = true
): Promise<string> {
  return renderMarkdownToHtml(markdown, lightTheme);
}
