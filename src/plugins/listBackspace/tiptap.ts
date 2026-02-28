/**
 * List Backspace Extension
 *
 * Overrides Backspace in list items to implement two-step removal:
 * 1. First Backspace at content start: lift item out of list (become paragraph)
 * 2. Second Backspace: standard paragraph joining (handled by defaultKeymap)
 *
 * Runs at priority 1000 (before ListKeymap at priority 0) so it intercepts
 * Backspace before the default joinItemBackward behavior fires.
 *
 * @coordinates-with shared/listHelpers.ts — shared list item lookup and ancestor walk
 */

import { Extension, isAtStartOfNode } from "@tiptap/core";
import { keymap } from "@tiptap/pm/keymap";
import { liftListItem } from "@tiptap/pm/schema-list";
import type { EditorState, Transaction } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { guardProseMirrorCommand } from "@/utils/imeGuard";
import { findListItemType, isPositionInsideListItem } from "@/plugins/shared/listHelpers";

function handleListBackspace(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
  _view?: EditorView
): boolean {
  // Only handle empty (collapsed) selections
  if (!state.selection.empty) return false;

  const listItemType = findListItemType(state.schema);
  if (!listItemType) return false;

  // Check if cursor is inside a list item
  const { $from } = state.selection;
  if (!isPositionInsideListItem($from, listItemType)) return false;

  // Must be at start of node content (no chars before cursor in this textblock)
  if (!isAtStartOfNode(state)) return false;

  // Lift the list item out — converts to paragraph at same position
  return liftListItem(listItemType)(state, dispatch);
}

export const listBackspaceExtension = Extension.create({
  name: "listBackspace",
  priority: 1000,
  addProseMirrorPlugins() {
    return [
      keymap({
        Backspace: guardProseMirrorCommand(handleListBackspace),
      }),
    ];
  },
});
