/**
 * Workflow Execution Hook
 *
 * Purpose: Listens to Tauri workflow execution events and updates the
 * execution store in real-time. Drives the live overlay on React Flow nodes.
 *
 * @coordinates-with workflowExecutionStore.ts — updates step statuses
 * @coordinates-with WorkflowPreview.tsx — nodes re-render on status changes
 * @module hooks/useWorkflowExecution
 */

import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useWorkflowExecutionStore, type StepExecution } from "@/stores/workflowExecutionStore";

interface StepUpdatePayload {
  executionId: string;
  stepId: string;
  status: StepExecution["status"];
  output?: string;
  error?: string;
  duration?: number;
  tokenCount?: number;
  cost?: number;
}

interface ExecutionCompletePayload {
  executionId: string;
  status: "completed" | "failed";
}

/**
 * Listen for workflow execution events from the Rust backend
 * and update the execution store accordingly.
 */
export function useWorkflowExecution(executionId: string | null) {
  useEffect(() => {
    if (!executionId) return;

    const unlistenStepUpdate = listen<StepUpdatePayload>(
      "workflow:step-update",
      (event) => {
        if (event.payload.executionId !== executionId) return;
        const { stepId, ...update } = event.payload;
        useWorkflowExecutionStore.getState().updateStepStatus(
          executionId,
          stepId,
          {
            status: update.status,
            output: update.output,
            error: update.error,
            completedAt: update.status === "success" || update.status === "error"
              ? Date.now()
              : undefined,
            startedAt: update.status === "running" ? Date.now() : undefined,
            tokenCount: update.tokenCount,
            cost: update.cost,
          },
        );
      },
    );

    const unlistenComplete = listen<ExecutionCompletePayload>(
      "workflow:complete",
      (event) => {
        if (event.payload.executionId !== executionId) return;
        useWorkflowExecutionStore.getState().completeExecution(
          executionId,
          event.payload.status,
        );
      },
    );

    return () => {
      void unlistenStepUpdate.then((fn) => fn());
      void unlistenComplete.then((fn) => fn());
    };
  }, [executionId]);
}
