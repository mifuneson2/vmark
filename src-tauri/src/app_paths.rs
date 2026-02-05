//! App Paths - Centralized path management for Tauri app data.
//!
//! Provides:
//! - Bootstrap file writing for MCP sidecar discovery
//! - Migration from legacy ~/.vmark/ to standard app data directory
//! - Atomic file operations to prevent race conditions

use std::fs::{self, File, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use tauri::Manager;

// ============================================================================
// Constants
// ============================================================================

/// Bootstrap file name - contains path to app data directory
const BOOTSTRAP_FILE: &str = "app-data-path";

/// Migration marker file name
const MIGRATION_MARKER: &str = ".migrated-from-legacy";

/// MCP settings file name
pub const MCP_SETTINGS_FILE: &str = "mcp-settings.json";

/// MCP port file name
pub const MCP_PORT_FILE: &str = "mcp-port";

// ============================================================================
// Public API (Tauri-dependent)
// ============================================================================

/// Get the legacy directory path (~/.vmark/).
/// This is being phased out - only used for bootstrap file and migration.
pub fn get_legacy_dir() -> Option<PathBuf> {
    dirs::home_dir().map(|h| h.join(".vmark"))
}

/// Write the app data path to a bootstrap file for MCP sidecar discovery.
///
/// The MCP sidecar is a separate Node.js process without access to Tauri's AppHandle.
/// Instead of duplicating platform-specific path logic in Node.js, we write a bootstrap file:
/// - File: ~/.vmark/app-data-path
/// - Contents: Absolute path to app data directory
/// - Read by: Node.js sidecar to locate mcp-port and mcp-settings.json
///
/// Uses atomic write (temp file + rename) to prevent partial reads.
pub fn write_app_data_path_bootstrap(app: &tauri::AppHandle) -> Result<(), String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let legacy_dir = get_legacy_dir().ok_or("Cannot determine home directory")?;

    write_bootstrap_file_impl(&legacy_dir, &app_data)
}

/// Migrate legacy files from ~/.vmark/ to the app data directory.
///
/// This is a one-time migration that runs on startup:
/// - Copies mcp-settings.json if it exists in legacy location but not in app data
/// - Creates a marker file atomically to prevent re-running (even with concurrent instances)
/// - Only writes marker on successful migration or when nothing to migrate
pub fn migrate_legacy_files(app: &tauri::AppHandle) -> Result<(), String> {
    let legacy_dir = get_legacy_dir().ok_or("Cannot determine home directory")?;
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;

    migrate_legacy_files_impl(&legacy_dir, &app_data)
}

/// Get the path to the port file in the app data directory.
pub fn get_port_file_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    Ok(app_data.join(MCP_PORT_FILE))
}

/// Get the path to the MCP settings file in the app data directory.
pub fn get_mcp_settings_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    Ok(app_data.join(MCP_SETTINGS_FILE))
}

// ============================================================================
// Core Implementation (Tauri-independent, testable)
// ============================================================================

/// Write bootstrap file atomically.
/// This is the core implementation that can be tested without Tauri.
fn write_bootstrap_file_impl(legacy_dir: &Path, app_data: &Path) -> Result<(), String> {
    // Ensure directories exist
    fs::create_dir_all(app_data).map_err(|e| {
        format!(
            "Failed to create app data directory {:?}: {}",
            app_data, e
        )
    })?;

    fs::create_dir_all(legacy_dir).map_err(|e| {
        format!(
            "Failed to create legacy directory {:?}: {}",
            legacy_dir, e
        )
    })?;

    // Convert app_data path to UTF-8 string, failing explicitly on non-UTF-8 paths
    let app_data_str = app_data
        .to_str()
        .ok_or_else(|| format!("App data path contains non-UTF-8 characters: {:?}", app_data))?;

    let bootstrap_path = legacy_dir.join(BOOTSTRAP_FILE);

    // Atomic write: temp file -> sync -> rename
    atomic_write_file(&bootstrap_path, app_data_str.as_bytes())?;

    #[cfg(debug_assertions)]
    eprintln!(
        "[App Paths] Bootstrap file written: {:?} -> {:?}",
        bootstrap_path, app_data
    );

    Ok(())
}

/// Migrate legacy files - core implementation.
fn migrate_legacy_files_impl(legacy_dir: &Path, app_data: &Path) -> Result<(), String> {
    // Ensure app data directory exists
    fs::create_dir_all(app_data).map_err(|e| {
        format!(
            "Failed to create app data directory {:?}: {}",
            app_data, e
        )
    })?;

    let marker_path = app_data.join(MIGRATION_MARKER);

    // Try to create marker atomically - if it already exists, migration was done
    match try_create_marker(&marker_path) {
        MarkerResult::AlreadyExists => {
            // Another instance already completed migration
            return Ok(());
        }
        MarkerResult::Created => {
            // We own the migration - but we created the marker prematurely
            // Remove it and proceed with migration
            let _ = fs::remove_file(&marker_path);
        }
        MarkerResult::Error(e) => {
            return Err(format!(
                "Failed to check migration marker {:?}: {}",
                marker_path, e
            ));
        }
    }

    // Perform migration
    let migration_result = perform_migration(legacy_dir, app_data);

    // Only write marker if migration succeeded or there was nothing to migrate
    match &migration_result {
        Ok(()) => {
            // Write marker to indicate successful migration
            if let Err(e) = atomic_write_file(&marker_path, b"") {
                // Log but don't fail - migration itself succeeded
                eprintln!(
                    "[App Paths] Warning: Failed to write migration marker {:?}: {}",
                    marker_path, e
                );
            }

            #[cfg(debug_assertions)]
            eprintln!("[App Paths] Migration completed successfully");
        }
        Err(e) => {
            // Migration failed - don't write marker so we can retry
            eprintln!("[App Paths] Migration failed, will retry on next launch: {}", e);
        }
    }

    migration_result
}

/// Result of trying to create the migration marker.
enum MarkerResult {
    /// Marker already exists (migration was done)
    AlreadyExists,
    /// Marker was created (we own migration)
    Created,
    /// Error occurred
    Error(std::io::Error),
}

/// Try to create marker file atomically using create_new.
fn try_create_marker(path: &Path) -> MarkerResult {
    match OpenOptions::new().write(true).create_new(true).open(path) {
        Ok(_) => MarkerResult::Created,
        Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists => MarkerResult::AlreadyExists,
        Err(e) => MarkerResult::Error(e),
    }
}

/// Perform the actual file migration.
fn perform_migration(legacy_dir: &Path, app_data: &Path) -> Result<(), String> {
    let legacy_settings = legacy_dir.join(MCP_SETTINGS_FILE);
    let new_settings = app_data.join(MCP_SETTINGS_FILE);

    // Only migrate if source exists
    if !legacy_settings.exists() {
        #[cfg(debug_assertions)]
        eprintln!("[App Paths] No legacy settings to migrate");
        return Ok(());
    }

    // Try to create destination atomically to avoid TOCTOU
    match OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&new_settings)
    {
        Ok(mut dest_file) => {
            // We own the destination - copy contents
            let contents = fs::read(&legacy_settings).map_err(|e| {
                format!(
                    "Failed to read legacy settings {:?}: {}",
                    legacy_settings, e
                )
            })?;

            dest_file.write_all(&contents).map_err(|e| {
                format!(
                    "Failed to write settings to {:?}: {}",
                    new_settings, e
                )
            })?;

            dest_file.sync_all().map_err(|e| {
                format!("Failed to sync settings file {:?}: {}", new_settings, e)
            })?;

            #[cfg(debug_assertions)]
            eprintln!(
                "[App Paths] Migrated {} from {:?} to {:?}",
                MCP_SETTINGS_FILE, legacy_settings, new_settings
            );

            Ok(())
        }
        Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists => {
            // Destination already exists - another instance migrated or user has settings
            #[cfg(debug_assertions)]
            eprintln!(
                "[App Paths] Settings already exist at {:?}, skipping migration",
                new_settings
            );
            Ok(())
        }
        Err(e) => Err(format!(
            "Failed to create settings file {:?}: {}",
            new_settings, e
        )),
    }
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
    // write_bootstrap_file_impl tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_bootstrap_file_created() {
        let legacy_dir = tempdir().unwrap();
        let app_data = tempdir().unwrap();

        write_bootstrap_file_impl(legacy_dir.path(), app_data.path()).unwrap();

        let bootstrap_path = legacy_dir.path().join(BOOTSTRAP_FILE);
        assert!(bootstrap_path.exists());

        let contents = fs::read_to_string(&bootstrap_path).unwrap();
        assert_eq!(contents, app_data.path().to_str().unwrap());
    }

    #[test]
    fn test_bootstrap_file_creates_directories() {
        let base = tempdir().unwrap();
        let legacy_dir = base.path().join("nested/legacy");
        let app_data = base.path().join("nested/appdata");

        write_bootstrap_file_impl(&legacy_dir, &app_data).unwrap();

        assert!(legacy_dir.exists());
        assert!(app_data.exists());
        assert!(legacy_dir.join(BOOTSTRAP_FILE).exists());
    }

    #[test]
    fn test_bootstrap_file_overwrites_existing() {
        let legacy_dir = tempdir().unwrap();
        let app_data1 = tempdir().unwrap();
        let app_data2 = tempdir().unwrap();

        write_bootstrap_file_impl(legacy_dir.path(), app_data1.path()).unwrap();
        write_bootstrap_file_impl(legacy_dir.path(), app_data2.path()).unwrap();

        let contents = fs::read_to_string(legacy_dir.path().join(BOOTSTRAP_FILE)).unwrap();
        assert_eq!(contents, app_data2.path().to_str().unwrap());
    }

    // ------------------------------------------------------------------------
    // migrate_legacy_files_impl tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_migration_copies_settings() {
        let legacy_dir = tempdir().unwrap();
        let app_data = tempdir().unwrap();

        // Create legacy settings
        let legacy_settings = legacy_dir.path().join(MCP_SETTINGS_FILE);
        fs::write(&legacy_settings, r#"{"toolMode":"full"}"#).unwrap();

        migrate_legacy_files_impl(legacy_dir.path(), app_data.path()).unwrap();

        // Check settings were copied
        let new_settings = app_data.path().join(MCP_SETTINGS_FILE);
        assert!(new_settings.exists());
        let contents = fs::read_to_string(&new_settings).unwrap();
        assert_eq!(contents, r#"{"toolMode":"full"}"#);

        // Check marker was created
        let marker = app_data.path().join(MIGRATION_MARKER);
        assert!(marker.exists());
    }

    #[test]
    fn test_migration_skips_if_marker_exists() {
        let legacy_dir = tempdir().unwrap();
        let app_data = tempdir().unwrap();

        // Create marker
        fs::create_dir_all(app_data.path()).unwrap();
        fs::write(app_data.path().join(MIGRATION_MARKER), "").unwrap();

        // Create legacy settings
        fs::write(
            legacy_dir.path().join(MCP_SETTINGS_FILE),
            r#"{"toolMode":"full"}"#,
        )
        .unwrap();

        migrate_legacy_files_impl(legacy_dir.path(), app_data.path()).unwrap();

        // Settings should NOT be copied (marker was present)
        assert!(!app_data.path().join(MCP_SETTINGS_FILE).exists());
    }

    #[test]
    fn test_migration_doesnt_overwrite_existing_settings() {
        let legacy_dir = tempdir().unwrap();
        let app_data = tempdir().unwrap();

        // Create both legacy and new settings
        fs::write(
            legacy_dir.path().join(MCP_SETTINGS_FILE),
            r#"{"toolMode":"full"}"#,
        )
        .unwrap();

        fs::create_dir_all(app_data.path()).unwrap();
        fs::write(
            app_data.path().join(MCP_SETTINGS_FILE),
            r#"{"toolMode":"writer"}"#,
        )
        .unwrap();

        migrate_legacy_files_impl(legacy_dir.path(), app_data.path()).unwrap();

        // Original new settings should be preserved
        let contents = fs::read_to_string(app_data.path().join(MCP_SETTINGS_FILE)).unwrap();
        assert_eq!(contents, r#"{"toolMode":"writer"}"#);
    }

    #[test]
    fn test_migration_creates_marker_when_nothing_to_migrate() {
        let legacy_dir = tempdir().unwrap();
        let app_data = tempdir().unwrap();

        // No legacy settings exist
        migrate_legacy_files_impl(legacy_dir.path(), app_data.path()).unwrap();

        // Marker should still be created
        assert!(app_data.path().join(MIGRATION_MARKER).exists());
    }

    #[test]
    fn test_migration_is_idempotent() {
        let legacy_dir = tempdir().unwrap();
        let app_data = tempdir().unwrap();

        // Create legacy settings
        fs::write(
            legacy_dir.path().join(MCP_SETTINGS_FILE),
            r#"{"toolMode":"full"}"#,
        )
        .unwrap();

        // Run migration twice
        migrate_legacy_files_impl(legacy_dir.path(), app_data.path()).unwrap();
        migrate_legacy_files_impl(legacy_dir.path(), app_data.path()).unwrap();

        // Should succeed without error
        let contents = fs::read_to_string(app_data.path().join(MCP_SETTINGS_FILE)).unwrap();
        assert_eq!(contents, r#"{"toolMode":"full"}"#);
    }

    #[test]
    fn test_concurrent_migration_is_safe() {
        // Test that two instances racing to migrate don't corrupt data
        let legacy_dir = tempdir().unwrap();
        let app_data = tempdir().unwrap();

        // Create legacy settings
        fs::write(
            legacy_dir.path().join(MCP_SETTINGS_FILE),
            r#"{"toolMode":"full"}"#,
        )
        .unwrap();

        let barrier = Arc::new(Barrier::new(2));
        let legacy_path = legacy_dir.path().to_path_buf();
        let app_path = app_data.path().to_path_buf();

        let handles: Vec<_> = (0..2)
            .map(|_| {
                let b = Arc::clone(&barrier);
                let l = legacy_path.clone();
                let a = app_path.clone();
                thread::spawn(move || {
                    b.wait();
                    migrate_legacy_files_impl(&l, &a)
                })
            })
            .collect();

        // Both should succeed (or one should find marker and skip)
        for h in handles {
            h.join().unwrap().unwrap();
        }

        // Final state should be correct
        let contents = fs::read_to_string(app_data.path().join(MCP_SETTINGS_FILE)).unwrap();
        assert_eq!(contents, r#"{"toolMode":"full"}"#);
        assert!(app_data.path().join(MIGRATION_MARKER).exists());
    }

    // ------------------------------------------------------------------------
    // try_create_marker tests
    // ------------------------------------------------------------------------

    #[test]
    fn test_try_create_marker_creates_new() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("marker");

        match try_create_marker(&path) {
            MarkerResult::Created => assert!(path.exists()),
            other => panic!("Expected Created, got {:?}", std::mem::discriminant(&other)),
        }
    }

    #[test]
    fn test_try_create_marker_detects_existing() {
        let dir = tempdir().unwrap();
        let path = dir.path().join("marker");
        fs::write(&path, "").unwrap();

        match try_create_marker(&path) {
            MarkerResult::AlreadyExists => {} // Expected
            other => panic!(
                "Expected AlreadyExists, got {:?}",
                std::mem::discriminant(&other)
            ),
        }
    }
}
