/**
 * Lint Plugin (ProseMirror / WYSIWYG)
 *
 * Purpose: Adds block-level decorations to ProseMirror nodes that contain
 * lint diagnostics. Uses lintStore for pre-computed diagnostics.
 *
 * Key decisions:
 *   - Block-level only: decorates the entire node containing the issue.
 *   - Skips "sourceOnly" diagnostics (no reliable WYSIWYG rendering).
 *   - Uses Decoration.node() — not inline — for a consistent left-border style.
 *   - Clears decorations on tr.docChanged (stale diagnostics removed).
 *   - Reads tabId from lintStore at plugin init time (passed via config).
 *
 * @coordinates-with lintStore.ts — reads diagnostics by tabId
 * @coordinates-with lint.css — visual styles for the decorations
 * @module plugins/lint
 */

import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as PMNode } from "@tiptap/pm/model";
import { useLintStore } from "@/stores/lintStore";
import type { LintDiagnostic } from "@/lib/lintEngine/types";
import "./lint.css";

const pluginKey = new PluginKey("markdownLint");

/**
 * Map a 1-based line number to the ProseMirror block node that contains it.
 * Returns the node position and node, or null if out of range.
 *
 * Strategy: iterate top-level blocks, counting content lines.
 */
function findBlockForLine(
  doc: PMNode,
  targetLine: number
): { pos: number; node: PMNode } | null {
  let currentLine = 1;
  let result: { pos: number; node: PMNode } | null = null;

  doc.forEach((node, pos) => {
    if (result) return; // Already found

    // Count lines in this block's text content
    const text = node.textContent;
    const lineCount = (text.match(/\n/g) ?? []).length + 1;

    if (targetLine >= currentLine && targetLine < currentLine + lineCount) {
      result = { pos, node };
    }

    currentLine += lineCount;
  });

  return result;
}

/**
 * Build a decoration set from lint diagnostics for the given document.
 */
function buildDecorations(doc: PMNode, diagnostics: LintDiagnostic[]): DecorationSet {
  if (!diagnostics || diagnostics.length === 0) {
    return DecorationSet.empty;
  }

  const decos: Decoration[] = [];

  for (const d of diagnostics) {
    // Skip sourceOnly — no reliable WYSIWYG rendering
    if (d.uiHint === "sourceOnly") continue;

    const block = findBlockForLine(doc, d.line);
    if (!block) continue;

    const className =
      d.severity === "error" ? "lint-block-error" : "lint-block-warning";

    decos.push(
      Decoration.node(block.pos, block.pos + block.node.nodeSize, {
        class: className,
      })
    );
  }

  return DecorationSet.create(doc, decos);
}

/**
 * Create the ProseMirror lint plugin for a specific tab.
 */
export function createLintPlugin(tabId: string): Plugin {
  return new Plugin({
    key: pluginKey,

    state: {
      init(_, { doc }) {
        const diagnostics =
          useLintStore.getState().diagnosticsByTab[tabId] ?? [];
        return buildDecorations(doc, diagnostics);
      },

      apply(tr, _oldDecorations) {
        // Clear decorations when document changes (diagnostics are stale)
        if (tr.docChanged) {
          useLintStore.getState().clearDiagnostics(tabId);
          return DecorationSet.empty;
        }

        // Check if diagnostics changed (e.g., after runLint)
        const diagnostics =
          useLintStore.getState().diagnosticsByTab[tabId] ?? [];
        return buildDecorations(tr.doc, diagnostics);
      },
    },

    props: {
      decorations(state) {
        return pluginKey.getState(state);
      },
    },
  });
}
