/**
 * Markdown Lint Engine — Orchestrator
 *
 * Purpose: Parses markdown via remark (lint-safe mode) and runs all
 * registered rules over the MDAST + raw source text. Returns sorted diagnostics.
 */

import { createMarkdownProcessor } from "@/utils/markdownPipeline/parser";
import type { Root } from "mdast";
import type { LintDiagnostic } from "./types";
import { allRules } from "./rules";

const processor = createMarkdownProcessor();

/**
 * Run all lint rules against a markdown source string.
 * Returns diagnostics sorted by position (line, then column).
 */
export function lintMarkdown(source: string): LintDiagnostic[] {
  if (!source.trim()) return [];

  const tree = processor.parse(source) as Root;
  // Run transforms so reference resolution etc. are applied
  const mdast = processor.runSync(tree) as Root;

  const diagnostics: LintDiagnostic[] = [];

  for (const rule of allRules) {
    diagnostics.push(...rule(source, mdast));
  }

  diagnostics.sort((a, b) => a.line - b.line || a.column - b.column);

  return diagnostics;
}
