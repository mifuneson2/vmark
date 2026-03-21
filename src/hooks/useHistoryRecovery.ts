/**
 * History Recovery (Hooks Layer)
 *
 * Purpose: Bulk-clearing operations for document history —
 *   deletes history per-document or per-workspace, or permanently clears all history.
 *
 * Key decisions:
 *   - Permanent delete removes both index and all snapshot files
 *   - Workspace clearing uses normalizePath + isWithinRoot for path matching
 *
 * @coordinates-with useHistoryOperations.ts — creates/manages active history
 * @coordinates-with historyTypes.ts — shared types and folder constants
 * @module hooks/useHistoryRecovery
 */

import {
  exists,
  readTextFile,
  readDir,
  remove,
} from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import { historyLog, historyError } from "@/utils/debug";
import {
  INDEX_FILE,
  hashPath,
  parseHistoryIndex,
} from "@/utils/historyTypes";
import { normalizePath, isWithinRoot } from "@/utils/paths/paths";
import { getHistoryBaseDir } from "@/hooks/useHistoryOperations";

/**
 * Permanently delete history for a document
 */
export async function deleteHistory(pathHash: string): Promise<void> {
  try {
    const baseDir = await getHistoryBaseDir();
    const historyDir = await join(baseDir, pathHash);

    if (await exists(historyDir)) {
      await remove(historyDir, { recursive: true });
      historyLog("Deleted history for:", pathHash);
    }
  } catch (error) {
    historyError("Failed to delete history:", error);
  }
}

/**
 * Clear all history
 */
export async function clearAllHistory(): Promise<void> {
  try {
    const baseDir = await getHistoryBaseDir();
    if (await exists(baseDir)) {
      await remove(baseDir, { recursive: true });
      historyLog("Cleared all history");
    }
  } catch (error) {
    historyError("Failed to clear all history:", error);
  }
}

/**
 * Delete all history for a specific document by its file path
 */
export async function deleteDocumentHistory(
  documentPath: string
): Promise<void> {
  try {
    const hash = await hashPath(documentPath);
    await deleteHistory(hash);
  } catch (error) {
    historyError("Failed to delete document history:", error);
  }
}

/**
 * Clear history for all documents within a workspace root path.
 * Returns the number of document histories deleted.
 */
export async function clearWorkspaceHistory(
  workspaceRootPath: string
): Promise<number> {
  try {
    if (!workspaceRootPath.trim()) return 0;

    const baseDir = await getHistoryBaseDir();
    if (!(await exists(baseDir))) return 0;

    const entries = await readDir(baseDir);
    let count = 0;

    for (const entry of entries) {
      if (!entry.isDirectory) continue;

      try {
        const indexPath = await join(baseDir, entry.name, INDEX_FILE);
        if (!(await exists(indexPath))) continue;

        const content = await readTextFile(indexPath);
        const index = parseHistoryIndex(JSON.parse(content));
        if (!index) continue;

        const docPath = normalizePath(index.documentPath);
        const rootPath = normalizePath(workspaceRootPath);

        if (isWithinRoot(rootPath, docPath)) {
          await deleteHistory(entry.name);
          count++;
        }
      } catch {
        // Skip invalid entries
      }
    }

    historyLog(`Cleared workspace history: ${count} document(s)`);
    return count;
  } catch (error) {
    historyError("Failed to clear workspace history:", error);
    return 0;
  }
}
