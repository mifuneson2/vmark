//! PDF bookmark (outline) injection using PDFKit.
//!
//! After the print operation generates a PDF, this module opens it
//! with PDFKit, searches for heading text on each page, and builds
//! a hierarchical outline (bookmarks) that PDF viewers display as
//! a table of contents.

use objc2::AnyThread;
use objc2_foundation::{NSPoint, NSString};
use objc2_pdf_kit::{PDFDestination, PDFDocument, PDFOutline};

/// A heading extracted from the document for bookmarking.
#[derive(Clone, Debug, serde::Deserialize)]
pub struct Heading {
    pub level: u32,
    pub text: String,
}

/// Add bookmark outlines to an existing PDF file.
///
/// Opens the PDF, searches for each heading's text to determine its page,
/// builds a hierarchical outline, and writes the PDF back.
pub fn add_bookmarks(pdf_path: &str, headings: &[Heading]) -> Result<(), String> {
    if headings.is_empty() {
        return Ok(());
    }

    eprintln!("[PDF] adding {} bookmarks to {}", headings.len(), pdf_path);

    let url = objc2_foundation::NSURL::fileURLWithPath(&NSString::from_str(pdf_path));
    let doc = unsafe { PDFDocument::initWithURL(PDFDocument::alloc(), &url) }
        .ok_or("Failed to open PDF for bookmark injection")?;

    let page_count = unsafe { doc.pageCount() };
    if page_count == 0 {
        return Err("PDF has no pages".to_string());
    }

    eprintln!("[PDF] PDF has {} pages", page_count);

    // Build page text index for heading lookup
    let page_texts = build_page_texts(&doc, page_count);

    // Create root outline
    let root = unsafe { PDFOutline::new() };

    // Track outline hierarchy using a stack of (level, outline_ref_index)
    let mut items: Vec<(u32, objc2::rc::Retained<PDFOutline>)> = Vec::new();

    for heading in headings {
        let page_idx = find_heading_page(&page_texts, &heading.text);
        let page = unsafe { doc.pageAtIndex(page_idx as objc2_foundation::NSUInteger) };

        let item = unsafe { PDFOutline::new() };
        unsafe {
            item.setLabel(Some(&NSString::from_str(&heading.text)));
        }

        if let Some(page) = page {
            // Point to top of the page where heading was found
            let dest = unsafe {
                PDFDestination::initWithPage_atPoint(
                    PDFDestination::alloc(),
                    &page,
                    NSPoint::new(0.0, 10000.0), // top of page (PDF coords: y=0 is bottom)
                )
            };
            unsafe { item.setDestination(Some(&dest)) };
        }

        // Build hierarchy: find the right parent for this heading level
        // Pop items from stack that are at the same or lower level
        while let Some((lvl, _)) = items.last() {
            if *lvl >= heading.level {
                items.pop();
            } else {
                break;
            }
        }

        if let Some((_, parent)) = items.last() {
            let child_count = unsafe { parent.numberOfChildren() };
            unsafe { parent.insertChild_atIndex(&item, child_count) };
        } else {
            let child_count = unsafe { root.numberOfChildren() };
            unsafe { root.insertChild_atIndex(&item, child_count) };
        }

        items.push((heading.level, item));
    }

    // Set the outline root and expand top-level items
    unsafe {
        root.setIsOpen(true);
        doc.setOutlineRoot(Some(&root));
    }

    // Write back
    let success = unsafe { doc.writeToFile(&NSString::from_str(pdf_path)) };
    if !success {
        return Err("Failed to write PDF with bookmarks".to_string());
    }

    eprintln!("[PDF] bookmarks added successfully");
    Ok(())
}

/// Extract text content from each page for heading search.
fn build_page_texts(
    doc: &PDFDocument,
    page_count: objc2_foundation::NSUInteger,
) -> Vec<String> {
    let mut texts = Vec::with_capacity(page_count as usize);
    for i in 0..page_count {
        let text = unsafe {
            doc.pageAtIndex(i)
                .and_then(|page| page.string())
                .map(|s| s.to_string())
                .unwrap_or_default()
        };
        texts.push(text);
    }
    texts
}

/// Find which page contains a heading by searching page text.
/// Returns 0 (first page) if not found.
fn find_heading_page(page_texts: &[String], heading_text: &str) -> usize {
    let needle = heading_text.trim();
    for (i, text) in page_texts.iter().enumerate() {
        if text.contains(needle) {
            return i;
        }
    }
    // Fallback: try case-insensitive or partial match
    let lower = needle.to_lowercase();
    for (i, text) in page_texts.iter().enumerate() {
        if text.to_lowercase().contains(&lower) {
            return i;
        }
    }
    0
}
