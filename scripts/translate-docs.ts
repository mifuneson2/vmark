#!/usr/bin/env -S node --import tsx
/**
 * Markdown Documentation Translation Script
 *
 * Translates VitePress markdown pages in website/ to supported languages
 * using the Anthropic Claude API.
 *
 * Usage:
 *   tsx scripts/translate-docs.ts --lang zh-CN
 *   tsx scripts/translate-docs.ts --lang zh-CN --file guide/features.md
 *   tsx scripts/translate-docs.ts --lang all
 *   tsx scripts/translate-docs.ts --lang zh-CN --dry-run
 *   tsx scripts/translate-docs.ts --lang zh-CN --force
 *
 * Options:
 *   --lang <code|all>       BCP-47 language code or "all" for all languages
 *   --file <path>           Translate a single file only (relative to website/)
 *   --dry-run               Show what would be translated without writing files
 *   --force                 Retranslate even if target file already exists
 *
 * Environment:
 *   ANTHROPIC_API_KEY       Required — your Anthropic API key
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const WEBSITE_DIR = path.join(REPO_ROOT, "website");

/** Directories to exclude when discovering source markdown files. */
const EXCLUDE_DIRS = new Set(["node_modules", ".vitepress", "public"]);

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-5-20250929";
const MAX_TOKENS = 16000;

// ---------------------------------------------------------------------------
// Supported languages
// ---------------------------------------------------------------------------

const LANGUAGES: Record<string, string> = {
  "zh-CN": "Simplified Chinese",
  "zh-TW": "Traditional Chinese",
  ja: "Japanese",
  ko: "Korean",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  "pt-BR": "Brazilian Portuguese",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CliArgs {
  lang: string; // language code or "all"
  file: string | null; // single file path relative to website/, or null
  dryRun: boolean;
  force: boolean;
}

interface TranslationJob {
  relPath: string; // relative to website/, e.g. "guide/features.md"
  sourcePath: string; // absolute
  targetPath: string; // absolute
  lang: string;
}

interface JobResult {
  relPath: string;
  lang: string;
  status: "translated" | "skipped" | "error" | "dry-run";
  durationMs?: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Source file discovery
// ---------------------------------------------------------------------------

/**
 * Recursively find all .md files under dir, excluding EXCLUDE_DIRS and
 * any directory that looks like a locale output directory (matches a known
 * language code).
 */
function findMarkdownFiles(dir: string, base: string = dir): string[] {
  const langCodes = new Set(Object.keys(LANGUAGES));
  const results: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      // Skip locale output directories (e.g. website/zh-CN/)
      if (langCodes.has(entry.name)) continue;
      results.push(...findMarkdownFiles(path.join(dir, entry.name), base));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(path.relative(base, path.join(dir, entry.name)));
    }
  }

  return results.sort();
}

// ---------------------------------------------------------------------------
// System prompt builder
// ---------------------------------------------------------------------------

function buildSystemPrompt(lang: string): string {
  const languageName = LANGUAGES[lang] ?? lang;
  return [
    `You are translating VMark documentation from English to ${languageName}.`,
    `VMark is a desktop Markdown editor built with Tauri and React.`,
    ``,
    `Rules:`,
    `- Translate prose text only`,
    `- Do NOT translate: code blocks, inline code, HTML tags, image paths, URLs`,
    `- Preserve all markdown syntax exactly (headings, lists, tables, links, emphasis)`,
    `- Preserve VitePress-specific syntax: :::tip, :::warning, :::info containers`,
    `- Preserve frontmatter YAML values (if any)`,
    `- Rewrite internal links: /guide/X → /${lang}/guide/X, /download → /${lang}/download`,
    `- External URLs (https://...) stay unchanged`,
    `- Keep the same line structure and paragraph breaks`,
    `- Translate naturally, not literally — use terminology common in ${languageName} tech documentation`,
    `- Output ONLY the translated markdown — no explanations, no markdown fences wrapping the whole document`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Claude API call
// ---------------------------------------------------------------------------

async function callClaude(systemPrompt: string, content: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY environment variable is not set.\n" +
        "Export it before running: export ANTHROPIC_API_KEY=sk-ant-..."
    );
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: "user", content }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };

  const textBlock = data.content.find((b) => b.type === "text");
  if (!textBlock) {
    throw new Error("Anthropic API returned no text content");
  }

  return textBlock.text.trim();
}

// ---------------------------------------------------------------------------
// Single file translation
// ---------------------------------------------------------------------------

async function translateFile(job: TranslationJob): Promise<string> {
  const sourceContent = fs.readFileSync(job.sourcePath, "utf-8");
  const systemPrompt = buildSystemPrompt(job.lang);
  const userMessage = `Translate the following VitePress markdown documentation page to ${LANGUAGES[job.lang] ?? job.lang}:\n\n${sourceContent}`;

  const translated = await callClaude(systemPrompt, userMessage);

  // Strip wrapping markdown fences if Claude added them despite instructions
  const fenceMatch = translated.match(/^```(?:md|markdown)?\s*\n([\s\S]*?)```\s*$/);
  return fenceMatch ? fenceMatch[1].trim() + "\n" : translated + "\n";
}

// ---------------------------------------------------------------------------
// Job execution
// ---------------------------------------------------------------------------

async function runJob(job: TranslationJob, opts: { dryRun: boolean; force: boolean }, index: number, total: number): Promise<JobResult> {
  const tag = `[${String(index + 1).padStart(String(total).length)}/${total}]`;
  const label = `${job.relPath} → ${job.lang}`;

  // Skip check
  if (!opts.force && fs.existsSync(job.targetPath)) {
    console.log(`${tag} Skipping ${label} (already exists)`);
    return { relPath: job.relPath, lang: job.lang, status: "skipped" };
  }

  // Dry-run check
  if (opts.dryRun) {
    console.log(`${tag} Would translate ${label}`);
    return { relPath: job.relPath, lang: job.lang, status: "dry-run" };
  }

  process.stdout.write(`${tag} Translating ${label}... `);
  const start = Date.now();

  try {
    const translated = await translateFile(job);
    const durationMs = Date.now() - start;

    // Write output
    fs.mkdirSync(path.dirname(job.targetPath), { recursive: true });
    fs.writeFileSync(job.targetPath, translated, "utf-8");

    console.log(`done (${(durationMs / 1000).toFixed(1)}s)`);
    return { relPath: job.relPath, lang: job.lang, status: "translated", durationMs };
  } catch (err) {
    const durationMs = Date.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    console.log(`FAILED`);
    console.error(`  Error: ${message}`);
    return { relPath: job.relPath, lang: job.lang, status: "error", durationMs, error: message };
  }
}

// ---------------------------------------------------------------------------
// Build job list
// ---------------------------------------------------------------------------

function buildJobs(args: CliArgs): TranslationJob[] {
  const langs = args.lang === "all" ? Object.keys(LANGUAGES) : [args.lang];

  let relPaths: string[];
  if (args.file) {
    // Single-file mode: normalise path separator
    const normalised = args.file.replace(/\\/g, "/");
    const abs = path.join(WEBSITE_DIR, normalised);
    if (!fs.existsSync(abs)) {
      throw new Error(`Source file not found: ${abs}`);
    }
    relPaths = [normalised];
  } else {
    relPaths = findMarkdownFiles(WEBSITE_DIR);
  }

  const jobs: TranslationJob[] = [];
  for (const lang of langs) {
    if (args.lang !== "all" && !LANGUAGES[lang]) {
      throw new Error(
        `Unknown language code: ${lang}\nSupported: ${Object.keys(LANGUAGES).join(", ")}`
      );
    }
    for (const relPath of relPaths) {
      jobs.push({
        relPath,
        sourcePath: path.join(WEBSITE_DIR, relPath),
        targetPath: path.join(WEBSITE_DIR, lang, relPath),
        lang,
      });
    }
  }

  return jobs;
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(): CliArgs {
  const argv = process.argv.slice(2);

  function getArg(name: string): string | undefined {
    const idx = argv.indexOf(name);
    if (idx === -1) return undefined;
    return argv[idx + 1];
  }

  function hasFlag(name: string): boolean {
    return argv.includes(name);
  }

  const lang = getArg("--lang");
  if (!lang) {
    throw new Error('Missing required argument: --lang <code|all>');
  }

  const file = getArg("--file") ?? null;

  return {
    lang,
    file,
    dryRun: hasFlag("--dry-run"),
    force: hasFlag("--force"),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  let args: CliArgs;
  try {
    args = parseArgs();
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    console.error("");
    console.error("Usage:");
    console.error("  tsx scripts/translate-docs.ts --lang zh-CN");
    console.error("  tsx scripts/translate-docs.ts --lang zh-CN --file guide/features.md");
    console.error("  tsx scripts/translate-docs.ts --lang all");
    console.error("  tsx scripts/translate-docs.ts --lang zh-CN --dry-run");
    console.error("  tsx scripts/translate-docs.ts --lang zh-CN --force");
    console.error("");
    console.error(`Supported languages: ${Object.keys(LANGUAGES).join(", ")}`);
    process.exit(1);
  }

  // Check API key early (not needed for dry-run, but catch it up front)
  if (!args.dryRun && !process.env.ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY environment variable is not set.");
    console.error("Export it before running: export ANTHROPIC_API_KEY=sk-ant-...");
    process.exit(1);
  }

  let jobs: TranslationJob[];
  try {
    jobs = buildJobs(args);
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  // Header
  const langDisplay =
    args.lang === "all"
      ? `all (${Object.keys(LANGUAGES).join(", ")})`
      : `${args.lang} — ${LANGUAGES[args.lang] ?? args.lang}`;

  console.log("\nVMark Documentation Translation");
  console.log(`  Language : ${langDisplay}`);
  if (args.file) console.log(`  File     : ${args.file}`);
  console.log(`  Files    : ${jobs.length} job(s)`);
  if (args.dryRun) console.log("  Mode     : DRY RUN (no files will be written)");
  if (args.force) console.log("  Force    : yes (overwrite existing translations)");
  console.log("");

  const results: JobResult[] = [];

  for (let i = 0; i < jobs.length; i++) {
    const result = await runJob(jobs[i]!, { dryRun: args.dryRun, force: args.force }, i, jobs.length);
    results.push(result);
  }

  // Summary
  const translated = results.filter((r) => r.status === "translated").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const dryRun = results.filter((r) => r.status === "dry-run").length;
  const errors = results.filter((r) => r.status === "error").length;

  console.log("");
  console.log("Summary:");
  if (translated > 0) console.log(`  Translated : ${translated} file(s)`);
  if (skipped > 0) console.log(`  Skipped    : ${skipped} file(s) (already exist)`);
  if (dryRun > 0) console.log(`  Would translate: ${dryRun} file(s)`);
  if (errors > 0) {
    console.log(`  Errors     : ${errors} file(s)`);
    console.error("\nFailed files:");
    results
      .filter((r) => r.status === "error")
      .forEach((r) => console.error(`  - ${r.lang}/${r.relPath}: ${r.error}`));
    process.exit(1);
  }
}

main();
