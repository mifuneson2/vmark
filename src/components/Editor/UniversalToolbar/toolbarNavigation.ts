/**
 * Toolbar Navigation - Linear keyboard handling
 *
 * Pure functions for calculating focus positions during keyboard navigation.
 * Simplified to linear navigation only (no group-aware jumps).
 *
 * Per spec Section 3.1:
 * - ←/→ or Tab/Shift+Tab: Move through buttons linearly (skipping disabled)
 * - Home/End: Jump to first/last enabled button
 *
 * @module components/Editor/UniversalToolbar/toolbarNavigation
 */

/**
 * Find next focusable index in a direction, wrapping around.
 */
function findNextFocusableIndex(
  start: number,
  total: number,
  isFocusable: (index: number) => boolean,
  direction: 1 | -1
): number {
  /* v8 ignore next -- @preserve reason: total <= 0 guard; toolbar always has at least one button in tests */
  if (total <= 0) return 0;
  let index = start;

  for (let i = 0; i < total; i++) {
    index = (index + direction + total) % total;
    if (isFocusable(index)) return index;
  }

  // No focusable button found, stay at current
  return start;
}

/**
 * Get the next focusable button index (wrapping).
 * Used for → and Tab keys.
 */
export function getNextFocusableIndex(
  current: number,
  total: number,
  isFocusable: (index: number) => boolean
): number {
  return findNextFocusableIndex(current, total, isFocusable, 1);
}

/**
 * Get the previous focusable button index (wrapping).
 * Used for ← and Shift+Tab keys.
 */
export function getPrevFocusableIndex(
  current: number,
  total: number,
  isFocusable: (index: number) => boolean
): number {
  return findNextFocusableIndex(current, total, isFocusable, -1);
}

/**
 * Get the first focusable button index.
 * Used for Home key.
 */
export function getFirstFocusableIndex(
  total: number,
  isFocusable: (index: number) => boolean
): number {
  if (total <= 0) return 0;
  for (let i = 0; i < total; i++) {
    if (isFocusable(i)) return i;
  }
  return 0;
}

/**
 * Get the last focusable button index.
 * Used for End key.
 */
export function getLastFocusableIndex(
  total: number,
  isFocusable: (index: number) => boolean
): number {
  if (total <= 0) return 0;
  for (let i = total - 1; i >= 0; i--) {
    if (isFocusable(i)) return i;
  }
  return Math.max(0, total - 1);
}
