/**
 * Hot Exit Restart Helper
 *
 * Captures session before restart and restores after relaunch.
 */

import { invoke } from '@tauri-apps/api/core';
import { relaunch } from '@tauri-apps/plugin-process';
import type { SessionData } from './types';

/**
 * Capture session, write to disk, then restart app.
 * Session will be automatically restored on next startup via useHotExitRestore.
 */
export async function restartWithHotExit(): Promise<void> {
  let captureError: Error | null = null;

  try {
    // Capture session from all windows and write atomically to disk
    // This command waits for all windows to respond with 5s timeout
    const session = await invoke<SessionData>('hot_exit_capture');

    console.log('[HotExit] Session captured and persisted:', {
      windows: session.windows.length,
      version: session.vmark_version,
    });
  } catch (error) {
    captureError = error instanceof Error ? error : new Error(String(error));
    console.error('[HotExit] Failed to capture session before restart:', captureError);
    // Continue to relaunch - user already confirmed restart
  }

  // Relaunch regardless of capture success (user confirmed restart)
  try {
    await relaunch();
  } catch (error) {
    console.error('[HotExit] Failed to relaunch:', error);
    throw error;
  }
}

/**
 * Check for saved session on startup and restore if present.
 * Called from App.tsx during initialization.
 * MUST only be called from the main window to avoid concurrent restore attempts.
 */
export async function checkAndRestoreSession(): Promise<boolean> {
  try {
    const session = await invoke<SessionData | null>('hot_exit_inspect_session');

    if (!session) {
      console.log('[HotExit] No saved session found');
      return false;
    }

    console.log('[HotExit] Found saved session:', {
      windows: session.windows.length,
      timestamp: new Date(session.timestamp * 1000).toISOString(),
      version: session.vmark_version,
    });

    // Restore session to main window
    // The useHotExitRestore hook will handle the actual restoration
    await invoke<void>('hot_exit_restore', { session });

    // Delete session file after successful restore (best-effort)
    try {
      await invoke<void>('hot_exit_clear_session');
      console.log('[HotExit] Session restored and cleared successfully');
    } catch (clearError) {
      console.warn('[HotExit] Failed to clear session file:', clearError);
      // Session was restored successfully, so we still return true
    }

    return true;
  } catch (error) {
    console.error('[HotExit] Failed to restore session:', error);
    return false;
  }
}
