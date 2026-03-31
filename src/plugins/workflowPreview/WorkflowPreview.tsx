/**
 * Workflow Preview React Flow Canvas
 *
 * Purpose: Self-contained React Flow canvas for rendering a WorkflowGraph.
 * Used inside the WorkflowSidePanel for standalone .yml files.
 *
 * @coordinates-with layout.ts — converts graph to positioned nodes/edges
 * @coordinates-with WorkflowNode.tsx — custom node renderer
 * @module plugins/workflowPreview/WorkflowPreview
 */

import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import type { NodeMouseHandler } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { WorkflowNode } from "./WorkflowNode";
import { layoutWorkflow, type WorkflowNodeData } from "@/lib/workflow/layout";
import type { WorkflowGraph } from "@/lib/workflow/types";
import "./workflow-preview.css";

const nodeTypes = { workflow: WorkflowNode };

interface WorkflowPreviewProps {
  graph: WorkflowGraph;
  activeStepId?: string | null;
  onNodeClick?: (stepId: string, yamlLine?: number) => void;
}

function WorkflowPreviewInner({ graph, activeStepId, onNodeClick }: WorkflowPreviewProps) {
  const { fitView } = useReactFlow();

  const { nodes, edges } = useMemo(() => {
    const result = layoutWorkflow(graph);

    // Highlight active step
    if (activeStepId) {
      for (const node of result.nodes) {
        if (node.id === activeStepId) {
          node.selected = true;
        }
      }
    }

    // Fit view after layout
    setTimeout(() => fitView({ padding: 0.1 }), 50);

    return result;
  }, [graph, activeStepId, fitView]);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      const data = node.data as WorkflowNodeData;
      onNodeClick?.(data.stepId, data.yamlLine);
    },
    [onNodeClick],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={handleNodeClick}
      fitView
      fitViewOptions={{ padding: 0.1 }}
      minZoom={0.25}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
      nodesDraggable={false}
      nodesConnectable={false}
      edgesFocusable={false}
    >
      <Background gap={16} size={1} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

export function WorkflowPreview(props: WorkflowPreviewProps) {
  return (
    <ReactFlowProvider>
      <WorkflowPreviewInner {...props} />
    </ReactFlowProvider>
  );
}
