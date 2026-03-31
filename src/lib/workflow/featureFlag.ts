/**
 * Workflow Engine Feature Flag
 *
 * Controls visibility of all workflow-related features. When false:
 * - YAML files don't appear in file explorer
 * - Workflow side panel doesn't render
 * - CodeMirror workflow preview plugin doesn't load
 * - Tauri commands stay registered but are unreachable from UI
 *
 * Flip to `true` when ready to ship.
 */
export const WORKFLOW_ENABLED = false;
