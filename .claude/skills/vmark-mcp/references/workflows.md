# VMark MCP Workflows

Detailed step-by-step patterns for common writing tasks.

---

## Workflow 1: AI Writing Partner

**Scenario:** Writer has a partial thought, wants AI to continue.

### Steps

```
1. READ CONTEXT
   cursor_get_context(linesBefore: 5, linesAfter: 2)

   Returns: { before: "...", after: "...",
              currentBlock: {...}, position: 1234 }

2. UNDERSTAND DOCUMENT STRUCTURE (if needed)
   get_document_digest

   Returns: { title, wordCount, outline: [...],
              blockCounts: {paragraph: 12, ...} }

3. GENERATE CONTINUATION
   (AI reasoning based on context)
   - Match tone and style of existing text
   - Consider document structure from digest
   - Generate appropriate continuation

4. INSERT AS SUGGESTION
   document_insert_at_cursor(
     text: "...generated content..."
   )

5. COMMUNICATE TO WRITER
   "I've suggested a continuation that [brief desc].
    Press Tab to accept or Escape to reject.
    Want me to try a different approach?"
```

### Variations

**Continue with specific direction:**
- Writer says "continue, but make it more technical"
- AI adjusts tone in generated content

**Continue at specific location:**
- Use `cursor_set_position` first if cursor isn't at right place
- Or use `batch_edit` with insert operation targeting specific nodeId

---

## Workflow 2: Improve a Section

**Scenario:** Writer wants a specific section refined.

### Steps

```
1. GET DOCUMENT STRUCTURE
   get_document_digest

   Look at outline to confirm section exists

2. READ THE SECTION
   get_section(heading: "Introduction")

   Returns: { heading: {...}, content: [...],
              markdown: "...", wordCount: 234 }

3. GET REVISION
   get_document_revision

   Returns: { revision: "rev_a7b3c9" }

4. ANALYZE AND IMPROVE
   (AI reasoning)
   - Identify issues: wordiness, unclear points, etc.
   - Draft improved version
   - Preserve writer's voice

5. PROPOSE REPLACEMENT
   update_section(
     baseRevision: "rev_a7b3c9",
     target: { heading: "Introduction" },
     newContent: "...improved markdown...",
     mode: "suggest"
   )

6. EXPLAIN CHANGES
   "I've suggested improvements to the Introduction:
    - Tightened the opening paragraph
    - Clarified the thesis statement
    - Removed redundant phrases

    Review the highlighted suggestion to accept."
```

### Handling Large Sections

For sections with many paragraphs, consider:

1. **Preview first:** `update_section(..., mode: "dryRun")`
2. **Split if needed:** Multiple `batch_edit` calls targeting specific paragraphs
3. **Max 100 operations per batch**

---

## Workflow 3: Reorganize Document

**Scenario:** Writer wants to reorder sections.

### Steps

```
1. GET CURRENT STRUCTURE
   get_document_digest

   outline: [
     { level: 1, text: "Title" },
     { level: 2, text: "Introduction" },
     { level: 2, text: "Methods" },
     { level: 2, text: "Results" },
     { level: 2, text: "Conclusion" }
   ]

2. CONFIRM MOVE WITH WRITER
   "I see the current order is:
    1. Introduction
    2. Methods
    3. Results
    4. Conclusion

    You want to move 'Conclusion' after 'Introduction'?"

3. GET REVISION AND EXECUTE MOVE
   get_document_revision -> "rev_a7b3c9"

   move_section(
     baseRevision: "rev_a7b3c9",
     section: { heading: "Conclusion" },
     after: { heading: "Introduction" }
   )

4. CONFIRM NEW STRUCTURE
   get_document_digest

   "Done. New order:
    1. Introduction
    2. Conclusion
    3. Methods
    4. Results"
```

---

## Workflow 4: Find and Replace

**Scenario:** Writer wants to change a term throughout the document.

### Steps

```
1. GET REVISION
   get_document_revision

   Returns: { revision: "rev_abc123" }

2. PREVIEW MATCHES
   apply_diff(
     baseRevision: "rev_abc123",
     original: "machine learning",
     replacement: "ML",
     matchPolicy: "error_if_multiple",
     mode: "dryRun"
   )

   Returns: { matchCount: 7, matches: [...] }

3. CONFIRM WITH WRITER
   "Found 7 occurrences of 'machine learning'.
    Replace all with 'ML'?"

4. EXECUTE REPLACEMENT
   apply_diff(
     baseRevision: "rev_abc123",
     original: "machine learning",
     replacement: "ML",
     matchPolicy: "all",
     mode: "suggest"
   )

5. REPORT
   "Created 7 suggestions. Review and accept each,
    or use 'accept all' to apply them at once."
```

### Cross-Formatting Fallback

When `apply_diff` or `document_replace` returns 0 matches because text spans
formatting boundaries (e.g. partially **bold** text), fall back to source-level replace:

```
1. document_replace_in_source(
     search: "**old bold** and _old italic_",
     replace: "**new bold** and _new italic_",
     all: true
   )

   Returns: { count: 2, message: "Replaced 2 occurrences in source",
              suggestionIds: [...], applied: false }

2. REPORT
   "Found and replaced 2 occurrences at the markdown source level.
    Review the suggestions to accept."
```

**Important:** The search string must match raw markdown — include `**`, `_`, `[]()` syntax markers.

### Match Policy Options

| Policy | Use When |
|--------|----------|
| `first` | Only want the first occurrence |
| `all` | Replace every match |
| `nth` | Replace specific occurrence (0-indexed) |
| `error_if_multiple` | Need to disambiguate before replacing |

---

## Workflow 5: Convert Notes to Prose

**Scenario:** Writer has bullet points, wants them as paragraphs.

### Steps

```
1. FIND THE BULLET LIST
   list_blocks(query: { type: "bulletList" })

   Returns: [{ id: "node_456", text: "- Point one..." }]

2. GET FULL CONTENT
   get_document_ast(
     filter: { type: "bulletList" },
     projection: ["id", "text", "children"]
   )

3. TRANSFORM TO PROSE
   (AI reasoning)
   - Understand relationships between points
   - Create flowing paragraphs
   - Add transitions

4. REPLACE LIST WITH PARAGRAPHS
   batch_edit(
     baseRevision: "...",
     mode: "suggest",
     operations: [
       { type: "delete", nodeId: "node_456" },
       { type: "insert", after: "node_455",
         content: "...prose paragraphs..." }
     ]
   )
```

---

## Workflow 6: Multi-Document Reference

**Scenario:** Writer needs to reference content from another open document.

### Steps

```
1. LIST AVAILABLE DOCUMENTS
   tabs_list

   Returns: [
     { id: "tab_1", title: "Draft.md", active: true },
     { id: "tab_2", title: "Notes.md", active: false }
   ]

2. REMEMBER CURRENT POSITION
   activeTab = "tab_1"

3. SWITCH TO SOURCE DOCUMENT
   tabs_switch(tabId: "tab_2")

4. READ FROM SOURCE
   get_section(heading: "Key Points")

5. SWITCH BACK
   tabs_switch(tabId: "tab_1")

6. INSERT REFERENCE
   document_insert_at_cursor(
     text: "...content from notes..."
   )
```

---

## Workflow 7: Format Cleanup

**Scenario:** Writer wants consistent formatting applied.

### Steps

```
1. FIND CONTENT TO FORMAT
   list_blocks(query: { contains: "important" })

   Returns: [
     { id: "node_101", text: "This is important..." },
     { id: "node_205", text: "Another important..." }
   ]

2. BATCH APPLY FORMATTING
   batch_edit(
     baseRevision: "...",
     mode: "apply",   // Formatting is immediate
     operations: [
       { type: "format", nodeId: "node_101",
         marks: [{ type: "bold" }] },
       { type: "format", nodeId: "node_205",
         marks: [{ type: "bold" }] }
     ]
   )

3. CONFIRM
   "Applied bold formatting to 2 paragraphs
    containing 'important'."
```

---

## Workflow 8: Handling Conflicts

**Scenario:** Document changed while AI was processing.

### Detection

```
batch_edit(...) returns:
{
  "error": "CONFLICT",
  "message": "Document revision changed from rev_abc to rev_xyz"
}
```

### Recovery Steps

```
1. ACKNOWLEDGE
   "The document changed while I was working.
    Let me re-read and update my suggestion."

2. RE-READ
   get_document_digest  // or get_section if targeted
   get_document_revision -> "rev_xyz"

3. RE-ANALYZE
   (AI re-examines content with fresh state)
   - Check if original target still exists
   - Adjust suggestion if content changed

4. RE-PROPOSE
   batch_edit(
     baseRevision: "rev_xyz",  // New revision
     ...
   )

5. COMMUNICATE
   "Updated my suggestion based on your recent edits."
```

---

## Workflow 9: Creating Tables

**Scenario:** Writer wants to create or modify a table.

### Creating a New Table

```
1. INSERT TABLE
   table_insert(rows: 3, cols: 4)

2. POPULATE WITH CONTENT
   table_modify(
     operations: [
       { type: "updateCell", row: 0, col: 0,
         content: "Header 1" },
       { type: "updateCell", row: 0, col: 1,
         content: "Header 2" },
       // ... more cells
     ]
   )

3. SET HEADER ROW
   table_toggle_header_row
```

### Modifying Existing Table

```
table_modify(
  operations: [
    { type: "addRow", position: "after", rowIndex: 2 },
    { type: "updateCell", row: 3, col: 0, content: "New data" },
    { type: "deleteColumn", colIndex: 4 }
  ]
)
```

---

## Workflow 10: Quick Insert with smart_insert

**Scenario:** Writer wants to add content at a common location.

### Steps

```
1. GET REVISION
   get_document_revision -> "rev_abc123"

2. INSERT AT LOCATION
   smart_insert(
     baseRevision: "rev_abc123",
     destination: "end_of_document",
     content: "## Summary\n\nKey takeaways from this document...",
     mode: "suggest"
   )

   // Or after a specific section:
   smart_insert(
     baseRevision: "rev_abc123",
     destination: { after_section: "Introduction" },
     content: "A transitional paragraph..."
   )

   // Or after a paragraph containing specific text:
   smart_insert(
     baseRevision: "rev_abc123",
     destination: { after_paragraph_containing: "conclusion" },
     content: "Supporting evidence..."
   )
```

---

## Workflow 11: Using AI Genies

**Scenario:** Writer wants to use a pre-defined AI workflow.

### Steps

```
1. DISCOVER AVAILABLE GENIES
   list_genies

   Returns: [
     { name: "Summarize", path: "/path/to/summarize.md",
       source: "global", category: "writing" },
     { name: "Translate to Chinese", path: "/path/to/translate.md",
       source: "workspace", category: "language" }
   ]

2. READ GENIE TEMPLATE (optional)
   read_genie(path: "/path/to/summarize.md")

   Returns: metadata (name, description, scope, category)
            and the template text

3. SELECT CONTENT
   // If genie scope is "selection", ensure text is selected
   // If scope is "document", no selection needed

4. INVOKE GENIE
   invoke_genie(
     geniePath: "/path/to/summarize.md",
     scope: "selection"   // or "block" or "document"
   )

5. REPORT
   "Genie 'Summarize' has been invoked on your selection.
    The AI response will appear as a suggestion."
```

---

## Workflow 12: Reload After External Edit

**Scenario:** Document was edited externally (e.g. by a script or another tool) and the editor needs to pick up the changes.

### Steps

```
1. SAVE FIRST (if needed)
   workspace_save_document

2. (External tool modifies the file on disk)

3. RELOAD FROM DISK
   workspace_reload_document

   Returns: "Reloaded document from: /path/to/file.md"

4. CONFIRM
   "The document has been reloaded from disk."
```

### Handling Dirty Documents

If the document has unsaved changes, `workspace_reload_document` refuses by default:

```
workspace_reload_document
-> Error: "Document has unsaved changes. Save first with
   workspace_save_document, or pass force: true to discard changes."

// Force reload (discards unsaved edits):
workspace_reload_document(force: true)
```

---

## Anti-Patterns to Avoid

### Don't: Edit without reading first

```
BAD:  batch_edit(operations: [...])  // Where does this go?

GOOD: get_document_digest            // Understand structure
      list_blocks(...)               // Find target
      batch_edit(operations: [...])  // Now edit
```

### Don't: Use apply mode for content changes

```
BAD:  batch_edit(mode: "apply", operations: [{type: "update", ...}])

GOOD: batch_edit(mode: "suggest", operations: [{type: "update", ...}])
```

### Don't: Assume suggestions are accepted

```
BAD:  "I've made the changes to your document."

GOOD: "I've suggested changes. Review the highlights to accept or reject."
```

### Don't: Ignore conflicts

```
BAD:  (Conflict error) -> Retry immediately with same content

GOOD: (Conflict error) -> Re-read -> Re-analyze -> Re-propose
```

### Don't: Forget baseRevision

```
BAD:  update_section(target: {heading: "..."}, newContent: "...")

GOOD: get_document_revision -> rev
      update_section(baseRevision: rev, target: {heading: "..."}, newContent: "...")
```
