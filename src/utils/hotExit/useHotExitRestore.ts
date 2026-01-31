/**
 * Hot Exit Restore Hook
 *
 * Listens for restore requests from Rust coordinator and applies
 * session state to recreate tabs, documents, and UI state.
 */

import { useEffect, useRef } from 'react';
import { emit, listen } from '@tauri-apps/api/event';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { useTabStore } from '@/stores/tabStore';
import { useDocumentStore } from '@/stores/documentStore';
import { useUIStore } from '@/stores/uiStore';
import { useEditorStore } from '@/stores/editorStore';
import type { SessionData, WindowState } from './types';
import { HOT_EXIT_EVENTS } from './types';
import type { LineEnding } from '@/utils/linebreakDetection';

/**
 * Convert hot exit line ending format back to store format
 */
function fromHotExitLineEnding(lineEnding: '\n' | '\r\n' | 'unknown'): LineEnding {
  switch (lineEnding) {
    case '\n':
      return 'lf';
    case '\r\n':
      return 'crlf';
    case 'unknown':
      return 'unknown';
  }
}

export function useHotExitRestore() {
  // Prevent concurrent restore attempts
  const isRestoring = useRef(false);

  useEffect(() => {
    const unlistenPromise = listen<SessionData>(
      HOT_EXIT_EVENTS.RESTORE_START,
      async (event) => {
        // Guard against concurrent restore
        if (isRestoring.current) {
          console.warn('[HotExit] Ignoring concurrent restore request');
          return;
        }

        isRestoring.current = true;

        try {
          const session = event.payload;
          await restoreSession(session);
          await emit(HOT_EXIT_EVENTS.RESTORE_COMPLETE, {});
        } catch (error) {
          console.error('[HotExit] Failed to restore session:', error);
          void emit(HOT_EXIT_EVENTS.RESTORE_FAILED, {
            error: error instanceof Error ? error.message : String(error),
          }).catch((e) => console.error('[HotExit] Failed to emit restore failed:', e));
        } finally {
          isRestoring.current = false;
        }
      }
    );

    return () => {
      void unlistenPromise.then((unlisten) => unlisten()).catch(() => {
        // Ignore cleanup errors
      });
    };
  }, []);
}

/**
 * Restore session for current window
 */
async function restoreSession(session: SessionData): Promise<void> {
  const windowLabel = getCurrentWebviewWindow().label;

  // Find window state for current window
  const windowState = session.windows.find((w) => w.window_label === windowLabel);
  if (!windowState) {
    console.warn(
      `[HotExit] No state found for window '${windowLabel}' in session`
    );
    return;
  }

  // Restore UI state first (before tabs)
  restoreUiState(windowState);

  // Restore tabs
  await restoreTabs(windowLabel, windowState);
}

/**
 * Restore UI state (sidebar, view modes, etc.)
 */
function restoreUiState(windowState: WindowState): void {
  const { ui_state } = windowState;
  const uiStore = useUIStore.getState();
  const editorStore = useEditorStore.getState();

  // Validate sidebar_view_mode before setting
  const validViewModes = ['files', 'outline'] as const;
  const viewMode = validViewModes.includes(ui_state.sidebar_view_mode as any)
    ? (ui_state.sidebar_view_mode as 'files' | 'outline')
    : 'files';

  // Restore sidebar state
  if (ui_state.sidebar_visible !== uiStore.sidebarVisible) {
    uiStore.toggleSidebar();
  }
  uiStore.setSidebarWidth(ui_state.sidebar_width);

  if (ui_state.outline_visible !== uiStore.outlineVisible) {
    uiStore.toggleOutline();
  }

  uiStore.setSidebarViewMode(viewMode);
  uiStore.setStatusBarVisible(ui_state.status_bar_visible);

  // Restore view modes
  if (ui_state.source_mode_enabled !== editorStore.sourceMode) {
    editorStore.toggleSourceMode();
  }
  if (ui_state.focus_mode_enabled !== editorStore.focusModeEnabled) {
    editorStore.toggleFocusMode();
  }
  if (ui_state.typewriter_mode_enabled !== editorStore.typewriterModeEnabled) {
    editorStore.toggleTypewriterMode();
  }
}

/**
 * Restore tabs from window state
 */
async function restoreTabs(windowLabel: string, windowState: WindowState): Promise<void> {
  const tabStore = useTabStore.getState();
  const documentStore = useDocumentStore.getState();

  // Clear existing tabs by removing the window (bypasses pin rules)
  const existingTabs = tabStore.getTabsByWindow(windowLabel);
  existingTabs.forEach((tab) => {
    documentStore.removeDocument(tab.id);
  });

  // Remove window from tab store to clear all tabs at once
  if (existingTabs.length > 0) {
    tabStore.removeWindow(windowLabel);
  }

  // Build tab ID mapping: session tab ID -> new tab ID
  const tabIdMap = new Map<string, string>();

  // Restore each tab
  for (const tabState of windowState.tabs) {
    // Create tab (will auto-activate if first tab)
    const newTabId = tabStore.createTab(windowLabel, tabState.file_path);

    // Store mapping
    tabIdMap.set(tabState.id, newTabId);

    // Update tab metadata
    if (tabState.title) {
      tabStore.updateTabTitle(newTabId, tabState.title);
    }
    if (tabState.is_pinned) {
      tabStore.togglePin(windowLabel, newTabId);
    }

    // Restore document state
    await restoreDocumentState(newTabId, tabState, documentStore);
  }

  // Restore active tab using mapped ID
  if (windowState.active_tab_id) {
    const mappedActiveId = tabIdMap.get(windowState.active_tab_id);
    if (mappedActiveId) {
      tabStore.setActiveTab(windowLabel, mappedActiveId);
    } else {
      // Fallback to first tab if mapping not found
      const tabs = tabStore.getTabsByWindow(windowLabel);
      if (tabs.length > 0) {
        tabStore.setActiveTab(windowLabel, tabs[0].id);
      }
    }
  }
}

/**
 * Restore document state for a tab
 */
async function restoreDocumentState(
  tabId: string,
  tabState: import('./types').TabState,
  documentStore: ReturnType<typeof useDocumentStore.getState>
): Promise<void> {
  const { document: docState, file_path } = tabState;

  // Convert line ending format (validate and narrow type)
  const validLineEndings: Array<'\n' | '\r\n' | 'unknown'> = ['\n', '\r\n', 'unknown'];
  const lineEnding = validLineEndings.includes(docState.line_ending as any)
    ? fromHotExitLineEnding(docState.line_ending as '\n' | '\r\n' | 'unknown')
    : 'unknown' as LineEnding;

  // Initialize document with saved content first
  documentStore.initDocument(tabId, docState.saved_content, file_path);

  // Load saved content with metadata
  documentStore.loadContent(tabId, docState.saved_content, file_path, {
    lineEnding,
  });

  // If dirty, apply current content (different from saved)
  if (docState.is_dirty) {
    documentStore.setContent(tabId, docState.content);
  }

  // Restore flags
  if (docState.is_missing) {
    documentStore.markMissing(tabId);
  }
  if (docState.is_divergent) {
    documentStore.markDivergent(tabId);
  }

  // Restore cursor info
  if (docState.cursor_info) {
    documentStore.setCursorInfo(tabId, {
      sourceLine: docState.cursor_info.source_line,
      wordAtCursor: docState.cursor_info.word_at_cursor,
      offsetInWord: docState.cursor_info.offset_in_word,
      nodeType: docState.cursor_info.node_type as import('@/types/cursorSync').NodeType,
      percentInLine: docState.cursor_info.percent_in_line,
      contextBefore: docState.cursor_info.context_before,
      contextAfter: docState.cursor_info.context_after,
      blockAnchor: docState.cursor_info.block_anchor as import('@/types/cursorSync').BlockAnchor | undefined,
    });
  }
}
