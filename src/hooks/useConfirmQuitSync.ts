import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "@/stores/settingsStore";

/**
 * Sync the confirmQuit setting to Rust on mount and when it changes.
 * Rust uses an AtomicBool to gate Cmd+Q — it can't read Zustand directly.
 *
 * Ordering safety: React batches synchronous Zustand updates into a single
 * render, so rapid toggles produce only one effect with the final value.
 * For separate renders, JS single-threading guarantees sequential invoke()
 * dispatch, and Rust's AtomicBool::store is idempotent — last write wins.
 */
export function useConfirmQuitSync() {
  const confirmQuit = useSettingsStore((state) => state.general.confirmQuit);

  useEffect(() => {
    invoke("set_confirm_quit", { enabled: confirmQuit }).catch((err: unknown) => {
      if (import.meta.env.DEV) {
        console.warn("[useConfirmQuitSync] Failed to sync:", err);
      }
    });
  }, [confirmQuit]);
}
