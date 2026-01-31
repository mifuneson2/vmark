/// Tauri commands for hot exit
///
/// These commands provide session capture, restore, and management for the hot exit feature.
/// They are used both in production (update restart flow) and for developer testing.

use tauri::AppHandle;
use super::session::SessionData;
use super::storage::{read_session, delete_session, write_session_atomic};
use super::coordinator::{capture_session, restore_session};

/// Capture session from all windows and persist to disk atomically
#[tauri::command]
pub async fn hot_exit_capture(app: AppHandle) -> Result<SessionData, String> {
    let session = capture_session(&app).await?;
    write_session_atomic(&app, &session).await?;
    Ok(session)
}

/// Restore session to current window from provided session data
#[tauri::command]
pub async fn hot_exit_restore(app: AppHandle, session: SessionData) -> Result<(), String> {
    restore_session(&app, session).await
}

/// Inspect the saved session file (returns None if no session exists)
#[tauri::command]
pub async fn hot_exit_inspect_session(app: AppHandle) -> Result<Option<SessionData>, String> {
    read_session(&app).await
}

/// Delete the saved session file
#[tauri::command]
pub async fn hot_exit_clear_session(app: AppHandle) -> Result<(), String> {
    delete_session(&app).await
}
