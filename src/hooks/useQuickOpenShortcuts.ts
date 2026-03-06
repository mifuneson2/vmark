import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { safeUnlistenAsync } from "@/utils/safeUnlisten";
import { useShortcutsStore } from "@/stores/shortcutsStore";
import { useQuickOpenStore } from "@/components/QuickOpen/quickOpenStore";
import { matchesShortcutEvent } from "@/utils/shortcutMatch";
import { isImeKeyEvent } from "@/utils/imeGuard";

export function useQuickOpenShortcuts(): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (isImeKeyEvent(e)) return;
      const quickOpenKey = useShortcutsStore.getState().getShortcut("quickOpen");
      if (matchesShortcutEvent(e, quickOpenKey)) {
        e.preventDefault();
        useQuickOpenStore.getState().toggle();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const unlisten = listen("menu:quick-open", () => {
      useQuickOpenStore.getState().toggle();
    });
    return () => safeUnlistenAsync(unlisten);
  }, []);
}
