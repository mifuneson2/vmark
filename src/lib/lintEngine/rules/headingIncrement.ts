/**
 * W01 — headingIncrement
 *
 * Purpose: Flag headings that skip levels (e.g., h1 → h3).
 * Decreasing levels (e.g., h3 → h1) are always fine.
 * The first heading sets the baseline — no prior context to compare.
 */

import { visit } from "unist-util-visit";
import type { Root, Heading } from "mdast";
import { createDiagnostic, type LintDiagnostic } from "../types";

export function headingIncrement(source: string, mdast: Root): LintDiagnostic[] {
  const diagnostics: LintDiagnostic[] = [];
  let prevDepth: number | null = null;

  visit(mdast, "heading", (node: Heading) => {
    const depth = node.depth;

    if (prevDepth !== null && depth > prevDepth + 1) {
      if (!node.position) {
        prevDepth = depth;
        return;
      }
      const { line, column, offset } = node.position.start;
      diagnostics.push(
        createDiagnostic({
          ruleId: "W01",
          severity: "warning",
          messageKey: "lint.W01",
          messageParams: { from: String(prevDepth), to: String(depth) },
          line,
          column,
          offset: offset ?? 0,
          endOffset: node.position.end.offset,
          uiHint: "exact",
        })
      );
    }

    prevDepth = depth;
  });

  return diagnostics;
}
