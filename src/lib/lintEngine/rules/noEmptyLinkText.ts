/**
 * E06 — noEmptyLinkText
 *
 * Purpose: Flag link nodes whose text content is empty (invisible to readers).
 * Only checks `link` nodes — imageReference and linkReference are excluded.
 * Images inside links count as non-empty content.
 */

import { visit } from "unist-util-visit";
import type { Root, Link, PhrasingContent } from "mdast";
import { createDiagnostic, type LintDiagnostic } from "../types";

function extractTextContent(children: PhrasingContent[]): string {
  let text = "";
  for (const child of children) {
    if (child.type === "text") {
      text += child.value;
    } else if (child.type === "inlineCode") {
      // Inline code counts as content
      text += child.value;
    } else if (child.type === "image") {
      // Image counts as content
      text += child.alt ?? "img";
    } else if ("children" in child && Array.isArray((child as { children?: PhrasingContent[] }).children)) {
      text += extractTextContent((child as { children: PhrasingContent[] }).children);
    }
  }
  return text;
}

export function noEmptyLinkText(_source: string, mdast: Root): LintDiagnostic[] {
  const diagnostics: LintDiagnostic[] = [];

  visit(mdast, "link", (node: Link) => {
    if (!node.position) return;

    const textContent = extractTextContent(node.children);
    if (textContent.trim() === "") {
      const { line, column, offset } = node.position.start;
      diagnostics.push(
        createDiagnostic({
          ruleId: "E06",
          severity: "error",
          messageKey: "lint.E06",
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
