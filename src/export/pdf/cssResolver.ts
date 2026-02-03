/**
 * CSS Resolver for PDF Export
 *
 * Transforms CSS with modern features into WeasyPrint-compatible CSS.
 */

import {
  CSS_VARIABLE_VALUES,
  ALERT_BACKGROUNDS,
  ALERT_ICONS,
  DETAILS_CHEVRON,
} from "./compatibility";

/**
 * Convert hex color to rgba with opacity.
 */
function hexToRgba(hex: string, opacity: number): string {
  // Remove # if present
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Resolve CSS variables to hardcoded values.
 *
 * @example
 * resolveCssVariables('color: var(--alert-note);')
 * // → 'color: #0969da;'
 */
export function resolveCssVariables(css: string): string {
  let result = css;

  // Sort by length descending to avoid partial replacements
  const variables = Object.entries(CSS_VARIABLE_VALUES).sort(
    (a, b) => b[0].length - a[0].length
  );

  for (const [variable, value] of variables) {
    // Match var(--name) and var(--name, fallback)
    const regex = new RegExp(
      `var\\(${variable.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:,\\s*[^)]+)?\\)`,
      "g"
    );
    result = result.replace(regex, value);
  }

  return result;
}

/**
 * Replace color-mix() with pre-computed rgba values.
 *
 * @example
 * resolveColorMix('background: color-mix(in srgb, var(--alert-note) 10%, transparent);')
 * // → 'background: rgba(9, 105, 218, 0.1);'
 */
export function resolveColorMix(css: string): string {
  // Pattern: color-mix(in srgb, <color-or-var> <percent>%, transparent)
  const colorMixPattern =
    /color-mix\(in srgb,\s*(?:var\((--[\w-]+)\)|([#\w]+))\s*(\d+)%,\s*transparent\)/g;

  return css.replace(colorMixPattern, (_, variable, directColor, percent) => {
    const opacity = parseInt(percent) / 100;

    if (variable) {
      // It's a CSS variable reference
      const baseColor = CSS_VARIABLE_VALUES[variable];
      if (baseColor && baseColor.startsWith("#")) {
        return hexToRgba(baseColor, opacity);
      }
    } else if (directColor) {
      // It's a direct color value
      if (directColor.startsWith("#")) {
        return hexToRgba(directColor, opacity);
      }
    }

    // Couldn't resolve, return original
    return _;
  });
}

/**
 * Get PDF-specific CSS overrides for alerts and details.
 * Replaces mask-image with background-image using pre-colored SVGs.
 */
export function getPdfAlertOverrides(): string {
  return `
/* ===========================================
   PDF Alert Overrides (WeasyPrint compatible)
   =========================================== */

/* Alert blocks - solid rgba backgrounds instead of color-mix */
.export-surface-editor .alert-note {
  --alert-border: #0969da;
  --alert-bg: ${ALERT_BACKGROUNDS.note};
  --alert-title: #0969da;
}

.export-surface-editor .alert-tip {
  --alert-border: #1a7f37;
  --alert-bg: ${ALERT_BACKGROUNDS.tip};
  --alert-title: #1a7f37;
}

.export-surface-editor .alert-important {
  --alert-border: #8250df;
  --alert-bg: ${ALERT_BACKGROUNDS.important};
  --alert-title: #8250df;
}

.export-surface-editor .alert-warning {
  --alert-border: #9a6700;
  --alert-bg: ${ALERT_BACKGROUNDS.warning};
  --alert-title: #9a6700;
}

.export-surface-editor .alert-caution {
  --alert-border: #cf222e;
  --alert-bg: ${ALERT_BACKGROUNDS.caution};
  --alert-title: #cf222e;
}

/* Alert icons - background-image instead of mask-image */
.export-surface-editor .alert-block .alert-title::before {
  background-color: transparent;
  -webkit-mask-image: none;
  mask-image: none;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.export-surface-editor .alert-note .alert-title::before {
  background-image: ${ALERT_ICONS.note};
}

.export-surface-editor .alert-tip .alert-title::before {
  background-image: ${ALERT_ICONS.tip};
}

.export-surface-editor .alert-important .alert-title::before {
  background-image: ${ALERT_ICONS.important};
}

.export-surface-editor .alert-warning .alert-title::before {
  background-image: ${ALERT_ICONS.warning};
}

.export-surface-editor .alert-caution .alert-title::before {
  background-image: ${ALERT_ICONS.caution};
}

/* Details chevron - background-image instead of mask-image */
.export-surface-editor .details-block > summary::before,
.export-surface-editor .details-summary::before {
  background-color: transparent;
  -webkit-mask-image: none;
  mask-image: none;
  background-image: ${DETAILS_CHEVRON};
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

/* Explicit border-radius (WeasyPrint needs hardcoded values) */
.export-surface-editor .alert-block {
  border-radius: 6px;
}

.export-surface-editor .details-block {
  border-radius: 6px;
  overflow: visible;
}

.export-surface-editor .code-block-wrapper {
  border-radius: 6px;
  overflow: hidden;
}

.export-surface-editor pre {
  border-radius: 6px;
}

.export-surface-editor code {
  border-radius: 3px;
}
`.trim();
}

/**
 * Get PDF-specific CSS overrides for layout and page breaks.
 */
export function getPdfLayoutOverrides(): string {
  return `
/* ===========================================
   PDF Layout Overrides
   =========================================== */

/* Hide line numbers in code blocks */
.export-surface-editor .code-line-numbers {
  display: none !important;
}

.export-surface-editor .code-block-wrapper pre {
  padding-left: 1em;
}

/* Page break controls */
h1, h2, h3 {
  page-break-after: avoid;
  break-after: avoid;
}

pre, .code-block-wrapper, table, .alert-block, .details-block {
  page-break-inside: avoid;
  break-inside: avoid;
}

p {
  orphans: 3;
  widows: 3;
}

/* TOC page break */
.pdf-toc {
  page-break-after: always;
  break-after: page;
}
`.trim();
}

/**
 * Apply all PDF transformations to CSS.
 */
export function transformCssForPdf(css: string): string {
  let result = css;

  // Step 1: Resolve CSS variables
  result = resolveCssVariables(result);

  // Step 2: Resolve color-mix()
  result = resolveColorMix(result);

  // Step 3: Add PDF-specific overrides
  result += "\n\n" + getPdfAlertOverrides();
  result += "\n\n" + getPdfLayoutOverrides();

  return result;
}
