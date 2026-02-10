use std::collections::HashMap;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tauri::AppHandle;

use crate::window_manager;

/// Data transferred when a tab is dragged out to a new window.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TabTransferData {
    pub tab_id: String,
    pub title: String,
    pub file_path: Option<String>,
    pub content: String,
    pub saved_content: String,
    pub is_dirty: bool,
}

/// Registry of pending tab transfers, keyed by target window label.
static TRANSFER_REGISTRY: Mutex<Option<HashMap<String, TabTransferData>>> = Mutex::new(None);

fn registry() -> std::sync::MutexGuard<'static, Option<HashMap<String, TabTransferData>>> {
    TRANSFER_REGISTRY.lock().unwrap()
}

/// Create a new window and store transfer data for it.
/// Returns the new window label.
#[tauri::command]
pub fn detach_tab_to_new_window(
    app: AppHandle,
    data: TabTransferData,
) -> Result<String, String> {
    let label = window_manager::create_document_window_for_transfer(&app)
        .map_err(|e| e.to_string())?;

    let mut guard = registry();
    let map = guard.get_or_insert_with(HashMap::new);
    map.insert(label.clone(), data);

    Ok(label)
}

/// Claim transfer data for a window. Returns the data and removes it from the registry.
#[tauri::command]
pub fn claim_tab_transfer(window_label: String) -> Option<TabTransferData> {
    let mut guard = registry();
    guard.as_mut().and_then(|map| map.remove(&window_label))
}

/// Remove any unclaimed transfer data for a window that was destroyed.
/// Called from the `WindowEvent::Destroyed` handler to prevent leaks.
pub fn clear_unclaimed_transfer(window_label: &str) {
    let mut guard = registry();
    if let Some(map) = guard.as_mut() {
        map.remove(window_label);
    }
}
