/**
 * Workflow Preview Store
 *
 * Purpose: Manages the state of the workflow side panel for standalone .yml files.
 * Tracks panel visibility, parsed graph, parse errors, and active step highlighting.
 *
 * @coordinates-with WorkflowSidePanel.tsx — UI reads this store
 * @coordinates-with Editor.tsx — panel rendered alongside editor content
 * @module stores/workflowPreviewStore
 */

import { create } from "zustand";
import type { WorkflowGraph } from "@/lib/workflow/types";

interface WorkflowPreviewState {
  panelOpen: boolean;
  graph: WorkflowGraph | null;
  parseError: string | null;
  activeStepId: string | null;

  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  setGraph: (graph: WorkflowGraph | null, error?: string) => void;
  setActiveStepId: (stepId: string | null) => void;
  reset: () => void;
}

const initialState = {
  panelOpen: false,
  graph: null as WorkflowGraph | null,
  parseError: null as string | null,
  activeStepId: null as string | null,
};

export const useWorkflowPreviewStore = create<WorkflowPreviewState>((set) => ({
  ...initialState,

  openPanel: () => set({ panelOpen: true }),
  closePanel: () => set({ panelOpen: false }),
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),

  setGraph: (graph, error) =>
    set({
      graph,
      parseError: error ?? null,
      // Clear active step if graph changed
      activeStepId: null,
    }),

  setActiveStepId: (stepId) => set({ activeStepId: stepId }),

  reset: () => set(initialState),
}));
