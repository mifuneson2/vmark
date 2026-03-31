/**
 * Workflow Approval Store
 *
 * Purpose: Manages approval dialog state for workflow steps that have
 * `approval: ask`. When the Rust runner requests approval, this store
 * captures the request and provides approve/reject callbacks that
 * communicate the decision back via Tauri events.
 *
 * @coordinates-with useWorkflowExecution.ts — receives approval requests
 * @coordinates-with commands.rs — responses sent via Tauri emit
 * @module stores/workflowApprovalStore
 */

import { create } from "zustand";
import { emit } from "@tauri-apps/api/event";
import { workflowLog } from "@/utils/debug";

export interface ApprovalRequest {
  executionId: string;
  stepId: string;
  description: string;
  files: ApprovalFileChange[];
}

export interface ApprovalFileChange {
  path: string;
  changeType: "modified" | "created" | "deleted";
  summary: string;
}

interface WorkflowApprovalState {
  request: ApprovalRequest | null;
  isOpen: boolean;

  showApproval: (request: ApprovalRequest) => void;
  approve: () => void;
  reject: () => void;
  reset: () => void;
}

export const useWorkflowApprovalStore = create<WorkflowApprovalState>((set, get) => ({
  request: null,
  isOpen: false,

  showApproval: (request) => set({ request, isOpen: true }),

  approve: () => {
    const { request } = get();
    if (request) {
      workflowLog("Approval granted for step:", request.stepId);
      void emit("workflow:approval-response", {
        executionId: request.executionId,
        stepId: request.stepId,
        approved: true,
      });
    }
    set({ isOpen: false });
  },

  reject: () => {
    const { request } = get();
    if (request) {
      workflowLog("Approval rejected for step:", request.stepId);
      void emit("workflow:approval-response", {
        executionId: request.executionId,
        stepId: request.stepId,
        approved: false,
      });
    }
    set({ isOpen: false });
  },

  reset: () => set({ request: null, isOpen: false }),
}));
