import { useMemo, useState, useEffect, useCallback, useRef, type MouseEvent, type KeyboardEvent } from "react";

// Stable empty array to avoid creating new reference on each render
const EMPTY_TABS: never[] = [];
import { Code2, Type, Save, Plus, AlertTriangle, GitFork, Satellite, Sparkles, Terminal } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { emit, listen } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { countWords as alfaazCount } from "alfaaz";
import { toast } from "sonner";
import { useEditorStore } from "@/stores/editorStore";
import { useUIStore } from "@/stores/uiStore";
import { useWindowLabel, useIsDocumentWindow } from "@/contexts/WindowContext";
import { useTabStore, type Tab as TabType } from "@/stores/tabStore";
import { useDocumentStore } from "@/stores/documentStore";
import { useImagePasteToastStore } from "@/stores/imagePasteToastStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { closeTabWithDirtyCheck } from "@/hooks/useTabOperations";
import { useTabDragOut, type DragOutPoint } from "@/hooks/useTabDragOut";
import { flushActiveWysiwygNow } from "@/utils/wysiwygFlush";
import {
  useDocumentContent,
  useDocumentLastAutoSave,
  useDocumentIsMissing,
  useDocumentIsDivergent,
} from "@/hooks/useDocumentState";
import { useSettingsStore } from "@/stores/settingsStore";
import { useAiInvocationStore } from "@/stores/aiInvocationStore";
import { formatRelativeTime, formatExactTime } from "@/utils/dateUtils";
import { Tab } from "@/components/Tabs/Tab";
import { TabContextMenu, type ContextMenuPosition } from "@/components/Tabs/TabContextMenu";
import { useShortcutsStore, formatKeyForDisplay } from "@/stores/shortcutsStore";
import { useMcpServer } from "@/hooks/useMcpServer";
import { planReorder } from "./tabDragRules";
import { openSettingsWindow } from "@/utils/settingsWindow";
import { UpdateIndicator } from "./UpdateIndicator";
import "./StatusBar.css";

/**
 * Prevent Cmd+A from selecting all page content when focus is on non-input elements.
 * Only prevents when active element is a button or similar non-text element.
 */
function preventSelectAllOnButtons(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === "a") {
    const target = e.target as HTMLElement;
    if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
      e.preventDefault();
    }
  }
}

/**
 * Strip markdown formatting to get plain text for word counting.
 */
function stripMarkdown(text: string): string {
  return (
    text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`]+`/g, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")
      .replace(/^>\s+/gm, "")
      .replace(/^[-*_]{3,}\s*$/gm, "")
      .replace(/^[\s]*[-*+]\s+/gm, "")
      .replace(/^[\s]*\d+\.\s+/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

/**
 * Count words using alfaaz library (handles CJK and other languages).
 * Expects pre-stripped plain text.
 */
function countWordsFromPlain(plainText: string): number {
  return alfaazCount(plainText);
}

/**
 * Count non-whitespace characters.
 * Expects pre-stripped plain text.
 */
function countCharsFromPlain(plainText: string): number {
  return plainText.replace(/\s/g, "").length;
}

interface TabTransferPayload {
  tabId: string;
  title: string;
  filePath: string | null;
  content: string;
  savedContent: string;
  isDirty: boolean;
  workspaceRoot: string | null;
}

interface TabDropPreviewEvent {
  sourceWindowLabel: string;
  targetWindowLabel: string | null;
}

const SPRING_LOAD_FOCUS_MS = 420;

export function StatusBar() {
  const isDocumentWindow = useIsDocumentWindow();
  const windowLabel = useWindowLabel();
  const content = useDocumentContent();
  const lastAutoSave = useDocumentLastAutoSave();
  const isMissing = useDocumentIsMissing();
  const isDivergent = useDocumentIsDivergent();
  const autoSaveEnabled = useSettingsStore((s) => s.general.autoSaveEnabled);
  const sourceMode = useEditorStore((state) => state.sourceMode);
  const statusBarVisible = useUIStore((state) => state.statusBarVisible);
  const terminalVisible = useUIStore((state) => state.terminalVisible);
  const sourceModeShortcut = useShortcutsStore((state) => state.getShortcut("sourceMode"));
  const terminalShortcut = useShortcutsStore((state) => state.getShortcut("toggleTerminal"));

  // AI genie running state
  const aiRunning = useAiInvocationStore((s) => s.isRunning);

  // MCP server status
  const { running: mcpRunning, loading: mcpLoading, port: mcpPort, error: mcpError } = useMcpServer();

  // Open Settings → Integrations for MCP status
  const openMcpSettings = useCallback(() => openSettingsWindow("integrations"), []);

  // Show warning when file is missing and auto-save is enabled
  const showAutoSavePaused = isMissing && autoSaveEnabled;

  // Tab state - only for document windows
  // Use stable EMPTY_TABS to avoid infinite loop from new array reference
  const tabs = useTabStore((state) =>
    isDocumentWindow ? state.tabs[windowLabel] ?? EMPTY_TABS : EMPTY_TABS
  );
  const activeTabId = useTabStore((state) =>
    isDocumentWindow ? state.activeTabId[windowLabel] : null
  );

  const [contextMenu, setContextMenu] = useState<{
    position: ContextMenuPosition;
    tab: TabType;
  } | null>(null);

  const [showAutoSave, setShowAutoSave] = useState(false);
  const [autoSaveTime, setAutoSaveTime] = useState<string>("");
  const tabDragScopeRef = useRef<HTMLDivElement>(null);
  const [dragTargetWindowLabel, setDragTargetWindowLabel] = useState<string | null>(null);
  const [isDropPreviewTarget, setIsDropPreviewTarget] = useState(false);
  const [snapbackTabId, setSnapbackTabId] = useState<string | null>(null);
  const [ariaAnnouncement, setAriaAnnouncement] = useState("");
  const ariaClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const springFocusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const springFocusedWindowRef = useRef<string | null>(null);
  const previewProbeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDragPointRef = useRef<DragOutPoint | null>(null);

  // Auto-save indicator effect
  useEffect(() => {
    if (!lastAutoSave) return;

    setAutoSaveTime(formatRelativeTime(lastAutoSave));
    setShowAutoSave(true);

    const updateInterval = setInterval(() => {
      setAutoSaveTime(formatRelativeTime(lastAutoSave));
    }, 10000);

    const fadeTimeout = setTimeout(() => {
      setShowAutoSave(false);
    }, 5000);

    return () => {
      clearInterval(updateInterval);
      clearTimeout(fadeTimeout);
    };
  }, [lastAutoSave]);

  // Tab handlers
  const handleActivateTab = useCallback(
    (tabId: string) => {
      useTabStore.getState().setActiveTab(windowLabel, tabId);
    },
    [windowLabel]
  );

  const handleCloseTab = useCallback(
    (tabId: string) => {
      closeTabWithDirtyCheck(windowLabel, tabId);
    },
    [windowLabel]
  );

  const handleContextMenu = useCallback(
    (e: MouseEvent, tab: TabType) => {
      e.preventDefault();
      setContextMenu({
        position: { x: e.clientX, y: e.clientY },
        tab,
      });
    },
    []
  );

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleNewTab = useCallback(() => {
    const tabId = useTabStore.getState().createTab(windowLabel, null);
    useDocumentStore.getState().initDocument(tabId, "", null);
  }, [windowLabel]);

  const announce = useCallback((message: string) => {
    setAriaAnnouncement(message);
    if (ariaClearTimerRef.current) {
      clearTimeout(ariaClearTimerRef.current);
    }
    ariaClearTimerRef.current = setTimeout(() => {
      setAriaAnnouncement("");
      ariaClearTimerRef.current = null;
    }, 1200);
  }, []);

  const triggerSnapback = useCallback((tabId: string) => {
    setSnapbackTabId(tabId);
    setTimeout(() => {
      setSnapbackTabId((prev) => (prev === tabId ? null : prev));
    }, 180);
  }, []);

  const clearDropPreviewBroadcast = useCallback(() => {
    setDragTargetWindowLabel(null);
    void emit("tab:drop-preview", {
      sourceWindowLabel: windowLabel,
      targetWindowLabel: null,
    } satisfies TabDropPreviewEvent);
    if (springFocusTimerRef.current) {
      clearTimeout(springFocusTimerRef.current);
      springFocusTimerRef.current = null;
    }
    springFocusedWindowRef.current = null;
  }, [windowLabel]);

  const handleDragOut = useCallback(
    async (tabId: string, point: DragOutPoint) => {
      const tabState = useTabStore.getState();
      const windowTabs = tabState.getTabsByWindow(windowLabel);
      const tab = windowTabs.find((t) => t.id === tabId);
      if (!tab) {
        clearDropPreviewBroadcast();
        return;
      }

      // Prevent drag-out of last tab in main window
      if (windowLabel === "main" && windowTabs.length <= 1) {
        triggerSnapback(tabId);
        announce("Cannot move the last tab in the main window.");
        clearDropPreviewBroadcast();
        return;
      }

      const doc = useDocumentStore.getState().getDocument(tabId);
      if (!doc) {
        clearDropPreviewBroadcast();
        return;
      }

      const transferData: TabTransferPayload = {
        tabId: tab.id,
        title: tab.title,
        filePath: tab.filePath ?? null,
        content: doc.content,
        savedContent: doc.savedContent,
        isDirty: doc.isDirty,
        workspaceRoot: useWorkspaceStore.getState().rootPath ?? null,
      };

      try {
        const targetWindowLabel = await invoke<string | null>("find_drop_target_window", {
          sourceWindowLabel: windowLabel,
          screenX: point.screenX,
          screenY: point.screenY,
        });

        if (targetWindowLabel) {
          await invoke("transfer_tab_to_existing_window", {
            targetWindowLabel,
            data: transferData,
          });
          toast.message(`Moved "${tab.title}"`, {
            action: {
              label: "Undo",
              onClick: () => {
                void invoke("remove_tab_from_window", {
                  targetWindowLabel,
                  tabId: transferData.tabId,
                }).then(() => {
                  const restoredTabId = useTabStore.getState().createTransferredTab(windowLabel, {
                    id: transferData.tabId,
                    filePath: transferData.filePath,
                    title: transferData.title,
                    isPinned: false,
                  });
                  useDocumentStore.getState().initDocument(
                    restoredTabId,
                    transferData.content,
                    transferData.filePath,
                    transferData.savedContent
                  );
                }).catch((error) => {
                  console.error("[StatusBar] Undo cross-window move failed:", error);
                });
              },
            },
          });
          announce(`Moved tab ${tab.title} to another window.`);
        } else {
          const createdWindowLabel = await invoke<string>("detach_tab_to_new_window", {
            data: transferData,
          });
          toast.message(`Detached "${tab.title}"`, {
            action: {
              label: "Undo",
              onClick: () => {
                void invoke("remove_tab_from_window", {
                  targetWindowLabel: createdWindowLabel,
                  tabId: transferData.tabId,
                }).then(() => {
                  const restoredTabId = useTabStore.getState().createTransferredTab(windowLabel, {
                    id: transferData.tabId,
                    filePath: transferData.filePath,
                    title: transferData.title,
                    isPinned: false,
                  });
                  useDocumentStore.getState().initDocument(
                    restoredTabId,
                    transferData.content,
                    transferData.filePath,
                    transferData.savedContent
                  );
                }).catch((error) => {
                  console.error("[StatusBar] Undo detach failed:", error);
                });
              },
            },
          });
          announce(`Detached tab ${tab.title} into a new window.`);
        }

        // Remove tab from source window (no dirty check — content is transferred)
        tabState.detachTab(windowLabel, tabId);
        useDocumentStore.getState().removeDocument(tabId);

        // If no tabs remain in a doc window, close it
        const remaining = useTabStore.getState().getTabsByWindow(windowLabel);
        if (remaining.length === 0 && windowLabel !== "main") {
          const win = getCurrentWebviewWindow();
          invoke("close_window", { label: win.label }).catch(() => {});
        }
      } catch (err) {
        console.error("[StatusBar] drag-out failed:", err);
        triggerSnapback(tabId);
        announce(`Failed to move tab ${tab.title}.`);
      } finally {
        clearDropPreviewBroadcast();
      }
    },
    [announce, clearDropPreviewBroadcast, triggerSnapback, windowLabel]
  );

  const handleReorder = useCallback(
    (tabId: string, dropIdx: number) => {
      const windowTabs = useTabStore.getState().tabs[windowLabel] ?? [];
      const fromIndex = windowTabs.findIndex((t) => t.id === tabId);
      if (fromIndex === -1) return;
      const tab = windowTabs[fromIndex];
      if (!tab) return;
      const plan = planReorder(windowTabs, fromIndex, dropIdx);
      if (!plan.allowed || fromIndex === plan.toIndex) {
        if (!plan.allowed && plan.blockedReason === "pinned-zone") {
          triggerSnapback(tabId);
          announce("Pinned tabs stay at the left. Drop blocked.");
        }
        return;
      }

      useTabStore.getState().reorderTabs(windowLabel, fromIndex, plan.toIndex);
      toast.message(`Moved "${tab.title}"`, {
        action: {
          label: "Undo",
          onClick: () => {
            const currentTabs = useTabStore.getState().tabs[windowLabel] ?? [];
            const currentIndex = currentTabs.findIndex((t) => t.id === tab.id);
            if (currentIndex !== -1) {
              useTabStore.getState().reorderTabs(windowLabel, currentIndex, fromIndex);
            }
          },
        },
      });
      announce(`Reordered tab ${tab.title}.`);
    },
    [announce, triggerSnapback, windowLabel]
  );

  const handleTabKeyDown = useCallback(
    (tabId: string, e: KeyboardEvent) => {
      if (e.nativeEvent.isComposing) return;
      if (e.altKey && e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        e.preventDefault();
        const windowTabs = useTabStore.getState().tabs[windowLabel] ?? [];
        const fromIndex = windowTabs.findIndex((tab) => tab.id === tabId);
        if (fromIndex === -1) return;
        const visualDropIndex = e.key === "ArrowLeft" ? fromIndex : fromIndex + 2;
        handleReorder(tabId, visualDropIndex);
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleActivateTab(tabId);
      }
    },
    [handleActivateTab, handleReorder, windowLabel]
  );

  const { getTabDragHandlers, isDragging, isReordering, dragMode, dragTabId, dropIndex, dragPoint } = useTabDragOut({
    tabBarRef: tabDragScopeRef,
    onDragOut: handleDragOut,
    onReorder: handleReorder,
    onDragMove: ({ mode, point }) => {
      if (mode !== "dragout") return;
      latestDragPointRef.current = point;
      if (previewProbeTimerRef.current) return;
      previewProbeTimerRef.current = setTimeout(() => {
        previewProbeTimerRef.current = null;
        const currentPoint = latestDragPointRef.current;
        if (!currentPoint) return;
        void invoke<string | null>("find_drop_target_window", {
          sourceWindowLabel: windowLabel,
          screenX: currentPoint.screenX,
          screenY: currentPoint.screenY,
        }).then((targetWindowLabel) => {
          setDragTargetWindowLabel(targetWindowLabel);
          void emit("tab:drop-preview", {
            sourceWindowLabel: windowLabel,
            targetWindowLabel,
          } satisfies TabDropPreviewEvent);
        }).catch((error) => {
          console.error("[StatusBar] Failed to probe drop target:", error);
        });
      }, 60);
    },
  });

  const dragTab = dragTabId ? tabs.find((tab) => tab.id === dragTabId) ?? null : null;
  const dragFromIndex = dragTabId ? tabs.findIndex((tab) => tab.id === dragTabId) : -1;
  const reorderPlan = (dragMode === "reorder" && dragFromIndex !== -1 && dropIndex !== null)
    ? planReorder(tabs, dragFromIndex, dropIndex)
    : null;
  const isReorderBlocked = Boolean(reorderPlan && !reorderPlan.allowed);
  const isDragOutBlocked = dragMode === "dragout" && windowLabel === "main" && tabs.length <= 1;
  const isDropInvalid = isReorderBlocked || isDragOutBlocked;
  const dragHint = isDragOutBlocked
    ? "Cannot move the last tab in main window"
    : dragTargetWindowLabel
      ? `Drop to move to ${dragTargetWindowLabel}`
      : dragMode === "dragout"
        ? "Drop to create a new window"
        : isReorderBlocked
          ? "Pinned zone is locked"
          : "Reorder tab";

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    let cancelled = false;
    listen<TabDropPreviewEvent>("tab:drop-preview", (event) => {
      if (cancelled) return;
      const payload = event.payload;
      if (payload.sourceWindowLabel === windowLabel) return;
      setIsDropPreviewTarget(payload.targetWindowLabel === windowLabel);
    }).then((fn) => {
      if (cancelled) {
        fn();
      } else {
        unlisten = fn;
      }
    }).catch((error) => {
      console.error("[StatusBar] Failed to listen for drop preview events:", error);
    });

    return () => {
      cancelled = true;
      if (unlisten) unlisten();
    };
  }, [windowLabel]);

  useEffect(() => {
    if (dragMode !== "dragout" || !dragTargetWindowLabel) {
      if (springFocusTimerRef.current) {
        clearTimeout(springFocusTimerRef.current);
        springFocusTimerRef.current = null;
      }
      springFocusedWindowRef.current = null;
      return;
    }
    if (springFocusedWindowRef.current === dragTargetWindowLabel) return;
    if (springFocusTimerRef.current) {
      clearTimeout(springFocusTimerRef.current);
    }
    springFocusTimerRef.current = setTimeout(() => {
      springFocusTimerRef.current = null;
      springFocusedWindowRef.current = dragTargetWindowLabel;
      void invoke("focus_existing_window", {
        windowLabel: dragTargetWindowLabel,
      }).catch((error) => {
        console.error("[StatusBar] Failed to focus spring-loaded target:", error);
      });
    }, SPRING_LOAD_FOCUS_MS);
  }, [dragMode, dragTargetWindowLabel]);

  useEffect(() => {
    if (dragMode !== "idle") return;
    clearDropPreviewBroadcast();
  }, [clearDropPreviewBroadcast, dragMode]);

  useEffect(() => {
    if (dragMode !== "dragout" && previewProbeTimerRef.current) {
      clearTimeout(previewProbeTimerRef.current);
      previewProbeTimerRef.current = null;
    }
  }, [dragMode]);

  useEffect(() => {
    if (dragMode !== "dragout" && dragMode !== "reorder") return;
    const previousCursor = document.body.style.cursor;
    document.body.style.cursor = isDropInvalid ? "not-allowed" : "grabbing";
    return () => {
      document.body.style.cursor = previousCursor;
    };
  }, [dragMode, isDropInvalid]);

  useEffect(() => () => {
    if (ariaClearTimerRef.current) clearTimeout(ariaClearTimerRef.current);
    if (springFocusTimerRef.current) clearTimeout(springFocusTimerRef.current);
    if (previewProbeTimerRef.current) clearTimeout(previewProbeTimerRef.current);
  }, []);

  // Memoize stripped content once, then derive both counts from it
  // This avoids running the expensive stripMarkdown regex twice per keystroke
  const strippedContent = useMemo(() => stripMarkdown(content), [content]);
  const wordCount = useMemo(() => countWordsFromPlain(strippedContent), [strippedContent]);
  const charCount = useMemo(() => countCharsFromPlain(strippedContent), [strippedContent]);

  // Always show tabs when there's at least one tab
  const showTabs = isDocumentWindow && tabs.length >= 1;
  const showNewTabButton = isDocumentWindow;

  // When hidden (Cmd+J toggled), don't render — unless AI is working
  if (!statusBarVisible && !aiRunning) return null;

  return (
    <>
      <div
        className={`status-bar-container visible${isDropPreviewTarget ? " status-bar-container--drop-target" : ""}`}
        onKeyDown={preventSelectAllOnButtons}
      >
        <div className="status-bar">
          {/* Left section: tabs */}
          <div className="status-bar-left" ref={tabDragScopeRef}>
            {/* New tab button - always on the left */}
            {showNewTabButton && (
              <button
                type="button"
                className="status-new-tab"
                onClick={handleNewTab}
                aria-label="New tab"
                title="New Tab"
              >
                <Plus className="w-3 h-3" />
              </button>
            )}

            {/* Tabs section (pill style) */}
            {showTabs && (
              <div className="status-tabs" role="tablist">
                {tabs.map((tab, index) => {
                  const dragHandlers = getTabDragHandlers(tab.id, tab.isPinned);
                  const isBeingDragged = dragTabId === tab.id;
                  const showDropBefore = isReordering && dropIndex === index && !isBeingDragged && !isReorderBlocked;

                  return (
                    <Tab
                      key={tab.id}
                      tab={tab}
                      isActive={tab.id === activeTabId}
                      isDragTarget={isDragging && isBeingDragged}
                      isReordering={isReordering && isBeingDragged}
                      isInvalidDrop={isDropInvalid && isBeingDragged}
                      isSnapback={snapbackTabId === tab.id}
                      showDropIndicator={showDropBefore}
                      onActivate={() => handleActivateTab(tab.id)}
                      onKeyDown={(e) => handleTabKeyDown(tab.id, e)}
                      onClose={() => handleCloseTab(tab.id)}
                      onContextMenu={(e) => handleContextMenu(e, tab)}
                      onPointerDown={dragHandlers.onPointerDown}
                    />
                  );
                })}
                {isReordering && dropIndex !== null && dropIndex >= tabs.length && !isReorderBlocked && (
                  <div className="tab-drop-indicator" />
                )}
              </div>
            )}

          </div>

          {/* Right section: stats + mode */}
          <div className="status-bar-right">
            {/* AI genie running indicator */}
            {aiRunning && (
              <span className="status-ai-running" title="AI genie is working...">
                <Sparkles size={12} />
              </span>
            )}

            {/* MCP status indicator */}
            <button
              className={`status-mcp ${mcpRunning ? "connected" : ""} ${mcpLoading ? "loading" : ""} ${mcpError ? "error" : ""}`}
              onClick={openMcpSettings}
              title={
                mcpError
                  ? `MCP error: ${mcpError}`
                  : mcpLoading
                    ? "MCP starting..."
                    : mcpRunning
                      ? `MCP running on port ${mcpPort}`
                      : "MCP stopped · Click to configure"
              }
            >
              <Satellite size={12} />
            </button>

            {/* Update status indicator */}
            <UpdateIndicator />

            {showAutoSavePaused && (
              <span
                className="status-autosave-paused"
                title="Auto-save paused: file was deleted from disk. Save manually with Cmd+S."
              >
                <AlertTriangle size={12} />
                Auto-save paused
              </span>
            )}
            {isDivergent && !showAutoSavePaused && (
              <span
                className="status-divergent"
                title="Local differs from disk. Save (Cmd+S) to sync, or use File > Revert to discard local changes."
              >
                <GitFork size={12} />
                Divergent
              </span>
            )}
            {showAutoSave && lastAutoSave && !showAutoSavePaused && !isDivergent && (
              <span
                className="status-autosave"
                title={`Auto-saved at ${formatExactTime(lastAutoSave)}`}
              >
                <Save size={12} />
                {autoSaveTime}
              </span>
            )}
            <span className="status-item">{wordCount} words</span>
            <span className="status-item">{charCount} chars</span>
            <button
              className={`status-terminal ${terminalVisible ? "active" : ""}`}
              title={`Toggle Terminal (${formatKeyForDisplay(terminalShortcut)})`}
              onClick={() => useUIStore.getState().toggleTerminal()}
            >
              <Terminal size={12} />
            </button>
            <button
              className="status-mode"
              title={sourceMode ? `Source Mode (${formatKeyForDisplay(sourceModeShortcut)})` : `Rich Text Mode (${formatKeyForDisplay(sourceModeShortcut)})`}
              onClick={() => {
                // Close any open image paste toast (don't paste - user is switching modes)
                const toastStore = useImagePasteToastStore.getState();
                if (toastStore.isOpen) {
                  toastStore.hideToast();
                }
                flushActiveWysiwygNow();
                useEditorStore.getState().toggleSourceMode();
              }}
            >
              {sourceMode ? <Code2 size={14} /> : <Type size={12} />}
            </button>
          </div>
        </div>
      </div>

      {dragPoint && dragTab && dragMode !== "idle" && (
        <div
          className={`tab-drag-ghost${isDropInvalid ? " invalid" : ""}`}
          style={{ transform: `translate3d(${dragPoint.clientX + 14}px, ${dragPoint.clientY + 14}px, 0)` }}
        >
          <span className="tab-drag-ghost-title">{dragTab.title}</span>
          <span className="tab-drag-ghost-hint">{dragHint}</span>
        </div>
      )}

      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {ariaAnnouncement}
      </div>

      {/* Tab context menu */}
      {contextMenu && (
        <TabContextMenu
          tab={contextMenu.tab}
          position={contextMenu.position}
          windowLabel={windowLabel}
          onClose={handleCloseContextMenu}
        />
      )}
    </>
  );
}

export default StatusBar;
