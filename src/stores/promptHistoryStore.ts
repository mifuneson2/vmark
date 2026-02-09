/**
 * Prompt History Store
 *
 * Persists freeform prompts used in the GeniePicker.
 * Newest entries first (index 0 = most recent).
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const MAX_ENTRIES = 100;

interface PromptHistoryState {
  entries: string[];
}

interface PromptHistoryActions {
  addEntry(prompt: string): void;
  clearHistory(): void;
  getFilteredEntries(prefix: string): string[];
}

export const usePromptHistoryStore = create<
  PromptHistoryState & PromptHistoryActions
>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (prompt) => {
        const trimmed = prompt.trim();
        if (!trimmed) return;

        set((state) => {
          // Remove duplicates (moves to top)
          const filtered = state.entries.filter((e) => e !== trimmed);
          return {
            entries: [trimmed, ...filtered].slice(0, MAX_ENTRIES),
          };
        });
      },

      clearHistory: () => set({ entries: [] }),

      getFilteredEntries: (prefix) => {
        const { entries } = get();
        if (!prefix) return entries;
        const lower = prefix.toLowerCase();
        return entries.filter((e) => e.toLowerCase().includes(lower));
      },
    }),
    {
      name: "vmark-prompt-history",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        entries: state.entries,
      }),
    }
  )
);
