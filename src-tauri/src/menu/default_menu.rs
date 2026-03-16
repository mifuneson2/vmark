//! Default menu builder (hardcoded accelerators).
//!
//! Purpose: Creates the initial application menu with default keyboard shortcuts.
//! Called once at app startup from `lib.rs`.
//!
//! @coordinates-with `custom_menu.rs` (must mirror structure changes)

use tauri::menu::{IsMenuItem, Menu, MenuItem, PredefinedMenuItem, Submenu};

use super::{RECENT_FILES_SUBMENU_ID, RECENT_WORKSPACES_SUBMENU_ID};

// ============================================================================
// Menu Structure (8 menus on macOS, 7 on Windows/Linux):
//
// macOS:        VMark | File | Edit | Format | Insert | View | Window | Help
// Windows/Linux:        File | Edit | Format | Insert | View | Window | Help
//
// Key changes from previous structure:
// - Block menu merged into Format
// - Tools menu removed (CJK/Cleanup -> Format)
// - Window menu added
// - About in App menu (macOS) or Help menu (others); updates are automatic
// ============================================================================

/// Build the default application menu with standard keyboard accelerators.
pub fn create_menu(app: &tauri::AppHandle) -> tauri::Result<Menu<tauri::Wry>> {
    // ========================================================================
    // App menu (macOS only)
    // ========================================================================
    #[cfg(target_os = "macos")]
    let app_menu = Submenu::with_id_and_items(
        app,
        "app-menu",
        "VMark",
        true,
        &[
            &MenuItem::with_id(app, "about", "About VMark", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "preferences", "Settings...", true, Some("CmdOrCtrl+,"))?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::services(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::hide(app, None)?,
            &PredefinedMenuItem::hide_others(app, None)?,
            &PredefinedMenuItem::show_all(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "save-all-quit", "Save All and Quit", true, Some("Alt+Shift+CmdOrCtrl+Q"))?,
            &MenuItem::with_id(app, "quit", "Quit VMark", true, Some("CmdOrCtrl+Q"))?,
        ],
    )?;

    // ========================================================================
    // File menu
    // ========================================================================
    let recent_submenu = Submenu::with_id_and_items(
        app,
        RECENT_FILES_SUBMENU_ID,
        "Open Recent",
        true,
        &[
            &MenuItem::with_id(app, "no-recent", "No Recent Files", false, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "clear-recent", "Clear Recent Files", true, None::<&str>)?,
        ],
    )?;

    let recent_workspaces_submenu = Submenu::with_id_and_items(
        app,
        RECENT_WORKSPACES_SUBMENU_ID,
        "Open Recent Workspace",
        true,
        &[
            &MenuItem::with_id(app, "no-recent-workspace", "No Recent Workspaces", false, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "clear-recent-workspaces", "Clear Recent Workspaces", true, None::<&str>)?,
        ],
    )?;

    let export_submenu = Submenu::with_id_and_items(
        app,
        "export-submenu",
        "Export",
        true,
        &[
            &MenuItem::with_id(app, "export-html", "HTML...", true, None::<&str>)?,
            &MenuItem::with_id(app, "export-pdf-native", "PDF...", true, None::<&str>)?,
            &{
                let mut items: Vec<Box<dyn IsMenuItem<tauri::Wry>>> = vec![
                    Box::new(MenuItem::with_id(app, "export-pandoc-docx", "Word (.docx)...", true, None::<&str>)?),
                    Box::new(MenuItem::with_id(app, "export-pandoc-epub", "EPUB (.epub)...", true, None::<&str>)?),
                    Box::new(MenuItem::with_id(app, "export-pandoc-latex", "LaTeX (.tex)...", true, None::<&str>)?),
                    Box::new(MenuItem::with_id(app, "export-pandoc-odt", "OpenDocument (.odt)...", true, None::<&str>)?),
                    Box::new(MenuItem::with_id(app, "export-pandoc-rtf", "Rich Text (.rtf)...", true, None::<&str>)?),
                    Box::new(MenuItem::with_id(app, "export-pandoc-txt", "Plain Text (.txt)...", true, None::<&str>)?),
                ];
                if crate::pandoc::commands::resolve_pandoc_path().is_none() {
                    items.push(Box::new(PredefinedMenuItem::separator(app)?));
                    items.push(Box::new(MenuItem::with_id(app, "export-pandoc-hint", "Requires Pandoc — pandoc.org", true, None::<&str>)?));
                }
                let refs: Vec<&dyn IsMenuItem<tauri::Wry>> = items.iter().map(|i| &**i).collect();
                Submenu::with_id_and_items(app, "other-formats-submenu", "Other Formats", true, &refs)?
            },
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "copy-html", "Copy as HTML", true, Some("CmdOrCtrl+Shift+C"))?,
        ],
    )?;

    let history_submenu = Submenu::with_id_and_items(
        app,
        "doc-history-submenu",
        "Document History",
        true,
        &[
            &MenuItem::with_id(app, "clear-workspace-history", "Clear Workspace History...", true, None::<&str>)?,
            &MenuItem::with_id(app, "clear-history", "Clear All History...", true, None::<&str>)?,
        ],
    )?;

    #[cfg(target_os = "macos")]
    let file_menu = Submenu::with_id_and_items(
        app,
        "file-menu",
        "File",
        true,
        &[
            &MenuItem::with_id(app, "new", "New", true, Some("CmdOrCtrl+N"))?,
            &MenuItem::with_id(app, "new-window", "New Window", true, Some("CmdOrCtrl+Shift+N"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "quick-open", "Quick Open", true, Some("CmdOrCtrl+O"))?,
            &MenuItem::with_id(app, "open", "Open File...", true, None::<&str>)?,
            &MenuItem::with_id(app, "open-folder", "Open Workspace...", true, Some("CmdOrCtrl+Shift+O"))?,
            &recent_submenu,
            &recent_workspaces_submenu,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "close", "Close", true, Some("CmdOrCtrl+W"))?,
            &MenuItem::with_id(app, "close-workspace", "Close Workspace", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "save", "Save", true, Some("CmdOrCtrl+S"))?,
            &MenuItem::with_id(app, "save-as", "Save As...", true, Some("CmdOrCtrl+Shift+S"))?,
            &MenuItem::with_id(app, "move-to", "Move to...", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &export_submenu,
            &MenuItem::with_id(app, "export-pdf", "Print...", true, Some("CmdOrCtrl+P"))?,
            &PredefinedMenuItem::separator(app)?,
            &history_submenu,
        ],
    )?;

    #[cfg(not(target_os = "macos"))]
    let file_menu = Submenu::with_id_and_items(
        app,
        "file-menu",
        "File",
        true,
        &[
            &MenuItem::with_id(app, "new", "New", true, Some("CmdOrCtrl+N"))?,
            &MenuItem::with_id(app, "new-window", "New Window", true, Some("CmdOrCtrl+Shift+N"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "quick-open", "Quick Open", true, Some("CmdOrCtrl+O"))?,
            &MenuItem::with_id(app, "open", "Open File...", true, None::<&str>)?,
            &MenuItem::with_id(app, "open-folder", "Open Workspace...", true, Some("CmdOrCtrl+Shift+O"))?,
            &recent_submenu,
            &recent_workspaces_submenu,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "close", "Close", true, Some("CmdOrCtrl+W"))?,
            &MenuItem::with_id(app, "close-workspace", "Close Workspace", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "save", "Save", true, Some("CmdOrCtrl+S"))?,
            &MenuItem::with_id(app, "save-as", "Save As...", true, Some("CmdOrCtrl+Shift+S"))?,
            &MenuItem::with_id(app, "move-to", "Move to...", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &export_submenu,
            &MenuItem::with_id(app, "export-pdf", "Print...", true, Some("CmdOrCtrl+P"))?,
            &PredefinedMenuItem::separator(app)?,
            &history_submenu,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "preferences", "Settings...", true, Some("CmdOrCtrl+,"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "save-all-quit", "Save All and Exit", true, Some("Alt+Shift+CmdOrCtrl+Q"))?,
            &MenuItem::with_id(app, "quit", "Exit", true, Some("CmdOrCtrl+Q"))?,
        ],
    )?;

    // ========================================================================
    // Edit menu
    // ========================================================================
    let find_submenu = Submenu::with_id_and_items(
        app,
        "find-submenu",
        "Find",
        true,
        &[
            &MenuItem::with_id(app, "find-replace", "Find and Replace...", true, Some("CmdOrCtrl+F"))?,
            &MenuItem::with_id(app, "find-next", "Find Next", true, Some("CmdOrCtrl+G"))?,
            &MenuItem::with_id(app, "find-prev", "Find Previous", true, Some("CmdOrCtrl+Shift+G"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "use-selection-find", "Use Selection for Find", true, Some("CmdOrCtrl+E"))?,
        ],
    )?;

    let selection_submenu = Submenu::with_id_and_items(
        app,
        "selection-submenu",
        "Selection",
        true,
        &[
            &MenuItem::with_id(app, "select-word", "Select Word", true, None::<&str>)?,
            &MenuItem::with_id(app, "select-line", "Select Line", true, Some("CmdOrCtrl+L"))?,
            &MenuItem::with_id(app, "select-block", "Select Block", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "expand-selection", "Expand Selection", true, Some("Ctrl+Shift+Up"))?,
        ],
    )?;

    let lines_submenu = Submenu::with_id_and_items(
        app,
        "lines-submenu",
        "Lines",
        true,
        &[
            &MenuItem::with_id(app, "move-line-up", "Move Line Up", true, Some("Alt+Up"))?,
            &MenuItem::with_id(app, "move-line-down", "Move Line Down", true, Some("Alt+Down"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "duplicate-line", "Duplicate Line", true, Some("Shift+Alt+Down"))?,
            &MenuItem::with_id(app, "delete-line", "Delete Line", true, Some("CmdOrCtrl+Shift+K"))?,
            &MenuItem::with_id(app, "join-lines", "Join Lines", true, Some("CmdOrCtrl+J"))?,
            &MenuItem::with_id(app, "remove-blank-lines", "Remove Blank Lines", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "sort-lines-asc", "Sort Lines Ascending", true, Some("F4"))?,
            &MenuItem::with_id(app, "sort-lines-desc", "Sort Lines Descending", true, Some("Shift+F4"))?,
        ],
    )?;

    let line_endings_submenu = Submenu::with_id_and_items(
        app,
        "line-endings-submenu",
        "Line Endings",
        true,
        &[
            &MenuItem::with_id(app, "line-endings-lf", "Convert to LF", true, None::<&str>)?,
            &MenuItem::with_id(app, "line-endings-crlf", "Convert to CRLF", true, None::<&str>)?,
        ],
    )?;

    let edit_menu = Submenu::with_id_and_items(
        app,
        "edit-menu",
        "Edit",
        true,
        &[
            &MenuItem::with_id(app, "undo", "Undo", true, Some("CmdOrCtrl+Z"))?,
            &MenuItem::with_id(app, "redo", "Redo", true, Some("CmdOrCtrl+Shift+Z"))?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::cut(app, None)?,
            &PredefinedMenuItem::copy(app, None)?,
            &PredefinedMenuItem::paste(app, None)?,
            &PredefinedMenuItem::select_all(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &find_submenu,
            &selection_submenu,
            &lines_submenu,
            &line_endings_submenu,
        ],
    )?;

    // ========================================================================
    // Format menu (merged: Block + Format + Tools)
    // ========================================================================
    let headings_submenu = Submenu::with_id_and_items(
        app,
        "headings-submenu",
        "Headings",
        true,
        &[
            &MenuItem::with_id(app, "heading-1", "Heading 1", true, Some("CmdOrCtrl+1"))?,
            &MenuItem::with_id(app, "heading-2", "Heading 2", true, Some("CmdOrCtrl+2"))?,
            &MenuItem::with_id(app, "heading-3", "Heading 3", true, Some("CmdOrCtrl+3"))?,
            &MenuItem::with_id(app, "heading-4", "Heading 4", true, Some("CmdOrCtrl+4"))?,
            &MenuItem::with_id(app, "heading-5", "Heading 5", true, Some("CmdOrCtrl+5"))?,
            &MenuItem::with_id(app, "heading-6", "Heading 6", true, Some("CmdOrCtrl+6"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "paragraph", "Paragraph", true, Some("CmdOrCtrl+Shift+0"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "increase-heading", "Increase Heading Level", true, Some("Alt+CmdOrCtrl+]"))?,
            &MenuItem::with_id(app, "decrease-heading", "Decrease Heading Level", true, Some("Alt+CmdOrCtrl+["))?,
        ],
    )?;

    let lists_submenu = Submenu::with_id_and_items(
        app,
        "lists-submenu",
        "Lists",
        true,
        &[
            &MenuItem::with_id(app, "ordered-list", "Ordered List", true, Some("Alt+CmdOrCtrl+O"))?,
            &MenuItem::with_id(app, "unordered-list", "Unordered List", true, Some("Alt+CmdOrCtrl+U"))?,
            &MenuItem::with_id(app, "task-list", "Task List", true, Some("Alt+CmdOrCtrl+X"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "indent", "Indent", true, Some("CmdOrCtrl+]"))?,
            &MenuItem::with_id(app, "outdent", "Outdent", true, Some("CmdOrCtrl+["))?,
            &MenuItem::with_id(app, "remove-list", "Remove List", true, None::<&str>)?,
        ],
    )?;

    let blockquote_submenu = Submenu::with_id_and_items(
        app,
        "blockquote-submenu",
        "Blockquote",
        true,
        &[
            &MenuItem::with_id(app, "quote", "Blockquote", true, Some("Alt+CmdOrCtrl+Q"))?,
            &MenuItem::with_id(app, "nest-blockquote", "Nest Blockquote", true, None::<&str>)?,
            &MenuItem::with_id(app, "unnest-blockquote", "Unnest Blockquote", true, None::<&str>)?,
        ],
    )?;

    let transform_submenu = Submenu::with_id_and_items(
        app,
        "transform-submenu",
        "Transform",
        true,
        &[
            &MenuItem::with_id(app, "transform-uppercase", "UPPERCASE", true, Some(if cfg!(target_os = "macos") { "Ctrl+Shift+U" } else { "Alt+Shift+U" }))?,
            &MenuItem::with_id(app, "transform-lowercase", "lowercase", true, Some(if cfg!(target_os = "macos") { "Ctrl+Shift+L" } else { "Alt+Shift+L" }))?,
            &MenuItem::with_id(app, "transform-title-case", "Title Case", true, Some(if cfg!(target_os = "macos") { "Ctrl+Shift+T" } else { "Alt+Shift+T" }))?,
            &MenuItem::with_id(app, "transform-toggle-case", "Toggle Case", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "toggle-quote-style", "Toggle Quote Style", true, Some("CmdOrCtrl+Shift+'"))?,
        ],
    )?;

    let cjk_submenu = Submenu::with_id_and_items(
        app,
        "cjk-submenu",
        "CJK",
        true,
        &[
            &MenuItem::with_id(app, "format-cjk", "Format Selection", true, Some("CmdOrCtrl+Shift+F"))?,
            &MenuItem::with_id(app, "format-cjk-file", "Format Entire File", true, Some("Alt+CmdOrCtrl+Shift+F"))?,
        ],
    )?;

    let cleanup_submenu = Submenu::with_id_and_items(
        app,
        "text-cleanup-submenu",
        "Text Cleanup",
        true,
        &[
            &MenuItem::with_id(app, "remove-trailing-spaces", "Remove Trailing Spaces", true, None::<&str>)?,
            &MenuItem::with_id(app, "collapse-blank-lines", "Collapse Blank Lines", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "cleanup-images", "Clean Up Unused Images...", true, None::<&str>)?,
        ],
    )?;

    let format_menu = Submenu::with_id_and_items(
        app,
        "format-menu",
        "Format",
        true,
        &[
            &headings_submenu,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "bold", "Bold", true, Some("CmdOrCtrl+B"))?,
            &MenuItem::with_id(app, "italic", "Italic", true, Some("CmdOrCtrl+I"))?,
            &MenuItem::with_id(app, "underline", "Underline", true, Some("CmdOrCtrl+U"))?,
            &MenuItem::with_id(app, "strikethrough", "Strikethrough", true, Some("CmdOrCtrl+Shift+X"))?,
            &MenuItem::with_id(app, "code", "Inline Code", true, Some("CmdOrCtrl+Shift+`"))?,
            &MenuItem::with_id(app, "highlight", "Highlight", true, Some("CmdOrCtrl+Shift+M"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "subscript", "Subscript", true, Some("Alt+CmdOrCtrl+="))?,
            &MenuItem::with_id(app, "superscript", "Superscript", true, Some("Alt+CmdOrCtrl+Shift+="))?,
            &PredefinedMenuItem::separator(app)?,
            &lists_submenu,
            &blockquote_submenu,
            &PredefinedMenuItem::separator(app)?,
            &transform_submenu,
            &cjk_submenu,
            &cleanup_submenu,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "clear-format", "Clear Format", true, Some("CmdOrCtrl+\\"))?,
        ],
    )?;

    // ========================================================================
    // Insert menu
    // ========================================================================
    let links_submenu = Submenu::with_id_and_items(
        app,
        "links-submenu",
        "Links",
        true,
        &[
            &MenuItem::with_id(app, "link", "Link", true, Some("CmdOrCtrl+K"))?,
            &MenuItem::with_id(app, "wiki-link", "Wiki Link", true, Some("Alt+CmdOrCtrl+K"))?,
            &MenuItem::with_id(app, "bookmark", "Bookmark", true, Some("Alt+CmdOrCtrl+B"))?,
        ],
    )?;

    let table_submenu = Submenu::with_id_and_items(
        app,
        "table-submenu",
        "Table",
        true,
        &[
            &MenuItem::with_id(app, "insert-table", "Insert Table", true, Some("CmdOrCtrl+Shift+T"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "add-row-before", "Add Row Above", true, None::<&str>)?,
            &MenuItem::with_id(app, "add-row-after", "Add Row Below", true, None::<&str>)?,
            &MenuItem::with_id(app, "add-col-before", "Add Column Before", true, None::<&str>)?,
            &MenuItem::with_id(app, "add-col-after", "Add Column After", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "delete-row", "Delete Row", true, None::<&str>)?,
            &MenuItem::with_id(app, "delete-col", "Delete Column", true, None::<&str>)?,
            &MenuItem::with_id(app, "delete-table", "Delete Table", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "align-left", "Align Left", true, None::<&str>)?,
            &MenuItem::with_id(app, "align-center", "Align Center", true, None::<&str>)?,
            &MenuItem::with_id(app, "align-right", "Align Right", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "align-all-left", "Align All Left", true, None::<&str>)?,
            &MenuItem::with_id(app, "align-all-center", "Align All Center", true, None::<&str>)?,
            &MenuItem::with_id(app, "align-all-right", "Align All Right", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "format-table", "Format Table", true, Some("Alt+CmdOrCtrl+T"))?,
        ],
    )?;

    let info_boxes_submenu = Submenu::with_id_and_items(
        app,
        "info-box-submenu",
        "Info Box",
        true,
        &[
            &MenuItem::with_id(app, "info-note", "Note", true, Some("Alt+CmdOrCtrl+N"))?,
            &MenuItem::with_id(app, "info-tip", "Tip", true, Some("Alt+Shift+CmdOrCtrl+T"))?,
            &MenuItem::with_id(app, "info-important", "Important", true, Some("Alt+Shift+CmdOrCtrl+I"))?,
            &MenuItem::with_id(app, "info-warning", "Warning", true, Some("CmdOrCtrl+Shift+W"))?,
            &MenuItem::with_id(app, "info-caution", "Caution", true, Some("CmdOrCtrl+Shift+U"))?,
        ],
    )?;

    let insert_menu = Submenu::with_id_and_items(
        app,
        "insert-menu",
        "Insert",
        true,
        &[
            &links_submenu,
            &MenuItem::with_id(app, "image", "Image...", true, Some("Shift+CmdOrCtrl+I"))?,
            &MenuItem::with_id(app, "video", "Video...", true, None::<&str>)?,
            &MenuItem::with_id(app, "audio", "Audio...", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &table_submenu,
            &MenuItem::with_id(app, "code-fences", "Code Block", true, Some("Alt+CmdOrCtrl+C"))?,
            &MenuItem::with_id(app, "math-block", "Math Block", true, Some("Alt+CmdOrCtrl+Shift+M"))?,
            &MenuItem::with_id(app, "diagram", "Diagram", true, Some("Alt+Shift+CmdOrCtrl+D"))?,
            &MenuItem::with_id(app, "mindmap", "Mindmap", true, Some("Alt+Shift+CmdOrCtrl+K"))?,
            &MenuItem::with_id(app, "horizontal-line", "Horizontal Line", true, Some("Alt+CmdOrCtrl+-"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "footnote", "Footnote", true, None::<&str>)?,
            &MenuItem::with_id(app, "collapsible-block", "Collapsible Block", true, Some("Alt+CmdOrCtrl+D"))?,
            &info_boxes_submenu,
        ],
    )?;

    // ========================================================================
    // View menu
    // ========================================================================
    let view_menu = Submenu::with_id_and_items(
        app,
        "view-menu",
        "View",
        true,
        &[
            &MenuItem::with_id(app, "source-mode", "Source Code Mode", true, Some("F6"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "focus-mode", "Focus Mode", true, Some("F8"))?,
            &MenuItem::with_id(app, "typewriter-mode", "Typewriter Mode", true, Some("F9"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "zoom-actual", "Actual Size", true, Some("CmdOrCtrl+0"))?,
            &MenuItem::with_id(app, "zoom-in", "Zoom In", true, Some("CmdOrCtrl+="))?,
            &MenuItem::with_id(app, "zoom-out", "Zoom Out", true, Some("CmdOrCtrl+-"))?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "word-wrap", "Toggle Word Wrap", true, Some("Alt+Z"))?,
            &MenuItem::with_id(app, "line-numbers", "Toggle Line Numbers", true, Some("Alt+CmdOrCtrl+L"))?,
            &MenuItem::with_id(app, "diagram-preview", "Toggle Diagram Preview", true, Some("Alt+CmdOrCtrl+P"))?,
            &MenuItem::with_id(app, "fit-tables", "Fit Tables to Width", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "outline", "Toggle Outline", true, Some("Ctrl+Shift+1"))?,
            &MenuItem::with_id(app, "file-explorer", "Toggle File Explorer", true, Some("Ctrl+Shift+2"))?,
            &MenuItem::with_id(app, "view-history", "Toggle History", true, Some("Ctrl+Shift+3"))?,
            &MenuItem::with_id(app, "toggle-terminal", "Toggle Terminal", true, Some("Ctrl+`"))?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::fullscreen(app, None)?,
        ],
    )?;

    // ========================================================================
    // Window menu
    // ========================================================================
    #[cfg(target_os = "macos")]
    let window_menu = Submenu::with_id_and_items(
        app,
        "window-menu",
        "Window",
        true,
        &[
            &PredefinedMenuItem::minimize(app, None)?,
            &PredefinedMenuItem::maximize(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "bring-all-to-front", "Bring All to Front", true, None::<&str>)?,
        ],
    )?;

    #[cfg(not(target_os = "macos"))]
    let window_menu = Submenu::with_id_and_items(
        app,
        "window-menu",
        "Window",
        true,
        &[
            &PredefinedMenuItem::minimize(app, None)?,
            &PredefinedMenuItem::maximize(app, None)?,
        ],
    )?;

    // ========================================================================
    // Help menu
    // ========================================================================
    #[cfg(target_os = "macos")]
    let help_menu = Submenu::with_id_and_items(
        app,
        "help-menu",
        "Help",
        true,
        &[
            &MenuItem::with_id(app, "vmark-help", "VMark Help", true, None::<&str>)?,
            &MenuItem::with_id(app, "keyboard-shortcuts", "Keyboard Shortcuts", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "install-cli", "Shell Command: Install 'vmark' in PATH...", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "report-issue", "Report an Issue...", true, None::<&str>)?,
        ],
    )?;

    #[cfg(not(target_os = "macos"))]
    let help_menu = Submenu::with_id_and_items(
        app,
        "help-menu",
        "Help",
        true,
        &[
            &MenuItem::with_id(app, "vmark-help", "VMark Help", true, None::<&str>)?,
            &MenuItem::with_id(app, "keyboard-shortcuts", "Keyboard Shortcuts", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "report-issue", "Report an Issue...", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &MenuItem::with_id(app, "about", "About VMark", true, None::<&str>)?,
        ],
    )?;

    // ========================================================================
    // Assemble the menu bar
    // ========================================================================
    #[cfg(target_os = "macos")]
    return Menu::with_items(
        app,
        &[
            &app_menu,
            &file_menu,
            &edit_menu,
            &format_menu,
            &insert_menu,
            &view_menu,
            &window_menu,
            &help_menu,
        ],
    );

    #[cfg(not(target_os = "macos"))]
    Menu::with_items(
        app,
        &[
            &file_menu,
            &edit_menu,
            &format_menu,
            &insert_menu,
            &view_menu,
            &window_menu,
            &help_menu,
        ],
    )
}
