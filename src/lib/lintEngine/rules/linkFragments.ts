/**
 * W04 — linkFragments
 *
 * Purpose: Flag links whose URL is a fragment (#anchor) that does not match
 * any heading in the document. Uses makeUniqueSlug to build the correct slug set,
 * which handles duplicate headings by appending counters.
 */

import { visit } from "unist-util-visit";
import type { Root, Link, Heading, PhrasingContent } from "mdast";
import { createDiagnostic, type LintDiagnostic } from "../types";
import { generateSlug, makeUniqueSlug } from "@/utils/headingSlug";

function extractHeadingText(children: PhrasingContent[]): string {
  let text = "";
  for (const child of children) {
    if ("value" in child && typeof (child as { value?: unknown }).value === "string") {
      // Covers text nodes, inlineCode, and any other leaf with .value
      text += (child as { value: string }).value;
    } else if ("children" in child && Array.isArray((child as { children?: PhrasingContent[] }).children)) {
      text += extractHeadingText((child as { children: PhrasingContent[] }).children);
    }
  }
  return text;
}

export function linkFragments(_source: string, mdast: Root): LintDiagnostic[] {
  const diagnostics: LintDiagnostic[] = [];

  // Build the set of valid slugs from all headings
  const usedSlugs = new Set<string>();
  const validSlugs = new Set<string>();

  visit(mdast, "heading", (node: Heading) => {
    const text = extractHeadingText(node.children as PhrasingContent[]);
    const baseSlug = generateSlug(text);
    if (!baseSlug) return;
    const slug = makeUniqueSlug(baseSlug, usedSlugs);
    usedSlugs.add(slug);
    validSlugs.add(slug);
  });

  // Check fragment links
  visit(mdast, "link", (node: Link) => {
    if (!node.position) return;

    const url = node.url ?? "";
    if (!url.startsWith("#")) return;

    const fragment = url.slice(1); // Remove leading #
    if (!fragment) return; // bare `#` — not a heading anchor

    if (!validSlugs.has(fragment)) {
      const { line, column, offset } = node.position.start;
      diagnostics.push(
        createDiagnostic({
          ruleId: "W04",
          severity: "warning",
          messageKey: "lint.W04",
          messageParams: { anchor: fragment },
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
