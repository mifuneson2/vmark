/**
 * Inline Markdown Parser
 *
 * Parses inline markdown text to MDAST inline content.
 * Used for parsing summary text in details blocks.
 */

import type { Content, Paragraph } from "mdast";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { remarkCustomInline } from "./plugins/customInline";

/**
 * Parse inline markdown text to MDAST inline content.
 *
 * Wraps the text in a paragraph, parses it, and extracts the inline children.
 *
 * @param text - The inline markdown text to parse
 * @returns Array of inline MDAST content nodes
 */
export function parseInlineMarkdown(text: string): Content[] {
  if (!text || !text.trim()) {
    return [];
  }

  // Check if text contains any markdown characters that need parsing
  if (!/[*_`~[\]]/.test(text)) {
    // No markdown characters - return as plain text
    return [{ type: "text", value: text } as Content];
  }

  try {
    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm, { singleTilde: false })
      .use(remarkCustomInline);

    const tree = processor.parse(text);
    const transformed = processor.runSync(tree);

    // The parser creates a root with children
    // For inline text, this should result in a single paragraph
    const children = (transformed as { children?: Content[] }).children ?? [];

    if (children.length === 0) {
      return [{ type: "text", value: text } as Content];
    }

    // If the first child is a paragraph, return its children (inline content)
    const first = children[0];
    if (first && first.type === "paragraph") {
      return (first as Paragraph).children as Content[];
    }

    // Otherwise return the children as-is (shouldn't happen for inline text)
    return children;
  } catch (error) {
    // If parsing fails, return as plain text
    console.warn("[InlineParser] Failed to parse inline markdown:", error);
    return [{ type: "text", value: text } as Content];
  }
}
