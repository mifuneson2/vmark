/**
 * W03 — noUnusedDefs
 *
 * Purpose: Flag definition nodes that are never referenced by a
 * linkReference or imageReference in the document.
 *
 * Uses source-text scanning to find reference patterns (like E01), because
 * remark's remarkResolveReferences plugin converts linkReference/imageReference
 * nodes to link/image nodes — the original reference node types are gone
 * from the MDAST by the time rules run.
 *
 * Uses CommonMark label normalization.
 */

import { visit } from "unist-util-visit";
import type { Root, Definition } from "mdast";
import { createDiagnostic, type LintDiagnostic } from "../types";
import { normalizeLabel } from "./labelUtils";

/**
 * Scan source for full-reference patterns [text][label] and ![alt][label].
 * Returns a Set of normalized labels that appear as references.
 */
function findReferencedLabels(source: string): Set<string> {
  const usedLabels = new Set<string>();
  const lines = source.split("\n");
  let inFencedBlock = false;
  let fenceChar = "";
  let fenceLen = 0;

  for (const lineText of lines) {
    const trimmed = lineText.replace(/\r$/, "");

    // Track fenced code blocks
    if (!inFencedBlock) {
      const openMatch = trimmed.match(/^ {0,3}(`{3,}|~{3,})/);
      if (openMatch) {
        inFencedBlock = true;
        fenceChar = openMatch[1][0];
        fenceLen = openMatch[1].length;
        continue;
      }
    } else {
      const closeRe = new RegExp(`^ {0,3}\\${fenceChar}{${fenceLen},}\\s*$`);
      if (closeRe.test(trimmed)) {
        inFencedBlock = false;
        fenceChar = "";
        fenceLen = 0;
      }
      continue;
    }

    // Strip inline code spans before scanning
    const strippedLine = lineText.replace(/`[^`]*`/g, (match) => " ".repeat(match.length));

    // Match [text][label] or ![alt][label]
    const refPattern = /(!?\[(?:[^\]\\]|\\.)*?\])\[([^\]]+?)\]/g;
    let match: RegExpExecArray | null;

    while ((match = refPattern.exec(strippedLine)) !== null) {
      const label = match[2];
      if (label) {
        usedLabels.add(normalizeLabel(label));
      }
    }
  }

  return usedLabels;
}

export function noUnusedDefs(source: string, mdast: Root): LintDiagnostic[] {
  const diagnostics: LintDiagnostic[] = [];

  // Get all referenced labels from source text
  const usedLabels = findReferencedLabels(source);

  // Check each definition node from MDAST
  visit(mdast, "definition", (node: Definition) => {
    if (!node.position) return;

    const raw = node.label ?? node.identifier ?? "";
    const normalized = normalizeLabel(raw);

    if (!usedLabels.has(normalized)) {
      const { line, column, offset } = node.position.start;
      diagnostics.push(
        createDiagnostic({
          ruleId: "W03",
          severity: "warning",
          messageKey: "lint.W03",
          messageParams: { ref: raw },
          line,
          column,
          offset: offset ?? 0,
          endOffset: node.position.end.offset,
          uiHint: "block",
        })
      );
    }
  });

  return diagnostics;
}
