/**
 * W02 — requireAltText
 *
 * Purpose: Flag image nodes with empty or missing alt text (WCAG 1.1.1).
 */

import { visit } from "unist-util-visit";
import type { Root, Image } from "mdast";
import { createDiagnostic, type LintDiagnostic } from "../types";

export function requireAltText(_source: string, mdast: Root): LintDiagnostic[] {
  const diagnostics: LintDiagnostic[] = [];

  visit(mdast, "image", (node: Image) => {
    if (!node.position) return;

    const alt = node.alt ?? "";
    if (alt.trim() === "") {
      const { line, column, offset } = node.position.start;
      diagnostics.push(
        createDiagnostic({
          ruleId: "W02",
          severity: "warning",
          messageKey: "lint.W02",
          messageParams: {},
          line,
          column,
          offset: offset ?? 0,
          endOffset: node.position.end.offset,
          uiHint: "exact",
        })
      );
    }
  });

  return diagnostics;
}
