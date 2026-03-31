//! Sequential workflow runner.
//!
//! Executes workflow steps in order, emitting status events to the frontend.
//! Currently supports sequential execution only; parallel execution via
//! `needs:` is planned for a future milestone.

use super::types::*;
use std::collections::HashMap;
use std::time::Instant;
use tauri::{AppHandle, Emitter};
use uuid::Uuid;

/// Execute a parsed workflow sequentially.
///
/// Returns the execution ID. Emits `workflow:step-update` for each step
/// and `workflow:complete` when done.
pub async fn run_workflow_sequential(
    app: &AppHandle,
    workflow: RawWorkflow,
    env: HashMap<String, String>,
) -> Result<String, String> {
    let execution_id = Uuid::new_v4().to_string();
    let mut outputs: HashMap<String, String> = HashMap::new();

    // Merge workflow env with provided env (provided takes precedence)
    let mut merged_env = workflow.env.clone();
    merged_env.extend(env);

    let step_count = workflow.steps.len();
    let mut failed = false;

    for (i, step) in workflow.steps.into_iter().enumerate() {
        let step_id = step
            .id
            .clone()
            .unwrap_or_else(|| step.uses.split('/').last().unwrap_or("step").to_string());

        // Skip if a previous step failed
        if failed {
            let _ = app.emit(
                "workflow:step-update",
                StepStatusEvent {
                    execution_id: execution_id.clone(),
                    step_id: step_id.clone(),
                    status: "skipped".to_string(),
                    output: None,
                    error: None,
                    duration: None,
                },
            );
            continue;
        }

        // Emit running status
        let _ = app.emit(
            "workflow:step-update",
            StepStatusEvent {
                execution_id: execution_id.clone(),
                step_id: step_id.clone(),
                status: "running".to_string(),
                output: None,
                error: None,
                duration: None,
            },
        );

        let start = Instant::now();

        // Resolve `with` parameter references (step_id.output -> actual output)
        let mut resolved_params = step.with.clone();
        for (_, value) in resolved_params.iter_mut() {
            if value.ends_with(".output") {
                let ref_id = value.trim_end_matches(".output");
                if let Some(output) = outputs.get(ref_id) {
                    *value = output.clone();
                }
            }
            // Env variable substitution
            if value.starts_with("${") && value.ends_with('}') {
                let var_name = &value[2..value.len() - 1];
                if let Some(env_val) = merged_env.get(var_name) {
                    *value = env_val.clone();
                }
            }
        }

        // Execute step based on type
        let result = execute_step(&step.uses, &resolved_params, &merged_env).await;
        let duration_ms = start.elapsed().as_millis() as u64;

        match result {
            Ok(output) => {
                outputs.insert(step_id.clone(), output.clone());
                let _ = app.emit(
                    "workflow:step-update",
                    StepStatusEvent {
                        execution_id: execution_id.clone(),
                        step_id,
                        status: "success".to_string(),
                        output: Some(output),
                        error: None,
                        duration: Some(duration_ms),
                    },
                );
            }
            Err(error) => {
                failed = true;
                let _ = app.emit(
                    "workflow:step-update",
                    StepStatusEvent {
                        execution_id: execution_id.clone(),
                        step_id,
                        status: "error".to_string(),
                        output: None,
                        error: Some(error),
                        duration: Some(duration_ms),
                    },
                );
            }
        }

        // Log progress
        log::info!(
            "Workflow '{}': step {}/{} complete",
            workflow.name,
            i + 1,
            step_count
        );
    }

    // Emit completion
    let final_status = if failed { "failed" } else { "completed" };
    let _ = app.emit(
        "workflow:complete",
        ExecutionCompleteEvent {
            execution_id: execution_id.clone(),
            status: final_status.to_string(),
        },
    );

    Ok(execution_id)
}

/// Execute a single step based on its `uses:` prefix.
async fn execute_step(
    uses: &str,
    params: &HashMap<String, String>,
    _env: &HashMap<String, String>,
) -> Result<String, String> {
    if uses.starts_with("action/") {
        execute_action(uses, params).await
    } else if uses.starts_with("genie/") {
        // Genie execution requires AI provider integration — placeholder
        Ok(format!(
            "[Genie '{}' execution not yet implemented — requires AI provider adapter]",
            uses
        ))
    } else if uses.starts_with("webhook/") {
        // Webhook execution — placeholder
        Ok(format!(
            "[Webhook '{}' execution not yet implemented]",
            uses
        ))
    } else {
        Err(format!("Unknown step type: {}", uses))
    }
}

/// Execute a built-in action step.
async fn execute_action(
    uses: &str,
    params: &HashMap<String, String>,
) -> Result<String, String> {
    let action = uses.strip_prefix("action/").unwrap_or(uses);
    match action {
        "read-file" => {
            let path = params
                .get("path")
                .ok_or("action/read-file requires 'path' parameter")?;
            tokio::fs::read_to_string(path)
                .await
                .map_err(|e| format!("Failed to read '{}': {}", path, e))
        }
        "read-folder" => {
            let path = params
                .get("path")
                .ok_or("action/read-folder requires 'path' parameter")?;
            let accept = params.get("accept").map(|s| s.as_str()).unwrap_or("*");
            let mut entries = Vec::new();
            let mut dir = tokio::fs::read_dir(path)
                .await
                .map_err(|e| format!("Failed to read directory '{}': {}", path, e))?;
            while let Some(entry) = dir
                .next_entry()
                .await
                .map_err(|e| format!("Failed to read entry: {}", e))?
            {
                let name = entry.file_name().to_string_lossy().to_string();
                if accept == "*" || name.ends_with(accept.trim_start_matches('*')) {
                    let content = tokio::fs::read_to_string(entry.path())
                        .await
                        .unwrap_or_default();
                    entries.push(format!("--- {} ---\n{}", name, content));
                }
            }
            Ok(entries.join("\n\n"))
        }
        "save-file" => {
            let path = params
                .get("path")
                .ok_or("action/save-file requires 'path' parameter")?;
            let input = params
                .get("input")
                .ok_or("action/save-file requires 'input' parameter")?;
            tokio::fs::write(path, input)
                .await
                .map_err(|e| format!("Failed to write '{}': {}", path, e))?;
            Ok(format!("Saved to {}", path))
        }
        "notify" => {
            let message = params.get("message").cloned().unwrap_or_default();
            log::info!("Workflow notification: {}", message);
            Ok(message)
        }
        "copy" => {
            let input = params.get("input").cloned().unwrap_or_default();
            Ok(input)
        }
        "prompt" => {
            // Interactive prompt — not supported in headless execution
            Ok("[Interactive prompt not supported in workflow execution]".to_string())
        }
        _ => Err(format!("Unknown action: {}", action)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_execute_action_notify() {
        let mut params = HashMap::new();
        params.insert("message".to_string(), "Hello".to_string());
        let result = execute_action("action/notify", &params).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "Hello");
    }

    #[tokio::test]
    async fn test_execute_action_copy() {
        let mut params = HashMap::new();
        params.insert("input".to_string(), "test data".to_string());
        let result = execute_action("action/copy", &params).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "test data");
    }

    #[tokio::test]
    async fn test_execute_action_unknown() {
        let params = HashMap::new();
        let result = execute_action("action/unknown", &params).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_execute_step_unknown_type() {
        let params = HashMap::new();
        let env = HashMap::new();
        let result = execute_step("unknown/thing", &params, &env).await;
        assert!(result.is_err());
    }
}
