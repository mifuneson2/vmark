/**
 * E02 — tableColumnCount
 *
 * Purpose: Flag table body rows whose cell count differs from the header row.
 * The first tableRow is treated as the header and defines the expected count.
 */

import { visit } from "unist-util-visit";
import type { Root, Table, TableRow } from "mdast";
import { createDiagnostic, type LintDiagnostic } from "../types";

export function tableColumnCount(source: string, mdast: Root): LintDiagnostic[] {
  const diagnostics: LintDiagnostic[] = [];

  visit(mdast, "table", (node: Table) => {
    const rows = node.children as TableRow[];
    if (rows.length < 2) return; // No body rows to check

    const headerRow = rows[0];
    const expectedCount = headerRow.children.length;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const foundCount = row.children.length;

      if (foundCount !== expectedCount) {
        if (!row.position) continue;
        const { line, column, offset } = row.position.start;
        diagnostics.push(
          createDiagnostic({
            ruleId: "E02",
            severity: "error",
            messageKey: "lint.E02",
            messageParams: {
              expected: String(expectedCount),
              found: String(foundCount),
            },
            line,
            column,
            offset: offset ?? 0,
            endOffset: row.position.end.offset,
            uiHint: "block",
          })
        );
      }
    }
  });

  return diagnostics;
}
