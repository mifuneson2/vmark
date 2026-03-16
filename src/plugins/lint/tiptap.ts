/**
 * Lint Tiptap Extension (WYSIWYG)
 *
 * Purpose: Wraps the ProseMirror lint plugin as a Tiptap extension with
 * reactive re-decoration when lintStore diagnostics change.
 *
 * Key decisions:
 *   - Uses configurable tabId to scope diagnostics per tab.
 *   - Subscribes to lintStore to re-dispatch when results arrive.
 *   - On docChanged: clears decorations (stale results dismissed).
 *   - skips "sourceOnly" diagnostics — they cannot be represented in WYSIWYG.
 *
 * @coordinates-with plugins/lint/index.ts — ProseMirror plugin implementation
 * @coordinates-with stores/lintStore.ts — listens for diagnostic changes
 * @module plugins/lint/tiptap
 */

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as PMNode } from "@tiptap/pm/model";
import { useLintStore } from "@/stores/lintStore";
import type { LintDiagnostic } from "@/lib/lintEngine/types";
import { runOrQueueProseMirrorAction } from "@/utils/imeGuard";
import "./lint.css";

const lintPluginKey = new PluginKey("markdownLintWysiwyg");

/** Map 1-based line number to block node position in the PM doc. */
function findBlockForLine(
  doc: PMNode,
  targetLine: number
): { pos: number; node: PMNode } | null {
  let currentLine = 1;
  let result: { pos: number; node: PMNode } | null = null;

  doc.forEach((node, pos) => {
    if (result) return;
    const text = node.textContent;
    const lineCount = (text.match(/\n/g) ?? []).length + 1;

    if (targetLine >= currentLine && targetLine < currentLine + lineCount) {
      result = { pos, node };
    }
    currentLine += lineCount;
  });

  return result;
}

/** Build decorations from diagnostics. Skips "sourceOnly" entries. */
function buildDecorations(doc: PMNode, diagnostics: LintDiagnostic[]): DecorationSet {
  if (!diagnostics || diagnostics.length === 0) {
    return DecorationSet.empty;
  }

  const decos: Decoration[] = [];

  for (const d of diagnostics) {
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

export interface LintExtensionOptions {
  /** Tab ID to scope diagnostics to. Empty string = disabled. */
  tabId: string;
}

/** Tiptap extension that decorates WYSIWYG blocks with lint diagnostic markers. */
export const LintExtension = Extension.create<LintExtensionOptions>({
  name: "markdownLint",

  addOptions() {
    return { tabId: "" };
  },

  addProseMirrorPlugins() {
    const { tabId } = this.options;
    if (!tabId) return [];

    return [
      new Plugin({
        key: lintPluginKey,

        view: (view) => {
          // Re-decorate when diagnostics arrive from runLint (plain subscribe, manual diff)
          let prevDiagnostics = useLintStore.getState().diagnosticsByTab[tabId];
          const unsubscribe = useLintStore.subscribe((state) => {
            const nextDiagnostics = state.diagnosticsByTab[tabId];
            if (nextDiagnostics !== prevDiagnostics) {
              prevDiagnostics = nextDiagnostics;
              runOrQueueProseMirrorAction(view, () => {
                view.dispatch(
                  view.state.tr.setMeta(lintPluginKey, "diagnosticsChanged")
                );
              });
            }
          });

          return { destroy: () => unsubscribe() };
        },

        state: {
          init(_, { doc }) {
            const diagnostics =
              useLintStore.getState().diagnosticsByTab[tabId] ?? [];
            return buildDecorations(doc, diagnostics);
          },

          apply(tr, oldDecorations) {
            // Clear on doc edit — stale diagnostics should disappear
            if (tr.docChanged) {
              useLintStore.getState().clearDiagnostics(tabId);
              return DecorationSet.empty;
            }

            // Rebuild when diagnostics were updated
            if (tr.getMeta(lintPluginKey) === "diagnosticsChanged") {
              const diagnostics =
                useLintStore.getState().diagnosticsByTab[tabId] ?? [];
              return buildDecorations(tr.doc, diagnostics);
            }

            // Remap existing decorations through non-doc-changing transactions
            return oldDecorations.map(tr.mapping, tr.doc);
          },
        },

        props: {
          decorations(state) {
            return lintPluginKey.getState(state);
          },
        },
      }),
    ];
  },
});
