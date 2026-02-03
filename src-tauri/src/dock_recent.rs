//! macOS Dock recent documents integration.
//!
//! Registers opened files with NSDocumentController so they appear
//! in the "Recent Documents" submenu when right-clicking the Dock icon.

use objc2::MainThreadMarker;
use objc2_app_kit::NSDocumentController;
use objc2_foundation::{NSString, NSURL};
use std::path::Path;

/// Register a file path with macOS Recent Documents.
/// This makes the file appear in the Dock right-click menu.
pub fn register_recent_document(path: &str) {
    // Validate path exists
    if !Path::new(path).exists() {
        #[cfg(debug_assertions)]
        eprintln!("[dock_recent] Path does not exist: {}", path);
        return;
    }

    let Some(mtm) = MainThreadMarker::new() else {
        #[cfg(debug_assertions)]
        eprintln!("[dock_recent] Not on main thread, cannot register document");
        return;
    };

    let path_ns = NSString::from_str(path);
    let url = NSURL::fileURLWithPath(&path_ns);

    let controller = NSDocumentController::sharedDocumentController(mtm);
    controller.noteNewRecentDocumentURL(&url);

    #[cfg(debug_assertions)]
    eprintln!("[dock_recent] Registered: {}", path);
}
