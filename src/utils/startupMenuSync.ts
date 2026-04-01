/**
 * Startup menu sync.
 *
 * Purpose: Rebuilds the native menu bar with translated labels when the
 * user's saved language is non-English. Must run after both i18n and
 * shortcutsStore are initialized.
 *
 * Separated from i18n.ts to avoid a circular dependency:
 *   i18n.ts → shortcutsStore.ts → i18n.ts
 *
 * @coordinates-with i18n.ts — relies on Rust locale being set first
 * @coordinates-with stores/shortcutsStore.ts — reads shortcuts for menu rebuild
 */
import { invoke } from "@tauri-apps/api/core";
import { menuSyncWarn } from "@/utils/debug";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  useShortcutsStore,
  DEFAULT_SHORTCUTS,
  prosemirrorToTauri,
} from "@/stores/shortcutsStore";

const startupLang = useSettingsStore.getState().general.language;
if (startupLang && startupLang !== "en") {
  invoke("set_locale", { locale: startupLang })
    .then(() => {
      const allShortcuts = useShortcutsStore.getState().getAllShortcuts();
      const menuShortcuts: Record<string, string> = {};
      for (const def of DEFAULT_SHORTCUTS) {
        if (def.menuId) {
          menuShortcuts[def.menuId] = prosemirrorToTauri(
            allShortcuts[def.id] ?? ""
          );
        }
      }
      return invoke("rebuild_menu", { shortcuts: menuShortcuts }).then(async () => {
        // Rebuild resets dynamic submenus — re-populate them
        const geniesAccel = menuShortcuts["search-genies"]
          ? { "search-genies": menuShortcuts["search-genies"] }
          : null;
        await invoke("refresh_genies_menu", { shortcuts: geniesAccel });
        const { useRecentFilesStore } = await import("@/stores/recentFilesStore");
        const { useRecentWorkspacesStore } = await import("@/stores/recentWorkspacesStore");
        useRecentFilesStore.getState().syncToNativeMenu();
        useRecentWorkspacesStore.getState().syncToNativeMenu();
      });
    })
    .catch((e) => { menuSyncWarn("rebuild failed:", e); });
}
