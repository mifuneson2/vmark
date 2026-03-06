/**
 * Auto-Save Hook
 *
 * Purpose: Automatically saves dirty documents at configurable intervals —
 *   skips untitled (no filePath) documents and coordinates with manual save.
 *
 * Pipeline: Interval timer fires → iterate all tabs for window → check
 *   isDirty + hasFilePath + !isDivergent → if dirty, call saveToPath() →
 *   markAutoSaved() clears dirty flag without touching savedContent (so
 *   external change detection still works)
 *
 * Key decisions:
 *   - Uses saveToPath() for consistent line ending normalization + history snapshots
 *   - Checks isOperationInProgress() to avoid conflicting with manual save
 *   - Interval restarts when autoSaveInterval setting changes
 *   - Skips save if document is currently in the middle of an operation
 *
 * @coordinates-with saveToPath.ts — shared save logic with line ending handling
 * @coordinates-with reentryGuard.ts — prevents concurrent save operations
 * @coordinates-with settingsStore.ts — reads autoSaveEnabled and autoSaveInterval
 * @module hooks/useAutoSave
 */

import { useEffect, useRef } from "react";
import { useWindowLabel } from "@/contexts/WindowContext";
import { useDocumentStore } from "@/stores/documentStore";
import { useTabStore } from "@/stores/tabStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { saveToPath } from "@/utils/saveToPath";
import { isOperationInProgress } from "@/utils/reentryGuard";
import { autoSaveLog } from "@/utils/debug";

export function useAutoSave() {
  const windowLabel = useWindowLabel();
  const autoSaveEnabled = useSettingsStore((s) => s.general.autoSaveEnabled);
  const autoSaveInterval = useSettingsStore((s) => s.general.autoSaveInterval);
  const lastSaveRef = useRef<number>(0);

  useEffect(() => {
    if (!autoSaveEnabled) return;

    const intervalMs = autoSaveInterval * 1000;

    const checkAndSave = async () => {
      // Skip if manual save is in progress (prevents race condition)
      if (isOperationInProgress(windowLabel, "save")) {
        autoSaveLog("Skipping - manual save in progress");
        return;
      }

      // Debounce: Prevent saves within 5 seconds of each other.
      const DEBOUNCE_MS = 5000;
      const now = Date.now();
      if (now - lastSaveRef.current < DEBOUNCE_MS) return;

      // Iterate ALL tabs for this window — not just the active one
      const tabs = useTabStore.getState().tabs[windowLabel] ?? [];
      const documentStore = useDocumentStore.getState();
      let anySaved = false;

      for (const tab of tabs) {
        const doc = documentStore.getDocument(tab.id);
        // Skip if no document, not dirty, no file path (untitled), file was deleted,
        // or user chose "keep my changes" after external change (divergent)
        if (!doc || !doc.isDirty || !doc.filePath || doc.isMissing || doc.isDivergent) continue;

        const success = await saveToPath(tab.id, doc.filePath, doc.content, "auto");
        if (success) {
          anySaved = true;
          autoSaveLog("Saved:", doc.filePath);
        }
      }

      if (anySaved) {
        lastSaveRef.current = now;
      }
    };

    const interval = setInterval(checkAndSave, intervalMs);

    return () => clearInterval(interval);
  }, [windowLabel, autoSaveEnabled, autoSaveInterval]);
}
