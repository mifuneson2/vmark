//! Tauri commands for PDF export.

use super::{bookmarks, renderer};
use std::path::Path;

/// Export HTML content to a PDF file using WKWebView.
///
/// Emits `pdf-export-progress` events to the `pdf-export` window
/// with status updates: "loading", "rendering", "writing", "done".
///
/// After PDF generation, injects heading-based bookmarks using PDFKit.
#[tauri::command]
pub async fn export_pdf(
    app: tauri::AppHandle,
    html: String,
    output_path: String,
    headings: Option<Vec<bookmarks::Heading>>,
) -> Result<(), String> {
    // Validate output path
    let path = Path::new(&output_path);

    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");
    if !ext.eq_ignore_ascii_case("pdf") {
        return Err("Output path must have .pdf extension".to_string());
    }

    if let Some(parent) = path.parent() {
        if !parent.as_os_str().is_empty() && !parent.exists() {
            return Err("Output directory does not exist".to_string());
        }
    }

    renderer::render_pdf(app, html, output_path.clone()).await?;

    // Add bookmarks if headings were provided
    if let Some(ref headings) = headings {
        if !headings.is_empty() {
            if let Err(e) = bookmarks::add_bookmarks(&output_path, headings) {
                eprintln!("[PDF] bookmark injection failed: {}", e);
                // Don't fail the export — PDF is still valid without bookmarks
            }
        }
    }

    Ok(())
}
