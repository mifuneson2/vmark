import { useWorkflowPreviewStore } from "../workflowPreviewStore";
import type { WorkflowGraph } from "@/lib/workflow/types";

const mockGraph: WorkflowGraph = {
  name: "Test",
  triggers: [],
  env: {},
  defaults: {},
  steps: [
    {
      id: "s1",
      uses: "genie/summarize",
      type: "genie",
      label: "s1",
      icon: "🤖",
      with: {},
      needs: [],
    },
  ],
  edges: [],
};

beforeEach(() => {
  useWorkflowPreviewStore.getState().reset();
});

describe("workflowPreviewStore", () => {
  it("initializes with panel closed", () => {
    const state = useWorkflowPreviewStore.getState();
    expect(state.panelOpen).toBe(false);
    expect(state.graph).toBeNull();
    expect(state.parseError).toBeNull();
    expect(state.activeStepId).toBeNull();
  });

  it("opens and closes panel", () => {
    const { openPanel, closePanel } = useWorkflowPreviewStore.getState();
    openPanel();
    expect(useWorkflowPreviewStore.getState().panelOpen).toBe(true);
    closePanel();
    expect(useWorkflowPreviewStore.getState().panelOpen).toBe(false);
  });

  it("toggles panel", () => {
    const { togglePanel } = useWorkflowPreviewStore.getState();
    togglePanel();
    expect(useWorkflowPreviewStore.getState().panelOpen).toBe(true);
    togglePanel();
    expect(useWorkflowPreviewStore.getState().panelOpen).toBe(false);
  });

  it("sets graph and clears error", () => {
    const { setGraph } = useWorkflowPreviewStore.getState();
    setGraph(mockGraph);
    const state = useWorkflowPreviewStore.getState();
    expect(state.graph).toBe(mockGraph);
    expect(state.parseError).toBeNull();
  });

  it("sets graph with error", () => {
    const { setGraph } = useWorkflowPreviewStore.getState();
    setGraph(null, "Parse failed");
    const state = useWorkflowPreviewStore.getState();
    expect(state.graph).toBeNull();
    expect(state.parseError).toBe("Parse failed");
  });

  it("clears activeStepId when graph changes", () => {
    const { setActiveStepId, setGraph } = useWorkflowPreviewStore.getState();
    setActiveStepId("s1");
    expect(useWorkflowPreviewStore.getState().activeStepId).toBe("s1");
    setGraph(mockGraph);
    expect(useWorkflowPreviewStore.getState().activeStepId).toBeNull();
  });

  it("sets and clears activeStepId", () => {
    const { setActiveStepId } = useWorkflowPreviewStore.getState();
    setActiveStepId("s1");
    expect(useWorkflowPreviewStore.getState().activeStepId).toBe("s1");
    setActiveStepId(null);
    expect(useWorkflowPreviewStore.getState().activeStepId).toBeNull();
  });

  it("resets to initial state", () => {
    const store = useWorkflowPreviewStore.getState();
    store.openPanel();
    store.setGraph(mockGraph);
    store.setActiveStepId("s1");
    store.reset();
    const state = useWorkflowPreviewStore.getState();
    expect(state.panelOpen).toBe(false);
    expect(state.graph).toBeNull();
    expect(state.parseError).toBeNull();
    expect(state.activeStepId).toBeNull();
  });
});
