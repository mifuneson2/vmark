/**
 * E01 — noUndefinedRefs
 *
 * Purpose: Flag reference-style links/images that have no matching definition.
 * Uses source-text regex to find reference patterns, and MDAST to find definitions.
 * This hybrid approach is necessary because remark does not parse
 * [text][unknown-ref] as a linkReference node when no definition exists —
 * it falls back to literal text per CommonMark spec.
 *
 * CommonMark label normalization: lowercase, collapse whitespace, trim.
 */

import { visit } from "unist-util-visit";
import type { Root, Definition } from "mdast";
import { createDiagnostic, type LintDiagnostic } from "../types";
import { normalizeLabel } from "./labelUtils";

/**
 * Find offset for a given 1-based line + 1-based column in source.
 */
function offsetFromLineCol(source: string, line: number, column: number): number {
  const lines = source.split("\n");
  let offset = 0;
  for (let i = 0; i < line - 1; i++) {
    offset += lines[i].length + 1; // +1 for the newline char
  }
  offset += column - 1;
  return offset;
}

export function noUndefinedRefs(source: string, mdast: Root): LintDiagnostic[] {
  const diagnostics: LintDiagnostic[] = [];

  // Collect all definition labels from MDAST (reliable — definitions always parse)
  const definedLabels = new Set<string>();
  visit(mdast, "definition", (node: Definition) => {
    const raw = node.label ?? node.identifier ?? "";
    definedLabels.add(normalizeLabel(raw));
  });

  // Scan source text for reference-style links: [text][label] and ![alt][label]
  // Also handle collapsed refs: [text][] and ![alt][]
  // We skip references inside code spans and fenced code blocks.
  const lines = source.split("\n");
  let inFencedBlock = false;
  let fenceChar = "";
  let fenceLen = 0;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const lineText = lines[lineIdx];
    const lineNum = lineIdx + 1;

    // Track fenced code blocks (skip their content)
    const trimmed = lineText.replace(/\r$/, "");
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

    // Strip inline code spans before scanning for refs
    const strippedLine = lineText.replace(/`[^`]*`/g, (match) => " ".repeat(match.length));

    // Regex: !?[...][label] — match full-reference and image-reference patterns
    // Group 1: optional ! (image)
    // Group 2: link text or alt (ignored for position)
    // Group 3: reference label
    const refPattern = /(!?\[(?:[^\]\\]|\\.)*?\])\[([^\]]*?)\]/g;
    let match: RegExpExecArray | null;

    while ((match = refPattern.exec(strippedLine)) !== null) {
      const fullMatch = match[0];
      const label = match[2];

      // Collapsed ref [text][] uses the link text itself as the label
      // We only flag non-empty labels here (collapsed refs use link text)
      if (label === "") {
        // Collapsed reference — uses link text as label, harder to validate
        // Skip for now; these are rare and hard to validate without full parsing
        continue;
      }

      const normalizedLabel = normalizeLabel(label);
      if (!definedLabels.has(normalizedLabel)) {
        const column = match.index + 1;
        const offset = offsetFromLineCol(source, lineNum, column);
        const endOffset = offset + fullMatch.length;

        diagnostics.push(
          createDiagnostic({
            ruleId: "E01",
            severity: "error",
            messageKey: "lint.E01",
            messageParams: { ref: label },
            line: lineNum,
            column,
            offset,
            endOffset,
            uiHint: "exact",
          })
        );
      }
    }
  }

  return diagnostics;
}
