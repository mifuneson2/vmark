/**
 * Lint Store
 *
 * Purpose: Tab-scoped storage for markdown lint diagnostics.
 * Ephemeral — no persistence. Diagnostics are cleared on document edit.
 */

import { create } from "zustand";
import { lintMarkdown } from "@/lib/lintEngine";
import type { LintDiagnostic } from "@/lib/lintEngine";

interface LintState {
  /** Diagnostics keyed by tabId */
  diagnosticsByTab: Record<string, LintDiagnostic[]>;
  /** Source hash per tab to detect stale results */
  sourceHashByTab: Record<string, string>;
  /** Currently selected diagnostic index for navigation */
  selectedIndex: number;
}

interface LintActions {
  /** Run lint on source for a specific tab */
  runLint: (tabId: string, source: string) => LintDiagnostic[];
  /** Clear diagnostics for a specific tab */
  clearDiagnostics: (tabId: string) => void;
  /** Clear all tabs */
  clearAllDiagnostics: () => void;
  /** Navigate to next diagnostic (wraps around) */
  selectNext: (tabId: string) => void;
  /** Navigate to previous diagnostic (wraps around) */
  selectPrev: (tabId: string) => void;
}

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}

export const useLintStore = create<LintState & LintActions>((set, get) => ({
  diagnosticsByTab: {},
  sourceHashByTab: {},
  selectedIndex: 0,

  runLint: (tabId, source) => {
    const hash = simpleHash(source);
    const diagnostics = lintMarkdown(source);

    set((state) => ({
      diagnosticsByTab: { ...state.diagnosticsByTab, [tabId]: diagnostics },
      sourceHashByTab: { ...state.sourceHashByTab, [tabId]: hash },
      selectedIndex: 0,
    }));

    return diagnostics;
  },

  clearDiagnostics: (tabId) => {
    set((state) => {
      const { [tabId]: _, ...rest } = state.diagnosticsByTab;
      const { [tabId]: __, ...hashRest } = state.sourceHashByTab;
      return {
        diagnosticsByTab: rest,
        sourceHashByTab: hashRest,
        selectedIndex: 0,
      };
    });
  },

  clearAllDiagnostics: () => {
    set({ diagnosticsByTab: {}, sourceHashByTab: {}, selectedIndex: 0 });
  },

  selectNext: (tabId) => {
    const diagnostics = get().diagnosticsByTab[tabId];
    if (!diagnostics || diagnostics.length === 0) return;
    set((state) => ({
      selectedIndex: (state.selectedIndex + 1) % diagnostics.length,
    }));
  },

  selectPrev: (tabId) => {
    const diagnostics = get().diagnosticsByTab[tabId];
    if (!diagnostics || diagnostics.length === 0) return;
    set((state) => ({
      selectedIndex:
        state.selectedIndex <= 0
          ? diagnostics.length - 1
          : state.selectedIndex - 1,
    }));
  },
}));
