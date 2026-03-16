#!/usr/bin/env -S node --import tsx
/**
 * CJK Website Formatter
 *
 * Applies VMark's CJK formatting rules to translated website markdown files.
 * Safe config: CJK-Latin spacing, fullwidth alphanumeric normalization,
 * ellipsis cleanup, space collapsing. Skips bracket/paren/quote conversions
 * that would break markdown syntax.
 *
 * Usage:
 *   pnpm tsx scripts/format-cjk-website.ts          # format all CJK pages
 *   pnpm tsx scripts/format-cjk-website.ts --dry-run # preview changes
 */

import fs from "fs";
import path from "path";
import { formatMarkdown } from "../src/lib/cjkFormatter/formatter";
import { containsCJK } from "../src/lib/cjkFormatter/rules";
import type { CJKFormattingSettings } from "../src/stores/settingsStore";

// Korean excluded from CJK-English spacing — Korean particles attach directly
// to preceding words (e.g., "VMark에는" not "VMark 에는").
const CJK_LOCALES = ["zh-CN", "zh-TW", "ja"];
const WEBSITE_DIR = path.resolve(import.meta.dirname, "../website");
const DRY_RUN = process.argv.includes("--dry-run");

/** Conservative config safe for markdown source files. */
const config: CJKFormattingSettings = {
  // Group 1: Universal
  ellipsisNormalization: true,
  newlineCollapsing: false,  // Risky: can collapse blank lines within markdown examples

  // Group 2: Fullwidth Normalization
  fullwidthAlphanumeric: true,
  fullwidthPunctuation: false,  // Risky: can remove spaces around inline code backticks
  fullwidthParentheses: false, // Would break markdown link syntax: [text](url)
  fullwidthBrackets: false,    // Would break markdown link syntax: [text]

  // Group 3: Spacing
  cjkEnglishSpacing: true,     // Most important rule
  cjkParenthesisSpacing: false,
  currencySpacing: true,
  slashSpacing: false,
  spaceCollapsing: false,  // Risky: eats spaces between adjacent inline code spans

  // Group 4: Dash & Quote — skip for markdown sources
  dashConversion: false,
  emdashSpacing: false,
  smartQuoteConversion: false,
  quoteStyle: "curly",
  contextualQuotes: false,
  quoteSpacing: false,
  singleQuoteSpacing: false,
  cjkCornerQuotes: false,
  cjkNestedQuotes: false,
  quoteToggleMode: "simple",

  // Group 5: Cleanup
  consecutivePunctuationLimit: 0, // Don't limit — respect original
  trailingSpaceRemoval: false,  // Risky: trims spaces before inline code spans
};

function findMarkdownFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findMarkdownFiles(full));
    } else if (entry.name.endsWith(".md")) {
      files.push(full);
    }
  }
  return files;
}

function main() {
  let totalFiles = 0;
  let changedFiles = 0;

  for (const locale of CJK_LOCALES) {
    const localeDir = path.join(WEBSITE_DIR, locale);
    if (!fs.existsSync(localeDir)) {
      console.log(`  skip ${locale}/ (not found)`);
      continue;
    }

    const files = findMarkdownFiles(localeDir);
    for (const file of files) {
      totalFiles++;
      const original = fs.readFileSync(file, "utf-8");

      if (!containsCJK(original)) continue;

      const formatted = formatMarkdown(original, config);

      if (formatted !== original) {
        changedFiles++;
        const rel = path.relative(WEBSITE_DIR, file);
        if (DRY_RUN) {
          console.log(`  would change: ${rel}`);
        } else {
          fs.writeFileSync(file, formatted, "utf-8");
          console.log(`  formatted: ${rel}`);
        }
      }
    }
  }

  console.log(
    `\n${DRY_RUN ? "[dry-run] " : ""}${changedFiles}/${totalFiles} files ${DRY_RUN ? "would be " : ""}changed.`
  );
}

main();
