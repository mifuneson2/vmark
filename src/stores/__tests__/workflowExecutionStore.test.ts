import { useWorkflowExecutionStore } from "../workflowExecutionStore";

beforeEach(() => {
  useWorkflowExecutionStore.getState().reset();
});

describe("workflowExecutionStore", () => {
  it("starts execution with pending steps", () => {
    const { startExecution } = useWorkflowExecutionStore.getState();
    startExecution("exec-1", "Test Workflow", ["a", "b", "c"]);

    const state = useWorkflowExecutionStore.getState();
    expect(state.activeExecutionId).toBe("exec-1");
    const exec = state.executions["exec-1"];
    expect(exec.status).toBe("running");
    expect(exec.workflowName).toBe("Test Workflow");
    expect(Object.keys(exec.steps)).toHaveLength(3);
    expect(exec.steps.a.status).toBe("pending");
    expect(exec.steps.b.status).toBe("pending");
  });

  it("updates step status", () => {
    const store = useWorkflowExecutionStore.getState();
    store.startExecution("exec-1", "Test", ["a", "b"]);
    store.updateStepStatus("exec-1", "a", {
      status: "running",
      startedAt: 1000,
    });

    const step = useWorkflowExecutionStore.getState().executions["exec-1"].steps.a;
    expect(step.status).toBe("running");
    expect(step.startedAt).toBe(1000);
  });

  it("completes execution", () => {
    const store = useWorkflowExecutionStore.getState();
    store.startExecution("exec-1", "Test", ["a"]);
    store.completeExecution("exec-1", "completed");

    const state = useWorkflowExecutionStore.getState();
    expect(state.executions["exec-1"].status).toBe("completed");
    expect(state.activeExecutionId).toBeNull();
  });

  it("cancels execution and skips pending steps", () => {
    const store = useWorkflowExecutionStore.getState();
    store.startExecution("exec-1", "Test", ["a", "b", "c"]);
    store.updateStepStatus("exec-1", "a", { status: "success" });
    store.cancelExecution("exec-1");

    const exec = useWorkflowExecutionStore.getState().executions["exec-1"];
    expect(exec.status).toBe("cancelled");
    expect(exec.steps.a.status).toBe("success"); // already completed
    expect(exec.steps.b.status).toBe("skipped");
    expect(exec.steps.c.status).toBe("skipped");
  });

  it("ignores updates to non-existent executions", () => {
    const store = useWorkflowExecutionStore.getState();
    store.updateStepStatus("nonexistent", "a", { status: "running" });
    expect(Object.keys(useWorkflowExecutionStore.getState().executions)).toHaveLength(0);
  });

  it("ignores updates to non-existent steps", () => {
    const store = useWorkflowExecutionStore.getState();
    store.startExecution("exec-1", "Test", ["a"]);
    store.updateStepStatus("exec-1", "nonexistent", { status: "running" });
    // Should not throw or add the step
    expect(useWorkflowExecutionStore.getState().executions["exec-1"].steps.nonexistent).toBeUndefined();
  });

  it("enforces history limit of 50", () => {
    const store = useWorkflowExecutionStore.getState();
    for (let i = 0; i < 55; i++) {
      store.startExecution(`exec-${i}`, `Test ${i}`, ["a"]);
    }
    const executions = useWorkflowExecutionStore.getState().executions;
    expect(Object.keys(executions).length).toBeLessThanOrEqual(50);
  });

  it("getExecution returns execution by ID", () => {
    const store = useWorkflowExecutionStore.getState();
    store.startExecution("exec-1", "Test", ["a"]);
    expect(store.getExecution("exec-1")).toBeDefined();
    expect(store.getExecution("nonexistent")).toBeUndefined();
  });

  it("resets to initial state", () => {
    const store = useWorkflowExecutionStore.getState();
    store.startExecution("exec-1", "Test", ["a"]);
    store.reset();
    const state = useWorkflowExecutionStore.getState();
    expect(Object.keys(state.executions)).toHaveLength(0);
    expect(state.activeExecutionId).toBeNull();
  });
});
