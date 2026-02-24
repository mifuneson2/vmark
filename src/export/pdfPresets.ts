/**
 * PDF Export Style Presets and Option Definitions
 *
 * Named style presets that bundle typography and margin settings into one-click choices.
 * Also contains all Select option definitions for the PDF settings sidebar.
 *
 * @module export/pdfPresets
 * @coordinates-with PdfSettingsSidebar.tsx — consumes presets and options
 * @coordinates-with pdfHtmlTemplate.ts — PdfOptions type, MARGIN_PRESETS
 */

import type { PdfOptions } from "./pdfHtmlTemplate";
import { MARGIN_PRESETS } from "./pdfHtmlTemplate";

// --- Style presets ---

export interface StylePreset {
  label: string;
  fontSize: number;
  lineHeight: number;
  latinFont: string;
  cjkFont: string;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
}

export const STYLE_PRESETS: Record<string, StylePreset> = {
  default: {
    label: "Default",
    fontSize: 11, lineHeight: 1.6,
    latinFont: "system", cjkFont: "system",
    marginTop: 25.4, marginRight: 25.4, marginBottom: 25.4, marginLeft: 25.4,
  },
  academic: {
    label: "Academic",
    fontSize: 12, lineHeight: 2.0,
    latinFont: "palatino", cjkFont: "songti",
    marginTop: 25.4, marginRight: 38.1, marginBottom: 25.4, marginLeft: 38.1,
  },
  compact: {
    label: "Compact",
    fontSize: 10, lineHeight: 1.4,
    latinFont: "system", cjkFont: "system",
    marginTop: 12.7, marginRight: 12.7, marginBottom: 12.7, marginLeft: 12.7,
  },
  elegant: {
    label: "Elegant",
    fontSize: 12, lineHeight: 1.8,
    latinFont: "athelas", cjkFont: "kaiti",
    marginTop: 25.4, marginRight: 25.4, marginBottom: 25.4, marginLeft: 25.4,
  },
};

export const STYLE_PRESET_OPTIONS = [
  ...Object.entries(STYLE_PRESETS).map(([value, p]) => ({ value, label: p.label })),
  { value: "custom", label: "Custom" },
];

// --- Preset detection ---

/** Detect which margin preset matches, or "custom". */
export function detectMarginPreset(options: PdfOptions): string {
  for (const [name, p] of Object.entries(MARGIN_PRESETS)) {
    if (
      options.marginTop === p.top &&
      options.marginRight === p.right &&
      options.marginBottom === p.bottom &&
      options.marginLeft === p.left
    ) return name;
  }
  return "custom";
}

/** Detect which style preset matches, or "custom". */
export function detectStylePreset(options: PdfOptions): string {
  for (const [name, p] of Object.entries(STYLE_PRESETS)) {
    if (
      options.fontSize === p.fontSize &&
      options.lineHeight === p.lineHeight &&
      options.latinFont === p.latinFont &&
      options.cjkFont === p.cjkFont &&
      options.marginTop === p.marginTop &&
      options.marginRight === p.marginRight &&
      options.marginBottom === p.marginBottom &&
      options.marginLeft === p.marginLeft
    ) return name;
  }
  return "custom";
}

// --- Select option arrays ---

export const PAGE_SIZE_OPTIONS = [
  { value: "a4" as const, label: "A4" },
  { value: "letter" as const, label: "Letter" },
  { value: "a3" as const, label: "A3" },
  { value: "legal" as const, label: "Legal" },
];

export const ORIENTATION_OPTIONS = [
  { value: "portrait" as const, label: "Portrait" },
  { value: "landscape" as const, label: "Landscape" },
];

export const MARGIN_PRESET_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "narrow", label: "Narrow" },
  { value: "wide", label: "Wide" },
  { value: "custom", label: "Custom" },
];

export const FONT_SIZE_OPTIONS = [
  { value: "10", label: "10pt" },
  { value: "11", label: "11pt" },
  { value: "12", label: "12pt" },
  { value: "13", label: "13pt" },
  { value: "14", label: "14pt" },
];

export const LINE_HEIGHT_OPTIONS = [
  { value: "1.4", label: "1.4" },
  { value: "1.6", label: "1.6" },
  { value: "1.8", label: "1.8" },
  { value: "2.0", label: "2.0" },
];

export const CJK_SPACING_OPTIONS = [
  { value: "0", label: "Off" },
  { value: "0.02", label: "0.02em" },
  { value: "0.05", label: "0.05em" },
  { value: "0.08", label: "0.08em" },
];

export const LATIN_FONT_OPTIONS = [
  { value: "system", label: "System Default" },
  { value: "athelas", label: "Athelas" },
  { value: "palatino", label: "Palatino" },
  { value: "georgia", label: "Georgia" },
  { value: "charter", label: "Charter" },
];

export const CJK_FONT_OPTIONS = [
  { value: "system", label: "System Default" },
  { value: "pingfang", label: "PingFang SC" },
  { value: "songti", label: "Songti SC" },
  { value: "kaiti", label: "Kaiti SC" },
  { value: "notoserif", label: "Noto Serif CJK" },
];
