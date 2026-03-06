//! Genie directory scanning.
//!
//! Recursively scans directories for `.md` genie files, extracting names
//! from filenames and categories from subdirectory structure.

use super::types::{GenieEntry, GenieMenuEntry};
use std::collections::HashMap;
use std::fs;
use std::path::Path;

/// Recursively scan a directory for `.md` files. Subdirectory names become categories.
pub(crate) fn scan_genies_dir(
    dir: &Path,
    base: &Path,
    source: &str,
    entries: &mut HashMap<String, GenieEntry>,
) {
    let read_dir = match fs::read_dir(dir) {
        Ok(rd) => rd,
        Err(_) => return,
    };

    for entry in read_dir.flatten() {
        // Skip symlinks for safety
        let ft = match entry.file_type() {
            Ok(ft) => ft,
            Err(_) => continue,
        };
        if ft.is_symlink() {
            continue;
        }

        let path = entry.path();
        if ft.is_dir() {
            scan_genies_dir(&path, base, source, entries);
        } else if path.extension().is_some_and(|ext| ext.eq_ignore_ascii_case("md")) {
            let name: String = path
                .file_stem()
                .unwrap_or_default()
                .to_string_lossy()
                .chars()
                .filter(|c| !c.is_control())
                .collect();

            // Category from subdirectory relative to base.
            // Normalize backslashes to forward slashes so Windows paths
            // produce the same category/key strings as POSIX.
            let category = path
                .parent()
                .and_then(|p| p.strip_prefix(base).ok())
                .filter(|rel| !rel.as_os_str().is_empty())
                .map(|rel| rel.to_string_lossy().replace('\\', "/"));

            // Key by relative path (e.g. "writing/improve") to avoid collisions
            // between files with the same stem in different categories.
            let rel_key = path
                .strip_prefix(base)
                .unwrap_or(&path)
                .with_extension("")
                .to_string_lossy()
                .replace('\\', "/");

            entries.insert(
                rel_key,
                GenieEntry {
                    name,
                    path: path.to_string_lossy().to_string(),
                    source: source.to_string(),
                    category,
                },
            );
        }
    }
}

/// Scan a directory and return genie entries with titles derived from filenames.
pub fn scan_genies_with_titles(dir: &Path) -> Vec<GenieMenuEntry> {
    let mut entries = Vec::new();
    scan_genies_recursive(dir, dir, &mut entries);
    entries.sort_by(|a, b| a.title.cmp(&b.title));
    entries
}

fn scan_genies_recursive(dir: &Path, base: &Path, entries: &mut Vec<GenieMenuEntry>) {
    let read_dir = match fs::read_dir(dir) {
        Ok(rd) => rd,
        Err(_) => return,
    };

    for entry in read_dir.flatten() {
        let ft = match entry.file_type() {
            Ok(ft) => ft,
            Err(_) => continue,
        };
        if ft.is_symlink() {
            continue;
        }

        let path = entry.path();
        if ft.is_dir() {
            scan_genies_recursive(&path, base, entries);
        } else if path.extension().is_some_and(|ext| ext.eq_ignore_ascii_case("md")) {
            let filename_stem = path
                .file_stem()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();

            // Always use filename as menu title — renaming the file changes the display.
            // Strip control characters to prevent misleading UI labels.
            let title: String = filename_stem.chars().filter(|c| !c.is_control()).collect();

            let category = path
                .parent()
                .and_then(|p| p.strip_prefix(base).ok())
                .filter(|rel| !rel.as_os_str().is_empty())
                .map(|rel| rel.to_string_lossy().replace('\\', "/"));

            entries.push(GenieMenuEntry {
                title,
                path: path.to_string_lossy().to_string(),
                category,
            });
        }
    }
}

