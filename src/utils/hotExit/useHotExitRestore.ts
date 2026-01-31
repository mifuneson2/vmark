/**
 * Hot Exit Restore Hook
 *
 * Listens for restore requests from Rust coordinator and applies
 * session state to recreate tabs, documents, and UI state.
 */

import { useEffect } from 'react';
import { emit, listen } from '@tauri-apps/api/event';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { useTabStore } from '@/stores/tabStore';
import { useDocumentStore } from '@/stores/documentStore';
import { useUIStore } from '@/stores/uiStore';
import { useEditorStore } from '@/stores/editorStore';
import type { SessionData, WindowState } from './types';
import { HOT_EXIT_EVENTS } from './types';

export function useHotExitRestore() {
  useEffect(() => {
    const unlistenPromise = listen<SessionData>(
      HOT_EXIT_EVENTS.RESTORE_START,
      async (event) => {
        try {
          const session = event.payload;
          await restoreSession(session);
          await emit(HOT_EXIT_EVENTS.RESTORE_COMPLETE, {});
        } catch (error) {
          console.error('[HotExit] Failed to restore session:', error);
          await emit(HOT_EXIT_EVENTS.RESTORE_FAILED, {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    );

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
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

  // Restore sidebar state
  if (ui_state.sidebar_visible !== uiStore.sidebarVisible) {
    uiStore.toggleSidebar();
  }
  uiStore.setSidebarWidth(ui_state.sidebar_width);

  if (ui_state.outline_visible !== uiStore.outlineVisible) {
    uiStore.toggleOutline();
  }

  uiStore.setSidebarViewMode(ui_state.sidebar_view_mode as 'files' | 'outline');
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

  // Clear existing tabs in this window
  const existingTabs = tabStore.getTabsByWindow(windowLabel);
  existingTabs.forEach((tab) => {
    documentStore.removeDocument(tab.id);
    tabStore.closeTab(windowLabel, tab.id);
  });

  // Restore each tab
  for (const tabState of windowState.tabs) {
    // Create tab (will auto-activate if first tab)
    const newTabId = tabStore.createTab(windowLabel, tabState.file_path);

    // Update tab metadata if needed (title, pinned status)
    if (tabState.title) {
      tabStore.updateTabTitle(newTabId, tabState.title);
    }
    if (tabState.is_pinned) {
      tabStore.togglePin(windowLabel, newTabId);
    }

    // Initialize document for this tab
    documentStore.initDocument(newTabId, tabState.document.content, tabState.file_path);

    // Restore document state
    const doc = documentStore.getDocument(newTabId);
    if (doc) {
      documentStore.setContent(newTabId, tabState.document.content);

      // Restore saved content and dirty state
      if (tabState.document.is_dirty) {
        // Content differs from saved
        // Note: We set savedContent directly via loadContent, then update content
        documentStore.loadContent(
          newTabId,
          tabState.document.saved_content,
          tabState.file_path,
          {
            lineEnding: tabState.document.line_ending as import('@/utils/linebreakDetection').LineEnding,
          }
        );
        documentStore.setContent(newTabId, tabState.document.content);
      } else {
        // Not dirty - content matches saved
        documentStore.loadContent(
          newTabId,
          tabState.document.content,
          tabState.file_path,
          {
            lineEnding: tabState.document.line_ending as import('@/utils/linebreakDetection').LineEnding,
          }
        );
      }

      // Restore flags
      if (tabState.document.is_missing) {
        documentStore.markMissing(newTabId);
      }
      if (tabState.document.is_divergent) {
        documentStore.markDivergent(newTabId);
      }

      // Restore cursor info
      if (tabState.document.cursor_info) {
        documentStore.setCursorInfo(newTabId, {
          sourceLine: tabState.document.cursor_info.source_line,
          wordAtCursor: tabState.document.cursor_info.word_at_cursor,
          offsetInWord: tabState.document.cursor_info.offset_in_word,
          nodeType: tabState.document.cursor_info.node_type as import('@/types/cursorSync').NodeType,
          percentInLine: tabState.document.cursor_info.percent_in_line,
          contextBefore: tabState.document.cursor_info.context_before,
          contextAfter: tabState.document.cursor_info.context_after,
          blockAnchor: tabState.document.cursor_info.block_anchor as import('@/types/cursorSync').BlockAnchor | undefined,
        });
      }
    }
  }

  // Restore active tab
  if (windowState.active_tab_id) {
    tabStore.setActiveTab(windowLabel, windowState.active_tab_id);
  }
}
