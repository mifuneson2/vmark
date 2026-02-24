/**
 * PDF Export Dialog
 *
 * Full-screen modal with settings panel (left) and live preview (right).
 * Uses Paged.js for paginated preview in an iframe. Preview is always
 * light/white theme. Dialog chrome respects user's theme.
 *
 * @module export/PdfExportDialog
 * @coordinates-with pdfHtmlTemplate.ts — builds the HTML for preview and export
 * @coordinates-with pdf_export/commands.rs — Rust backend for final PDF generation
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";

import { buildPdfHtml, type PdfOptions } from "./pdfHtmlTemplate";
import { captureThemeCSS } from "./themeSnapshot";
import { getEditorContentCSS } from "./htmlExportStyles";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  SettingsGroup,
  SettingRow,
  Select,
  Toggle,
  Button,
  CloseButton,
} from "@/pages/settings/components";

import "./pdf-export-dialog.css";

// --- Page dimensions (px at 96dpi) ---

const PAGE_DIMS: Record<string, { w: number; h: number }> = {
  a4: { w: 794, h: 1123 },       // 210mm × 297mm
  letter: { w: 816, h: 1056 },   // 8.5in × 11in
  a3: { w: 1123, h: 1587 },      // 297mm × 420mm
  legal: { w: 816, h: 1344 },    // 8.5in × 14in
};

function getPageDims(size: string, orientation: string): { w: number; h: number } {
  const dims = PAGE_DIMS[size] ?? PAGE_DIMS.a4;
  return orientation === "landscape" ? { w: dims.h, h: dims.w } : dims;
}

// --- Option definitions ---

const PAGE_SIZE_OPTIONS = [
  { value: "a4" as const, label: "A4" },
  { value: "letter" as const, label: "Letter" },
  { value: "a3" as const, label: "A3" },
  { value: "legal" as const, label: "Legal" },
];

const ORIENTATION_OPTIONS = [
  { value: "portrait" as const, label: "Portrait" },
  { value: "landscape" as const, label: "Landscape" },
];

const MARGIN_OPTIONS = [
  { value: "normal" as const, label: "Normal" },
  { value: "narrow" as const, label: "Narrow" },
  { value: "wide" as const, label: "Wide" },
];

const FONT_SIZE_OPTIONS = [
  { value: "10", label: "10pt" },
  { value: "11", label: "11pt" },
  { value: "12", label: "12pt" },
  { value: "13", label: "13pt" },
  { value: "14", label: "14pt" },
];

const LINE_HEIGHT_OPTIONS = [
  { value: "1.4", label: "1.4" },
  { value: "1.6", label: "1.6" },
  { value: "1.8", label: "1.8" },
  { value: "2.0", label: "2.0" },
];

const CJK_SPACING_OPTIONS = [
  { value: "0", label: "Off" },
  { value: "0.02", label: "0.02em" },
  { value: "0.05", label: "0.05em" },
  { value: "0.08", label: "0.08em" },
];

const LATIN_FONT_OPTIONS = [
  { value: "system", label: "System Default" },
  { value: "athelas", label: "Athelas" },
  { value: "palatino", label: "Palatino" },
  { value: "georgia", label: "Georgia" },
  { value: "charter", label: "Charter" },
];

const CJK_FONT_OPTIONS = [
  { value: "system", label: "System Default" },
  { value: "pingfang", label: "PingFang SC" },
  { value: "songti", label: "Songti SC" },
  { value: "kaiti", label: "Kaiti SC" },
  { value: "notoserif", label: "Noto Serif CJK" },
];

// --- Types ---

interface PdfExportDialogProps {
  markdown: string;
  renderedHtml: string;
  defaultName?: string;
  sourceFilePath?: string | null;
  onClose: () => void;
}

// --- Component ---

function PdfExportDialog({
  renderedHtml,
  defaultName,
  onClose,
}: PdfExportDialogProps) {
  // Font choices inherited from user's editor settings
  const appearance = useSettingsStore.getState().appearance;

  const [options, setOptions] = useState<PdfOptions>({
    pageSize: "a4",
    orientation: "portrait",
    margins: "normal",
    showPageNumbers: true,
    showHeader: true,
    showFooter: false,
    title: defaultName?.replace(/\.[^.]+$/, "") ?? "Document",
    fontSize: 11,
    lineHeight: 1.6,
    cjkLetterSpacing: "0.05em",
    latinFont: appearance.latinFont,
    cjkFont: appearance.cjkFont,
  });

  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [previewScale, setPreviewScale] = useState(0.5);

  // Compute scale to fit page into preview container
  const pageDims = getPageDims(options.pageSize, options.orientation);

  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    const updateScale = () => {
      const rect = container.getBoundingClientRect();
      const padding = 32; // visual padding around the page
      const availW = rect.width - padding;
      const availH = rect.height - padding;
      if (availW <= 0 || availH <= 0) return;
      const scale = Math.min(availW / pageDims.w, availH / pageDims.h);
      setPreviewScale(Math.min(scale, 1)); // never upscale
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, [pageDims.w, pageDims.h]);

  // Capture theme CSS once (light theme values)
  const themeCSSRef = useRef(captureThemeCSS());
  const contentCSSRef = useRef(getEditorContentCSS());

  // Build HTML for the iframe
  const buildHtml = useCallback(() => {
    return buildPdfHtml(
      renderedHtml,
      themeCSSRef.current,
      contentCSSRef.current,
      options,
    );
  }, [renderedHtml, options]);

  // Update iframe on options change (debounced)
  useEffect(() => {
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const iframe = iframeRef.current;
      if (!iframe) return;
      iframe.srcdoc = buildHtml();
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [buildHtml]);

  // Listen for Paged.js completion messages from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      // Validate sender is our preview iframe
      if (
        e.data?.type === "pagedjs-complete" &&
        e.source === iframeRef.current?.contentWindow
      ) {
        setPageCount(e.data.pageCount ?? 0);
        setCurrentPage(1);
        setLoading(false);
        setPreviewError(false);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Preview timeout — if Paged.js doesn't complete in 30s, show error
  const [previewError, setPreviewError] = useState(false);
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setPreviewError(true);
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, [loading]);

  // Escape key closes dialog (blocked during export)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !exporting) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, exporting]);

  // Navigate to a specific page in the preview
  const goToPage = useCallback((page: number) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument) return;
    const pages = iframe.contentDocument.querySelectorAll(".pagedjs_page");
    const target = pages[page - 1];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      setCurrentPage(page);
    }
  }, []);

  // Export to PDF
  const handleExport = useCallback(async () => {
    try {
      setExporting(true);
      const outputPath = await save({
        defaultPath: `${options.title ?? "document"}.pdf`,
        title: "Export PDF",
        filters: [{ name: "PDF", extensions: ["pdf"] }],
      });
      if (!outputPath) {
        setExporting(false);
        return;
      }

      const html = buildHtml();
      await invoke("export_pdf", { html, outputPath });
      toast.success("PDF exported successfully");
      onClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(`PDF export failed: ${msg}`);
      setExporting(false);
    }
  }, [buildHtml, options.title, onClose]);

  // Update a single option
  const set = useCallback(
    <K extends keyof PdfOptions>(key: K, value: PdfOptions[K]) => {
      setOptions((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  return createPortal(
    <div className="pdf-export-overlay" onClick={exporting ? undefined : onClose}>
      <div className="pdf-export-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="pdf-export-header">
          <h2>Export PDF</h2>
          <CloseButton onClick={onClose} />
        </div>

        {/* Body */}
        <div className="pdf-export-body">
          {/* Settings sidebar */}
          <div className="pdf-export-sidebar">
            <SettingsGroup title="Page" className="mb-4">
              <SettingRow label="Size">
                <Select
                  value={options.pageSize}
                  options={PAGE_SIZE_OPTIONS}
                  onChange={(v) => set("pageSize", v)}
                />
              </SettingRow>
              <SettingRow label="Orientation">
                <Select
                  value={options.orientation}
                  options={ORIENTATION_OPTIONS}
                  onChange={(v) => set("orientation", v)}
                />
              </SettingRow>
              <SettingRow label="Margins">
                <Select
                  value={options.margins}
                  options={MARGIN_OPTIONS}
                  onChange={(v) => set("margins", v)}
                />
              </SettingRow>
            </SettingsGroup>

            <SettingsGroup title="Typography" className="mb-4">
              <SettingRow label="Font Size">
                <Select
                  value={String(options.fontSize)}
                  options={FONT_SIZE_OPTIONS}
                  onChange={(v) => set("fontSize", Number(v))}
                />
              </SettingRow>
              <SettingRow label="Line Height">
                <Select
                  value={String(options.lineHeight)}
                  options={LINE_HEIGHT_OPTIONS}
                  onChange={(v) => set("lineHeight", Number(v))}
                />
              </SettingRow>
              <SettingRow label="CJK Spacing">
                <Select
                  value={options.cjkLetterSpacing.replace("em", "")}
                  options={CJK_SPACING_OPTIONS}
                  onChange={(v) =>
                    set("cjkLetterSpacing", v === "0" ? "0" : `${v}em`)
                  }
                />
              </SettingRow>
              <SettingRow label="Latin Font">
                <Select
                  value={options.latinFont}
                  options={LATIN_FONT_OPTIONS}
                  onChange={(v) => set("latinFont", v)}
                />
              </SettingRow>
              <SettingRow label="CJK Font">
                <Select
                  value={options.cjkFont}
                  options={CJK_FONT_OPTIONS}
                  onChange={(v) => set("cjkFont", v)}
                />
              </SettingRow>
            </SettingsGroup>

            <SettingsGroup title="Elements" className="mb-4">
              <SettingRow label="Page Numbers">
                <Toggle
                  checked={options.showPageNumbers}
                  onChange={(v) => set("showPageNumbers", v)}
                />
              </SettingRow>
              <SettingRow label="Header">
                <Toggle
                  checked={options.showHeader}
                  onChange={(v) => set("showHeader", v)}
                />
              </SettingRow>
              <SettingRow label="Footer">
                <Toggle
                  checked={options.showFooter}
                  onChange={(v) => set("showFooter", v)}
                />
              </SettingRow>
            </SettingsGroup>
          </div>

          {/* Preview */}
          <div className="pdf-export-preview" ref={previewContainerRef}>
            {loading && (
              <div className="pdf-export-preview-loading">
                Rendering preview...
              </div>
            )}
            {previewError && (
              <div className="pdf-export-preview-loading">
                Preview failed to render. You can still export.
              </div>
            )}
            <div
              className="pdf-export-page-frame"
              style={{
                width: pageDims.w,
                height: pageDims.h,
                transform: `scale(${previewScale})`,
              }}
            >
              <iframe
                ref={iframeRef}
                title="PDF Preview"
                sandbox="allow-scripts"
              />
            </div>
            {pageCount > 0 && (
              <div className="pdf-export-page-nav">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => goToPage(currentPage - 1)}
                >
                  &#9664;
                </button>
                <span>
                  Page {currentPage} of {pageCount}
                </span>
                <button
                  disabled={currentPage >= pageCount}
                  onClick={() => goToPage(currentPage + 1)}
                >
                  &#9654;
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pdf-export-footer">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// --- Public API ---

/** Prevents opening multiple PDF export dialogs simultaneously. */
let dialogOpen = false;

/** Check if the PDF export dialog is currently open. */
export function isPdfDialogOpen(): boolean {
  return dialogOpen;
}

/** Imperative function to show the PDF export dialog. */
export function showPdfExportDialog(props: {
  markdown: string;
  renderedHtml: string;
  defaultName?: string;
  sourceFilePath?: string | null;
}): void {
  if (dialogOpen) return;
  dialogOpen = true;

  const container = document.createElement("div");
  document.body.appendChild(container);

  let closed = false;
  const cleanup = () => {
    if (closed) return;
    closed = true;
    dialogOpen = false;
    root.unmount();
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  };

  const root = createRoot(container);
  root.render(
    <PdfExportDialog
      markdown={props.markdown}
      renderedHtml={props.renderedHtml}
      defaultName={props.defaultName}
      sourceFilePath={props.sourceFilePath}
      onClose={cleanup}
    />,
  );
}
