//! AI Provider Router
//!
//! Detects available CLI AI providers and executes prompts via shell commands
//! or REST APIs. Streams results back to the frontend via Tauri events.

use serde::Serialize;
use std::io::{BufRead, BufReader, Write as IoWrite};
use std::process::{Command, Stdio};
use tauri::{command, Emitter, WebviewWindow};

// ============================================================================
// Types
// ============================================================================

#[derive(Debug, Serialize)]
pub struct CliProviderEntry {
    #[serde(rename = "type")]
    pub provider_type: String,
    pub name: String,
    pub command: String,
    pub available: bool,
    pub path: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct AiResponseChunk {
    #[serde(rename = "requestId")]
    pub request_id: String,
    pub chunk: String,
    pub done: bool,
    pub error: Option<String>,
}

// ============================================================================
// CLI Provider Detection
// ============================================================================

/// Detect which CLI AI providers are available on the system.
#[command]
pub fn detect_ai_providers() -> Vec<CliProviderEntry> {
    let providers = [
        ("claude", "Claude", "claude"),
        ("codex", "Codex", "codex"),
        ("gemini", "Gemini", "gemini"),
        ("ollama", "Ollama", "ollama"),
    ];

    providers
        .iter()
        .map(|(typ, name, cmd)| {
            let (available, path) = check_command(cmd);
            CliProviderEntry {
                provider_type: typ.to_string(),
                name: name.to_string(),
                command: cmd.to_string(),
                available,
                path,
            }
        })
        .collect()
}

fn check_command(cmd: &str) -> (bool, Option<String>) {
    let which_cmd = if cfg!(target_os = "windows") {
        "where"
    } else {
        "which"
    };

    match Command::new(which_cmd).arg(cmd).output() {
        Ok(output) if output.status.success() => {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            (true, Some(path))
        }
        _ => (false, None),
    }
}

// ============================================================================
// Prompt Execution
// ============================================================================

/// Run an AI prompt and stream results back via `ai:response` events.
///
/// For CLI providers: pipes prompt to stdin of the CLI tool.
/// For REST providers: sends HTTP request via reqwest.
#[command]
pub async fn run_ai_prompt(
    window: WebviewWindow,
    request_id: String,
    provider: String,
    prompt: String,
    model: Option<String>,
    api_key: Option<String>,
    endpoint: Option<String>,
) -> Result<(), String> {
    match provider.as_str() {
        // CLI providers
        "claude" => run_cli_provider(&window, &request_id, "claude", &["--print", "--output-format", "text"], &prompt),
        "codex" => run_cli_provider(&window, &request_id, "codex", &[], &prompt),
        "gemini" => run_cli_provider(&window, &request_id, "gemini", &[], &prompt),
        "ollama" => {
            let m = model.as_deref().unwrap_or("llama3.2");
            run_cli_provider(&window, &request_id, "ollama", &["run", m], &prompt)
        }

        // REST providers
        "anthropic" => {
            let key = api_key.unwrap_or_default();
            if key.is_empty() {
                emit_error(&window, &request_id, "Anthropic API key is required");
                return Ok(());
            }
            run_rest_anthropic(
                &window,
                &request_id,
                &endpoint.unwrap_or_else(|| "https://api.anthropic.com".to_string()),
                &key,
                &model.unwrap_or_else(|| "claude-sonnet-4-5-20250929".to_string()),
                &prompt,
            )
            .await
        }
        "openai" => {
            let key = api_key.unwrap_or_default();
            if key.is_empty() {
                emit_error(&window, &request_id, "OpenAI API key is required");
                return Ok(());
            }
            run_rest_openai(
                &window,
                &request_id,
                &endpoint.unwrap_or_else(|| "https://api.openai.com".to_string()),
                &key,
                &model.unwrap_or_else(|| "gpt-4o".to_string()),
                &prompt,
            )
            .await
        }
        "google-ai" => {
            let key = api_key.unwrap_or_default();
            if key.is_empty() {
                emit_error(&window, &request_id, "Google AI API key is required");
                return Ok(());
            }
            run_rest_google(
                &window,
                &request_id,
                &key,
                &model.unwrap_or_else(|| "gemini-2.0-flash".to_string()),
                &prompt,
            )
            .await
        }
        "ollama-api" => {
            run_rest_ollama(
                &window,
                &request_id,
                &endpoint.unwrap_or_else(|| "http://localhost:11434".to_string()),
                &model.unwrap_or_else(|| "llama3.2".to_string()),
                &prompt,
            )
            .await
        }

        _ => Err(format!("Unknown provider: {}", provider)),
    }
}

// ============================================================================
// CLI Execution
// ============================================================================

fn run_cli_provider(
    window: &WebviewWindow,
    request_id: &str,
    cmd: &str,
    args: &[&str],
    prompt: &str,
) -> Result<(), String> {
    let mut child = Command::new(cmd)
        .args(args)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| format!("Failed to spawn {}: {}", cmd, e))?;

    // Write prompt to stdin
    if let Some(mut stdin) = child.stdin.take() {
        stdin
            .write_all(prompt.as_bytes())
            .map_err(|e| format!("Failed to write to stdin: {}", e))?;
        // stdin is dropped here, closing it
    }

    // Stream stdout line by line
    if let Some(stdout) = child.stdout.take() {
        let reader = BufReader::new(stdout);
        for line in reader.lines() {
            match line {
                Ok(text) => {
                    emit_chunk(window, request_id, &(text + "\n"));
                }
                Err(e) => {
                    emit_error(window, request_id, &format!("Read error: {}", e));
                    let _ = child.kill();
                    return Ok(());
                }
            }
        }
    }

    // Check exit status
    let status = child.wait().map_err(|e| format!("Wait failed: {}", e))?;
    if !status.success() {
        emit_error(window, request_id, &format!("{} exited with status {}", cmd, status));
    } else {
        emit_done(window, request_id);
    }

    Ok(())
}

// ============================================================================
// REST Execution (reqwest)
// ============================================================================

async fn run_rest_anthropic(
    window: &WebviewWindow,
    request_id: &str,
    endpoint: &str,
    api_key: &str,
    model: &str,
    prompt: &str,
) -> Result<(), String> {
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "model": model,
        "max_tokens": 4096,
        "messages": [{"role": "user", "content": prompt}]
    });

    let resp = client
        .post(format!("{}/v1/messages", endpoint))
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Anthropic request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        emit_error(window, request_id, &format!("Anthropic API error {}: {}", status, text));
        return Ok(());
    }

    let json: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    // Extract text from content blocks
    if let Some(content) = json.get("content").and_then(|c| c.as_array()) {
        for block in content {
            if let Some(text) = block.get("text").and_then(|t| t.as_str()) {
                emit_chunk(window, request_id, text);
            }
        }
    } else {
        emit_error(window, request_id, "No content blocks in Anthropic response");
        return Ok(());
    }

    emit_done(window, request_id);
    Ok(())
}

async fn run_rest_openai(
    window: &WebviewWindow,
    request_id: &str,
    endpoint: &str,
    api_key: &str,
    model: &str,
    prompt: &str,
) -> Result<(), String> {
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "model": model,
        "messages": [{"role": "user", "content": prompt}]
    });

    let resp = client
        .post(format!("{}/v1/chat/completions", endpoint))
        .header("Authorization", format!("Bearer {}", api_key))
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("OpenAI request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        emit_error(window, request_id, &format!("OpenAI API error {}: {}", status, text));
        return Ok(());
    }

    let json: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    if let Some(text) = json
        .get("choices")
        .and_then(|c| c.as_array())
        .and_then(|choices| choices.first())
        .and_then(|c| c.get("message"))
        .and_then(|m| m.get("content"))
        .and_then(|t| t.as_str())
    {
        emit_chunk(window, request_id, text);
    } else {
        emit_error(window, request_id, "No choices in OpenAI response");
        return Ok(());
    }

    emit_done(window, request_id);
    Ok(())
}

async fn run_rest_google(
    window: &WebviewWindow,
    request_id: &str,
    api_key: &str,
    model: &str,
    prompt: &str,
) -> Result<(), String> {
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "contents": [{"parts": [{"text": prompt}]}]
    });

    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        model, api_key
    );

    let resp = client
        .post(&url)
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Google AI request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        emit_error(window, request_id, &format!("Google AI error {}: {}", status, text));
        return Ok(());
    }

    let json: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    if let Some(text) = json
        .get("candidates")
        .and_then(|c| c.as_array())
        .and_then(|candidates| candidates.first())
        .and_then(|c| c.get("content"))
        .and_then(|c| c.get("parts"))
        .and_then(|p| p.as_array())
        .and_then(|parts| parts.first())
        .and_then(|p| p.get("text"))
        .and_then(|t| t.as_str())
    {
        emit_chunk(window, request_id, text);
    } else {
        emit_error(window, request_id, "No candidates in Google AI response");
        return Ok(());
    }

    emit_done(window, request_id);
    Ok(())
}

async fn run_rest_ollama(
    window: &WebviewWindow,
    request_id: &str,
    endpoint: &str,
    model: &str,
    prompt: &str,
) -> Result<(), String> {
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "model": model,
        "prompt": prompt,
        "stream": false
    });

    let resp = client
        .post(format!("{}/api/generate", endpoint))
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Ollama request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        emit_error(window, request_id, &format!("Ollama API error {}: {}", status, text));
        return Ok(());
    }

    let json: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    if let Some(text) = json.get("response").and_then(|r| r.as_str()) {
        emit_chunk(window, request_id, text);
    } else {
        emit_error(window, request_id, "No response field in Ollama response");
        return Ok(());
    }

    emit_done(window, request_id);
    Ok(())
}

// ============================================================================
// Helpers
// ============================================================================

fn emit_chunk(window: &WebviewWindow, request_id: &str, text: &str) {
    let _ = window.emit(
        "ai:response",
        AiResponseChunk {
            request_id: request_id.to_string(),
            chunk: text.to_string(),
            done: false,
            error: None,
        },
    );
}

fn emit_done(window: &WebviewWindow, request_id: &str) {
    let _ = window.emit(
        "ai:response",
        AiResponseChunk {
            request_id: request_id.to_string(),
            chunk: String::new(),
            done: true,
            error: None,
        },
    );
}

fn emit_error(window: &WebviewWindow, request_id: &str, msg: &str) {
    let _ = window.emit(
        "ai:response",
        AiResponseChunk {
            request_id: request_id.to_string(),
            chunk: String::new(),
            done: true,
            error: Some(msg.to_string()),
        },
    );
}
