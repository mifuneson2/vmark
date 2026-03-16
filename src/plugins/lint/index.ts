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
 * Map a 1-based markdown line number to a ProseMirror top-level block node.
 * Returns the node position and node, or null if out of range.
 *
 * Strategy: treat each top-level block as occupying 1 "virtual line" for
 * mapping purposes. This is imprecise but avoids counting WYSIWYG text
 * newlines (which don't correspond to markdown line numbers). Decorations
 * are block-level only, so a best-effort mapping is acceptable.
 *
 * Blocks are accumulated into a line→block index during a single pass.
 * A diagnostic at line N maps to the (N-1)th block (0-indexed). If the
 * block doesn't exist, the diagnostic is skipped.
 */
function findBlockForLine(
  doc: PMNode,
  targetLine: number
): { pos: number; node: PMNode } | null {
  // Build a simple array of top-level blocks on demand
  const blocks: Array<{ pos: number; node: PMNode }> = [];
  doc.forEach((node, pos) => {
    blocks.push({ pos, node });
  });

  // Map 1-based line to 0-based block index
  const blockIndex = targetLine - 1;
  return blocks[blockIndex] ?? null;
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
