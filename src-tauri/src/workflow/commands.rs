//! Tauri commands for workflow execution.

use super::runner::run_workflow_sequential;
use super::types::RawWorkflow;
use std::collections::HashMap;
use tauri::AppHandle;

/// Execute a workflow from YAML string.
#[tauri::command]
pub async fn run_workflow(
    app: AppHandle,
    yaml: String,
    env: HashMap<String, String>,
) -> Result<String, String> {
    let workflow: RawWorkflow =
        serde_yaml::from_str(&yaml).map_err(|e| format!("Failed to parse workflow YAML: {}", e))?;

    run_workflow_sequential(&app, workflow, env).await
}

/// Cancel a running workflow (placeholder — cancellation requires
/// a shared state mechanism that will be added in a follow-up).
#[tauri::command]
pub async fn cancel_workflow(
    _app: AppHandle,
    execution_id: String,
) -> Result<(), String> {
    log::warn!(
        "Workflow cancellation not yet implemented for '{}'",
        execution_id
    );
    Err("Cancellation not yet implemented".to_string())
}
