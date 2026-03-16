/**
 * E07 — noDuplicateDefs
 *
 * Purpose: Flag definition nodes whose label has already appeared in the document.
 * Uses CommonMark label normalization (case-insensitive, whitespace-collapsed).
 * First occurrence wins; second+ are flagged.
 */

import { visit } from "unist-util-visit";
import type { Root, Definition } from "mdast";
import { createDiagnostic, type LintDiagnostic } from "../types";
import { normalizeLabel } from "./labelUtils";

export function noDuplicateDefs(source: string, mdast: Root): LintDiagnostic[] {
  const diagnostics: LintDiagnostic[] = [];
  const seenLabels = new Set<string>();

  visit(mdast, "definition", (node: Definition) => {
    if (!node.position) return;

    const raw = node.label ?? node.identifier ?? "";
    const normalized = normalizeLabel(raw);

    if (seenLabels.has(normalized)) {
      const { line, column, offset } = node.position.start;
      diagnostics.push(
        createDiagnostic({
          ruleId: "E07",
          severity: "error",
          messageKey: "lint.E07",
          messageParams: { ref: raw },
          line,
          column,
          offset: offset ?? 0,
          endOffset: node.position.end.offset,
          uiHint: "exact",
        })
      );
    } else {
      seenLabels.add(normalized);
    }
  });

  return diagnostics;
}
