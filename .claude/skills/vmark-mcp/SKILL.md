---
name: vmark-mcp
description: AI writing assistant for VMark editor. Use when helping users write, edit, reorganize, or format markdown documents through the VMark MCP tools.
---

# VMark MCP Writing Assistant

## When to Use This Skill

Use this skill when the user wants AI help with:
- Writing or expanding content in VMark
- Editing, refining, or improving existing text
- Reorganizing document structure (moving sections, reordering)
- Formatting (headings, lists, tables, emphasis)
- Multi-document workflows (working across tabs/windows)
- Running AI genies against document content

## Core Principles

### 1. Read Before Write

**Always** understand the document before making changes:

```
get_document_digest  ->  understand structure
get_section          ->  read specific content
THEN propose changes
```

Never edit blind. The digest gives you: title, word count, outline, block counts.

### 2. Suggest, Don't Force

Use `mode: "suggest"` for content changes. Let the writer decide:

```
batch_edit(
  mode: "suggest",      <- Writer reviews before applying
  operations: [...]
)
```

The writer sees highlighted suggestions and accepts/rejects them.

### 3. Respect Revision History

Every mutation needs `baseRevision` for conflict detection:

```
1. get_document_revision -> "rev_abc123"
2. batch_edit(baseRevision: "rev_abc123", ...)
   -> If doc changed: CONFLICT (re-read and retry)
   -> If unchanged: SUCCESS
```

### 4. Work with Structure, Not Positions

Target nodes by ID, not character offsets:

```
batch_edit(operations: [{nodeId: "node_123", ...}])
NOT: "Replace characters 450-500"
```

Use `list_blocks` or `get_document_ast` to find node IDs.

## Quick Reference: Intent -> Tool

| You Want To... | Use This Tool | Key Params |
|----------------|---------------|------------|
| Understand the document | `get_document_digest` | - |
| Find specific content | `list_blocks` with query | `query`, `limit` |
| Read a section | `get_section` | `heading` |
| Read a paragraph | `read_paragraph` | `target: {index}` or `{containing}` |
| Insert/update/delete content | `batch_edit` | `baseRevision`, `mode`, `operations` |
| Find and replace | `apply_diff` | `baseRevision`, `original`, `replacement`, `matchPolicy` |
| Find and replace (source-level) | `document_replace_in_source` | `search`, `replace`, `all` |
| Replace with context anchors | `replace_text_anchored` | `baseRevision`, `anchor`, `replacement` |
| Update section content | `update_section` | `baseRevision`, `target: {heading}`, `newContent` |
| Insert new section | `insert_section` | `baseRevision`, `heading: {level, text}` |
| Move a section | `move_section` | `baseRevision`, `section: {heading}`, `after` |
| Write/modify paragraph | `write_paragraph` | `baseRevision`, `target`, `operation` |
| Insert at common location | `smart_insert` | `baseRevision`, `destination`, `content` |
| Toggle formatting | `format_toggle` | `mark` |
| Change block type | `block_set_type` | `type`, `level`, `language` |
| Work with lists | `list_toggle`, `list_modify` | `type` (bullet/ordered/task) |
| Work with tables | `table_modify` | `target`, `operations` |
| Insert math | `insert_math_inline` / `insert_math_block` | `latex` |
| Insert diagram | `insert_mermaid` | `code` |
| Insert mindmap | `insert_markmap` | `code` |
| Insert SVG | `insert_svg` | `code` |
| Insert wiki link | `insert_wiki_link` | `target`, `displayText` |
| Reload document from disk | `workspace_reload_document` | `force` |
| Check pending suggestions | `suggestion_list` | - |
| Preview changes | Any mutation tool | `mode: "dryRun"` |
| Discover AI genies | `list_genies` | - |
| Run a genie | `invoke_genie` | `geniePath`, `scope` |

## The Fundamental Workflow

Every AI writing task follows this cycle:

```
1. READ         get_document_digest / get_section
                Understand what exists

2. LOCATE       list_blocks / resolve_targets
                Find the nodes you'll modify

3. PLAN         (AI reasoning)
                Decide what changes to make

4. PREVIEW      batch_edit with mode: "dryRun"
                (Optional) Verify targets are correct

5. SUGGEST      batch_edit with mode: "suggest"
                Propose changes for writer approval

6. WAIT         Writer accepts/rejects suggestions
                Don't assume acceptance
```

## Common Workflows

### Expand/Continue Writing

```
1. cursor_get_context     -> Get text around cursor
2. (AI generates continuation)
3. document_insert_at_cursor(text: "...")
4. Tell writer: "I've suggested a continuation. Press Tab to accept or Escape to reject."
```

### Improve a Section

```
1. get_document_digest         -> Find section heading
2. get_section(heading: "Introduction")  -> Read full content
3. get_document_revision       -> Get baseRevision
4. (AI analyzes and improves)
5. update_section(
     baseRevision: "rev_...",
     target: { heading: "Introduction" },
     newContent: "...",
     mode: "suggest"
   )
6. Tell writer what you changed and why
```

### Reorganize Document

```
1. get_document_digest   -> See outline
2. get_document_revision -> Get baseRevision
3. move_section(
     baseRevision: "rev_...",
     section: { heading: "Conclusion" },
     after: { heading: "Introduction" }
   )
4. Confirm new structure to writer
```

### Find and Replace

```
1. apply_diff(
     baseRevision: "rev_...",
     original: "old phrase",
     replacement: "new phrase",
     matchPolicy: "all",
     mode: "suggest"
   )
2. Report: "Found X occurrences. Review suggestions to accept."
```

**Cross-formatting fallback:** If `apply_diff` or `document_replace` returns 0 matches because the text spans formatting boundaries (bold, italic, links), use `document_replace_in_source` instead — it operates on raw markdown:

```
1. document_replace_in_source(
     search: "**bold** and _italic_",
     replace: "**new bold** and _new italic_",
     all: true
   )
2. Report result (supports suggestion flow).
```

### Format Content

```
1. list_blocks(query: {contains: "important term"})
2. batch_edit(operations: [
     {type: "format", nodeId: "...", marks: [{type: "bold"}]}
   ])
```

### Quick Insert at Location

```
1. get_document_revision -> Get baseRevision
2. smart_insert(
     baseRevision: "rev_...",
     destination: { after_section: "Introduction" },
     content: "New paragraph text...",
     mode: "suggest"
   )
```

### Use AI Genies

```
1. list_genies                -> Discover available genies
2. read_genie(path: "...")    -> Read genie template
3. invoke_genie(
     geniePath: "...",
     scope: "selection"       -> selection, block, or document
   )
```

## What This Skill Cannot Do

Be honest about limitations:

| Request | Reality |
|---------|---------|
| "Type along with me" | No real-time streaming. AI responds to requests. |
| "Show me 3 alternatives" | One suggestion at a time. Iterate if needed. |
| "Watch for errors as I type" | No document events. Must be asked to check. |
| "Track all my changes" | Suggestions are accept/reject, not diff view. |

## Handling Conflicts

If `batch_edit` returns a conflict error:

```
1. Re-read: get_document_digest or get_section
2. Re-analyze: the content may have changed
3. Re-propose: new batch_edit with fresh baseRevision
4. Tell writer: "The document changed. Here's my updated suggestion."
```

## Multi-Document Workflows

When working across files:

```
1. workspace_list_windows  -> See all open windows
2. tabs_list(windowId)     -> See tabs in a window
3. tabs_switch(tabId)      -> Switch to target document
4. (Perform operations)
5. tabs_switch back if needed
```

Always specify `windowId` when not working in the focused window.

## References

- `references/tools-by-intent.md` -- Complete tool mapping by writer intent
- `references/workflows.md` -- Detailed step-by-step patterns
- `references/examples.md` -- Real tool call examples with parameters
