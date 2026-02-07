/**
 * Prompt Shortcuts Hook
 *
 * - Cmd+Y keyboard shortcut opens the prompt picker
 * - Loads prompts on mount and syncs to native menu
 * - Handles direct prompt invocation from the Genies menu
 */

import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { useShortcutsStore } from "@/stores/shortcutsStore";
import { usePromptPickerStore } from "@/stores/promptPickerStore";
import { usePromptsStore } from "@/stores/promptsStore";
import { usePromptInvocation } from "@/hooks/usePromptInvocation";
import { matchesShortcutEvent } from "@/utils/shortcutMatch";
import { isImeKeyEvent } from "@/utils/imeGuard";
import type { PromptDefinition, PromptMetadata } from "@/types/aiPrompts";

/** Load prompts from disk and refresh the native Genies menu. */
async function loadAndSyncMenu(): Promise<void> {
  await usePromptsStore.getState().loadPrompts();
  await invoke("refresh_genies_menu");
}

export function usePromptShortcuts() {
  const { invokePrompt } = usePromptInvocation();

  // Keyboard shortcut (Cmd+Y) — opens the prompt picker
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isImeKeyEvent(e)) return;

      const aiPromptsKey = useShortcutsStore.getState().getShortcut("aiPrompts");
      if (matchesShortcutEvent(e, aiPromptsKey)) {
        e.preventDefault();
        usePromptPickerStore.getState().openPicker();
      }
    };

    // Must fire before INPUT/TEXTAREA guard (global shortcut)
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Load prompts + sync menu on mount
  useEffect(() => {
    loadAndSyncMenu().catch((e) =>
      console.error("[usePromptShortcuts] Failed to load prompts:", e)
    );
  }, []);

  // Direct prompt invocation from Genies menu — reads from disk directly
  // to avoid name-collision issues with the deduplicated store.
  useEffect(() => {
    const unlisten = listen<[string, string]>(
      "menu:invoke-genie",
      async (event) => {
        const [promptPath] = event.payload;
        try {
          const result = await invoke<{ metadata: PromptMetadata; template: string }>(
            "read_prompt",
            { path: promptPath },
          );
          const prompt: PromptDefinition = {
            metadata: result.metadata,
            template: result.template,
            filePath: promptPath,
            source: "global", // source isn't used by invokePrompt
          };
          invokePrompt(prompt);
        } catch (e) {
          console.error("[usePromptShortcuts] Failed to read genie:", e);
        }
      }
    );

    return () => {
      unlisten.then((fn) => fn()).catch(() => {});
    };
  }, [invokePrompt]);

  // "Search Genies…" menu item opens the picker (same as Cmd+Y)
  useEffect(() => {
    const unlisten = listen("menu:search-genies", () => {
      usePromptPickerStore.getState().openPicker();
    });
    return () => {
      unlisten.then((fn) => fn()).catch(() => {});
    };
  }, []);

  // "Reload Genies" menu item re-scans the genies folder
  useEffect(() => {
    const unlisten = listen("menu:reload-genies", () => {
      loadAndSyncMenu().catch((e) =>
        console.error("[usePromptShortcuts] Failed to reload genies:", e)
      );
    });
    return () => {
      unlisten.then((fn) => fn()).catch(() => {});
    };
  }, []);
}
