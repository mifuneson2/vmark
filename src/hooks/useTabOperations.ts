/**
 * Tab Operations (Hooks Layer)
 *
 * Purpose: Async tab lifecycle functions with side effects — close with
 *   dirty check, orphan image cleanup, and history clearing.
 *
 * Key decisions:
 *   - Lives in hooks/ (not utils/) because it has Tauri dialog + store side effects
 *   - Orphan image cleanup runs only on explicitly closed tabs (not discarded)
 *   - On macOS, closes the window when the last tab is closed (standard behavior)
 *   - On Windows/Linux, creates a new untitled tab instead of closing the window
 *   - Pure close decision logic delegated to utils/closeDecision.ts
 *   - Re-entry guard (closingTabIds) prevents duplicate save prompts when
 *     Cmd+W fires both keydown and menu:close concurrently
 *
 * @coordinates-with closeSave.ts — promptSaveForDirtyDocument dialog
 * @coordinates-with tabStore.ts — removeTab mutations
 * @coordinates-with workspaceSession.ts — persists session before closing window
 * @coordinates-with useUnifiedHistory.ts — clearDocumentHistory on close
 * @module hooks/useTabOperations
 */

import { fileOpsError } from "@/utils/debug";
import { promptSaveForDirtyDocument } from "@/hooks/closeSave";
import { useTabStore } from "@/stores/tabStore";
import { useDocumentStore } from "@/stores/documentStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { findOrphanedImages, deleteOrphanedImages } from "@/utils/orphanAssetCleanup";
import { clearDocumentHistory } from "@/hooks/useUnifiedHistory";
import { invoke } from "@tauri-apps/api/core";
import { persistWorkspaceSession } from "@/hooks/workspaceSession";
import { createUntitledTab } from "@/utils/newFile";
import { isMacPlatform } from "@/utils/shortcutMatch";

/**
 * Clean up orphaned images for a document if setting is enabled.
 * Only runs on saved documents (not discarded changes).
 */
async function cleanupOrphansIfEnabled(
  filePath: string | null,
  content: string
): Promise<void> {
  if (!filePath) return;

  const { cleanupOrphansOnClose } = useSettingsStore.getState().image;
  if (!cleanupOrphansOnClose) return;

  try {
    const result = await findOrphanedImages(filePath, content);
    if (result.orphanedImages.length > 0) {
      await deleteOrphanedImages(result.orphanedImages);
    }
  } catch (error) {
    // Silent failure - don't block close for cleanup errors
    fileOpsError("OrphanCleanup error during close cleanup:", error);
  }
}

/**
 * Handle empty window after last tab is closed.
 * macOS: close the window (standard macOS behavior — app stays in dock).
 * Windows/Linux: create a new untitled tab (users expect the window to persist).
 */
async function closeWindowIfEmpty(windowLabel: string): Promise<void> {
  /* v8 ignore start -- tabs[windowLabel] always exists when called after a tab close; ?? [] is defensive */
  const remaining = useTabStore.getState().tabs[windowLabel] ?? [];
  /* v8 ignore stop */
  if (remaining.length === 0) {
    if (isMacPlatform()) {
      await persistWorkspaceSession(windowLabel);
      useTabStore.getState().removeWindow(windowLabel);
      await invoke("close_window", { label: windowLabel });
    } else {
      createUntitledTab(windowLabel);
    }
  }
}

/**
 * Tabs currently being closed — prevents duplicate save prompts when Cmd+W
 * fires both keydown (useTabShortcuts) and menu:close (useWindowClose).
 */
const closingTabIds = new Set<string>();

/**
 * Close a tab with dirty check. If the document has unsaved changes,
 * prompts the user to save, don't save, or cancel.
 * If the last tab is closed, the window is closed (macOS standard behavior).
 *
 * Re-entrant calls for the same tabId are treated as no-ops (returns true).
 *
 * @returns true if tab was closed, false if user cancelled
 */
export async function closeTabWithDirtyCheck(
  windowLabel: string,
  tabId: string
): Promise<boolean> {
  // Re-entry guard: another close for this tab is already in progress
  if (closingTabIds.has(tabId)) return true;

  const doc = useDocumentStore.getState().getDocument(tabId);
  const tab = useTabStore.getState().tabs[windowLabel]?.find((t) => t.id === tabId);

  // Tab or document doesn't exist - treat as already closed
  if (!doc || !tab) return true;

  closingTabIds.add(tabId);
  try {
    // If not dirty, clean up orphans and close immediately
    if (!doc.isDirty) {
      await cleanupOrphansIfEnabled(doc.filePath, doc.content);
      useTabStore.getState().closeTab(windowLabel, tabId);
      useDocumentStore.getState().removeDocument(tabId);
      clearDocumentHistory(tabId);
      await closeWindowIfEmpty(windowLabel);
      return true;
    }

    // Prompt user for dirty document
    const result = await promptSaveForDirtyDocument({
      windowLabel,
      tabId,
      title: doc.filePath || tab.title,
      filePath: doc.filePath,
      content: doc.content,
    });

    if (result.action === "cancelled") {
      return false;
    }

    // If user saved, clean up orphans based on saved content
    // If user discarded, don't clean up (would delete based on unsaved changes)
    if (result.action === "saved") {
      // Re-fetch document content after save
      const savedDoc = useDocumentStore.getState().getDocument(tabId);
      if (savedDoc) {
        await cleanupOrphansIfEnabled(savedDoc.filePath, savedDoc.content);
      }
    }

    // Proceed to close
    useTabStore.getState().closeTab(windowLabel, tabId);
    useDocumentStore.getState().removeDocument(tabId);
    clearDocumentHistory(tabId);
    await closeWindowIfEmpty(windowLabel);
    return true;
  } finally {
    closingTabIds.delete(tabId);
  }
}

/**
 * Close multiple tabs with dirty checks.
 * Prompts for each dirty tab. If user cancels any, stops and returns false.
 *
 * @returns true if all tabs were closed, false if user cancelled any
 */
export async function closeTabsWithDirtyCheck(
  windowLabel: string,
  tabIds: string[]
): Promise<boolean> {
  for (const tabId of tabIds) {
    const closed = await closeTabWithDirtyCheck(windowLabel, tabId);
    if (!closed) {
      return false; // User cancelled - stop closing
    }
  }
  return true;
}
