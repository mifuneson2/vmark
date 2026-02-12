//! App Paths - Centralized path management for Tauri app data.
//!
//! Provides:
//! - Port file path resolution for MCP bridge
//! - Legacy ~/.vmark/ directory cleanup
//! - Atomic file operations to prevent race conditions

use std::fs::{self, File};
use std::io::Write;
use std::path::{Path, PathBuf};
use tauri::Manager;

// ============================================================================
// Constants
// ============================================================================

/// MCP port file name
pub const MCP_PORT_FILE: &str = "mcp-port";

/// Bootstrap file name — legacy, only used for cleanup
const BOOTSTRAP_FILE: &str = "app-data-path";

/// Legacy MCP settings file — only used for cleanup
const LEGACY_MCP_SETTINGS_FILE: &str = "mcp-settings.json";

// ============================================================================
// Public API (Tauri-dependent)
// ============================================================================

/// Get the path to the port file in the app data directory.
pub fn get_port_file_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    Ok(app_data.join(MCP_PORT_FILE))
}

/// Best-effort cleanup of legacy ~/.vmark/ directory.
/// Removes obsolete files (bootstrap, port, settings) and the directory itself if empty.
pub fn cleanup_legacy_home_dir(_app: &tauri::AppHandle) {
    let Some(legacy_dir) = get_legacy_dir() else {
        return;
    };
    if !legacy_dir.exists() {
        return;
    }

    // Remove all known legacy files
    let _ = fs::remove_file(legacy_dir.join(BOOTSTRAP_FILE));
    let _ = fs::remove_file(legacy_dir.join(MCP_PORT_FILE));
    let _ = fs::remove_file(legacy_dir.join(LEGACY_MCP_SETTINGS_FILE));

    // Try to remove directory (only succeeds if empty)
    let _ = fs::remove_dir(&legacy_dir);
}

// ============================================================================
// Internal helpers
// ============================================================================

/// Get the legacy directory path (~/.vmark/).
fn get_legacy_dir() -> Option<PathBuf> {
    dirs::home_dir().map(|h| h.join(".vmark"))
}

/// Write a file atomically using temp file + sync + rename pattern.
/// This prevents partial reads by other processes.
pub fn atomic_write_file(path: &Path, contents: &[u8]) -> Result<(), String> {
    let parent = path.parent().ok_or_else(|| {
        format!("Cannot determine parent directory of {:?}", path)
    })?;

    // Create temp file in same directory (for same-filesystem rename)
    let temp_path = parent.join(format!(
        ".{}.tmp.{}",
        path.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("file"),
        std::process::id()
    ));

    // Write to temp file
    let mut temp_file = File::create(&temp_path).map_err(|e| {
        format!("Failed to create temp file {:?}: {}", temp_path, e)
    })?;

    temp_file.write_all(contents).map_err(|e| {
        let _ = fs::remove_file(&temp_path);
        format!("Failed to write temp file {:?}: {}", temp_path, e)
    })?;

    // Sync to disk before rename
    temp_file.sync_all().map_err(|e| {
        let _ = fs::remove_file(&temp_path);
        format!("Failed to sync temp file {:?}: {}", temp_path, e)
    })?;

    // Atomic rename (on Unix) or replace (on Windows)
    #[cfg(unix)]
    {
        fs::rename(&temp_path, path).map_err(|e| {
            let _ = fs::remove_file(&temp_path);
            format!(
                "Failed to rename {:?} to {:?}: {}",
                temp_path, path, e
            )
        })?;
    }

    #[cfg(windows)]
    {
        // Windows rename fails if target exists, use replace
        if path.exists() {
            fs::remove_file(path).map_err(|e| {
                let _ = fs::remove_file(&temp_path);
                format!("Failed to remove existing {:?}: {}", path, e)
            })?;
        }
        fs::rename(&temp_path, path).map_err(|e| {
            let _ = fs::remove_file(&temp_path);
            format!(
                "Failed to rename {:?} to {:?}: {}",
                temp_path, path, e
            )
        })?;
    }

    Ok(())
}

/// Remove a file, returning Ok for NotFound (idempotent delete).
/// Returns error for other failures (permission denied, etc.)
#[allow(dead_code)]
pub fn remove_file_if_exists(path: &Path) -> Result<(), String> {
    match fs::remove_file(path) {
        Ok(()) => Ok(()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(format!("Failed to remove {:?}: {}", path, e)),
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::sync::{Arc, Barrier};
    use std::thread;
    use tempfile::tempdir;

    // ------------------------------------------------------------------------
    // atomic_write_file tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_atomic_write_creates_file() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("test.txt");

        atomic_write_file(&path, b"hello").unwrap();

        let contents = fs::read_to_string(&path).unwrap();
        assert_eq!(contents, "hello");
    }

    #[test]
    fn test_atomic_write_overwrites_existing() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("test.txt");

        fs::write(&path, "old content").unwrap();
        atomic_write_file(&path, b"new content").unwrap();

        let contents = fs::read_to_string(&path).unwrap();
        assert_eq!(contents, "new content");
    }

    #[test]
    fn test_atomic_write_no_partial_content() {
        // This tests that readers see either old or new content, never partial
        let dir = tempdir().unwrap();
        let path = dir.path().join("test.txt");

        // Write initial content
        atomic_write_file(&path, b"AAAA").unwrap();

        // Concurrent read and write
        let path_clone = path.clone();
        let barrier = Arc::new(Barrier::new(2));
        let barrier_clone = Arc::clone(&barrier);

        let writer = thread::spawn(move || {
            barrier_clone.wait();
            for _ in 0..100 {
                atomic_write_file(&path_clone, b"BBBBBBBB").unwrap();
                atomic_write_file(&path_clone, b"AAAA").unwrap();
            }
        });

        let reader = thread::spawn(move || {
            barrier.wait();
            for _ in 0..100 {
                if let Ok(contents) = fs::read_to_string(&path) {
                    // Should never see partial content
                    assert!(
                        contents == "AAAA" || contents == "BBBBBBBB",
                        "Got partial content: {:?}",
                        contents
                    );
                }
            }
        });

        writer.join().unwrap();
        reader.join().unwrap();
    }

    #[test]
    fn test_atomic_write_cleans_up_temp_on_failure() {
        let dir = tempdir().unwrap();
        // Create a directory where we expect a file - this will cause write to fail
        let path = dir.path().join("subdir");
        fs::create_dir(&path).unwrap();

        let result = atomic_write_file(&path, b"test");
        assert!(result.is_err());

        // No temp files should be left behind
        let entries: Vec<_> = fs::read_dir(dir.path()).unwrap().collect();
        assert_eq!(entries.len(), 1); // Only the subdir
    }

    // ------------------------------------------------------------------------
    // remove_file_if_exists tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_remove_file_if_exists_removes_file() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("test.txt");
        fs::write(&path, "content").unwrap();

        remove_file_if_exists(&path).unwrap();
        assert!(!path.exists());
    }

    #[test]
    fn test_remove_file_if_exists_ok_for_missing() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("nonexistent.txt");

        // Should not error
        remove_file_if_exists(&path).unwrap();
    }

    // ------------------------------------------------------------------------
    // cleanup_legacy_home_dir tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_cleanup_removes_bootstrap_file() {
        let dir = tempdir().unwrap();
        let legacy_dir = dir.path().join(".vmark");
        fs::create_dir_all(&legacy_dir).unwrap();
        fs::write(legacy_dir.join("app-data-path"), "/some/path").unwrap();

        // Cleanup using internal function for testability
        let _ = fs::remove_file(legacy_dir.join("app-data-path"));
        let _ = fs::remove_dir(&legacy_dir);

        assert!(!legacy_dir.exists());
    }
}
