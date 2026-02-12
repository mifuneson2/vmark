# VMark MCP Tools by Intent

This reference organizes tools by **what you want to accomplish**, not by category.

## Understanding the Document

### "What's in this document?"

| Tool | Returns | Use When |
|------|---------|----------|
| `get_document_digest` | Title, word count, outline, block counts, flags | First call to understand structure |
| `get_document_ast` | Full AST with projections | Need detailed structure |
| `document_get_content` | Raw markdown | Need exact source text |

**Best practice:** Start with `get_document_digest`. Only use AST/content if you need more detail.

### "Find specific content"

| Tool | Capability | Parameters |
|------|------------|------------|
| `list_blocks` | Query by type, level, text content | `query: {type: "paragraph", contains: "keyword"}` |
| `document_search` | Find text with positions | `query: "search term"` |
| `resolve_targets` | Pre-flight check with confidence scores | `query: {...}` |

**Best practice:** Use `list_blocks` to find nodeIds before editing.

### "Read a specific section"

| Tool | Capability |
|------|------------|
| `get_section` | Get heading + content until next equal/higher heading |

```
get_section(heading: "Introduction")
get_section(heading: {level: 2, index: 0})  // First H2
```

### "Read a specific paragraph"

| Tool | Capability |
|------|------------|
| `read_paragraph` | Get paragraph by index or content match |

```
read_paragraph(target: {index: 0})                  // First paragraph
read_paragraph(target: {containing: "key phrase"})   // By content
read_paragraph(target: {index: 2}, includeContext: true)  // With surrounding
```

**Best practice:** Use for flat documents without headings.

---

## Making Content Changes

### "Insert new content"

| Tool | Where | Best For |
|------|-------|----------|
| `document_insert_at_cursor` | At cursor position | Continuing where writer left off |
| `smart_insert` | At common locations | End/start of doc, after section/paragraph |
| `batch_edit` with insert op | After specific node | Precise placement by nodeId |
| `insert_section` | New section with heading | Adding new document section |

**Always use `mode: "suggest"` for content insertion.**

### "Update existing content"

| Tool | Capability | Best For |
|------|------------|----------|
| `batch_edit` with update op | Change node text/attrs | Targeted node updates |
| `update_section` | Replace entire section content | Section rewrites |
| `write_paragraph` | Modify a paragraph | Flat docs without headings |
| `apply_diff` | Find and replace | Pattern-based changes |
| `document_replace_in_source` | Find/replace in raw markdown | Text spanning formatting boundaries |
| `replace_text_anchored` | Context-aware replacement | Drift-tolerant edits |

### "Delete content"

| Tool | Capability |
|------|------------|
| `batch_edit` with delete op | Remove specific nodes |
| `write_paragraph` with `operation: "delete"` | Remove a paragraph |
| `selection_delete` | Delete current selection |

### "Move content"

| Tool | Capability |
|------|------------|
| `move_section` | Reorder sections by heading |
| `batch_edit` with move op | Move specific nodes |

---

## Formatting

### "Apply text formatting"

| Tool | Marks Available |
|------|-----------------|
| `format_toggle` | bold, italic, code, strike, underline, highlight |
| `format_set_link` | Create hyperlink |
| `format_remove_link` | Remove hyperlink |
| `format_clear` | Remove all marks |

```
format_toggle(mark: "bold")      // Toggle on selection
format_set_link(href: "https://...")
```

### "Change block type"

| Tool | Block Types |
|------|-------------|
| `block_set_type` | paragraph, heading (with level), codeBlock, blockquote |
| `block_toggle` | Toggle between types |

```
block_set_type(type: "heading", level: 2)
block_set_type(type: "codeBlock", language: "python")
```

---

## Lists

| Intent | Tool |
|--------|------|
| Convert to list | `list_toggle(type: "bullet")` |
| Change list type | `list_toggle(type: "ordered")` |
| Create task list | `list_toggle(type: "task")` |
| Indent item | `list_indent` |
| Outdent item | `list_outdent` |
| Batch list operations | `list_modify` |

---

## Tables

| Intent | Tool |
|--------|------|
| Insert new table | `table_insert(rows: 3, cols: 3)` |
| Delete table | `table_delete` |
| Add row | `table_add_row(position: "after")` |
| Delete row | `table_delete_row` |
| Add column | `table_add_column(position: "after")` |
| Delete column | `table_delete_column` |
| Toggle header | `table_toggle_header_row` |
| Batch operations | `table_modify(operations: [...])` |

**Best practice:** Use `table_modify` for multiple operations (atomic).

---

## Special Content

| Intent | Tool |
|--------|------|
| Inline math | `insert_math_inline(latex: "E = mc^2")` |
| Block math | `insert_math_block(latex: "\\int_0^\\infty...")` |
| Mermaid diagram | `insert_mermaid(code: "flowchart TD...")` |
| Markmap mindmap | `insert_markmap(code: "# Root\n## Branch...")` |
| SVG graphic | `insert_svg(code: "<svg>...</svg>")` |
| Wiki link | `insert_wiki_link(target: "Other Page")` |
| Wiki link with label | `insert_wiki_link(target: "Page", displayText: "see also")` |
| Horizontal rule | `block_insert_horizontal_rule` |

---

## CJK (Chinese/Japanese/Korean)

| Intent | Tool |
|--------|------|
| Convert punctuation | `cjk_punctuation_convert(direction: "to-fullwidth")` |
| Fix CJK-Latin spacing | `cjk_spacing_fix(action: "add")` |
| Remove CJK-Latin spacing | `cjk_spacing_fix(action: "remove")` |

---

## Cursor and Selection

### "Where is the cursor?"

| Tool | Returns |
|------|---------|
| `cursor_get_context` | Surrounding lines, current line, current paragraph |
| `selection_get` | Selection range, selected text, isEmpty |

### "Move cursor/selection"

| Tool | Capability |
|------|------------|
| `cursor_set_position(position)` | Move cursor to character offset |
| `selection_set(from, to)` | Set selection range |

### "Work with selection"

| Tool | Capability |
|------|------------|
| `selection_replace(text)` | Replace selection with new text |
| `selection_delete` | Delete selection |

---

## Suggestions (Pending Edits)

| Intent | Tool |
|--------|------|
| List pending suggestions | `suggestion_list` |
| Accept one | `suggestion_accept(suggestionId)` |
| Reject one | `suggestion_reject(suggestionId)` |
| Accept all | `suggestion_accept_all` |
| Reject all | `suggestion_reject_all` |

**Note:** When using `mode: "suggest"`, the mutation tool returns a `suggestionId`.

---

## Editor State

| Intent | Tool |
|--------|------|
| Undo | `editor_undo` |
| Redo | `editor_redo` |
| Focus editor | `editor_focus` |

---

## AI Genies

| Intent | Tool |
|--------|------|
| Discover genies | `list_genies` |
| Read genie template | `read_genie(path: "...")` |
| Run genie | `invoke_genie(geniePath: "...", scope: "selection")` |

Scopes: `selection`, `block`, `document`.

---

## Multi-Window / Multi-Tab

### Window Operations

| Intent | Tool |
|--------|------|
| List all windows | `workspace_list_windows` |
| Get focused window | `workspace_get_focused` |
| Focus a window | `workspace_focus_window(label)` |
| Close a window | `workspace_close_window(label)` |
| Get workspace info | `workspace_get_info` |

### Document Operations

| Intent | Tool |
|--------|------|
| New document | `workspace_new_document` |
| Open document | `workspace_open_document(filePath)` |
| Save document | `workspace_save_document` |
| Save as | `workspace_save_document_as(filePath)` |
| Get document info | `workspace_get_document_info` |
| Reload from disk | `workspace_reload_document` |
| Recent files | `workspace_list_recent_files` |

### Tab Operations

| Intent | Tool |
|--------|------|
| List tabs | `tabs_list` |
| Get active tab | `tabs_get_active` |
| Switch tab | `tabs_switch(tabId)` |
| Close tab | `tabs_close(tabId)` |
| Create tab | `tabs_create` |
| Get tab info | `tabs_get_info(tabId)` |
| Reopen closed | `tabs_reopen_closed` |

---

## Protocol / Meta

| Intent | Tool |
|--------|------|
| Check capabilities | `get_capabilities` |
| Get current revision | `get_document_revision` |

---

## Operation Modes

Most mutation tools support three modes:

| Mode | Behavior |
|------|----------|
| `apply` | Execute immediately (default for formatting) |
| `suggest` | Create suggestion for user approval (default for content) |
| `dryRun` | Preview without making changes |

**Rule of thumb:**
- Content changes -> `suggest`
- Formatting/structure -> `apply` (instant feedback expected)
- Uncertain about targets -> `dryRun` first
