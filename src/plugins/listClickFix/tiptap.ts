/**
 * List Click Fix Extension
 *
 * Fixes cursor placement when clicking empty list items.
 *
 * Problem: When clicking an empty <li>, ProseMirror correctly computes
 * the position inside the list item and passes it to handleClick. But
 * after all handlers return false, PM's default behavior reads the
 * browser's native selection — which the browser resolved to the nearest
 * text node (often in a paragraph below the list). This overrides the
 * correct pos, and the cursor lands outside the list.
 *
 * Two scenarios are handled:
 *   1. pos is inside an empty listItem: force-set selection and return true
 *      to prevent PM from reading the wrong native selection.
 *   2. pos is outside listItem but DOM target is inside <li>: use posAtDOM
 *      to find the correct position and set selection there.
 *
 * @coordinates-with shared/listHelpers.ts — shared list item lookup and ancestor walk
 */

import { Extension } from "@tiptap/core";
import { Plugin, TextSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import type { NodeType, ResolvedPos } from "@tiptap/pm/model";
import { listClickFixLog } from "@/utils/debug";
import { findListItemType, isPositionInsideListItem } from "@/plugins/shared/listHelpers";

// Re-export for tests that import from this module
export { findListItemType, isPositionInsideListItem } from "@/plugins/shared/listHelpers";

/**
 * Check if a resolved position is inside a listItem whose text content
 * is empty (the <li> has no visible text). Walk up to find the listItem
 * ancestor, then check its textContent.
 */
export function isInsideEmptyListItem(
  $pos: ResolvedPos,
  listItemType: NodeType
): boolean {
  for (let d = $pos.depth; d > 0; d--) {
    const node = $pos.node(d);
    if (node.type === listItemType) {
      return node.textContent.trim() === "";
    }
  }
  return false;
}

/** Exported for testing. */
export function handleClick(
  view: EditorView,
  pos: number,
  event: MouseEvent
): boolean {
  // Skip modified clicks — let multi-cursor and other handlers process them
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
    return false;
  }

  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;

  // Check if the DOM click target is inside an <li>
  const liElement = target.closest("li");
  if (!liElement) return false;

  const listItemType = findListItemType(view.state.schema);
  if (!listItemType) return false;

  const $pos = view.state.doc.resolve(pos);

  // Scenario 1: pos is already inside a listItem — check if it's empty.
  // For empty list items, PM's default behavior will read the browser's
  // native selection which resolves to the wrong place. Force-set selection.
  if (isPositionInsideListItem($pos, listItemType)) {
    if (!isInsideEmptyListItem($pos, listItemType)) return false;

    // Force-set selection to prevent PM from overriding with native selection
    const selection = TextSelection.near($pos);
    const tr = view.state.tr.setSelection(selection);
    view.dispatch(tr);
    return true;
  }

  // Scenario 2: pos is outside listItem but DOM target is inside <li>.
  // Use posAtDOM to find the correct position inside the list item.
  try {
    const targetPos = view.posAtDOM(liElement, 0);
    const $targetPos = view.state.doc.resolve(targetPos);

    // Verify corrected position is actually inside a list item
    if (!isPositionInsideListItem($targetPos, listItemType)) return false;

    const selection = TextSelection.near($targetPos);
    const tr = view.state.tr.setSelection(selection);
    view.dispatch(tr);
    return true;
  } catch (error) {
    listClickFixLog("posAtDOM failed for list click fix:", error);
    return false;
  }
}

export const listClickFixExtension = Extension.create({
  name: "listClickFix",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleClick,
        },
      }),
    ];
  },
});
