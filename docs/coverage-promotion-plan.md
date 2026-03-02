# Test Coverage Promotion Plan — Phase 2

**Branch:** `chore/promoting-test-coverage`
**Baseline:** 80.3% statements, 72.1% branches, 84.5% functions, 81.5% lines
**Target:** 85%+ statements, 77%+ branches, 88%+ functions, 85%+ lines

## Strategy

Prioritize files by **statement count** (more logic = more coverage gain per file) and
**testability** (pure logic > state transforms > DOM-dependent code).

Files are grouped into 6 parallel batches. Each batch targets a thematic area and can be
worked on independently by a subagent.

---

## Batch 1 — Toolbar Actions (highest statement count, pure command logic)

These files implement toolbar commands — function calls that transform editor state.
Most can be tested by mocking the editor/CodeMirror view.

| File | Stmts | Cov% |
|------|-------|------|
| `plugins/toolbarActions/wysiwygAdapterInsert.ts` | 201 | 3.0% |
| `plugins/toolbarActions/sourceAdapter.ts` | 180 | 12.8% |
| `plugins/toolbarActions/wysiwygAdapter.ts` | 162 | 11.1% |
| `plugins/toolbarActions/multiSelectionContext.ts` | 151 | 5.3% |
| `plugins/toolbarActions/sourceImageActions.ts` | 106 | 17.9% |
| `plugins/toolbarActions/tiptapSelectionActions.ts` | 100 | 1.0% |
| `plugins/toolbarActions/sourceMultiSelection.ts` | 51 | 3.9% |
| `plugins/toolbarActions/sourceAdapterHelpers.ts` | 62 | 29.0% |

**Total uncovered statements:** ~1,000
**Test approach:** Mock editor instances, test command outputs

---

## Batch 2 — CodeMirror Plugins (Source mode features)

Source mode plugins with logic worth testing — paste handling, table context menus,
tab behavior.

| File | Stmts | Cov% |
|------|-------|------|
| `plugins/codemirror/smartPaste.ts` | 25 | 0.0% |
| `plugins/codemirror/smartPasteImage.ts` | 168 | 33.9% |
| `plugins/codemirror/sourceTableContextMenu.ts` | 111 | 1.8% |
| `plugins/codemirror/tabEscape.ts` | 62 | 32.3% |
| `plugins/codemirror/sourceMultiCursorPlugin.ts` | 15 | 53.3% |

**Total uncovered statements:** ~280
**Test approach:** Mock CodeMirror EditorView, test state transitions

---

## Batch 3 — Tiptap Plugin Logic (extension files with real logic)

These `tiptap.ts` files contain input rules, paste handlers, keymaps, or transaction
filters — not just wiring.

| File | Stmts | Cov% |
|------|-------|------|
| `plugins/codeBlockLineNumbers/tiptap.ts` | 232 | 1.7% |
| `plugins/aiSuggestion/tiptap.ts` | 195 | 17.9% |
| `plugins/codePreview/tiptap.ts` | 181 | 38.7% |
| `plugins/editorPlugins.tiptap.ts` | 168 | 25.0% |
| `plugins/footnotePopup/tiptap.ts` | 148 | 27.0% |
| `plugins/imageHandler/tiptap.ts` | 120 | 4.2% |
| `plugins/search/tiptap.ts` | 117 | 25.6% |
| `plugins/textDragDrop/tiptap.ts` | 126 | 6.3% |
| `plugins/tabIndent/tiptap.ts` | 83 | 3.6% |

**Total uncovered statements:** ~980
**Test approach:** Mock Tiptap editor, test commands/input rules/paste handlers

---

## Batch 4 — Popup Views & Source Popups

Popup view classes and source mode popup plugins.

| File | Stmts | Cov% |
|------|-------|------|
| `plugins/latex/MathInlineNodeView.ts` | 292 | 49.7% |
| `plugins/linkCreatePopup/LinkCreatePopupView.ts` | 191 | 9.9% |
| `plugins/footnotePopup/FootnotePopupView.ts` | 198 | 68.2% |
| `plugins/imagePreview/ImagePreviewView.ts` | 181 | 66.9% |
| `plugins/sourcePopup/createSourcePopupPlugin.ts` | 117 | 3.4% |
| `plugins/sourceLinkPopup/sourceLinkActions.ts` | 54 | 33.3% |
| `plugins/sourceLinkPopup/sourceLinkPopupPlugin.ts` | 54 | 46.3% |
| `plugins/sourceImagePopup/sourceImageActions.ts` | 66 | 47.0% |
| `plugins/sourceFootnotePopup/sourceFootnoteActions.ts` | 118 | 64.4% |
| `plugins/wikiLinkPopup/tiptap.ts` | 62 | 25.8% |
| `plugins/linkPopup/tiptap.ts` | 104 | 51.0% |

**Total uncovered statements:** ~600
**Test approach:** DOM mocks, test action handlers and state management

---

## Batch 5 — Source Context Detection & Smaller Plugins

Source context detection helpers and smaller plugin files.

| File | Stmts | Cov% |
|------|-------|------|
| `plugins/sourceContextDetection/listDetection.ts` | 143 | 55.2% |
| `plugins/sourceContextDetection/blockquoteDetection.ts` | 74 | 35.1% |
| `plugins/sourceContextDetection/formatMultiSelection.ts` | 66 | 47.0% |
| `plugins/sourceContextDetection/taskListActions.ts` | 25 | 12.0% |
| `plugins/sourceContextDetection/sourceInsertions.ts` | 24 | 66.7% |
| `plugins/codePreview/blockMathKeymap.ts` | 66 | 4.5% |
| `plugins/smartSelectAll/tiptap.ts` | 56 | 19.6% |
| `plugins/markdownCopy/tiptap.ts` | 55 | 21.8% |
| `plugins/markInputRules/tiptap.ts` | 45 | 53.3% |
| `plugins/listContinuation/tiptap.ts` | 41 | 58.5% |
| `plugins/focusMode/tiptap.ts` | 31 | 48.4% |
| `plugins/typewriterMode/tiptap.ts` | 34 | 35.3% |
| `plugins/blockImage/tiptap.ts` | 40 | 17.5% |
| `plugins/blockVideo/tiptap.ts` | 18 | 27.8% |
| `plugins/blockAudio/tiptap.ts` | 16 | 31.3% |
| `plugins/sourcePeekInline/tiptap.ts` | 48 | 31.3% |
| `plugins/footnotePopup/tiptapNodes.ts` | 14 | 42.9% |
| `plugins/editorPlugins/keymapUtils.ts` | 38 | 60.5% |
| `plugins/editorPlugins/lineOperationCommands.ts` | 106 | 61.3% |
| `plugins/imageHandler/imageHandlerUtils.ts` | 45 | 68.9% |

**Total uncovered statements:** ~400
**Test approach:** Mock CodeMirror state for detection, PM state for commands

---

## Batch 6 — Hooks, Components & Utils

Non-plugin files with coverage gaps.

| File | Stmts | Cov% |
|------|-------|------|
| `hooks/mcpBridge/batchOpHandlers.ts` | 104 | 52.8% |
| `hooks/useUnifiedMenuCommands.ts` | 123 | 57.7% |
| `hooks/useSourceOutlineSync.ts` | 86 | 36.0% |
| `hooks/useFileOpen.ts` | 84 | 45.2% |
| `hooks/useTabShortcuts.ts` | 36 | 58.3% |
| `contexts/WindowContext.tsx` | 170 | 50.0% |
| `components/Editor/TiptapEditor.tsx` | 201 | 53.2% |
| `components/Editor/SourceEditor.tsx` | 105 | 64.8% |
| `components/Terminal/createTerminalInstance.ts` | 87 | 63.2% |
| `components/Terminal/useTerminalPosition.ts` | 49 | 40.8% |
| `components/StatusBar/StatusBarRight.tsx` | 21 | 66.7% |
| `utils/sourceEditorExtensions.ts` | 16 | 37.5% |

**Total uncovered statements:** ~500
**Test approach:** renderHook, mock Tauri APIs, test state transitions

---

## Execution Order

1. Run **Batch 1 + 2 + 3** in parallel (3 agents) — highest coverage gain
2. Run **Batch 4 + 5 + 6** in parallel (3 agents) — remaining gaps
3. Run `pnpm test` to verify all pass
4. Ratchet thresholds to new floor
5. Commit

## Success Criteria

- All tests pass (`pnpm test`)
- Coverage thresholds raised (target: statements 85, branches 77, functions 88, lines 85)
- No test files testing only wiring (each test must assert behavior)
