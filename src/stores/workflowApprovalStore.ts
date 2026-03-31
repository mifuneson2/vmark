/**
 * Workflow Approval Store
 *
 * Purpose: Manages approval dialog state for workflow steps that have
 * `approval: ask`. The Rust runner emits an approval request, this store
 * captures it, and the ApprovalDialog component renders the UI.
 *
 * @coordinates-with useWorkflowExecution.ts — receives approval requests
 * @module stores/workflowApprovalStore
 */

import { create } from "zustand";

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

export const useWorkflowApprovalStore = create<WorkflowApprovalState>((set) => ({
  request: null,
  isOpen: false,

  showApproval: (request) => set({ request, isOpen: true }),

  approve: () => set({ isOpen: false }),

  reject: () => set({ isOpen: false }),

  reset: () => set({ request: null, isOpen: false }),
}));
