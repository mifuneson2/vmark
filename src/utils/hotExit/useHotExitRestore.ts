/**
 * Hot Exit Restore Hook
 *
 * Restores window state after hot restart. Uses a pull-based approach
 * for reliability — windows pull their state from Rust coordinator
 * rather than waiting for events (which can be missed due to timing).
 *
 * For main window: restoreMainWindowState() is called directly by
 *   checkAndRestoreSession() after Rust invoke returns (bypasses event race).
 * For secondary windows: Pulls pending state via invoke on mount.
 *
 * The RESTORE_START listener in the hook is kept as a fallback but
 * is guarded against double-restore.
 *
 * @coordinates-with restoreHelpers.ts — all restore logic lives there
 */

import { useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { emit, listen } from '@tauri-apps/api/event';
import { hotExitLog, hotExitWarn } from '@/utils/debug';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { HOT_EXIT_EVENTS } from './types';
import { pullWindowStateWithRetry, restoreWindowState } from './restoreHelpers';

/** Maximum retries when pulling state (handles timing issues) */
const MAX_STATE_RETRIES = 5;

/** Module-level flag to prevent double-restore of main window */
let mainWindowRestoreStarted = false;

/**
 * Pull main window state from Rust and restore it.
 * This is called directly by checkAndRestoreSession after Rust invoke returns
 * (bypasses RESTORE_START event to avoid listener race conditions).
 *
 * Uses a module-level flag to prevent double-restore if the RESTORE_START
 * event listener also fires.
 */
export async function restoreMainWindowState(): Promise<void> {
  const windowLabel = getCurrentWebviewWindow().label;
  if (windowLabel !== 'main') {
    hotExitWarn('restoreMainWindowState called from non-main window');
    return;
  }

  // Guard against double-restore
  if (mainWindowRestoreStarted) {
    hotExitLog('Main window restore already in progress or completed, skipping');
    return;
  }
  mainWindowRestoreStarted = true;

  try {
    const windowState = await pullWindowStateWithRetry(windowLabel);

    if (!windowState) {
      hotExitWarn('No state found for main window after retries');
      void emit(HOT_EXIT_EVENTS.RESTORE_FAILED, {
        error: `No restore state found for window '${windowLabel}'`,
      }).catch((e) => hotExitWarn('Failed to emit restore failed:', e));
      return;
    }

    hotExitLog('Main window found pending state, restoring...');
    await restoreWindowState(windowLabel, windowState);

    // Signal completion for this window and check if all windows done
    const allDone = await invoke<boolean>('hot_exit_window_restore_complete', { windowLabel });
    hotExitLog(`Main window restored successfully (allDone: ${allDone})`);

    // Only emit RESTORE_COMPLETE when ALL windows have completed
    if (allDone) {
      await emit(HOT_EXIT_EVENTS.RESTORE_COMPLETE, {});
    }
  } catch (error) {
    mainWindowRestoreStarted = false; // Allow retry on failure
    hotExitWarn('Main window restore failed:', error);
    void emit(HOT_EXIT_EVENTS.RESTORE_FAILED, {
      error: error instanceof Error ? error.message : String(error),
    }).catch((e) => hotExitWarn('Failed to emit restore failed:', e));
  }
}

export function useHotExitRestore() {
  // Prevent concurrent restore attempts
  const isRestoring = useRef(false);
  const hasCheckedPending = useRef(false);
  // Track if we were triggered by RESTORE_START (vs normal startup)
  const restoreWasRequested = useRef(false);

  useEffect(() => {
    const windowLabel = getCurrentWebviewWindow().label;
    const isMainWindow = windowLabel === 'main';

    /**
     * Restore this window's state by pulling from Rust coordinator.
     * Used by both main and secondary windows for consistency.
     *
     * @param isRequestedRestore - True if triggered by RESTORE_START event
     */
    const restoreFromPulledState = async (isRequestedRestore: boolean) => {
      /* v8 ignore start -- concurrent restore guard; React renders are synchronous so this race is untestable */
      if (isRestoring.current) {
        hotExitWarn(`Window '${windowLabel}' ignoring concurrent restore`);
        return;
      }
      /* v8 ignore stop */

      isRestoring.current = true;

      try {
        const windowState = await pullWindowStateWithRetry(windowLabel);

        if (!windowState) {
          hotExitWarn(`No state found for window '${windowLabel}' after ${MAX_STATE_RETRIES} retries`);

          // If restore was explicitly requested but no state found, emit failure
          // (This prevents checkAndRestoreSession from waiting until timeout)
          if (isRequestedRestore && isMainWindow) {
            hotExitWarn('Restore was requested but no state available');
            void emit(HOT_EXIT_EVENTS.RESTORE_FAILED, {
              error: `No restore state found for window '${windowLabel}'`,
            /* v8 ignore start -- @preserve reason: emit().catch() callback only fires on Tauri IPC errors; not triggered in mocked tests */
            }).catch((e) => hotExitWarn('Failed to emit restore failed:', e));
            /* v8 ignore stop */
          }
          return;
        }

        hotExitLog(`Window '${windowLabel}' found pending state, restoring...`);
        await restoreWindowState(windowLabel, windowState);

        // Signal completion for this window and check if all windows done
        const allDone = await invoke<boolean>('hot_exit_window_restore_complete', { windowLabel });
        hotExitLog(`Window '${windowLabel}' restored successfully (allDone: ${allDone})`);

        // Only emit RESTORE_COMPLETE when ALL windows have completed
        if (allDone) {
          await emit(HOT_EXIT_EVENTS.RESTORE_COMPLETE, {});
        }
      } catch (error) {
        hotExitWarn(`Window '${windowLabel}' restore failed:`, error);
        void emit(HOT_EXIT_EVENTS.RESTORE_FAILED, {
          error: error instanceof Error ? error.message : String(error),
        }).catch((e) => hotExitWarn('Failed to emit restore failed:', e));
      } finally {
        isRestoring.current = false;
      }
    };

    // For secondary windows: check for pending state immediately on mount
    // (they're created by Rust after session is stored)
    const checkPendingState = async () => {
      /* v8 ignore start -- re-entry guard; hasCheckedPending is set to true on first call and never reset */
      if (hasCheckedPending.current) return;
      /* v8 ignore stop */
      hasCheckedPending.current = true;

      // Secondary windows pull state immediately
      // Main window waits for RESTORE_START signal (to avoid restoring on normal startup)
      if (!isMainWindow) {
        // Secondary windows created during restore are "requested"
        await restoreFromPulledState(true);
      }
    };

    void checkPendingState();

    // Listen for RESTORE_START signal (fallback for main window)
    // Primary restore is now triggered directly by checkAndRestoreSession()
    // This listener is kept as a fallback but guarded against double-restore.
    const unlistenPromise = listen(
      HOT_EXIT_EVENTS.RESTORE_START,
      async () => {
        // Main window: check if already restored via direct call
        if (isMainWindow) {
          if (mainWindowRestoreStarted) {
            hotExitLog('RESTORE_START received but restore already started, ignoring');
            return;
          }
          // Set flag to prevent double-restore via direct call
          mainWindowRestoreStarted = true;
          restoreWasRequested.current = true;
          await restoreFromPulledState(true);
        }
        // Secondary windows ignore this — they restore on mount
      }
    );

    return () => {
      void unlistenPromise.then((unlisten) => unlisten()).catch((e) => {
        hotExitLog('Cleanup error (expected during unmount):', e);
      });
    };
  }, []);
}
