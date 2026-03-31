/**
 * Workflow Execution Store
 *
 * Purpose: Tracks workflow execution state — running executions, step statuses,
 * and execution history. Frontend only; the Rust runner emits events that this
 * store consumes.
 *
 * @coordinates-with WorkflowPreview.tsx — nodes read step status for visual feedback
 * @coordinates-with useWorkflowExecution.ts — listens to Tauri events and updates this store
 * @module stores/workflowExecutionStore
 */

import { create } from "zustand";

export interface StepExecution {
  stepId: string;
  status: "pending" | "running" | "success" | "error" | "skipped";
  startedAt?: number;
  completedAt?: number;
  output?: string;
  error?: string;
  tokenCount?: number;
  cost?: number;
}

export interface WorkflowExecution {
  id: string;
  workflowName: string;
  startedAt: number;
  status: "running" | "completed" | "failed" | "cancelled";
  steps: Record<string, StepExecution>;
}

const MAX_HISTORY = 50;

interface WorkflowExecutionState {
  executions: Record<string, WorkflowExecution>;
  activeExecutionId: string | null;

  startExecution: (id: string, workflowName: string, stepIds: string[]) => void;
  updateStepStatus: (executionId: string, stepId: string, update: Partial<StepExecution>) => void;
  completeExecution: (executionId: string, status: "completed" | "failed") => void;
  cancelExecution: (executionId: string) => void;
  getExecution: (executionId: string) => WorkflowExecution | undefined;
  reset: () => void;
}

const initialState = {
  executions: {} as Record<string, WorkflowExecution>,
  activeExecutionId: null as string | null,
};

export const useWorkflowExecutionStore = create<WorkflowExecutionState>((set, get) => ({
  ...initialState,

  startExecution: (id, workflowName, stepIds) => {
    const steps: Record<string, StepExecution> = {};
    for (const stepId of stepIds) {
      steps[stepId] = { stepId, status: "pending" };
    }
    set((state) => {
      const executions = { ...state.executions };

      // Enforce history limit
      const ids = Object.keys(executions);
      if (ids.length >= MAX_HISTORY) {
        const sorted = ids
          .map((k) => ({ id: k, startedAt: executions[k].startedAt }))
          .sort((a, b) => a.startedAt - b.startedAt);
        for (let i = 0; i <= ids.length - MAX_HISTORY; i++) {
          delete executions[sorted[i].id];
        }
      }

      executions[id] = {
        id,
        workflowName,
        startedAt: Date.now(),
        status: "running",
        steps,
      };
      return { executions, activeExecutionId: id };
    });
  },

  updateStepStatus: (executionId, stepId, update) => {
    set((state) => {
      const exec = state.executions[executionId];
      if (!exec) return state;
      const step = exec.steps[stepId];
      if (!step) return state;
      return {
        executions: {
          ...state.executions,
          [executionId]: {
            ...exec,
            steps: {
              ...exec.steps,
              [stepId]: { ...step, ...update },
            },
          },
        },
      };
    });
  },

  completeExecution: (executionId, status) => {
    set((state) => {
      const exec = state.executions[executionId];
      if (!exec) return state;
      return {
        executions: {
          ...state.executions,
          [executionId]: { ...exec, status },
        },
        activeExecutionId:
          state.activeExecutionId === executionId ? null : state.activeExecutionId,
      };
    });
  },

  cancelExecution: (executionId) => {
    set((state) => {
      const exec = state.executions[executionId];
      if (!exec) return state;

      // Mark remaining pending steps as skipped
      const steps = { ...exec.steps };
      for (const [id, step] of Object.entries(steps)) {
        if (step.status === "pending" || step.status === "running") {
          steps[id] = { ...step, status: "skipped" };
        }
      }

      return {
        executions: {
          ...state.executions,
          [executionId]: { ...exec, status: "cancelled", steps },
        },
        activeExecutionId:
          state.activeExecutionId === executionId ? null : state.activeExecutionId,
      };
    });
  },

  getExecution: (executionId) => get().executions[executionId],

  reset: () => set(initialState),
}));
