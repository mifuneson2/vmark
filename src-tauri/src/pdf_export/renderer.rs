//! Off-screen WKWebView PDF renderer (macOS only).
//!
//! Flow:
//! 1. Write HTML to temp file (avoids loadHTMLString issues)
//! 2. Dispatch to main thread via Tauri's event loop (NOT GCD — critical!)
//! 3. Create hidden NSWindow + WKWebView, load HTML from file URL
//! 4. Spin NSRunLoop to wait for load completion
//! 5. Use printOperationWithPrintInfo + NSPrintSaveJob for paginated PDF
//!
//! Uses `app.run_on_main_thread()` (tao event loop) instead of
//! `dispatch2::Queue::main().exec_async()` (GCD). The latter causes
//! WKWebView callbacks to deadlock because NSRunLoop spinning inside
//! a GCD main queue block can't drain nested GCD callbacks.
//!
//! Uses `printOperationWithPrintInfo` instead of `createPDF` because
//! createPDF produces a single continuous page with no pagination.
//! The print operation respects @page CSS rules and paginates properly.
//!
//! Emits `pdf-export-progress` events to the frontend for UI updates.

use objc2::MainThreadOnly;
use objc2_foundation::NSString;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};
use tokio::sync::oneshot;

/// Progress event payload.
#[derive(Clone, serde::Serialize)]
struct PdfProgress {
    stage: &'static str,
}

fn emit_progress(app: &AppHandle, stage: &'static str) {
    let _ = app.emit_to("pdf-export", "pdf-export-progress", PdfProgress { stage });
}

/// Render HTML to PDF via off-screen WKWebView.
///
/// Writes HTML to a temp file, then dispatches to the main thread via
/// Tauri's event loop to create a WKWebView and generate the PDF.
pub async fn render_pdf(
    app: AppHandle,
    html: String,
    output_path: String,
) -> Result<(), String> {
    // Write HTML to temp file on the async thread (no main thread needed)
    let temp_dir = std::env::temp_dir();
    let unique_id = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let temp_html = temp_dir.join(format!("vmark-pdf-export-{}-{}.html", std::process::id(), unique_id));
    std::fs::write(&temp_html, &html)
        .map_err(|e| format!("Failed to write temp HTML: {}", e))?;

    eprintln!(
        "[PDF] render_pdf: wrote {} bytes to {}, output: {}",
        html.len(),
        temp_html.display(),
        output_path
    );

    let (tx, rx) = oneshot::channel::<Result<(), String>>();
    let tx = Arc::new(Mutex::new(Some(tx)));

    let tx_clone = tx.clone();
    let app_clone = app.clone();
    let temp_html_str = temp_html.to_string_lossy().to_string();
    let temp_dir_str = temp_dir.to_string_lossy().to_string();
    let output_path_clone = output_path.clone();

    // Use Tauri's event loop dispatch (NOT GCD) — this is critical.
    // GCD dispatch causes WKWebView callback deadlock when spinning NSRunLoop.
    app.run_on_main_thread(move || {
        eprintln!("[PDF] main thread (tao event loop) entered");
        let result = render_pdf_on_main_thread(
            &app_clone,
            &temp_html_str,
            &temp_dir_str,
            &output_path_clone,
        );
        eprintln!(
            "[PDF] done, result: {:?}",
            result.as_ref().map(|_| "ok")
        );
        // Clean up temp file
        let _ = std::fs::remove_file(&temp_html_str);
        if let Some(sender) = tx_clone.lock().unwrap().take() {
            let _ = sender.send(result);
        }
    })
    .map_err(|e| format!("Failed to dispatch to main thread: {}", e))?;

    rx.await
        .map_err(|_| "PDF render channel closed".to_string())?
}

/// Main-thread PDF rendering logic.
fn render_pdf_on_main_thread(
    app: &AppHandle,
    html_path: &str,
    read_access_dir: &str,
    output_path: &str,
) -> Result<(), String> {
    use objc2::MainThreadMarker;
    use objc2_app_kit::{
        NSBackingStoreType, NSWindow, NSWindowStyleMask,
    };
    use objc2_core_foundation::CGRect;
    use objc2_foundation::NSURL;
    use objc2_web_kit::{WKWebView, WKWebViewConfiguration};

    let mtm =
        MainThreadMarker::new().ok_or("PDF export must run on the main thread")?;

    emit_progress(app, "loading");
    eprintln!("[PDF] creating hidden window + WKWebView...");

    // Create a hidden NSWindow to host the WKWebView.
    // WKWebView's printOperationWithPrintInfo requires a window for
    // runOperationModalForWindow to work correctly.
    let frame = CGRect::new(
        objc2_core_foundation::CGPoint::new(0.0, 0.0),
        objc2_core_foundation::CGSize::new(800.0, 600.0),
    );
    let window = unsafe {
        NSWindow::initWithContentRect_styleMask_backing_defer(
            NSWindow::alloc(mtm),
            frame,
            NSWindowStyleMask::Borderless,
            NSBackingStoreType::Buffered,
            true, // defer
        )
    };

    let config = unsafe { WKWebViewConfiguration::new(mtm) };
    let webview = unsafe {
        WKWebView::initWithFrame_configuration(WKWebView::alloc(mtm), frame, &config)
    };

    // Attach WKWebView to the window (required for print operations)
    window.setContentView(Some(&webview));

    // Load from file URL
    eprintln!("[PDF] loading file: {}", html_path);
    let file_url = NSURL::fileURLWithPath(&NSString::from_str(html_path));
    let dir_url = NSURL::fileURLWithPath(&NSString::from_str(read_access_dir));
    unsafe { webview.loadFileURL_allowingReadAccessToURL(&file_url, &dir_url) };

    // Wait for HTML to load
    eprintln!("[PDF] waiting for load...");
    let load_start = std::time::Instant::now();
    let mut loaded = false;
    for i in 0..200 {
        run_loop_tick(0.05);

        let is_loading: bool = unsafe { objc2::msg_send![&webview, isLoading] };
        if !is_loading && i > 2 {
            eprintln!(
                "[PDF] loaded at tick {} ({:.2}s)",
                i,
                load_start.elapsed().as_secs_f64()
            );
            loaded = true;
            break;
        }
        if i % 20 == 0 {
            eprintln!("[PDF] tick {}: isLoading={}", i, is_loading);
        }
    }

    if !loaded {
        eprintln!("[PDF] load TIMEOUT after {:.2}s", load_start.elapsed().as_secs_f64());
        return Err("HTML load timeout (10s)".to_string());
    }

    // Extra settle time for rendering
    run_loop_tick(0.2);

    eprintln!(
        "[PDF] load phase done ({:.2}s), creating PDF via print operation...",
        load_start.elapsed().as_secs_f64()
    );

    // Create PDF via print operation (paginated, respects @page CSS)
    emit_progress(app, "rendering");
    let pdf_start = std::time::Instant::now();
    let result = print_to_pdf(&webview, &window, output_path);
    eprintln!(
        "[PDF] print operation done in {:.2}s",
        pdf_start.elapsed().as_secs_f64()
    );

    if result.is_ok() {
        emit_progress(app, "done");
    }
    result
}

/// Print WKWebView content to PDF using NSPrintOperation.
///
/// Uses printOperationWithPrintInfo with NSPrintSaveJob disposition
/// to generate a paginated PDF that respects @page CSS rules.
fn print_to_pdf(
    webview: &objc2_web_kit::WKWebView,
    window: &objc2_app_kit::NSWindow,
    output_path: &str,
) -> Result<(), String> {
    use objc2_app_kit::{
        NSPrintInfo, NSPrintJobSavingURL, NSPrintSaveJob,
        NSPrintingPaginationMode,
    };
    use objc2_foundation::{NSCopying, NSURL};

    eprintln!("[PDF] configuring NSPrintInfo...");

    // Copy shared print info to avoid mutating global state between operations
    let print_info = NSPrintInfo::sharedPrintInfo().copy();

    // Configure pagination
    print_info.setHorizontalPagination(NSPrintingPaginationMode::Fit);
    print_info.setVerticalPagination(NSPrintingPaginationMode::Automatic);

    // Set margins to 0 — let @page CSS rules control margins.
    // WebKit's print pipeline applies @page margins internally.
    print_info.setTopMargin(0.0);
    print_info.setBottomMargin(0.0);
    print_info.setLeftMargin(0.0);
    print_info.setRightMargin(0.0);

    // Configure save-to-PDF disposition
    unsafe {
        print_info.setJobDisposition(NSPrintSaveJob);
    }

    // Set the output file URL in the print info dictionary.
    // Use msg_send! because the typed setObject_forKey expects ProtocolObject<NSCopying>.
    let output_url = NSURL::fileURLWithPath(&NSString::from_str(output_path));
    unsafe {
        let dict = print_info.dictionary();
        let _: () = objc2::msg_send![&*dict, setObject: &*output_url, forKey: NSPrintJobSavingURL];
    }

    // Remove any stale file to avoid false-positive success detection
    let _ = std::fs::remove_file(output_path);

    eprintln!("[PDF] creating print operation...");

    // Get print operation from WKWebView
    let print_op = unsafe { webview.printOperationWithPrintInfo(&print_info) };

    // Hide print panel and progress panel (save silently)
    print_op.setShowsPrintPanel(false);
    print_op.setShowsProgressPanel(false);

    eprintln!("[PDF] running print operation (modal for hidden window)...");

    // Run the print operation modally for the hidden window.
    // This is required for WKWebView — plain runOperation() produces blank PDFs.
    // The modal variant properly processes WebKit's internal print rendering.
    //
    // We pass nil delegate/selector/contextInfo since we spin NSRunLoop
    // synchronously and check the file output afterwards.
    unsafe {
        print_op.runOperationModalForWindow_delegate_didRunSelector_contextInfo(
            window,
            None,                    // delegate
            None,                    // didRunSelector
            std::ptr::null_mut(),    // contextInfo
        );
    }

    // Spin run loop to let the print operation complete
    let start = std::time::Instant::now();
    for i in 0..600 {
        run_loop_tick(0.1);

        // Check if the PDF file has been written
        if i > 5 && std::path::Path::new(output_path).exists() {
            // Verify file has content (not just created empty)
            if let Ok(metadata) = std::fs::metadata(output_path) {
                if metadata.len() > 0 {
                    eprintln!(
                        "[PDF] PDF file detected at tick {} ({:.2}s), size: {} bytes",
                        i,
                        start.elapsed().as_secs_f64(),
                        metadata.len()
                    );
                    // Give a bit more time for file to be fully flushed
                    run_loop_tick(0.2);
                    return Ok(());
                }
            }
        }

        if i % 50 == 0 && i > 0 {
            eprintln!(
                "[PDF] print waiting... tick {} ({:.2}s)",
                i,
                start.elapsed().as_secs_f64()
            );
        }
    }

    eprintln!(
        "[PDF] print operation TIMEOUT after {:.2}s",
        start.elapsed().as_secs_f64()
    );

    // Check if file was created at all
    if std::path::Path::new(output_path).exists() {
        let size = std::fs::metadata(output_path)
            .map(|m| m.len())
            .unwrap_or(0);
        if size > 0 {
            eprintln!("[PDF] file exists with {} bytes (detected late)", size);
            return Ok(());
        }
        eprintln!("[PDF] file exists but is empty (0 bytes)");
        let _ = std::fs::remove_file(output_path);
        return Err("Print operation produced empty PDF".to_string());
    }

    Err("Print operation timeout (60s)".to_string())
}

/// Print HTML via native macOS print dialog.
///
/// Same pipeline as render_pdf but shows the print panel instead of
/// silently saving to file. The user selects a printer and prints.
pub async fn print_document(app: AppHandle, html: String) -> Result<(), String> {
    let temp_dir = std::env::temp_dir();
    let unique_id = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let temp_html = temp_dir.join(format!("vmark-print-{}-{}.html", std::process::id(), unique_id));
    std::fs::write(&temp_html, &html)
        .map_err(|e| format!("Failed to write temp HTML: {}", e))?;

    let (tx, rx) = oneshot::channel::<Result<(), String>>();
    let tx = Arc::new(Mutex::new(Some(tx)));
    let tx_clone = tx.clone();
    let temp_html_str = temp_html.to_string_lossy().to_string();
    let temp_dir_str = temp_dir.to_string_lossy().to_string();

    let app_clone = app.clone();
    app.run_on_main_thread(move || {
        let result =
            print_on_main_thread(&app_clone, &temp_html_str, &temp_dir_str);
        let _ = std::fs::remove_file(&temp_html_str);
        if let Some(sender) = tx_clone.lock().unwrap().take() {
            let _ = sender.send(result);
        }
    })
    .map_err(|e| format!("Failed to dispatch to main thread: {}", e))?;

    rx.await
        .map_err(|_| "Print channel closed".to_string())?
}

/// Main-thread native print logic.
fn print_on_main_thread(
    _app: &AppHandle,
    html_path: &str,
    read_access_dir: &str,
) -> Result<(), String> {
    use objc2::MainThreadMarker;
    use objc2_app_kit::{
        NSApplication, NSBackingStoreType, NSPrintInfo, NSPrintingPaginationMode, NSWindow,
        NSWindowStyleMask,
    };
    use objc2_core_foundation::CGRect;
    use objc2_foundation::NSURL;
    use objc2_web_kit::{WKWebView, WKWebViewConfiguration};

    let mtm = MainThreadMarker::new().ok_or("Print must run on the main thread")?;

    // Hidden window + WKWebView to render the HTML
    let frame = CGRect::new(
        objc2_core_foundation::CGPoint::new(0.0, 0.0),
        objc2_core_foundation::CGSize::new(800.0, 600.0),
    );
    let hidden_window = unsafe {
        NSWindow::initWithContentRect_styleMask_backing_defer(
            NSWindow::alloc(mtm),
            frame,
            NSWindowStyleMask::Borderless,
            NSBackingStoreType::Buffered,
            true,
        )
    };
    let config = unsafe { WKWebViewConfiguration::new(mtm) };
    let webview = unsafe {
        WKWebView::initWithFrame_configuration(WKWebView::alloc(mtm), frame, &config)
    };
    hidden_window.setContentView(Some(&webview));

    // Load HTML from file URL
    let file_url = NSURL::fileURLWithPath(&NSString::from_str(html_path));
    let dir_url = NSURL::fileURLWithPath(&NSString::from_str(read_access_dir));
    unsafe { webview.loadFileURL_allowingReadAccessToURL(&file_url, &dir_url) };

    // Wait for load (with timeout)
    let mut print_loaded = false;
    for i in 0..200 {
        run_loop_tick(0.05);
        let is_loading: bool = unsafe { objc2::msg_send![&webview, isLoading] };
        if !is_loading && i > 2 {
            print_loaded = true;
            break;
        }
    }
    if !print_loaded {
        return Err("Print HTML load timeout (10s)".to_string());
    }
    run_loop_tick(0.2);

    // Copy shared print info to avoid mutating global state
    let print_info = {
        use objc2_foundation::NSCopying;
        NSPrintInfo::sharedPrintInfo().copy()
    };
    print_info.setHorizontalPagination(NSPrintingPaginationMode::Fit);
    print_info.setVerticalPagination(NSPrintingPaginationMode::Automatic);
    print_info.setTopMargin(0.0);
    print_info.setBottomMargin(0.0);
    print_info.setLeftMargin(0.0);
    print_info.setRightMargin(0.0);

    // Get print operation — show the print panel (unlike PDF export)
    let print_op = unsafe { webview.printOperationWithPrintInfo(&print_info) };
    print_op.setShowsPrintPanel(true);
    print_op.setShowsProgressPanel(true);

    // Attach the print dialog to the app's key window (the focused document window)
    // so the sheet appears on the main window and can be interacted with normally.
    let ns_app = NSApplication::sharedApplication(mtm);
    let parent_window = ns_app.keyWindow().unwrap_or(hidden_window.clone());

    // Run modal — shows native macOS print dialog as a sheet on the main window
    unsafe {
        print_op.runOperationModalForWindow_delegate_didRunSelector_contextInfo(
            &parent_window,
            None,
            None,
            std::ptr::null_mut(),
        );
    }

    // Spin run loop to let the dialog and print operation complete
    for _ in 0..20 {
        run_loop_tick(0.1);
    }

    Ok(())
}

/// Tick the run loop using NSRunLoop.
fn run_loop_tick(seconds: f64) {
    use objc2_foundation::{NSDate, NSRunLoop};

    let date = NSDate::dateWithTimeIntervalSinceNow(seconds);
    let run_loop = NSRunLoop::currentRunLoop();
    run_loop.runUntilDate(&date);
}
