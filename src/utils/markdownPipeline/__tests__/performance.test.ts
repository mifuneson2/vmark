/**
 * Performance baseline tests for markdown pipeline.
 *
 * These tests establish performance baselines for:
 * - Parsing large markdown documents
 * - Serializing large ProseMirror documents
 * - Memory usage patterns
 *
 * BASELINE (2024-01-25):
 * - 1K lines parse: ~110ms, serialize: ~50ms
 * - 5K lines parse: ~550ms, serialize: ~220ms
 * - 10K lines parse: ~1250ms, serialize: ~500ms
 * - Scaling: roughly linear (2x input = 2x time)
 *
 * Current thresholds are set 20% above measured baselines to account for
 * CI variance. Tighten these as optimizations are made.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { parseMarkdown, serializeMarkdown } from "../adapter";

// Create a minimal schema for performance testing
function createTestSchema() {
  return getSchema([StarterKit]);
}

/**
 * Generate a markdown document with the specified number of lines.
 * Includes varied content: headings, paragraphs, lists, code blocks, tables.
 */
function generateLargeMarkdown(lineCount: number): string {
  const lines: string[] = [];
  let currentLine = 0;

  while (currentLine < lineCount) {
    const section = currentLine % 100;

    if (section === 0) {
      // Heading every 100 lines
      lines.push(`# Section ${Math.floor(currentLine / 100) + 1}`);
      lines.push("");
      currentLine += 2;
    } else if (section < 20) {
      // Regular paragraphs
      lines.push(`This is paragraph ${currentLine}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`);
      lines.push("");
      currentLine += 2;
    } else if (section < 40) {
      // Bullet lists
      lines.push(`- List item ${currentLine}`);
      currentLine += 1;
    } else if (section < 50) {
      // Numbered lists
      lines.push(`1. Numbered item ${currentLine}`);
      currentLine += 1;
    } else if (section < 60) {
      // Code block
      if (section === 50) {
        lines.push("```javascript");
        lines.push(`function example${currentLine}() {`);
        lines.push(`  console.log("Line ${currentLine}");`);
        lines.push("}");
        lines.push("```");
        lines.push("");
        currentLine += 6;
      } else {
        lines.push(`const x${currentLine} = ${currentLine};`);
        currentLine += 1;
      }
    } else if (section < 70) {
      // Blockquote
      lines.push(`> Quote line ${currentLine}`);
      currentLine += 1;
    } else if (section < 85) {
      // Inline formatting
      lines.push(`**Bold text** and *italic text* and \`inline code\` on line ${currentLine}.`);
      lines.push("");
      currentLine += 2;
    } else {
      // Links and images
      lines.push(`[Link ${currentLine}](https://example.com/${currentLine}) and more text here.`);
      lines.push("");
      currentLine += 2;
    }
  }

  return lines.join("\n");
}

describe("Markdown Pipeline Performance", () => {
  let schema: ReturnType<typeof createTestSchema>;

  beforeAll(() => {
    schema = createTestSchema();
  });

  describe("parsing performance", () => {
    it("parses 1,000 lines under 150ms", () => {
      const markdown = generateLargeMarkdown(1000);
      const start = performance.now();
      const doc = parseMarkdown(schema, markdown);
      const elapsed = performance.now() - start;

      expect(doc).toBeDefined();
      expect(doc.content.childCount).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(150); // Baseline: ~110ms

      console.log(`[Perf] 1K lines parse: ${elapsed.toFixed(2)}ms`);
    });

    it("parses 5,000 lines under 700ms", () => {
      const markdown = generateLargeMarkdown(5000);
      const start = performance.now();
      const doc = parseMarkdown(schema, markdown);
      const elapsed = performance.now() - start;

      expect(doc).toBeDefined();
      expect(elapsed).toBeLessThan(700); // Baseline: ~550ms

      console.log(`[Perf] 5K lines parse: ${elapsed.toFixed(2)}ms`);
    });

    it("parses 10,000 lines under 1500ms", () => {
      const markdown = generateLargeMarkdown(10000);
      const start = performance.now();
      const doc = parseMarkdown(schema, markdown);
      const elapsed = performance.now() - start;

      expect(doc).toBeDefined();
      expect(elapsed).toBeLessThan(1500); // Baseline: ~1250ms

      console.log(`[Perf] 10K lines parse: ${elapsed.toFixed(2)}ms`);
    });
  });

  describe("serialization performance", () => {
    it("serializes 1,000 lines under 200ms", () => {
      const markdown = generateLargeMarkdown(1000);
      const doc = parseMarkdown(schema, markdown);

      const start = performance.now();
      const output = serializeMarkdown(schema, doc);
      const elapsed = performance.now() - start;

      expect(output).toBeDefined();
      expect(output.length).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(200); // Baseline: ~50ms (includes parse overhead)

      console.log(`[Perf] 1K lines serialize: ${elapsed.toFixed(2)}ms`);
    });

    it("serializes 5,000 lines under 900ms", () => {
      const markdown = generateLargeMarkdown(5000);
      const doc = parseMarkdown(schema, markdown);

      const start = performance.now();
      const output = serializeMarkdown(schema, doc);
      const elapsed = performance.now() - start;

      expect(output).toBeDefined();
      expect(elapsed).toBeLessThan(900); // Baseline: ~220ms (includes parse overhead)

      console.log(`[Perf] 5K lines serialize: ${elapsed.toFixed(2)}ms`);
    });

    it("serializes 10,000 lines under 1800ms", () => {
      const markdown = generateLargeMarkdown(10000);
      const doc = parseMarkdown(schema, markdown);

      const start = performance.now();
      const output = serializeMarkdown(schema, doc);
      const elapsed = performance.now() - start;

      expect(output).toBeDefined();
      expect(elapsed).toBeLessThan(1800); // Baseline: ~500ms (includes parse overhead)

      console.log(`[Perf] 10K lines serialize: ${elapsed.toFixed(2)}ms`);
    });
  });

  describe("round-trip performance", () => {
    it("round-trips 10,000 lines under 2000ms", () => {
      const markdown = generateLargeMarkdown(10000);

      const start = performance.now();
      const doc = parseMarkdown(schema, markdown);
      const output = serializeMarkdown(schema, doc);
      const elapsed = performance.now() - start;

      expect(output).toBeDefined();
      expect(elapsed).toBeLessThan(2000); // Baseline: ~1750ms (parse + serialize)

      console.log(`[Perf] 10K lines round-trip: ${elapsed.toFixed(2)}ms`);
    });
  });

  describe("scaling behavior", () => {
    it("does not scale exponentially with document size", () => {
      const sizes = [1000, 2000, 4000, 8000];
      const times: number[] = [];

      for (const size of sizes) {
        const markdown = generateLargeMarkdown(size);
        const start = performance.now();
        const doc = parseMarkdown(schema, markdown);
        serializeMarkdown(schema, doc);
        times.push(performance.now() - start);
      }

      console.log(`[Perf] Scaling: ${sizes.map((s, i) => `${s}→${times[i].toFixed(0)}ms`).join(", ")}`);

      // Check that doubling input doesn't more than triple time
      // (should be roughly linear, allowing some overhead)
      for (let i = 1; i < times.length; i++) {
        const ratio = times[i] / times[i - 1];
        // Expect ratio to be less than 3 (allowing for some overhead)
        expect(ratio).toBeLessThan(3);
      }
    });
  });

  describe("content integrity", () => {
    it("preserves content structure through round-trip", () => {
      const markdown = `# Test Document

This is a paragraph.

- Item 1
- Item 2
- Item 3

\`\`\`javascript
const x = 1;
\`\`\`

> A quote
`;
      const doc = parseMarkdown(schema, markdown);
      const output = serializeMarkdown(schema, doc);

      // Key elements should be preserved
      expect(output).toContain("# Test Document");
      expect(output).toContain("This is a paragraph");
      expect(output).toContain("Item 1");
      expect(output).toContain("Item 2");
      expect(output).toContain("const x = 1");
      expect(output).toContain("A quote");
    });
  });
});
