/**
 * Markdown Pipeline Benchmarks
 *
 * Run: pnpm bench
 * Measures: parse (markdown → ProseMirror), serialize (ProseMirror → markdown)
 */

import { bench, describe } from "vitest";
import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { parseMarkdown, serializeMarkdown } from "@/utils/markdownPipeline/adapter";

function createTestSchema() {
  return getSchema([StarterKit]);
}

function generateMarkdown(lines: number): string {
  const blocks: string[] = [];
  for (let i = 0; i < lines; i++) {
    if (i % 20 === 0) blocks.push(`## Heading ${i}`);
    else if (i % 10 === 0) blocks.push(`- List item ${i}`);
    else if (i % 15 === 0) blocks.push(`> Blockquote line ${i}`);
    else if (i % 30 === 0) blocks.push("```\ncode block\n```");
    else blocks.push(`Paragraph ${i} with some text content that represents a typical line.`);
  }
  return blocks.join("\n\n");
}

const schema = createTestSchema();
const md1K = generateMarkdown(1000);
const md5K = generateMarkdown(5000);
const md10K = generateMarkdown(10000);

// Pre-parse for serialize benchmarks
const doc1K = parseMarkdown(schema, md1K);
const doc5K = parseMarkdown(schema, md5K);

describe("markdown parse", () => {
  bench("1K lines", () => {
    parseMarkdown(schema, md1K);
  });

  bench("5K lines", () => {
    parseMarkdown(schema, md5K);
  });

  bench("10K lines", () => {
    parseMarkdown(schema, md10K);
  });
});

describe("markdown serialize", () => {
  bench("1K lines", () => {
    serializeMarkdown(schema, doc1K);
  });

  bench("5K lines", () => {
    serializeMarkdown(schema, doc5K);
  });
});
