/**
 * Hot Exit Capture Hook
 *
 * Listens for capture requests from Rust coordinator and responds with
 * current window state (tabs, documents, UI state).
 */

import { useEffect } from 'react';
import { emit, listen } from '@tauri-apps/api/event';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { useTabStore } from '@/stores/tabStore';
import { useDocumentStore } from '@/stores/documentStore';
import { useUIStore } from '@/stores/uiStore';
import { useEditorStore } from '@/stores/editorStore';
import type { WindowState, TabState, CaptureResponse } from './types';
import { HOT_EXIT_EVENTS } from './types';

export function useHotExitCapture() {
  useEffect(() => {
    const unlistenPromise = listen(HOT_EXIT_EVENTS.CAPTURE_REQUEST, async () => {
      try {
        const windowState = await captureWindowState();
        const response: CaptureResponse = {
          window_label: getCurrentWebviewWindow().label,
          state: windowState,
        };
        await emit(HOT_EXIT_EVENTS.CAPTURE_RESPONSE, response);
      } catch (error) {
        console.error('[HotExit] Failed to capture window state:', error);
        // Still respond with partial state to avoid blocking coordinator
        const fallbackState: WindowState = {
          window_label: getCurrentWebviewWindow().label,
          is_main_window: getCurrentWebviewWindow().label === 'main',
          active_tab_id: null,
          tabs: [],
          ui_state: getUiState(),
          geometry: null,
        };
        const response: CaptureResponse = {
          window_label: getCurrentWebviewWindow().label,
          state: fallbackState,
        };
        await emit(HOT_EXIT_EVENTS.CAPTURE_RESPONSE, response);
      }
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);
}

/**
 * Capture complete window state
 */
async function captureWindowState(): Promise<WindowState> {
  const windowLabel = getCurrentWebviewWindow().label;
  const tabStore = useTabStore.getState();
  const documentStore = useDocumentStore.getState();

  // Get tabs for this window
  const windowTabs = tabStore.getTabsByWindow(windowLabel);

  const tabs: TabState[] = windowTabs.map((tab) => {
    const doc = documentStore.getDocument(tab.id);

    return {
      id: tab.id,
      file_path: tab.filePath,
      title: tab.title,
      is_pinned: tab.isPinned,
      document: doc ? {
        content: doc.content,
        saved_content: doc.savedContent,
        is_dirty: doc.isDirty,
        is_missing: doc.isMissing,
        is_divergent: doc.isDivergent,
        line_ending: doc.lineEnding === 'unknown' ? '\n' : doc.lineEnding,
        cursor_info: doc.cursorInfo
          ? {
              source_line: doc.cursorInfo.sourceLine,
              word_at_cursor: doc.cursorInfo.wordAtCursor,
              offset_in_word: doc.cursorInfo.offsetInWord,
              node_type: doc.cursorInfo.nodeType,
              percent_in_line: doc.cursorInfo.percentInLine,
              context_before: doc.cursorInfo.contextBefore,
              context_after: doc.cursorInfo.contextAfter,
              block_anchor: doc.cursorInfo.blockAnchor,
            }
          : null,
        last_modified_timestamp: doc.lastAutoSave,
        is_untitled: !tab.filePath,
        untitled_number: tab.filePath ? null : extractUntitledNumber(tab.title),
      } : {
        // Fallback if document not found
        content: '',
        saved_content: '',
        is_dirty: false,
        is_missing: false,
        is_divergent: false,
        line_ending: '\n',
        cursor_info: null,
        last_modified_timestamp: null,
        is_untitled: !tab.filePath,
        untitled_number: tab.filePath ? null : extractUntitledNumber(tab.title),
      },
    };
  });

  const activeTab = tabStore.getActiveTab(windowLabel);

  const windowState: WindowState = {
    window_label: windowLabel,
    is_main_window: windowLabel === 'main',
    active_tab_id: activeTab?.id || null,
    tabs,
    ui_state: getUiState(),
    geometry: null, // TODO: Capture window geometry
  };

  return windowState;
}

/**
 * Extract untitled number from tab title like "Untitled-5"
 */
function extractUntitledNumber(title: string): number | null {
  const match = title.match(/^Untitled-(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Gather UI state from stores
 */
function getUiState() {
  const uiStore = useUIStore.getState();
  const editorStore = useEditorStore.getState();

  return {
    sidebar_visible: uiStore.sidebarVisible,
    sidebar_width: uiStore.sidebarWidth,
    outline_visible: uiStore.outlineVisible,
    sidebar_view_mode: uiStore.sidebarViewMode,
    status_bar_visible: uiStore.statusBarVisible,
    source_mode_enabled: editorStore.sourceMode,
    focus_mode_enabled: editorStore.focusModeEnabled,
    typewriter_mode_enabled: editorStore.typewriterModeEnabled,
  };
}
