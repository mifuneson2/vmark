import { memo, useCallback, type MouseEvent, type PointerEvent } from "react";
import { X, Pin, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tab as TabType } from "@/stores/tabStore";
import { useDocumentStore } from "@/stores/documentStore";

interface TabProps {
  tab: TabType;
  isActive: boolean;
  isDragTarget?: boolean;
  onActivate: () => void;
  onClose: () => void;
  onContextMenu: (e: MouseEvent) => void;
  onPointerDown?: (e: PointerEvent) => void;
}

export const Tab = memo(function Tab({
  tab,
  isActive,
  isDragTarget,
  onActivate,
  onClose,
  onContextMenu,
  onPointerDown,
}: TabProps) {
  // Get dirty and missing state from document store
  const isDirty = useDocumentStore(
    (state) => state.documents[tab.id]?.isDirty ?? false
  );
  const isMissing = useDocumentStore(
    (state) => state.documents[tab.id]?.isMissing ?? false
  );

  const handleClose = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      onClose();
    },
    [onClose]
  );

  const handleMiddleClick = useCallback(
    (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
        onClose();
      }
    },
    [onClose]
  );

  return (
    <div
      role="tab"
      aria-selected={isActive}
      className={cn(
        "tab-pill group",
        isActive && "active",
        isMissing && "tab-missing",
        isDragTarget && "tab--dragging"
      )}
      onClick={onActivate}
      onMouseDown={handleMiddleClick}
      onPointerDown={onPointerDown}
      onContextMenu={onContextMenu}
      title={isMissing ? "File deleted from disk" : undefined}
    >
      {/* Pin indicator */}
      {tab.isPinned && (
        <Pin className="w-3 h-3 text-[var(--text-tertiary)] flex-shrink-0" />
      )}

      {/* Missing file indicator (warning icon) */}
      {isMissing && (
        <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
      )}

      {/* Dirty indicator (dot before title) */}
      {isDirty && !isMissing && (
        <span className="tab-dirty-dot" />
      )}

      {/* Tab title */}
      <span className="tab-title">{tab.title}</span>

      {/* Close button (shown on hover for non-pinned) */}
      {!tab.isPinned && (
        <button
          type="button"
          className="tab-close"
          onClick={handleClose}
          aria-label={`Close ${tab.title}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
});

export default Tab;
