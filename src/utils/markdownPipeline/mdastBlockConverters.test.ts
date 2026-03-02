/**
 * Tests for MDAST block node converters (MDAST -> ProseMirror).
 *
 * Tests converter functions directly for edge cases not covered by
 * the integration tests in mdastToProseMirror.blocks.test.ts.
 */

import { describe, it, expect } from "vitest";
import { Schema } from "@tiptap/pm/model";
import type {
  Content,
  Paragraph,
  Heading,
  Code,
  Blockquote,
  List,
  ListItem,
  ThematicBreak,
  Table,
  TableRow,
  TableCell,
  Html,
  Definition,
  FootnoteDefinition,
} from "mdast";
import type { Math } from "mdast-util-math";
import type { Alert, Details, WikiLink, Yaml } from "./types";
import {
  convertParagraph,
  convertHeading,
  convertCode,
  convertBlockquote,
  convertList,
  convertListItem,
  convertThematicBreak,
  convertTable,
  convertMathBlock,
  convertDefinition,
  convertFrontmatter,
  convertDetails,
  convertAlert,
  convertWikiLink,
  convertHtml,
  convertFootnoteDefinition,
  convertAlertBlockquote,
  MATH_BLOCK_LANGUAGE,
  type MdastToPmContext,
} from "./mdastBlockConverters";
import { testSchema } from "./testSchema";

function createContext(schema: Schema = testSchema): MdastToPmContext {
  return {
    schema,
    convertChildren: (_children, _marks, _context) => {
      // Simple mock that converts text children to PM text nodes
      const result: import("@tiptap/pm/model").Node[] = [];
      for (const child of _children) {
        if (child.type === "text" && "value" in child) {
          result.push(schema.text(String(child.value)));
        }
      }
      return result;
    },
  };
}

/** Minimal schema missing optional node types */
const minimalSchema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { content: "inline*", group: "block" },
    text: { group: "inline" },
  },
});

describe("mdastBlockConverters", () => {
  const context = createContext();

  describe("convertParagraph", () => {
    it("creates paragraph with text children", () => {
      const node: Paragraph = {
        type: "paragraph",
        children: [{ type: "text", value: "hello" }],
      };
      const result = convertParagraph(context, node, []);
      expect(result).not.toBeNull();
      expect(result!.type.name).toBe("paragraph");
    });

    it("returns null when paragraph not in schema", () => {
      const schema = new Schema({
        nodes: { doc: { content: "text*" }, text: {} },
      });
      const ctx = createContext(schema);
      const node: Paragraph = {
        type: "paragraph",
        children: [{ type: "text", value: "hello" }],
      };
      const result = convertParagraph(ctx, node, []);
      expect(result).toBeNull();
    });

    it("sets sourceLine from position when schema supports it", () => {
      const schemaWithSourceLine = new Schema({
        nodes: {
          doc: { content: "block+" },
          paragraph: { attrs: { sourceLine: { default: null } }, content: "inline*", group: "block" },
          text: { group: "inline" },
        },
      });
      const ctx = createContext(schemaWithSourceLine);
      const node: Paragraph = {
        type: "paragraph",
        children: [{ type: "text", value: "hello" }],
        position: { start: { line: 5, column: 1 }, end: { line: 5, column: 6 } },
      };
      const result = convertParagraph(ctx, node, []);
      expect(result!.attrs.sourceLine).toBe(5);
    });

    it("handles paragraph with no position when schema supports sourceLine", () => {
      const schemaWithSourceLine = new Schema({
        nodes: {
          doc: { content: "block+" },
          paragraph: { attrs: { sourceLine: { default: null } }, content: "inline*", group: "block" },
          text: { group: "inline" },
        },
      });
      const ctx = createContext(schemaWithSourceLine);
      const node: Paragraph = {
        type: "paragraph",
        children: [{ type: "text", value: "hello" }],
      };
      const result = convertParagraph(ctx, node, []);
      expect(result!.attrs.sourceLine).toBeNull();
    });
  });

  describe("convertHeading", () => {
    it("creates heading with correct depth", () => {
      const node: Heading = {
        type: "heading",
        depth: 3,
        children: [{ type: "text", value: "Title" }],
      };
      const result = convertHeading(context, node, []);
      expect(result).not.toBeNull();
      expect(result!.type.name).toBe("heading");
      expect(result!.attrs.level).toBe(3);
    });

    it("generates heading ID when generateHeadingId is provided", () => {
      // Need a schema with id attr on heading
      const schemaWithId = new Schema({
        nodes: {
          doc: { content: "block+" },
          heading: {
            attrs: { level: { default: 1 }, sourceLine: { default: null }, id: { default: null } },
            content: "inline*",
            group: "block",
          },
          paragraph: { content: "inline*", group: "block" },
          text: { group: "inline" },
        },
      });
      const ctx: MdastToPmContext = {
        schema: schemaWithId,
        convertChildren: (_children, _marks, _context) => {
          const result: import("@tiptap/pm/model").Node[] = [];
          for (const child of _children) {
            if (child.type === "text" && "value" in child) {
              result.push(schemaWithId.text(String(child.value)));
            }
          }
          return result;
        },
        generateHeadingId: (text: string) => `id-${text.toLowerCase().replace(/\s+/g, "-")}`,
      };
      const node: Heading = {
        type: "heading",
        depth: 1,
        children: [{ type: "text", value: "Hello World" }],
      };
      const result = convertHeading(ctx, node, []);
      expect(result!.attrs.id).toBe("id-hello-world");
    });

    it("returns null when heading not in schema", () => {
      const ctx = createContext(minimalSchema);
      const node: Heading = { type: "heading", depth: 1, children: [] };
      const result = convertHeading(ctx, node, []);
      expect(result).toBeNull();
    });
  });

  describe("convertCode", () => {
    it("creates codeBlock with language", () => {
      const node: Code = { type: "code", lang: "javascript", value: "const x = 1;" };
      const result = convertCode(context, node);
      expect(result).not.toBeNull();
      expect(result!.type.name).toBe("codeBlock");
      expect(result!.attrs.language).toBe("javascript");
    });

    it("handles null language", () => {
      const node: Code = { type: "code", value: "plain code" };
      const result = convertCode(context, node);
      expect(result!.attrs.language).toBeNull();
    });

    it("handles empty value", () => {
      const node: Code = { type: "code", value: "" };
      const result = convertCode(context, node);
      expect(result).not.toBeNull();
      expect(result!.content.size).toBe(0);
    });

    it("returns null when codeBlock not in schema", () => {
      const ctx = createContext(minimalSchema);
      const node: Code = { type: "code", value: "code" };
      const result = convertCode(ctx, node);
      expect(result).toBeNull();
    });
  });

  describe("convertBlockquote", () => {
    it("creates blockquote node", () => {
      const node: Blockquote = {
        type: "blockquote",
        children: [{ type: "paragraph", children: [{ type: "text", value: "quote" }] }],
      };
      const result = convertBlockquote(context, node, []);
      expect(result).not.toBeNull();
      expect(result!.type.name).toBe("blockquote");
    });

    it("detects alert syntax and creates alertBlock instead", () => {
      const node: Blockquote = {
        type: "blockquote",
        children: [
          {
            type: "paragraph",
            children: [{ type: "text", value: "[!WARNING]\nBe careful" }],
          },
        ],
      };
      const result = convertBlockquote(context, node, []);
      expect(result).not.toBeNull();
      expect(result!.type.name).toBe("alertBlock");
      expect(result!.attrs.alertType).toBe("WARNING");
    });

    it("returns null when blockquote not in schema", () => {
      const ctx = createContext(minimalSchema);
      const node: Blockquote = {
        type: "blockquote",
        children: [{ type: "paragraph", children: [] }],
      };
      const result = convertBlockquote(ctx, node, []);
      expect(result).toBeNull();
    });
  });

  describe("convertList", () => {
    it("creates bulletList", () => {
      const node: List = {
        type: "list",
        ordered: false,
        children: [
          { type: "listItem", children: [{ type: "paragraph", children: [{ type: "text", value: "item" }] }] },
        ],
      };
      const result = convertList(context, node, []);
      expect(result).not.toBeNull();
      expect(result!.type.name).toBe("bulletList");
    });

    it("creates orderedList with start attribute", () => {
      const node: List = {
        type: "list",
        ordered: true,
        start: 3,
        children: [
          { type: "listItem", children: [{ type: "paragraph", children: [{ type: "text", value: "item" }] }] },
        ],
      };
      const result = convertList(context, node, []);
      expect(result!.type.name).toBe("orderedList");
      expect(result!.attrs.start).toBe(3);
    });

    it("defaults ordered start to 1", () => {
      const node: List = {
        type: "list",
        ordered: true,
        children: [
          { type: "listItem", children: [{ type: "paragraph", children: [] }] },
        ],
      };
      const result = convertList(context, node, []);
      expect(result!.attrs.start).toBe(1);
    });

    it("defaults ordered to false when undefined", () => {
      const node = {
        type: "list",
        children: [
          { type: "listItem", children: [{ type: "paragraph", children: [] }] },
        ],
      } as List;
      const result = convertList(context, node, []);
      expect(result!.type.name).toBe("bulletList");
    });
  });

  describe("convertListItem", () => {
    it("creates listItem with checked attribute", () => {
      const node: ListItem = {
        type: "listItem",
        checked: true,
        children: [{ type: "paragraph", children: [{ type: "text", value: "done" }] }],
      };
      const result = convertListItem(context, node, []);
      expect(result).not.toBeNull();
      expect(result!.attrs.checked).toBe(true);
    });

    it("creates listItem without checked when null", () => {
      const node: ListItem = {
        type: "listItem",
        children: [{ type: "paragraph", children: [{ type: "text", value: "item" }] }],
      };
      const result = convertListItem(context, node, []);
      // checked defaults to null in schema
      expect(result!.attrs.checked).toBeNull();
    });

    it("inserts empty paragraph for empty listItem", () => {
      const ctx: MdastToPmContext = {
        ...context,
        convertChildren: () => [], // simulate no children
      };
      const node: ListItem = { type: "listItem", children: [] };
      const result = convertListItem(ctx, node, []);
      expect(result).not.toBeNull();
      // Should have a fallback paragraph
      expect(result!.childCount).toBe(1);
      expect(result!.firstChild!.type.name).toBe("paragraph");
    });
  });

  describe("convertThematicBreak", () => {
    it("creates horizontalRule", () => {
      const node: ThematicBreak = { type: "thematicBreak" };
      const result = convertThematicBreak(context, node);
      expect(result).not.toBeNull();
      expect(result!.type.name).toBe("horizontalRule");
    });

    it("returns null when horizontalRule not in schema", () => {
      const ctx = createContext(minimalSchema);
      const node: ThematicBreak = { type: "thematicBreak" };
      const result = convertThematicBreak(ctx, node);
      expect(result).toBeNull();
    });
  });

  describe("convertTable", () => {
    it("creates table with header and data rows", () => {
      const node: Table = {
        type: "table",
        align: ["left", "center"],
        children: [
          {
            type: "tableRow",
            children: [
              { type: "tableCell", children: [{ type: "text", value: "A" }] },
              { type: "tableCell", children: [{ type: "text", value: "B" }] },
            ],
          },
          {
            type: "tableRow",
            children: [
              { type: "tableCell", children: [{ type: "text", value: "1" }] },
              { type: "tableCell", children: [{ type: "text", value: "2" }] },
            ],
          },
        ],
      };
      const result = convertTable(context, node, []);
      expect(result).not.toBeNull();
      expect(result!.type.name).toBe("table");
      expect(result!.childCount).toBe(2);
    });

    it("returns null when table node types missing from schema", () => {
      const ctx = createContext(minimalSchema);
      const node: Table = {
        type: "table",
        children: [
          {
            type: "tableRow",
            children: [{ type: "tableCell", children: [{ type: "text", value: "A" }] }],
          },
        ],
      };
      const result = convertTable(ctx, node, []);
      expect(result).toBeNull();
    });

    it("handles table with no alignment", () => {
      const node: Table = {
        type: "table",
        children: [
          {
            type: "tableRow",
            children: [{ type: "tableCell", children: [{ type: "text", value: "A" }] }],
          },
        ],
      };
      const result = convertTable(context, node, []);
      expect(result).not.toBeNull();
    });
  });

  describe("convertMathBlock", () => {
    it("creates codeBlock with math sentinel language", () => {
      const node = { type: "math", value: "x^2 + y^2" } as Math;
      const result = convertMathBlock(context, node);
      expect(result).not.toBeNull();
      expect(result!.type.name).toBe("codeBlock");
      expect(result!.attrs.language).toBe(MATH_BLOCK_LANGUAGE);
    });

    it("handles empty math value", () => {
      const node = { type: "math", value: "" } as Math;
      const result = convertMathBlock(context, node);
      expect(result).not.toBeNull();
      expect(result!.content.size).toBe(0);
    });
  });

  describe("convertDefinition", () => {
    it("creates link_definition node", () => {
      const node: Definition = {
        type: "definition",
        identifier: "ref",
        label: "Ref",
        url: "https://example.com",
        title: "Title",
      };
      const result = convertDefinition(context, node);
      expect(result).not.toBeNull();
      expect(result!.type.name).toBe("link_definition");
      expect(result!.attrs.identifier).toBe("ref");
      expect(result!.attrs.url).toBe("https://example.com");
    });

    it("handles missing label and title", () => {
      const node: Definition = {
        type: "definition",
        identifier: "ref",
        url: "https://example.com",
      };
      const result = convertDefinition(context, node);
      expect(result!.attrs.label).toBeNull();
      expect(result!.attrs.title).toBeNull();
    });

    it("returns null when link_definition not in schema", () => {
      const ctx = createContext(minimalSchema);
      const node: Definition = { type: "definition", identifier: "ref", url: "url" };
      const result = convertDefinition(ctx, node);
      expect(result).toBeNull();
    });
  });

  describe("convertFrontmatter", () => {
    it("creates frontmatter node", () => {
      const node: Yaml = { type: "yaml", value: "title: Test" };
      const result = convertFrontmatter(context, node);
      expect(result).not.toBeNull();
      expect(result!.type.name).toBe("frontmatter");
      expect(result!.attrs.value).toBe("title: Test");
    });

    it("handles empty frontmatter value", () => {
      const node = { type: "yaml", value: "" } as Yaml;
      const result = convertFrontmatter(context, node);
      expect(result!.attrs.value).toBe("");
    });

    it("returns null when frontmatter not in schema", () => {
      const ctx = createContext(minimalSchema);
      const node: Yaml = { type: "yaml", value: "title: Test" };
      const result = convertFrontmatter(ctx, node);
      expect(result).toBeNull();
    });
  });

  describe("convertDetails", () => {
    it("creates detailsBlock with summary", () => {
      const node: Details = {
        type: "details",
        open: true,
        summary: "Click me",
        children: [{ type: "paragraph", children: [{ type: "text", value: "Hidden" }] }],
      };
      const result = convertDetails(context, node, []);
      expect(result).not.toBeNull();
      expect(result!.type.name).toBe("detailsBlock");
      expect(result!.attrs.open).toBe(true);
    });

    it("defaults summary to 'Details' when missing", () => {
      const node: Details = {
        type: "details",
        children: [{ type: "paragraph", children: [{ type: "text", value: "Content" }] }],
      };
      const result = convertDetails(context, node, []);
      expect(result).not.toBeNull();
      // The summary node should be created with default text
      const summaryChild = result!.firstChild;
      expect(summaryChild!.type.name).toBe("detailsSummary");
    });

    it("returns null when detailsBlock not in schema", () => {
      const ctx = createContext(minimalSchema);
      const node: Details = { type: "details", children: [] };
      const result = convertDetails(ctx, node, []);
      expect(result).toBeNull();
    });

    it("inserts empty paragraph when children are empty", () => {
      const ctx: MdastToPmContext = {
        ...context,
        convertChildren: (_children, _marks, ctxType) => {
          // Return empty for block children, non-empty for inline (summary)
          if (ctxType === "block") return [];
          return [testSchema.text("Summary")];
        },
      };
      const node: Details = {
        type: "details",
        summary: "Summary",
        children: [],
      };
      const result = convertDetails(ctx, node, []);
      expect(result).not.toBeNull();
      // Should have summary + at least one block child (empty paragraph)
      expect(result!.childCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe("convertAlert", () => {
    it("creates alertBlock with type", () => {
      const node: Alert = {
        type: "alert",
        alertType: "TIP",
        children: [{ type: "paragraph", children: [{ type: "text", value: "Tip text" }] }],
      };
      const result = convertAlert(context, node, []);
      expect(result).not.toBeNull();
      expect(result!.type.name).toBe("alertBlock");
      expect(result!.attrs.alertType).toBe("TIP");
    });

    it("returns null when alertBlock not in schema", () => {
      const ctx = createContext(minimalSchema);
      const node: Alert = { type: "alert", alertType: "NOTE", children: [] };
      const result = convertAlert(ctx, node, []);
      expect(result).toBeNull();
    });

    it("inserts empty paragraph when children are empty", () => {
      const ctx: MdastToPmContext = {
        ...context,
        convertChildren: () => [],
      };
      const node: Alert = { type: "alert", alertType: "NOTE", children: [] };
      const result = convertAlert(ctx, node, []);
      expect(result).not.toBeNull();
      expect(result!.childCount).toBe(1);
      expect(result!.firstChild!.type.name).toBe("paragraph");
    });
  });

  describe("convertWikiLink", () => {
    it("creates wikiLink with value and alias", () => {
      const node: WikiLink = { type: "wikiLink", value: "Page", alias: "Alias" };
      const result = convertWikiLink(context, node);
      expect(result).not.toBeNull();
      expect(result!.type.name).toBe("wikiLink");
      expect(result!.attrs.value).toBe("Page");
      expect(result!.textContent).toBe("Alias");
    });

    it("creates wikiLink without alias", () => {
      const node: WikiLink = { type: "wikiLink", value: "Page" };
      const result = convertWikiLink(context, node);
      expect(result!.attrs.value).toBe("Page");
      expect(result!.textContent).toBe("Page");
    });

    it("returns null when wikiLink not in schema", () => {
      const ctx = createContext(minimalSchema);
      const node: WikiLink = { type: "wikiLink", value: "Page" };
      const result = convertWikiLink(ctx, node);
      expect(result).toBeNull();
    });
  });

  describe("convertHtml", () => {
    it("creates html_block for block context", () => {
      const node: Html = { type: "html", value: "<div>content</div>" };
      const result = convertHtml(context, node, false);
      expect(result).not.toBeNull();
      expect(result!.type.name).toBe("html_block");
      expect(result!.attrs.value).toBe("<div>content</div>");
    });

    it("creates html_inline for inline context", () => {
      const node: Html = { type: "html", value: "<kbd>X</kbd>" };
      const result = convertHtml(context, node, true);
      expect(result).not.toBeNull();
      expect(result!.type.name).toBe("html_inline");
    });

    it("handles empty HTML value", () => {
      const node: Html = { type: "html", value: "" };
      const result = convertHtml(context, node, false);
      expect(result!.attrs.value).toBe("");
    });

    it("returns null when html_block not in schema", () => {
      const ctx = createContext(minimalSchema);
      const node: Html = { type: "html", value: "<div>x</div>" };
      const result = convertHtml(ctx, node, false);
      expect(result).toBeNull();
    });
  });

  describe("convertFootnoteDefinition", () => {
    it("creates footnote_definition node", () => {
      const node = {
        type: "footnoteDefinition",
        identifier: "1",
        children: [{ type: "paragraph", children: [{ type: "text", value: "Footnote" }] }],
      } as unknown as FootnoteDefinition;
      const result = convertFootnoteDefinition(context, node, []);
      expect(result).not.toBeNull();
      expect(result!.type.name).toBe("footnote_definition");
      expect(result!.attrs.label).toBe("1");
    });

    it("returns null when footnote_definition not in schema", () => {
      const ctx = createContext(minimalSchema);
      const node = {
        type: "footnoteDefinition",
        identifier: "1",
        children: [],
      } as unknown as FootnoteDefinition;
      const result = convertFootnoteDefinition(ctx, node, []);
      expect(result).toBeNull();
    });
  });

  describe("convertAlertBlockquote", () => {
    it("detects [!NOTE] marker", () => {
      const node: Blockquote = {
        type: "blockquote",
        children: [
          {
            type: "paragraph",
            children: [{ type: "text", value: "[!NOTE]\nSome note" }],
          },
        ],
      };
      const result = convertAlertBlockquote(context, node, []);
      expect(result).not.toBeNull();
      expect(result!.type.name).toBe("alertBlock");
      expect(result!.attrs.alertType).toBe("NOTE");
    });

    it("detects all alert types", () => {
      for (const alertType of ["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"]) {
        const node: Blockquote = {
          type: "blockquote",
          children: [
            {
              type: "paragraph",
              children: [{ type: "text", value: `[!${alertType}]` }],
            },
          ],
        };
        const result = convertAlertBlockquote(context, node, []);
        expect(result).not.toBeNull();
        expect(result!.attrs.alertType).toBe(alertType);
      }
    });

    it("returns null for non-alert blockquote", () => {
      const node: Blockquote = {
        type: "blockquote",
        children: [
          {
            type: "paragraph",
            children: [{ type: "text", value: "Just a quote" }],
          },
        ],
      };
      const result = convertAlertBlockquote(context, node, []);
      expect(result).toBeNull();
    });

    it("returns null when first child is not paragraph", () => {
      const node: Blockquote = {
        type: "blockquote",
        children: [{ type: "code", value: "code" }],
      };
      const result = convertAlertBlockquote(context, node, []);
      expect(result).toBeNull();
    });

    it("returns null when blockquote is empty", () => {
      const node: Blockquote = {
        type: "blockquote",
        children: [],
      };
      const result = convertAlertBlockquote(context, node, []);
      expect(result).toBeNull();
    });

    it("returns null when alertBlock not in schema", () => {
      const ctx = createContext(minimalSchema);
      const node: Blockquote = {
        type: "blockquote",
        children: [
          {
            type: "paragraph",
            children: [{ type: "text", value: "[!NOTE]\nContent" }],
          },
        ],
      };
      const result = convertAlertBlockquote(ctx, node, []);
      expect(result).toBeNull();
    });

    it("handles alert marker with remaining text on first line", () => {
      const node: Blockquote = {
        type: "blockquote",
        children: [
          {
            type: "paragraph",
            children: [{ type: "text", value: "[!TIP] This is a tip" }],
          },
        ],
      };
      const result = convertAlertBlockquote(context, node, []);
      expect(result).not.toBeNull();
      expect(result!.attrs.alertType).toBe("TIP");
    });

    it("strips break node after alert marker", () => {
      const node: Blockquote = {
        type: "blockquote",
        children: [
          {
            type: "paragraph",
            children: [
              { type: "text", value: "[!NOTE]" },
              { type: "break" },
              { type: "text", value: "Content" },
            ],
          },
        ],
      };
      const result = convertAlertBlockquote(context, node, []);
      expect(result).not.toBeNull();
      expect(result!.attrs.alertType).toBe("NOTE");
    });

    it("handles case-insensitive alert type", () => {
      const node: Blockquote = {
        type: "blockquote",
        children: [
          {
            type: "paragraph",
            children: [{ type: "text", value: "[!note]\nContent" }],
          },
        ],
      };
      const result = convertAlertBlockquote(context, node, []);
      expect(result).not.toBeNull();
      expect(result!.attrs.alertType).toBe("NOTE");
    });
  });

  describe("MATH_BLOCK_LANGUAGE sentinel", () => {
    it("has expected value", () => {
      expect(MATH_BLOCK_LANGUAGE).toBe("$$math$$");
    });
  });
});
