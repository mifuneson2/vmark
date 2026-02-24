//! PDF Export
//!
//! Native PDF generation using WKWebView + NSPrintOperation (macOS only).
//! The frontend sends fully rendered HTML and this module creates a
//! paginated PDF via WebKit's print pipeline, then adds bookmarks
//! using PDFKit.

pub mod commands;
mod bookmarks;
mod renderer;
