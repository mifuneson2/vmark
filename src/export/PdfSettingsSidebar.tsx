/**
 * PDF Export Settings Sidebar
 *
 * Right panel of the PDF export dialog with page, typography, and element options.
 * Includes a visual page margin diagram and the Export button at the bottom.
 *
 * @module export/PdfSettingsSidebar
 * @coordinates-with PdfExportDialog.tsx — parent component
 * @coordinates-with pdfHtmlTemplate.ts — PdfOptions type, MARGIN_PRESETS
 */

import { useState, useCallback } from "react";
import { type PdfOptions, MARGIN_PRESETS } from "./pdfHtmlTemplate";
import { FileText, Type, Layers } from "lucide-react";
import {
  SettingRow,
  Select,
  Toggle,
  Button,
} from "@/pages/settings/components";

import "./pdf-margin-layout.css";

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

const MARGIN_PRESET_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "narrow", label: "Narrow" },
  { value: "wide", label: "Wide" },
  { value: "custom", label: "Custom" },
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

// --- Helpers ---

/** Detect which preset matches the current margin values, or "custom". */
function detectMarginPreset(options: PdfOptions): string {
  for (const [name, p] of Object.entries(MARGIN_PRESETS)) {
    if (
      options.marginTop === p.top &&
      options.marginRight === p.right &&
      options.marginBottom === p.bottom &&
      options.marginLeft === p.left
    ) {
      return name;
    }
  }
  return "custom";
}

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

/** Visual page margin diagram with editable mm inputs on all 4 sides. */
function MarginLayoutDiagram({
  top,
  right,
  bottom,
  left,
  landscape,
  onChange,
}: {
  top: number;
  right: number;
  bottom: number;
  left: number;
  landscape: boolean;
  onChange: (side: "marginTop" | "marginRight" | "marginBottom" | "marginLeft", value: number) => void;
}) {
  const handleChange = (side: "marginTop" | "marginRight" | "marginBottom" | "marginLeft", raw: string) => {
    const v = parseFloat(raw);
    if (!Number.isNaN(v) && v >= 0 && v <= 100) {
      onChange(side, Math.round(v * 10) / 10);
    }
  };

  return (
    <div className="margin-layout">
      <div className="margin-layout-top">
        <input
          type="number"
          className="margin-layout-input"
          value={top}
          min={0}
          max={100}
          step={1}
          onChange={(e) => handleChange("marginTop", e.target.value)}
        />
      </div>
      <div className="margin-layout-middle">
        <input
          type="number"
          className="margin-layout-input"
          value={left}
          min={0}
          max={100}
          step={1}
          onChange={(e) => handleChange("marginLeft", e.target.value)}
        />
        <div className={`margin-layout-page ${landscape ? "margin-layout-page--landscape" : ""}`} />
        <input
          type="number"
          className="margin-layout-input"
          value={right}
          min={0}
          max={100}
          step={1}
          onChange={(e) => handleChange("marginRight", e.target.value)}
        />
      </div>
      <div className="margin-layout-bottom">
        <input
          type="number"
          className="margin-layout-input"
          value={bottom}
          min={0}
          max={100}
          step={1}
          onChange={(e) => handleChange("marginBottom", e.target.value)}
        />
      </div>
      <span className="margin-layout-unit">mm</span>
    </div>
  );
}

// --- Main sidebar ---

interface PdfSettingsSidebarProps {
  options: PdfOptions;
  onOptionChange: <K extends keyof PdfOptions>(key: K, value: PdfOptions[K]) => void;
  onExport: () => void;
  exporting: boolean;
  exportStage: string;
}

export function PdfSettingsSidebar({ options, onOptionChange: set, onExport, exporting, exportStage }: PdfSettingsSidebarProps) {
  const [marginPreset, setMarginPreset] = useState(() => detectMarginPreset(options));

  const handlePresetChange = useCallback((preset: string) => {
    setMarginPreset(preset);
    const p = MARGIN_PRESETS[preset];
    if (p) {
      set("marginTop", p.top);
      set("marginRight", p.right);
      set("marginBottom", p.bottom);
      set("marginLeft", p.left);
    }
  }, [set]);

  const handleMarginChange = useCallback(
    (side: "marginTop" | "marginRight" | "marginBottom" | "marginLeft", value: number) => {
      set(side, value);
      // After changing an individual margin, re-detect preset
      const next = { ...options, [side]: value };
      for (const [name, p] of Object.entries(MARGIN_PRESETS)) {
        if (next.marginTop === p.top && next.marginRight === p.right &&
            next.marginBottom === p.bottom && next.marginLeft === p.left) {
          setMarginPreset(name);
          return;
        }
      }
      setMarginPreset("custom");
    },
    [set, options],
  );

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
              value={marginPreset}
              options={MARGIN_PRESET_OPTIONS}
              onChange={handlePresetChange}
            />
          </SettingRow>
          <MarginLayoutDiagram
            top={options.marginTop}
            right={options.marginRight}
            bottom={options.marginBottom}
            left={options.marginLeft}
            landscape={options.orientation === "landscape"}
            onChange={handleMarginChange}
          />
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
      <div className="pdf-export-action-bar">
        <Button
          variant="primary"
          size="sm"
          onClick={onExport}
          disabled={exporting}
        >
          {exporting ? exportStage || "Exporting…" : "Export PDF"}
        </Button>
      </div>
    </div>
  );
}
