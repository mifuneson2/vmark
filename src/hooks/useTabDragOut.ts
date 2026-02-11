import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";

/** Vertical distance (px) below the tab bar bottom to trigger drag-out. */
const DRAG_OUT_THRESHOLD = 40;

/** Horizontal distance (px) to lock into reorder mode. */
const REORDER_LOCK_THRESHOLD = 6;

type DragMode = "idle" | "pending" | "reorder" | "dragout";

interface UseTabDragOptions {
  tabBarRef: RefObject<HTMLElement | null>;
  onDragOut: (tabId: string) => void;
  onReorder: (tabId: string, toIndex: number) => void;
}

interface TabDragHandlers {
  onPointerDown: (e: ReactPointerEvent) => void;
}

interface UseTabDragResult {
  getTabDragHandlers: (tabId: string, isPinned: boolean) => TabDragHandlers;
  isDragging: boolean;
  isReordering: boolean;
  dragTabId: string | null;
  dropIndex: number | null;
}

/** Get the index where a dragged tab should be inserted based on cursor X. */
function calcDropIndex(bar: HTMLElement, clientX: number): number {
  const tablist = bar.querySelector("[role='tablist']");
  if (!tablist) return -1;

  const tabs = Array.from(tablist.querySelectorAll<HTMLElement>("[role='tab']"));
  if (tabs.length === 0) return -1;

  for (let i = 0; i < tabs.length; i++) {
    const rect = tabs[i].getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    if (clientX < midX) {
      return i;
    }
  }
  return tabs.length;
}

export function useTabDragOut({ tabBarRef, onDragOut, onReorder }: UseTabDragOptions): UseTabDragResult {
  const [isDragging, setIsDragging] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [dragTabId, setDragTabId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  // Track drop index in a ref so handleUp can read it synchronously
  const dropIndexRef = useRef<number | null>(null);

  const stateRef = useRef({
    tabId: null as string | null,
    mode: "idle" as DragMode,
    startX: 0,
    startY: 0,
  });

  // Stable refs for callbacks used in document listeners
  const onDragOutRef = useRef(onDragOut);
  onDragOutRef.current = onDragOut;
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;
  const tabBarRefRef = useRef(tabBarRef);
  tabBarRefRef.current = tabBarRef;

  // Detach document listeners and reset state
  const cleanupRef = useRef(() => {});
  const cleanup = useCallback(() => {
    cleanupRef.current();
    cleanupRef.current = () => {};
    stateRef.current = { tabId: null, mode: "idle", startX: 0, startY: 0 };
    dropIndexRef.current = null;
    setIsDragging(false);
    setIsReordering(false);
    setDragTabId(null);
    setDropIndex(null);
  }, []);

  const getTabDragHandlers = useCallback(
    (tabId: string, isPinned: boolean): TabDragHandlers => ({
      onPointerDown: (e: ReactPointerEvent) => {
        // Only primary button; skip pinned tabs
        if (e.button !== 0 || isPinned) return;

        stateRef.current = {
          tabId,
          mode: "pending",
          startX: e.clientX,
          startY: e.clientY,
        };
        dropIndexRef.current = null;
        setDragTabId(tabId);

        const handleMove = (ev: PointerEvent) => {
          const s = stateRef.current;
          if (!s.tabId) return;

          const bar = tabBarRefRef.current.current;
          if (!bar) return;

          const dx = ev.clientX - s.startX;
          const barBottom = bar.getBoundingClientRect().bottom;

          if (s.mode === "pending") {
            // Direction lock: determine reorder vs drag-out
            if (ev.clientY > barBottom + DRAG_OUT_THRESHOLD) {
              s.mode = "dragout";
              setIsDragging(true);
            } else if (Math.abs(dx) > REORDER_LOCK_THRESHOLD) {
              s.mode = "reorder";
              setIsReordering(true);
              const idx = calcDropIndex(bar, ev.clientX);
              dropIndexRef.current = idx;
              setDropIndex(idx);
            }
          } else if (s.mode === "reorder") {
            // Update drop position
            const idx = calcDropIndex(bar, ev.clientX);
            dropIndexRef.current = idx;
            setDropIndex(idx);

            // Allow escape to drag-out even while reordering
            if (ev.clientY > barBottom + DRAG_OUT_THRESHOLD) {
              s.mode = "dragout";
              setIsReordering(false);
              setIsDragging(true);
              dropIndexRef.current = null;
              setDropIndex(null);
            }
          }
          // dragout mode: nothing more to track
        };

        const handleUp = () => {
          const s = stateRef.current;
          if (s.tabId) {
            if (s.mode === "dragout") {
              onDragOutRef.current(s.tabId);
            } else if (s.mode === "reorder" && dropIndexRef.current !== null) {
              onReorderRef.current(s.tabId, dropIndexRef.current);
            }
          }
          cleanup();
        };

        document.addEventListener("pointermove", handleMove);
        document.addEventListener("pointerup", handleUp);
        document.addEventListener("pointercancel", cleanup);

        cleanupRef.current = () => {
          document.removeEventListener("pointermove", handleMove);
          document.removeEventListener("pointerup", handleUp);
          document.removeEventListener("pointercancel", cleanup);
        };
      },
    }),
    [cleanup]
  );

  return { getTabDragHandlers, isDragging, isReordering, dragTabId, dropIndex };
}
