# MCP Tools Reference

This page documents all MCP tools available when Claude (or other AI assistants) connects to VMark.

VMark exposes **10 composite tools**, **2 protocol tools**, and **4 resources**. Composite tools use an `action` parameter to select the operation — this reduces token overhead while keeping all capabilities accessible.

::: tip Recommended Workflow
For most writing tasks, you only need a handful of actions:

**Understand:** `structure` → `get_digest`, `document` → `search`
**Read:** `structure` → `get_section`, `document` → `read_paragraph` / `get_content`
**Write:** `structure` → `update_section` / `insert_section`, `document` → `write_paragraph` / `smart_insert`
**Control:** `editor` → `undo` / `redo`, `suggestions` → `accept` / `reject`
**Files:** `workspace` → `save`, `tabs` → `switch` / `list`

The remaining actions provide fine-grained control for advanced automation scenarios.
:::

::: tip Mermaid Diagrams
When using AI to generate Mermaid diagrams via MCP, consider installing the [mermaid-validator MCP server](/guide/mermaid#mermaid-validator-mcp-server-syntax-checking) — it catches syntax errors using the same Mermaid v11 parsers before diagrams reach your document.
:::

---

## `document`

Read, write, search, and transform document content. 12 actions.

All actions accept an optional `windowId` (string) parameter to target a specific window. Defaults to the focused window.

### `get_content`

Get the full document content as markdown text.

### `set_content`

Replace the entire document content.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `content` | string | Yes | New document content (markdown supported). |

::: warning Empty Documents Only
For safety, this action is only allowed when the target document is **empty**. For non-empty documents, use `insert_at_cursor`, `apply_diff`, or `selection` → `replace` instead — these create suggestions that require user approval.
:::

### `insert_at_cursor`

Insert text at the current cursor position.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | string | Yes | Text to insert (markdown supported). |

**Returns:** `{ message, position, suggestionId?, applied }`

::: tip Suggestion System
By default, this action creates a **suggestion** that requires user approval. The text appears as ghost text preview. Users can accept (Enter) or reject (Escape). If **Auto-approve edits** is enabled in Settings → Integrations, changes are applied immediately.
:::

### `insert_at_position`

Insert text at a specific character position.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | string | Yes | Text to insert (markdown supported). |
| `position` | number | Yes | Character position (0-indexed). |

**Returns:** `{ message, position, suggestionId?, applied }`

### `search`

Search for text in the document.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Text to search for. |
| `caseSensitive` | boolean | No | Case-sensitive search. Default: false. |

**Returns:** Array of matches with positions and line numbers.

### `replace_in_source`

Replace text at the markdown source level, bypassing ProseMirror node boundaries.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | string | Yes | Text to find in the markdown source. |
| `replace` | string | Yes | Replacement text (markdown supported). |
| `all` | boolean | No | Replace all occurrences. Default: false. |

**Returns:** `{ count, message, suggestionIds?, applied }`

::: tip When to use
Use `apply_diff` first — it's faster and more precise. Fall back to `replace_in_source` only when the search text crosses formatting boundaries (bold, italic, links, etc.) and `apply_diff` can't find it.
:::

### `batch_edit`

Apply multiple operations atomically.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `operations` | array | Yes | Array of operations (max 100). |
| `baseRevision` | string | Yes | Expected revision for conflict detection. |
| `requestId` | string | No | Idempotency key. |
| `mode` | string | No | `dryRun` to preview without applying. Apply-vs-suggest is controlled by user setting. |

Each operation requires `type` (`update`, `insert`, `delete`, `format`, or `move`), `nodeId`, and optionally `text`/`content`.

**Returns:** `{ success, changedNodeIds[], suggestionIds[] }`

### `apply_diff`

Find and replace text with match policy control.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `original` | string | Yes | Text to find. |
| `replacement` | string | Yes | Text to replace with. |
| `baseRevision` | string | Yes | Expected revision for conflict detection. |
| `matchPolicy` | string | No | `first`, `all`, `nth`, or `error_if_multiple`. Default: `first`. |
| `nth` | number | No | Which match to replace (0-indexed, for `nth` policy). |
| `scopeQuery` | object | No | Scope filter to narrow search. |
| `mode` | string | No | `dryRun` to preview without applying. Apply-vs-suggest is controlled by user setting. |

**Returns:** `{ matchCount, appliedCount, matches[], suggestionIds[] }`

### `replace_anchored`

Replace text using context anchoring for precise targeting.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `anchor` | object | Yes | `{ text, beforeContext, afterContext }` |
| `replacement` | string | Yes | Replacement text. |
| `baseRevision` | string | Yes | Expected revision for conflict detection. |
| `mode` | string | No | `dryRun` to preview without applying. Apply-vs-suggest is controlled by user setting. |

### `read_paragraph`

Read a paragraph from the document by index or content match.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `target` | object | Yes | `{ index: 0 }` or `{ containing: "text" }` |
| `includeContext` | boolean | No | Include surrounding paragraphs. Default: false. |

**Returns:** `{ index, content, wordCount, charCount, position, context? }`

### `write_paragraph`

Modify a paragraph in the document.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `baseRevision` | string | Yes | Document revision for conflict detection. |
| `target` | object | Yes | `{ index: 0 }` or `{ containing: "text" }` |
| `operation` | string | Yes | `replace`, `append`, `prepend`, or `delete`. |
| `content` | string | Conditional | New content (required except for `delete`). |
| `mode` | string | No | `dryRun` to preview without applying. Apply-vs-suggest is controlled by user setting. |

**Returns:** `{ success, message, suggestionId?, applied, newRevision? }`

### `smart_insert`

Insert content at common document locations.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `baseRevision` | string | Yes | Document revision for conflict detection. |
| `destination` | varies | Yes | Where to insert (see below). |
| `content` | string | Yes | Markdown content to insert. |
| `mode` | string | No | `dryRun` to preview without applying. Apply-vs-suggest is controlled by user setting. |

**Destination options:**
- `"end_of_document"` — Insert at the end
- `"start_of_document"` — Insert at the beginning
- `{ after_paragraph: 2 }` — Insert after paragraph at index 2
- `{ after_paragraph_containing: "conclusion" }` — Insert after paragraph containing text
- `{ after_section: "Introduction" }` — Insert after section heading

**Returns:** `{ success, message, suggestionId?, applied, newRevision?, insertedAt? }`

::: tip When to Use
- **Structured documents** (with headings): Use `structure` → `get_section`, `update_section`, `insert_section`
- **Flat documents** (no headings): Use `document` → `read_paragraph`, `write_paragraph`, `smart_insert`
- **End of document**: Use `document` → `smart_insert` with `"end_of_document"`
:::

---

## `structure`

Document structure queries and section operations. 8 actions.

All actions accept an optional `windowId` parameter.

### `get_ast`

Get the document's abstract syntax tree.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `projection` | string[] | No | Fields to include: `id`, `type`, `text`, `attrs`, `marks`, `children`. |
| `filter` | object | No | Filter by `type`, `level`, `contains`, `hasMarks`. |
| `limit` | number | No | Max results. |
| `offset` | number | No | Skip count. |
| `afterCursor` | string | No | Node ID for cursor pagination. |

**Returns:** Full AST with node types, positions, and content.

### `get_digest`

Get a compact digest of the document structure.

**Returns:** `{ revision, title, wordCount, charCount, outline[], sections[], blockCounts, hasImages, hasTables, hasCodeBlocks, languages[] }`

### `list_blocks`

List all blocks in the document with their node IDs.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | object | No | Filter by `type`, `level`, `contains`, `hasMarks`. |
| `projection` | string[] | No | Fields to include. |
| `limit` | number | No | Max results. |
| `afterCursor` | string | No | Node ID for cursor pagination. |

**Returns:** `{ revision, blocks[], hasMore, nextCursor? }`

Node IDs use prefixes: `h-0` (heading), `p-0` (paragraph), `code-0` (code block), etc.

### `resolve_targets`

Pre-flight check for mutations — find nodes by query.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | object | Yes | Query criteria: `type`, `level`, `contains`, `hasMarks`. |
| `maxResults` | number | No | Max candidates. |

**Returns:** Resolved target positions and types.

### `get_section`

Get content of a document section (heading and its content until next same-or-higher level heading).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `heading` | string \| object | Yes | Heading text (string) or `{ level, index }`. |
| `includeNested` | boolean | No | Include subsections. |

**Returns:** Section content with heading, body, and positions.

### `update_section`

Update a section's content.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `baseRevision` | string | Yes | Document revision. |
| `target` | object | Yes | `{ heading, byIndex, or sectionId }` |
| `newContent` | string | Yes | New section content (markdown). |
| `mode` | string | No | `dryRun` to preview without applying. Apply-vs-suggest is controlled by user setting. |

### `insert_section`

Insert a new section.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `baseRevision` | string | Yes | Document revision. |
| `after` | object | No | Section target to insert after. |
| `sectionHeading` | object | Yes | `{ level, text }` — heading level (1-6) and text. |
| `content` | string | No | Section body content. |
| `mode` | string | No | `dryRun` to preview without applying. Apply-vs-suggest is controlled by user setting. |

### `move_section`

Move a section to a new location.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `baseRevision` | string | Yes | Document revision. |
| `section` | object | Yes | Section to move: `{ heading, byIndex, or sectionId }`. |
| `after` | object | No | Section target to move after. |
| `mode` | string | No | `dryRun` to preview without applying. Apply-vs-suggest is controlled by user setting. |

---

## `selection`

Read and manipulate text selection and cursor. 5 actions.

All actions accept an optional `windowId` parameter.

### `get`

Get the current text selection.

**Returns:** `{ text, range: { from, to }, isEmpty }`

### `set`

Set the selection range.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `from` | number | Yes | Start position (inclusive). |
| `to` | number | Yes | End position (exclusive). |

::: tip
Use the same value for `from` and `to` to position the cursor without selecting text.
:::

### `replace`

Replace selected text with new text.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | string | Yes | Replacement text (markdown supported). |

**Returns:** `{ message, range, originalContent, suggestionId?, applied }`

::: tip Suggestion System
By default, this action creates a **suggestion** that requires user approval. The original text appears with strikethrough, and the new text appears as ghost text. If **Auto-approve edits** is enabled in Settings → Integrations, changes are applied immediately.
:::

### `get_context`

Get text surrounding the cursor for context understanding.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `linesBefore` | number | No | Lines before cursor. Default: 3. |
| `linesAfter` | number | No | Lines after cursor. Default: 3. |

**Returns:** `{ before, after, currentLine, currentParagraph, block }`

The `block` object contains:

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | Block type: `paragraph`, `heading`, `codeBlock`, `blockquote`, etc. |
| `level` | number | Heading level 1-6 (only for headings) |
| `language` | string | Code language (only for code blocks with language set) |
| `inList` | string | List type if inside a list: `bullet`, `ordered`, or `task` |
| `inBlockquote` | boolean | `true` if inside a blockquote |
| `inTable` | boolean | `true` if inside a table |
| `position` | number | Document position where the block starts |

### `set_cursor`

Set the cursor position (clears selection).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `position` | number | Yes | Character position (0-indexed). |

---

## `format`

Text formatting, block types, lists, and list batch operations. 10 actions.

All actions accept an optional `windowId` parameter.

### `toggle`

Toggle a formatting mark on the current selection.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `mark` | string | Yes | `bold`, `italic`, `code`, `strike`, `underline`, or `highlight` |

### `set_link`

Create a hyperlink on the selected text.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `href` | string | Yes | Link URL. |
| `title` | string | No | Link title (tooltip). |

### `remove_link`

Remove hyperlink from the selection. No additional parameters.

### `clear`

Remove all formatting from the selection. No additional parameters.

### `set_block_type`

Convert the current block to a specific type.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `blockType` | string | Yes | `paragraph`, `heading`, `codeBlock`, or `blockquote` |
| `level` | number | Conditional | Heading level 1-6 (required for `heading`). |
| `language` | string | No | Code language (for `codeBlock`). |

### `insert_hr`

Insert a horizontal rule (`---`) at the cursor. No additional parameters.

### `toggle_list`

Toggle list type on the current block.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `listType` | string | Yes | `bullet`, `ordered`, or `task` |

### `indent_list`

Increase indentation of the current list item. No additional parameters.

### `outdent_list`

Decrease indentation of the current list item. No additional parameters.

### `list_modify`

Batch modify a list's structure and content.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `baseRevision` | string | Yes | Document revision. |
| `target` | object | Yes | `{ listId }`, `{ selector }`, or `{ listIndex }` |
| `operations` | array | Yes | Array of list operations. |
| `mode` | string | No | `dryRun` to preview without applying. Apply-vs-suggest is controlled by user setting. |

Operations: `add_item`, `delete_item`, `update_item`, `toggle_check`, `reorder`, `set_indent`

---

## `table`

Table operations. 3 actions.

All actions accept an optional `windowId` parameter.

### `insert`

Insert a new table at the cursor.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `rows` | number | Yes | Number of rows (must be at least 1). |
| `cols` | number | Yes | Number of columns (must be at least 1). |
| `withHeaderRow` | boolean | No | Whether to include a header row. Default: true. |

### `delete`

Delete the table at the cursor position. No additional parameters.

### `modify`

Batch modify a table's structure and content.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `baseRevision` | string | Yes | Document revision. |
| `target` | object | Yes | `{ tableId }`, `{ afterHeading }`, or `{ tableIndex }` |
| `operations` | array | Yes | Array of table operations. |
| `mode` | string | No | `dryRun` to preview without applying. Apply-vs-suggest is controlled by user setting. |

Operations: `add_row`, `delete_row`, `add_column`, `delete_column`, `update_cell`, `set_header`

---

## `editor`

Editor state operations. 3 actions.

All actions accept an optional `windowId` parameter.

### `undo`

Undo the last editing action.

### `redo`

Redo the last undone action.

### `focus`

Focus the editor (bring it to front, ready for input).

---

## `workspace`

Manage documents, windows, and workspace state. 12 actions.

Actions that operate on a specific window accept an optional `windowId` parameter.

### `list_windows`

List all open VMark windows.

**Returns:** Array of `{ label, title, filePath, isFocused, isAiExposed }`

### `get_focused`

Get the focused window's label.

### `focus_window`

Focus a specific window.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `windowId` | string | Yes | Window label to focus. |

### `new_document`

Create a new empty document.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | No | Optional document title. |

### `open_document`

Open a document from the filesystem.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | File path to open. |

### `save`

Save the current document.

### `save_as`

Save the document to a new path.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | New file path. |

### `get_document_info`

Get document metadata.

**Returns:** `{ filePath, isDirty, title, wordCount, charCount }`

### `close_window`

Close a window.

### `list_recent_files`

List recently opened files.

**Returns:** Array of `{ path, name, timestamp }` (up to 10 files, most recent first).

### `get_info`

Get information about the current workspace state.

**Returns:** `{ isWorkspaceMode, rootPath, workspaceName }`

### `reload_document`

Reload the active document from disk.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `force` | boolean | No | Force reload even if document has unsaved changes. Default: false. |

Fails if the document is untitled or has unsaved changes without `force: true`.

---

## `tabs`

Manage editor tabs within windows. 6 actions.

All actions accept an optional `windowId` parameter.

### `list`

List all tabs in a window.

**Returns:** Array of `{ id, title, filePath, isDirty, isActive }`

### `switch`

Switch to a specific tab.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tabId` | string | Yes | Tab ID to switch to. |

### `close`

Close a tab.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tabId` | string | No | Tab ID to close. Defaults to active tab. |

### `create`

Create a new empty tab.

**Returns:** `{ tabId }`

### `get_info`

Get detailed tab information.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tabId` | string | No | Tab ID. Defaults to active tab. |

**Returns:** `{ id, title, filePath, isDirty, isActive }`

### `reopen_closed`

Reopen the most recently closed tab.

**Returns:** `{ tabId, filePath, title }` or message if none available.

VMark keeps track of the last 10 closed tabs per window.

---

## `media`

Insert math, diagrams, media, wiki links, and CJK formatting. 11 actions.

All actions accept an optional `windowId` parameter.

### `math_inline`

Insert inline LaTeX math.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `latex` | string | Yes | LaTeX expression (e.g., `E = mc^2`). |

### `math_block`

Insert a block-level math equation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `latex` | string | Yes | LaTeX expression. |

### `mermaid`

Insert a Mermaid diagram.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | string | Yes | Mermaid diagram code. |

### `markmap`

Insert a Markmap mindmap. Uses standard Markdown headings to define the tree.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | string | Yes | Markdown with headings defining the mindmap tree. |

### `svg`

Insert an SVG graphic. The SVG renders inline with pan, zoom, and PNG export.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | string | Yes | SVG markup (valid XML with `<svg>` root). |

### `wiki_link`

Insert a wiki-style link.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `target` | string | Yes | Link target (page name). |
| `displayText` | string | No | Display text (if different from target). |

**Result:** `[[target]]` or `[[target|displayText]]`

### `video`

Insert an HTML5 video element.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `src` | string | Yes | Video file path or URL. |
| `baseRevision` | string | Yes | Document revision. |
| `title` | string | No | Title attribute. |
| `poster` | string | No | Poster image path or URL. |

### `audio`

Insert an HTML5 audio element.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `src` | string | Yes | Audio file path or URL. |
| `baseRevision` | string | Yes | Document revision. |
| `title` | string | No | Title attribute. |

### `video_embed`

Insert a video embed (iframe). Supports YouTube (privacy-enhanced), Vimeo, and Bilibili.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `videoId` | string | Yes | Video ID (YouTube: 11-char, Vimeo: numeric, Bilibili: BV ID). |
| `baseRevision` | string | Yes | Document revision. |
| `provider` | string | No | `youtube` (default), `vimeo`, or `bilibili`. |

### `cjk_punctuation`

Convert punctuation between half-width and full-width.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `direction` | string | Yes | `to-fullwidth` or `to-halfwidth`. |

### `cjk_spacing`

Add or remove spacing between CJK and Latin characters.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `spacingAction` | string | Yes | `add` or `remove`. |

---

## `suggestions`

Manage AI-generated edit suggestions pending user approval. 5 actions.

When AI uses `document` → `insert_at_cursor` / `insert_at_position` / `replace_in_source`, `selection` → `replace`, or `document` → `apply_diff` / `batch_edit`, the changes are staged as suggestions that require user approval.

All actions accept an optional `windowId` parameter.

::: info Undo/Redo Safety
Suggestions don't modify the document until accepted. This preserves full undo/redo functionality — users can undo after accepting, and rejecting leaves no trace in history.
:::

::: tip Auto-Approve Mode
If **Auto-approve edits** is enabled in Settings → Integrations, changes apply directly without creating suggestions. The actions below are only needed when auto-approve is disabled (the default).
:::

### `list`

List all pending suggestions.

**Returns:** `{ suggestions: [...], count, focusedId }`

Each suggestion includes `id`, `type` (`insert`, `replace`, `delete`), `from`, `to`, `newContent`, `originalContent`, and `createdAt`.

### `accept`

Accept a specific suggestion, applying its changes to the document.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `suggestionId` | string | Yes | ID of the suggestion to accept. |

### `reject`

Reject a specific suggestion, discarding it without changes.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `suggestionId` | string | Yes | ID of the suggestion to reject. |

### `accept_all`

Accept all pending suggestions in document order.

### `reject_all`

Reject all pending suggestions.

---

## Protocol Tools

Two standalone tools for querying server capabilities and document state. These do not use the composite `action` pattern.

### `get_capabilities`

Get the MCP server's capabilities and available tools.

**Returns:** `{ version, supportedNodeTypes[], supportedQueryOperators[], limits, features }`

### `get_document_revision`

Get the current document revision for optimistic locking.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `windowId` | string | No | Window identifier. |

**Returns:** `{ revision, lastUpdated }`

Use the revision in mutation actions to detect concurrent edits.

---

## MCP Resources

In addition to tools, VMark exposes these read-only resources:

| Resource URI | Description |
|--------------|-------------|
| `vmark://document/outline` | Document heading hierarchy |
| `vmark://document/metadata` | Document metadata (path, word count, etc.) |
| `vmark://windows/list` | List of open windows |
| `vmark://windows/focused` | Currently focused window label |
