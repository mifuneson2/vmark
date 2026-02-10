import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";

/** Vertical distance (px) below the tab bar bottom to trigger drag-out. */
const DRAG_OUT_THRESHOLD = 40;

interface UseTabDragOutOptions {
  tabBarRef: RefObject<HTMLElement | null>;
  onDragOut: (tabId: string) => void;
}

interface TabDragHandlers {
  onPointerDown: (e: ReactPointerEvent) => void;
}

interface UseTabDragOutResult {
  getTabDragHandlers: (tabId: string, isPinned: boolean) => TabDragHandlers;
  isDragging: boolean;
  dragTabId: string | null;
}

export function useTabDragOut({ tabBarRef, onDragOut }: UseTabDragOutOptions): UseTabDragOutResult {
  const [isDragging, setIsDragging] = useState(false);
  const [dragTabId, setDragTabId] = useState<string | null>(null);

  const stateRef = useRef({
    tabId: null as string | null,
    triggered: false,
  });

  // Stable refs for callbacks used in document listeners
  const onDragOutRef = useRef(onDragOut);
  onDragOutRef.current = onDragOut;
  const tabBarRefRef = useRef(tabBarRef);
  tabBarRefRef.current = tabBarRef;

  // Detach document listeners and reset state
  const cleanupRef = useRef(() => {});
  const cleanup = useCallback(() => {
    cleanupRef.current();
    cleanupRef.current = () => {};
    stateRef.current = { tabId: null, triggered: false };
    setIsDragging(false);
    setDragTabId(null);
  }, []);

  const getTabDragHandlers = useCallback(
    (tabId: string, isPinned: boolean): TabDragHandlers => ({
      onPointerDown: (e: ReactPointerEvent) => {
        // Only primary button; skip pinned tabs
        if (e.button !== 0 || isPinned) return;

        stateRef.current = { tabId, triggered: false };
        setDragTabId(tabId);

        // Attach document-level listeners only while dragging
        const handleMove = (ev: PointerEvent) => {
          const s = stateRef.current;
          if (!s.tabId || s.triggered) return;

          const bar = tabBarRefRef.current.current;
          if (!bar) return;

          const barBottom = bar.getBoundingClientRect().bottom;
          if (ev.clientY > barBottom + DRAG_OUT_THRESHOLD) {
            s.triggered = true;
            setIsDragging(true);
          }
        };

        const handleUp = () => {
          const s = stateRef.current;
          if (s.tabId && s.triggered) {
            onDragOutRef.current(s.tabId);
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

  return { getTabDragHandlers, isDragging, dragTabId };
}
