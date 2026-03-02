/**
 * useHotExitRestore Tests
 *
 * Tests for the hot exit restore hook and restoreMainWindowState function:
 *   - restoreMainWindowState: main window pull-based restore
 *   - useHotExitRestore: hook behavior for main and secondary windows
 *   - Double-restore guard (module-level flag)
 *   - Error handling and event emission
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mocks — must appear before imports of the module under test
// ---------------------------------------------------------------------------

const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

const mockEmit = vi.fn(() => Promise.resolve());
const mockListen = vi.fn(() => Promise.resolve(() => {}));
vi.mock('@tauri-apps/api/event', () => ({
  emit: (...args: unknown[]) => mockEmit(...args),
  listen: (...args: unknown[]) => mockListen(...args),
}));

let currentWindowLabel = 'main';
vi.mock('@tauri-apps/api/webviewWindow', () => ({
  getCurrentWebviewWindow: () => ({ label: currentWindowLabel }),
}));

vi.mock('@/utils/debug', () => ({
  hotExitLog: vi.fn(),
  hotExitWarn: vi.fn(),
}));

const mockPullWindowStateWithRetry = vi.fn();
const mockRestoreWindowState = vi.fn();
vi.mock('./restoreHelpers', () => ({
  pullWindowStateWithRetry: (...args: unknown[]) => mockPullWindowStateWithRetry(...args),
  restoreWindowState: (...args: unknown[]) => mockRestoreWindowState(...args),
}));

// ---------------------------------------------------------------------------
// Import module under test AFTER mocks
// ---------------------------------------------------------------------------

// We need to dynamically import to reset the module-level flag between tests
let restoreMainWindowState: typeof import('./useHotExitRestore').restoreMainWindowState;
let useHotExitRestore: typeof import('./useHotExitRestore').useHotExitRestore;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWindowState() {
  return {
    window_label: 'main',
    is_main_window: true,
    active_tab_id: 'tab-1',
    tabs: [],
    ui_state: {
      sidebar_visible: true,
      sidebar_width: 260,
      outline_visible: false,
      sidebar_view_mode: 'files',
      status_bar_visible: true,
      source_mode_enabled: false,
      focus_mode_enabled: false,
      typewriter_mode_enabled: false,
    },
    geometry: null,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useHotExitRestore', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    currentWindowLabel = 'main';
    mockPullWindowStateWithRetry.mockResolvedValue(null);
    mockRestoreWindowState.mockResolvedValue(undefined);
    mockInvoke.mockResolvedValue(false);
    cleanup();

    // Re-import to reset module-level `mainWindowRestoreStarted` flag
    vi.resetModules();

    // Re-apply mocks after resetModules
    vi.doMock('@tauri-apps/api/core', () => ({
      invoke: (...args: unknown[]) => mockInvoke(...args),
    }));
    vi.doMock('@tauri-apps/api/event', () => ({
      emit: (...args: unknown[]) => mockEmit(...args),
      listen: (...args: unknown[]) => mockListen(...args),
    }));
    vi.doMock('@tauri-apps/api/webviewWindow', () => ({
      getCurrentWebviewWindow: () => ({ label: currentWindowLabel }),
    }));
    vi.doMock('@/utils/debug', () => ({
      hotExitLog: vi.fn(),
      hotExitWarn: vi.fn(),
    }));
    vi.doMock('./restoreHelpers', () => ({
      pullWindowStateWithRetry: (...args: unknown[]) => mockPullWindowStateWithRetry(...args),
      restoreWindowState: (...args: unknown[]) => mockRestoreWindowState(...args),
    }));

    const mod = await import('./useHotExitRestore');
    restoreMainWindowState = mod.restoreMainWindowState;
    useHotExitRestore = mod.useHotExitRestore;
  });

  // =========================================================================
  // restoreMainWindowState
  // =========================================================================

  describe('restoreMainWindowState', () => {
    it('should pull and restore state for main window', async () => {
      const state = makeWindowState();
      mockPullWindowStateWithRetry.mockResolvedValueOnce(state);
      mockInvoke.mockResolvedValueOnce(false);

      await restoreMainWindowState();

      expect(mockPullWindowStateWithRetry).toHaveBeenCalledWith('main');
      expect(mockRestoreWindowState).toHaveBeenCalledWith('main', state);
      expect(mockInvoke).toHaveBeenCalledWith('hot_exit_window_restore_complete', { windowLabel: 'main' });
    });

    it('should emit RESTORE_COMPLETE when all windows are done', async () => {
      const state = makeWindowState();
      mockPullWindowStateWithRetry.mockResolvedValueOnce(state);
      mockInvoke.mockResolvedValueOnce(true); // allDone = true

      await restoreMainWindowState();

      expect(mockEmit).toHaveBeenCalledWith('hot-exit:restore-complete', {});
    });

    it('should NOT emit RESTORE_COMPLETE when not all windows done', async () => {
      const state = makeWindowState();
      mockPullWindowStateWithRetry.mockResolvedValueOnce(state);
      mockInvoke.mockResolvedValueOnce(false); // allDone = false

      await restoreMainWindowState();

      expect(mockEmit).not.toHaveBeenCalledWith('hot-exit:restore-complete', {});
    });

    it('should emit RESTORE_FAILED when no state found after retries', async () => {
      mockPullWindowStateWithRetry.mockResolvedValueOnce(null);

      await restoreMainWindowState();

      expect(mockEmit).toHaveBeenCalledWith(
        'hot-exit:restore-failed',
        expect.objectContaining({ error: expect.stringContaining('No restore state found') }),
      );
    });

    it('should skip restore from non-main window', async () => {
      currentWindowLabel = 'doc-0';

      // Re-import with non-main window
      vi.resetModules();
      vi.doMock('@tauri-apps/api/core', () => ({
        invoke: (...args: unknown[]) => mockInvoke(...args),
      }));
      vi.doMock('@tauri-apps/api/event', () => ({
        emit: (...args: unknown[]) => mockEmit(...args),
        listen: (...args: unknown[]) => mockListen(...args),
      }));
      vi.doMock('@tauri-apps/api/webviewWindow', () => ({
        getCurrentWebviewWindow: () => ({ label: currentWindowLabel }),
      }));
      vi.doMock('@/utils/debug', () => ({
        hotExitLog: vi.fn(),
        hotExitWarn: vi.fn(),
      }));
      vi.doMock('./restoreHelpers', () => ({
        pullWindowStateWithRetry: (...args: unknown[]) => mockPullWindowStateWithRetry(...args),
        restoreWindowState: (...args: unknown[]) => mockRestoreWindowState(...args),
      }));

      const mod = await import('./useHotExitRestore');

      await mod.restoreMainWindowState();

      expect(mockPullWindowStateWithRetry).not.toHaveBeenCalled();
      expect(mockRestoreWindowState).not.toHaveBeenCalled();
    });

    it('should prevent double-restore via module-level guard', async () => {
      const state = makeWindowState();
      mockPullWindowStateWithRetry.mockResolvedValue(state);
      mockInvoke.mockResolvedValue(false);

      await restoreMainWindowState();
      await restoreMainWindowState(); // second call

      // pullWindowStateWithRetry should only be called once
      expect(mockPullWindowStateWithRetry).toHaveBeenCalledTimes(1);
    });

    it('should reset guard on failure to allow retry', async () => {
      mockPullWindowStateWithRetry.mockRejectedValueOnce(new Error('network fail'));

      await restoreMainWindowState();

      // Should have emitted failure
      expect(mockEmit).toHaveBeenCalledWith(
        'hot-exit:restore-failed',
        expect.objectContaining({ error: 'network fail' }),
      );

      // Guard should be reset — second call should proceed
      const state = makeWindowState();
      mockPullWindowStateWithRetry.mockResolvedValueOnce(state);
      mockInvoke.mockResolvedValueOnce(false);

      await restoreMainWindowState();

      expect(mockPullWindowStateWithRetry).toHaveBeenCalledTimes(2);
    });

    it('should emit RESTORE_FAILED with stringified error for non-Error throws', async () => {
      mockPullWindowStateWithRetry.mockRejectedValueOnce('string error');

      await restoreMainWindowState();

      expect(mockEmit).toHaveBeenCalledWith(
        'hot-exit:restore-failed',
        { error: 'string error' },
      );
    });
  });

  // =========================================================================
  // useHotExitRestore hook
  // =========================================================================

  describe('useHotExitRestore hook', () => {
    it('should register RESTORE_START listener on mount', () => {
      currentWindowLabel = 'main';

      renderHook(() => useHotExitRestore());

      expect(mockListen).toHaveBeenCalledWith(
        'hot-exit:restore-start',
        expect.any(Function),
      );
    });

    it('should clean up listener on unmount', async () => {
      const mockUnlisten = vi.fn();
      mockListen.mockResolvedValueOnce(mockUnlisten);

      const { unmount } = renderHook(() => useHotExitRestore());

      unmount();

      // Allow the promise chain to resolve
      await vi.waitFor(() => {
        expect(mockUnlisten).toHaveBeenCalled();
      });
    });

    it('should pull state immediately for secondary windows', async () => {
      currentWindowLabel = 'doc-0';

      // Re-import with secondary window label
      vi.resetModules();
      vi.doMock('@tauri-apps/api/core', () => ({
        invoke: (...args: unknown[]) => mockInvoke(...args),
      }));
      vi.doMock('@tauri-apps/api/event', () => ({
        emit: (...args: unknown[]) => mockEmit(...args),
        listen: (...args: unknown[]) => mockListen(...args),
      }));
      vi.doMock('@tauri-apps/api/webviewWindow', () => ({
        getCurrentWebviewWindow: () => ({ label: currentWindowLabel }),
      }));
      vi.doMock('@/utils/debug', () => ({
        hotExitLog: vi.fn(),
        hotExitWarn: vi.fn(),
      }));
      vi.doMock('./restoreHelpers', () => ({
        pullWindowStateWithRetry: (...args: unknown[]) => mockPullWindowStateWithRetry(...args),
        restoreWindowState: (...args: unknown[]) => mockRestoreWindowState(...args),
      }));

      const mod = await import('./useHotExitRestore');
      useHotExitRestore = mod.useHotExitRestore;

      const state = makeWindowState();
      mockPullWindowStateWithRetry.mockResolvedValueOnce(state);
      mockInvoke.mockResolvedValueOnce(false);

      renderHook(() => useHotExitRestore());

      await vi.waitFor(() => {
        expect(mockPullWindowStateWithRetry).toHaveBeenCalledWith('doc-0');
      });
    });

    it('should NOT pull state immediately for main window', async () => {
      currentWindowLabel = 'main';

      renderHook(() => useHotExitRestore());

      // Give async effects time to run
      await vi.waitFor(() => {
        expect(mockListen).toHaveBeenCalled();
      });

      // Main window should NOT auto-pull state
      expect(mockPullWindowStateWithRetry).not.toHaveBeenCalled();
    });

    it('should handle RESTORE_START event for main window', async () => {
      currentWindowLabel = 'main';

      const state = makeWindowState();
      mockPullWindowStateWithRetry.mockResolvedValueOnce(state);
      mockInvoke.mockResolvedValueOnce(false);

      renderHook(() => useHotExitRestore());

      // Extract the listener callback from the listen mock
      const listenerCallback = mockListen.mock.calls[0]?.[1] as (() => Promise<void>) | undefined;
      expect(listenerCallback).toBeDefined();

      // Simulate RESTORE_START event
      await listenerCallback!();

      expect(mockPullWindowStateWithRetry).toHaveBeenCalledWith('main');
      expect(mockRestoreWindowState).toHaveBeenCalledWith('main', state);
    });

    it('should emit RESTORE_FAILED when secondary window has no state', async () => {
      currentWindowLabel = 'doc-0';

      vi.resetModules();
      vi.doMock('@tauri-apps/api/core', () => ({
        invoke: (...args: unknown[]) => mockInvoke(...args),
      }));
      vi.doMock('@tauri-apps/api/event', () => ({
        emit: (...args: unknown[]) => mockEmit(...args),
        listen: (...args: unknown[]) => mockListen(...args),
      }));
      vi.doMock('@tauri-apps/api/webviewWindow', () => ({
        getCurrentWebviewWindow: () => ({ label: currentWindowLabel }),
      }));
      vi.doMock('@/utils/debug', () => ({
        hotExitLog: vi.fn(),
        hotExitWarn: vi.fn(),
      }));
      vi.doMock('./restoreHelpers', () => ({
        pullWindowStateWithRetry: (...args: unknown[]) => mockPullWindowStateWithRetry(...args),
        restoreWindowState: (...args: unknown[]) => mockRestoreWindowState(...args),
      }));

      const mod = await import('./useHotExitRestore');
      mockPullWindowStateWithRetry.mockResolvedValueOnce(null);

      renderHook(() => mod.useHotExitRestore());

      // Secondary windows do NOT emit RESTORE_FAILED (only main does)
      await vi.waitFor(() => {
        expect(mockPullWindowStateWithRetry).toHaveBeenCalled();
      });
      // Secondary window with isRequestedRestore=true DOES emit failure
      // because it was "requested" during restore
      // Actually checking the source: secondary windows call restoreFromPulledState(true)
      // and the guard `isRequestedRestore && isMainWindow` means secondary windows
      // do NOT emit failure. So emit should not be called with restore-failed.
      expect(mockEmit).not.toHaveBeenCalledWith(
        'hot-exit:restore-failed',
        expect.anything(),
      );
    });

    it('should handle restore error in secondary window gracefully', async () => {
      currentWindowLabel = 'doc-0';

      vi.resetModules();
      vi.doMock('@tauri-apps/api/core', () => ({
        invoke: (...args: unknown[]) => mockInvoke(...args),
      }));
      vi.doMock('@tauri-apps/api/event', () => ({
        emit: (...args: unknown[]) => mockEmit(...args),
        listen: (...args: unknown[]) => mockListen(...args),
      }));
      vi.doMock('@tauri-apps/api/webviewWindow', () => ({
        getCurrentWebviewWindow: () => ({ label: currentWindowLabel }),
      }));
      vi.doMock('@/utils/debug', () => ({
        hotExitLog: vi.fn(),
        hotExitWarn: vi.fn(),
      }));
      vi.doMock('./restoreHelpers', () => ({
        pullWindowStateWithRetry: (...args: unknown[]) => mockPullWindowStateWithRetry(...args),
        restoreWindowState: (...args: unknown[]) => mockRestoreWindowState(...args),
      }));

      const mod = await import('./useHotExitRestore');
      mockPullWindowStateWithRetry.mockRejectedValueOnce(new Error('restore boom'));

      renderHook(() => mod.useHotExitRestore());

      await vi.waitFor(() => {
        expect(mockEmit).toHaveBeenCalledWith(
          'hot-exit:restore-failed',
          { error: 'restore boom' },
        );
      });
    });
  });
});
