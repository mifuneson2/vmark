/**
 * Workflow Side Panel
 *
 * Purpose: Persistent side panel for standalone .yml workflow files.
 * Shows the React Flow graph alongside the CodeMirror YAML editor.
 *
 * @coordinates-with workflowPreviewStore.ts — reads panel state
 * @coordinates-with WorkflowPreview.tsx — renders the React Flow canvas
 * @coordinates-with Editor.tsx — mounted alongside editor-content
 * @module plugins/workflowPreview/WorkflowSidePanel
 */

import { useCallback, useRef, useState } from "react";
import { useWorkflowPreviewStore } from "@/stores/workflowPreviewStore";
import { WorkflowPreview } from "./WorkflowPreview";
import { useTranslation } from "react-i18next";
import "./workflow-side-panel.css";

const MIN_PANEL_WIDTH = 200;
const DEFAULT_PANEL_WIDTH = 400;

export function WorkflowSidePanel() {
  const { t } = useTranslation();
  const panelOpen = useWorkflowPreviewStore((s) => s.panelOpen);
  const graph = useWorkflowPreviewStore((s) => s.graph);
  const parseError = useWorkflowPreviewStore((s) => s.parseError);
  const activeStepId = useWorkflowPreviewStore((s) => s.activeStepId);

  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
  const isResizing = useRef(false);

  const handleNodeClick = useCallback((stepId: string, _yamlLine?: number) => {
    // TODO: Jump to YAML line in CodeMirror (Phase 2 follow-up)
    useWorkflowPreviewStore.getState().setActiveStepId(stepId);
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    const startX = e.clientX;
    const startWidth = panelWidth;

    const onMove = (moveEvent: MouseEvent) => {
      if (!isResizing.current) return;
      const delta = startX - moveEvent.clientX;
      setPanelWidth(Math.max(MIN_PANEL_WIDTH, startWidth + delta));
    };

    const onUp = () => {
      isResizing.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [panelWidth]);

  if (!panelOpen) return null;

  return (
    <div
      className="workflow-side-panel"
      style={{ width: panelWidth }}
    >
      <div
        className="workflow-side-panel__resize-handle"
        onMouseDown={handleResizeStart}
        role="separator"
        aria-label={t("common:resize")}
      />
      <div className="workflow-side-panel__content">
        {parseError ? (
          <div className="workflow-side-panel__error">
            <span className="workflow-side-panel__error-icon">⚠</span>
            <span className="workflow-side-panel__error-text">{parseError}</span>
          </div>
        ) : graph ? (
          <div className="workflow-preview-canvas">
            <WorkflowPreview
              graph={graph}
              activeStepId={activeStepId}
              onNodeClick={handleNodeClick}
            />
          </div>
        ) : (
          <div className="workflow-side-panel__empty">
            {t("editor:workflow.noPreview")}
          </div>
        )}
      </div>
    </div>
  );
}
