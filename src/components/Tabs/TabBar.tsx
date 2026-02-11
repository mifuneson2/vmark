import { useCallback, useState, useRef, type MouseEvent } from "react";
import { Plus } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { cn } from "@/lib/utils";
import { useWindowLabel } from "@/contexts/WindowContext";
import { useTabStore, type Tab as TabType } from "@/stores/tabStore";
import { useDocumentStore } from "@/stores/documentStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { closeTabWithDirtyCheck } from "@/hooks/useTabOperations";
import { useTabDragOut } from "@/hooks/useTabDragOut";
import { Tab } from "./Tab";
import { TabContextMenu, type ContextMenuPosition } from "./TabContextMenu";

export function TabBar() {
  const windowLabel = useWindowLabel();
  const tabs = useTabStore((state) => state.tabs[windowLabel] ?? []);
  const activeTabId = useTabStore((state) => state.activeTabId[windowLabel]);

  const [contextMenu, setContextMenu] = useState<{
    position: ContextMenuPosition;
    tab: TabType;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);

  const handleDragOut = useCallback(
    async (tabId: string) => {
      const tabState = useTabStore.getState();
      const windowTabs = tabState.getTabsByWindow(windowLabel);
      const tab = windowTabs.find((t) => t.id === tabId);
      if (!tab) return;

      // Prevent drag-out of last tab in main window
      if (windowLabel === "main" && windowTabs.length <= 1) return;

      const doc = useDocumentStore.getState().getDocument(tabId);
      if (!doc) return;

      try {
        await invoke<string>("detach_tab_to_new_window", {
          data: {
            tabId: tab.id,
            title: tab.title,
            filePath: tab.filePath ?? null,
            content: doc.content,
            savedContent: doc.savedContent,
            isDirty: doc.isDirty,
            workspaceRoot: useWorkspaceStore.getState().rootPath ?? null,
          },
        });

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
        console.error("[TabBar] drag-out failed:", err);
      }
    },
    [windowLabel]
  );

  const handleReorder = useCallback(
    (tabId: string, dropIdx: number) => {
      const windowTabs = useTabStore.getState().tabs[windowLabel] ?? [];
      const fromIndex = windowTabs.findIndex((t) => t.id === tabId);
      if (fromIndex === -1) return;

      // calcDropIndex returns visual insertion point (0..N).
      // reorderTabs does splice(from,1) then splice(to,0,item),
      // so when moving forward the target shifts left by 1.
      let toIndex = dropIdx;
      if (fromIndex < dropIdx) {
        toIndex = dropIdx - 1;
      }
      // Clamp to valid range
      toIndex = Math.max(0, Math.min(toIndex, windowTabs.length - 1));

      if (fromIndex === toIndex) return;
      useTabStore.getState().reorderTabs(windowLabel, fromIndex, toIndex);
    },
    [windowLabel]
  );

  const { getTabDragHandlers, isDragging, isReordering, dragTabId, dropIndex } = useTabDragOut({
    tabBarRef,
    onDragOut: handleDragOut,
    onReorder: handleReorder,
  });

  const handleActivateTab = useCallback(
    (tabId: string) => {
      useTabStore.getState().setActiveTab(windowLabel, tabId);
    },
    [windowLabel]
  );

  const handleCloseTab = useCallback(
    async (tabId: string) => {
      await closeTabWithDirtyCheck(windowLabel, tabId);
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

  // Don't render if no tabs (shouldn't happen normally)
  if (tabs.length === 0) {
    return null;
  }

  return (
    <>
      <div
        ref={tabBarRef}
        className={cn(
          "flex items-center h-9",
          "bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]",
          "select-none"
        )}
        data-tauri-drag-region
      >
        {/* Tab list with horizontal scroll */}
        <div
          ref={scrollRef}
          className="flex-1 flex items-center overflow-x-auto scrollbar-none"
          role="tablist"
        >
          {tabs.map((tab, index) => {
            const dragHandlers = getTabDragHandlers(tab.id, tab.isPinned);
            const isBeingDragged = dragTabId === tab.id;
            // Show drop indicator before this tab when reordering
            const showDropBefore = isReordering && dropIndex === index && !isBeingDragged;

            return (
              <Tab
                key={tab.id}
                tab={tab}
                isActive={tab.id === activeTabId}
                isDragTarget={isDragging && isBeingDragged}
                isReordering={isReordering && isBeingDragged}
                showDropIndicator={showDropBefore}
                onActivate={() => handleActivateTab(tab.id)}
                onClose={() => handleCloseTab(tab.id)}
                onContextMenu={(e) => handleContextMenu(e, tab)}
                onPointerDown={dragHandlers.onPointerDown}
              />
            );
          })}
          {/* Drop indicator at end of tab list */}
          {isReordering && dropIndex !== null && dropIndex >= tabs.length && (
            <div className="tab-drop-indicator" />
          )}
        </div>

        {/* New tab button */}
        <button
          type="button"
          className={cn(
            "flex-shrink-0 w-8 h-8 flex items-center justify-center",
            "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
            "hover:bg-[var(--bg-tertiary)]",
            "transition-colors duration-100"
          )}
          style={{ WebkitAppRegion: "no-drag", appRegion: "no-drag" } as React.CSSProperties}
          onClick={handleNewTab}
          aria-label="New tab"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Context menu */}
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

export default TabBar;
