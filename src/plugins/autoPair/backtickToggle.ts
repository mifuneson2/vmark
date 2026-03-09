/**
 * Backtick Code Mark Toggle
 *
 * Purpose: Handles backtick (`) input as a code mark toggle in WYSIWYG mode.
 * - Outside code: activate code mark (or wrap selection)
 * - Inside code: escape to end of code mark
 *
 * Split from handlers.ts to keep files under ~300 lines.
 *
 * @coordinates-with handlers.ts — called from handleTextInput for backtick input
 * @module plugins/autoPair/backtickToggle
 */

import type { EditorView } from "@tiptap/pm/view";
import type { EditorState } from "@tiptap/pm/state";
import { TextSelection } from "@tiptap/pm/state";
import { isInCodeBlock } from "./utils";

/**
 * Handle backtick as code mark toggle in WYSIWYG mode.
 * - Outside code: activate code mark (or wrap selection)
 * - Inside code: escape to end of code mark
 * Returns true if handled.
 */
export function handleBacktickCodeToggle(
  view: EditorView,
  from: number,
  to: number
): boolean {
  const { state, dispatch } = view;

  // Don't handle if preceded by backslash (escaped)
  /* v8 ignore next -- @preserve reason: from is always >= 1 in ProseMirror (cursor is inside the doc node); the else branch (from === 0) is unreachable during normal editing */
  if (from > 0) {
    const $pos = state.doc.resolve(from);
    const textBefore = $pos.parent.textBetween(
      Math.max(0, $pos.parentOffset - 1),
      $pos.parentOffset,
      ""
    );
    if (textBefore === "\\") return false;
  }

  // Don't handle in code blocks
  if (isInCodeBlock(state)) return false;

  const codeMarkType = state.schema.marks.code;
  if (!codeMarkType) return false;

  // Check if cursor is in inline code
  const $from = state.doc.resolve(from);
  const inCode = $from.marks().some((m) => m.type === codeMarkType);

  if (inCode) {
    // Escape: move cursor to end of code mark
    const endPos = findCodeMarkEnd(state, from, codeMarkType);
    // findCodeMarkEnd always returns non-null when inCode is true — use non-null assertion
    // (the null guard above exists as a type-safety guarantee only)
    /* v8 ignore next -- @preserve reason: endPos is always non-null when inCode is true; the ?? from fallback is structurally unreachable */
    const pos = endPos ?? from; // fallback to from keeps selection stable if null (unreachable)
    const tr = state.tr.setSelection(TextSelection.create(state.doc, pos));
    tr.removeStoredMark(codeMarkType);
    dispatch(tr);
    return true;
  }

  // Outside code: toggle code mark
  if (from !== to) {
    // Selection: wrap with code mark
    const tr = state.tr.addMark(from, to, codeMarkType.create());
    dispatch(tr);
    return true;
  }

  // No selection: activate code mark for subsequent typing
  const tr = state.tr.addStoredMark(codeMarkType.create());
  dispatch(tr);
  return true;
}

/**
 * Find the end position of the code mark containing the given position.
 */
function findCodeMarkEnd(
  state: EditorState,
  pos: number,
  codeMarkType: ReturnType<EditorState["schema"]["marks"]["code"]["create"]>["type"]
): number | null {
  const $pos = state.doc.resolve(pos);
  const parent = $pos.parent;
  const parentStart = $pos.start();

  let offset = 0;
  for (let i = 0; i < parent.childCount; i++) {
    const child = parent.child(i);
    const childStart = parentStart + offset;
    const childEnd = childStart + child.nodeSize;

    if (pos >= childStart && pos <= childEnd) {
      /* v8 ignore next 3 -- @preserve reason: when inCode is true the cursor lies inside a code-marked text node; any sibling that satisfies the range check but lacks the code mark is only reachable at a mark boundary where $from.marks() already returns [] (inCode=false), making this else path structurally unreachable */
      if (child.marks.some((m) => m.type === codeMarkType)) {
        return childEnd;
      }
    }
    offset += child.nodeSize;
  }
  return null;
}
