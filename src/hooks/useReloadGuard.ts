/**
 * Reload Guard Hook
 *
 * Purpose: Prevents page reload in the webview. Reload is not a valid
 *   desktop app action — it destroys all in-memory state (undo history,
 *   editor instances, store data) even when no documents are dirty.
 *
 * Behavior:
 *   - Production: blocks ALL reload triggers unconditionally
 *     (Cmd+R, Ctrl+R, Ctrl+Shift+R, beforeunload, and the native
 *     webview context menu which includes "Reload").
 *   - Dev: only warns via beforeunload when documents are dirty,
 *     so developers can still use Cmd+R to refresh during development.
 *
 * Note: F5 is NOT blocked — it is used as the Source Peek shortcut.
 * Tauri's webview does not reload on bare F5 (unlike browsers).
 *
 * @coordinates-with reloadGuard.ts — pure logic for shouldBlockReload (dev mode)
 * @module hooks/useReloadGuard
 */

import { useEffect } from "react";
import { useDocumentStore } from "@/stores/documentStore";
import { shouldBlockReload, getReloadWarningMessage, isReloadShortcut, isTerminalFocused } from "@/utils/reloadGuard";

/**
 * Production guard: block all reload triggers unconditionally.
 *
 * Blocks keyboard shortcuts (Cmd+R, Ctrl+R), beforeunload, and the
 * native webview context menu (which includes a "Reload" option on macOS).
 */
function useProductionReloadGuard(): void {
  useEffect(() => {
    const blockKeyboard = (e: KeyboardEvent) => {
      if (isReloadShortcut(e) && !isTerminalFocused()) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const blockBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    // Block the native webview context menu (contains "Reload" on macOS).
    // Custom context menus (table, image) call stopPropagation() so this
    // global handler won't interfere with them.
    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Capture phase to intercept before anything else handles it
    window.addEventListener("keydown", blockKeyboard, true);
    window.addEventListener("beforeunload", blockBeforeUnload);
    window.addEventListener("contextmenu", blockContextMenu);

    return () => {
      window.removeEventListener("keydown", blockKeyboard, true);
      window.removeEventListener("beforeunload", blockBeforeUnload);
      window.removeEventListener("contextmenu", blockContextMenu);
    };
  }, []);
}

/**
 * Dev guard: only warn when documents are dirty (preserves Cmd+R for refresh).
 */
function useDevReloadGuard(): void {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent): string | undefined => {
      const dirtyTabIds = useDocumentStore.getState().getAllDirtyDocuments();
      const result = shouldBlockReload({ dirtyTabIds });

      if (result.shouldBlock) {
        event.preventDefault();
        event.returnValue = "";
        return getReloadWarningMessage(result.count);
      }

      return undefined;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);
}

/**
 * Hook to prevent page reload in the webview.
 *
 * Production: blocks all reload triggers (keyboard shortcuts + beforeunload).
 * Dev: warns only when documents have unsaved changes.
 */
export function useReloadGuard(): void {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useDevReloadGuard();
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useProductionReloadGuard();
  }
}
