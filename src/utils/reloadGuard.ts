/**
 * Reload Guard Logic
 *
 * Purpose: Pure helpers for reload prevention. Includes dirty-document
 *   checks (dev mode) and keyboard shortcut detection (production mode).
 *
 * @coordinates-with closeDecision.ts — similar dirty-check logic for window close
 * @coordinates-with documentStore.ts — provides dirty tab IDs
 * @coordinates-with useReloadGuard.ts — hook that consumes these helpers
 * @module utils/reloadGuard
 */

/**
 * Input for reload guard check
 */
export interface ReloadGuardInput {
  /** List of dirty document tab IDs */
  dirtyTabIds: string[];
}

/**
 * Result of reload guard check
 */
export type ReloadGuardResult =
  | { shouldBlock: true; reason: "unsaved_changes"; count: number }
  | { shouldBlock: false };

/**
 * Determine if page reload should be blocked.
 *
 * @param input - Current dirty document state
 * @returns Whether reload should be blocked and why
 */
export function shouldBlockReload(input: ReloadGuardInput): ReloadGuardResult {
  const { dirtyTabIds } = input;

  if (dirtyTabIds.length > 0) {
    return {
      shouldBlock: true,
      reason: "unsaved_changes",
      count: dirtyTabIds.length,
    };
  }

  return { shouldBlock: false };
}

/**
 * Get the warning message for unsaved changes.
 *
 * @param count - Number of unsaved documents
 * @returns User-friendly warning message
 */
export function getReloadWarningMessage(count: number): string {
  if (count === 1) {
    return "You have unsaved changes. Are you sure you want to leave?";
  }
  return `You have ${count} documents with unsaved changes. Are you sure you want to leave?`;
}

/**
 * Check if a keyboard event is a browser/webview reload shortcut.
 *
 * Detected shortcuts:
 *   - F5
 *   - Cmd+R / Ctrl+R
 *   - Cmd+Shift+R / Ctrl+Shift+R
 */
export function isReloadShortcut(e: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey">): boolean {
  if (e.key === "F5") return true;
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "r") return true;
  return false;
}
