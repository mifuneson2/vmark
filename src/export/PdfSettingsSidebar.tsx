/**
 * PDF Export Settings Sidebar
 *
 * Left panel of the PDF export dialog with page, typography, and element options.
 *
 * @module export/PdfSettingsSidebar
 * @coordinates-with PdfExportDialog.tsx — parent component
 * @coordinates-with pdfHtmlTemplate.ts — PdfOptions type
 */

import type { PdfOptions } from "./pdfHtmlTemplate";
import { FileText, Type, Layers } from "lucide-react";
import {
  SettingRow,
  Select,
  Toggle,
} from "@/pages/settings/components";

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

// --- Components ---

function PdfSettingsGroup({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="pdf-settings-group">
      <div className="pdf-settings-group-icon">{icon}</div>
      <div className="pdf-settings-group-items">{children}</div>
    </div>
  );
}

interface PdfSettingsSidebarProps {
  options: PdfOptions;
  onOptionChange: <K extends keyof PdfOptions>(key: K, value: PdfOptions[K]) => void;
}

export function PdfSettingsSidebar({ options, onOptionChange: set }: PdfSettingsSidebarProps) {
  return (
    <div className="pdf-export-sidebar">
      <div data-tauri-drag-region className="pdf-export-drag-region" />
      <div className="pdf-export-sidebar-content">
        <PdfSettingsGroup icon={<FileText className="w-3.5 h-3.5" />}>
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
        </PdfSettingsGroup>

        <PdfSettingsGroup icon={<Type className="w-3.5 h-3.5" />}>
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
        </PdfSettingsGroup>

        <PdfSettingsGroup icon={<Layers className="w-3.5 h-3.5" />}>
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
          <SettingRow label="Date">
            <Toggle
              checked={options.showDate}
              onChange={(v) => set("showDate", v)}
            />
          </SettingRow>
        </PdfSettingsGroup>
      </div>
    </div>
  );
}
