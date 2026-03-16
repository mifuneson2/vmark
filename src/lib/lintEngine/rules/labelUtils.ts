/**
 * CommonMark label normalization utilities.
 *
 * Purpose: Shared helper for normalizing reference/definition labels
 * per the CommonMark spec (case-insensitive, whitespace-collapsed).
 */

/**
 * Normalize a CommonMark reference label.
 * Lowercase + collapse internal whitespace + trim.
 */
export function normalizeLabel(label: string): string {
  return label.toLowerCase().replace(/\s+/g, " ").trim();
}
