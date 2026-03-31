//! File snapshots for workflow undo.
//!
//! Before any workflow execution that modifies files, snapshot all affected
//! files. Snapshots are stored in the app data directory and can be restored.

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

const MAX_SNAPSHOTS: usize = 50;

/// Metadata for a file snapshot.
#[derive(Debug, Serialize, Deserialize)]
pub struct SnapshotInfo {
    pub id: String,
    pub execution_id: String,
    pub timestamp: u64,
    pub files: Vec<String>,
}

/// Create a snapshot of the given files before modification.
pub async fn create_snapshot(
    app_data_dir: &Path,
    execution_id: &str,
    file_paths: &[PathBuf],
) -> Result<String, String> {
    let snapshot_id = format!("snap-{}", execution_id);
    let snapshot_dir = app_data_dir
        .join("workflow-snapshots")
        .join(&snapshot_id);

    tokio::fs::create_dir_all(&snapshot_dir)
        .await
        .map_err(|e| format!("Failed to create snapshot directory: {}", e))?;

    let mut saved_files = Vec::new();

    for path in file_paths {
        if path.exists() {
            let file_name = path
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();
            let dest = snapshot_dir.join(&file_name);
            tokio::fs::copy(path, &dest)
                .await
                .map_err(|e| format!("Failed to snapshot '{}': {}", path.display(), e))?;
            saved_files.push(path.to_string_lossy().to_string());
        }
    }

    // Write metadata
    let info = SnapshotInfo {
        id: snapshot_id.clone(),
        execution_id: execution_id.to_string(),
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs(),
        files: saved_files,
    };
    let meta_path = snapshot_dir.join("metadata.json");
    let meta_json =
        serde_json::to_string_pretty(&info).map_err(|e| format!("Failed to serialize: {}", e))?;
    tokio::fs::write(&meta_path, meta_json)
        .await
        .map_err(|e| format!("Failed to write metadata: {}", e))?;

    Ok(snapshot_id)
}

/// Restore all files from a snapshot.
pub async fn restore_snapshot(
    app_data_dir: &Path,
    snapshot_id: &str,
) -> Result<(), String> {
    let snapshot_dir = app_data_dir
        .join("workflow-snapshots")
        .join(snapshot_id);

    let meta_path = snapshot_dir.join("metadata.json");
    let meta_str = tokio::fs::read_to_string(&meta_path)
        .await
        .map_err(|e| format!("Snapshot not found: {}", e))?;
    let info: SnapshotInfo =
        serde_json::from_str(&meta_str).map_err(|e| format!("Invalid snapshot metadata: {}", e))?;

    for original_path in &info.files {
        let file_name = Path::new(original_path)
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();
        let snapshot_file = snapshot_dir.join(&file_name);
        if snapshot_file.exists() {
            tokio::fs::copy(&snapshot_file, original_path)
                .await
                .map_err(|e| format!("Failed to restore '{}': {}", original_path, e))?;
        }
    }

    Ok(())
}

/// List recent snapshots, sorted by timestamp descending.
pub async fn list_snapshots(app_data_dir: &Path) -> Result<Vec<SnapshotInfo>, String> {
    let snapshots_dir = app_data_dir.join("workflow-snapshots");
    if !snapshots_dir.exists() {
        return Ok(vec![]);
    }

    let mut snapshots = Vec::new();
    let mut dir = tokio::fs::read_dir(&snapshots_dir)
        .await
        .map_err(|e| format!("Failed to read snapshots directory: {}", e))?;

    while let Some(entry) = dir
        .next_entry()
        .await
        .map_err(|e| format!("Failed to read entry: {}", e))?
    {
        let meta_path = entry.path().join("metadata.json");
        if meta_path.exists() {
            if let Ok(meta_str) = tokio::fs::read_to_string(&meta_path).await {
                if let Ok(info) = serde_json::from_str::<SnapshotInfo>(&meta_str) {
                    snapshots.push(info);
                }
            }
        }
    }

    snapshots.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    snapshots.truncate(MAX_SNAPSHOTS);

    Ok(snapshots)
}
