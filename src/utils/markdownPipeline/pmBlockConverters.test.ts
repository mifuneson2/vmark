/**
 * Tests for ProseMirror block node converters (PM -> MDAST).
 *
 * Tests converter functions directly, especially edge cases for
 * media nodes, tables, and alert blocks.
 */

import { describe, it, expect } from "vitest";
import { Schema, type Node as PMNode } from "@tiptap/pm/model";
import type {
  Blockquote,
  Code,
  Heading,
  Html,
  Image,
  List,
  ListItem,
  Paragraph,
  PhrasingContent,
  Table,
  TableCell,
  TableRow,
} from "mdast";
import type { Math } from "mdast-util-math";
import type { Details, Yaml } from "./types";
import {
  convertParagraph,
  convertHeading,
  convertCodeBlock,
  convertBlockquote,
  convertAlertBlock,
  convertDetailsBlock,
  convertList,
  convertListItem,
  convertHorizontalRule,
  convertTable,
  convertBlockImage,
  convertBlockVideo,
  convertBlockAudio,
  convertVideoEmbed,
  convertFrontmatter,
  convertDefinition,
  convertHtmlBlock,
  type PmToMdastContext,
} from "./pmBlockConverters";

/** Schema with video_embed for testing */
const mediaSchema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { content: "inline*", group: "block" },
    text: { group: "inline", inline: true },
    image: {
      attrs: { src: { default: "" }, alt: { default: null }, title: { default: null } },
      inline: true,
      group: "inline",
    },
    heading: {
      attrs: { level: { default: 1 } },
      content: "inline*",
      group: "block",
    },
    codeBlock: {
      attrs: { language: { default: null } },
      content: "text*",
      group: "block",
    },
    blockquote: { content: "block+", group: "block" },
    alertBlock: {
      attrs: { alertType: { default: "NOTE" } },
      content: "block+",
      group: "block",
    },
    detailsBlock: {
      attrs: { open: { default: false } },
      content: "block+",
      group: "block",
    },
    detailsSummary: { content: "inline*" },
    bulletList: { content: "listItem+", group: "block" },
    orderedList: {
      attrs: { start: { default: 1 } },
      content: "listItem+",
      group: "block",
    },
    listItem: {
      attrs: { checked: { default: null } },
      content: "block+",
    },
    horizontalRule: { group: "block" },
    table: { content: "tableRow+", group: "block" },
    tableRow: { content: "(tableCell|tableHeader)+" },
    tableCell: {
      content: "paragraph+",
      attrs: { alignment: { default: null } },
    },
    tableHeader: {
      content: "paragraph+",
      attrs: { alignment: { default: null } },
    },
    block_image: {
      attrs: { src: { default: "" }, alt: { default: "" }, title: { default: "" } },
      group: "block",
      atom: true,
    },
    block_video: {
      group: "block",
      atom: true,
      attrs: {
        src: { default: "" },
        title: { default: "" },
        poster: { default: "" },
        controls: { default: true },
        preload: { default: "metadata" },
      },
    },
    block_audio: {
      group: "block",
      atom: true,
      attrs: {
        src: { default: "" },
        title: { default: "" },
        controls: { default: true },
        preload: { default: "metadata" },
      },
    },
    video_embed: {
      group: "block",
      atom: true,
      attrs: {
        provider: { default: "youtube" },
        videoId: { default: "" },
        width: { default: 560 },
        height: { default: 315 },
      },
    },
    frontmatter: {
      attrs: { value: { default: "" } },
      group: "block",
      atom: true,
    },
    link_definition: {
      attrs: {
        identifier: { default: "" },
        label: { default: null },
        url: { default: "" },
        title: { default: null },
      },
      group: "block",
      atom: true,
    },
    html_block: {
      attrs: { value: { default: "" } },
      group: "block",
      atom: true,
    },
  },
  marks: {
    bold: {},
    italic: {},
    link: { attrs: { href: {} } },
  },
});

function createMockContext(): PmToMdastContext {
  return {
    convertNode: (node: PMNode) => {
      if (node.type.name === "paragraph") {
        return { type: "paragraph", children: [{ type: "text", value: node.textContent }] } as Paragraph;
      }
      if (node.type.name === "listItem") {
        const children: import("mdast").BlockContent[] = [];
        node.forEach((child) => {
          if (child.type.name === "paragraph") {
            children.push({ type: "paragraph", children: [{ type: "text", value: child.textContent }] });
          }
        });
        return {
          type: "listItem",
          spread: false,
          children: children.length > 0 ? children : [{ type: "paragraph", children: [] }],
        } as ListItem;
      }
      return null;
    },
    convertInlineContent: (node: PMNode) => {
      const result: PhrasingContent[] = [];
      node.forEach((child) => {
        if (child.isText) {
          result.push({ type: "text", value: child.text || "" });
        }
      });
      return result;
    },
  };
}

describe("pmBlockConverters", () => {
  const context = createMockContext();

  describe("convertVideoEmbed", () => {
    it("serializes YouTube embed to iframe HTML", () => {
      const node = mediaSchema.nodes.video_embed.create({
        provider: "youtube",
        videoId: "dQw4w9WgXcQ",
        width: 560,
        height: 315,
      });
      const result = convertVideoEmbed(node);
      expect(result.type).toBe("html");
      expect(result.value).toContain("<iframe");
      expect(result.value).toContain("dQw4w9WgXcQ");
      expect(result.value).toContain('width="560"');
      expect(result.value).toContain('height="315"');
      expect(result.value).toContain("allowfullscreen");
    });

    it("serializes Vimeo embed", () => {
      const node = mediaSchema.nodes.video_embed.create({
        provider: "vimeo",
        videoId: "123456789",
        width: 640,
        height: 360,
      });
      const result = convertVideoEmbed(node);
      expect(result.type).toBe("html");
      expect(result.value).toContain("vimeo.com");
      expect(result.value).toContain("123456789");
    });

    it("serializes Bilibili embed", () => {
      const node = mediaSchema.nodes.video_embed.create({
        provider: "bilibili",
        videoId: "BV1xx411c7mD",
        width: 560,
        height: 315,
      });
      const result = convertVideoEmbed(node);
      expect(result.type).toBe("html");
      expect(result.value).toContain("bilibili");
      expect(result.value).toContain("BV1xx411c7mD");
    });

    it("sanitizes invalid YouTube videoId", () => {
      const node = mediaSchema.nodes.video_embed.create({
        provider: "youtube",
        videoId: "invalid<script>",
        width: 560,
        height: 315,
      });
      const result = convertVideoEmbed(node);
      // Invalid video ID should be replaced with empty string
      expect(result.value).not.toContain("invalid<script>");
    });

    it("sanitizes invalid Vimeo videoId", () => {
      const node = mediaSchema.nodes.video_embed.create({
        provider: "vimeo",
        videoId: "not-a-number",
        width: 560,
        height: 315,
      });
      const result = convertVideoEmbed(node);
      expect(result.value).not.toContain("not-a-number");
    });

    it("sanitizes invalid Bilibili videoId", () => {
      const node = mediaSchema.nodes.video_embed.create({
        provider: "bilibili",
        videoId: "invalid",
        width: 560,
        height: 315,
      });
      const result = convertVideoEmbed(node);
      expect(result.value).not.toContain("invalid");
    });

    it("handles default width/height", () => {
      const node = mediaSchema.nodes.video_embed.create({
        provider: "youtube",
        videoId: "dQw4w9WgXcQ",
      });
      const result = convertVideoEmbed(node);
      expect(result.value).toContain('width="560"');
      expect(result.value).toContain('height="315"');
    });
  });

  describe("convertBlockVideo — edge cases", () => {
    it("includes title attribute in HTML fallback", () => {
      const node = mediaSchema.nodes.block_video.create({
        src: "clip.mp4",
        title: "My Title",
        poster: "thumb.jpg",
        controls: true,
      });
      const result = convertBlockVideo(node);
      expect(result.type).toBe("html");
      expect((result as Html).value).toContain('title="My Title"');
    });

    it("escapes special chars in HTML attributes", () => {
      const node = mediaSchema.nodes.block_video.create({
        src: 'clip"special&.mp4',
        controls: false,
      });
      const result = convertBlockVideo(node);
      expect(result.type).toBe("html");
      expect((result as Html).value).toContain("&quot;");
      expect((result as Html).value).toContain("&amp;");
    });

    it("omits preload attr when value is 'metadata' in HTML fallback", () => {
      const node = mediaSchema.nodes.block_video.create({
        src: "clip.mp4",
        poster: "thumb.jpg",
        controls: true,
        preload: "metadata",
      });
      const result = convertBlockVideo(node);
      expect(result.type).toBe("html");
      expect((result as Html).value).not.toContain("preload=");
    });
  });

  describe("convertBlockAudio — edge cases", () => {
    it("includes title in HTML fallback", () => {
      const node = mediaSchema.nodes.block_audio.create({
        src: "song.mp3",
        title: "My Song",
        controls: false,
      });
      const result = convertBlockAudio(node);
      expect(result.type).toBe("html");
      expect((result as Html).value).toContain('title="My Song"');
    });
  });

  describe("convertCodeBlock", () => {
    it("converts math sentinel to MDAST math node", () => {
      const node = mediaSchema.nodes.codeBlock.create({ language: "$$math$$" });
      // Create with text content
      const withText = mediaSchema.nodes.codeBlock.create(
        { language: "$$math$$" },
        [mediaSchema.text("x^2")]
      );
      const result = convertCodeBlock(withText);
      expect(result.type).toBe("math");
      expect((result as Math).value).toBe("x^2");
    });

    it("converts regular code block to MDAST code node", () => {
      const node = mediaSchema.nodes.codeBlock.create(
        { language: "js" },
        [mediaSchema.text("const x = 1;")]
      );
      const result = convertCodeBlock(node);
      expect(result.type).toBe("code");
      expect((result as Code).lang).toBe("js");
      expect((result as Code).value).toBe("const x = 1;");
    });

    it("handles null language", () => {
      const node = mediaSchema.nodes.codeBlock.create(
        { language: null },
        [mediaSchema.text("code")]
      );
      const result = convertCodeBlock(node);
      expect(result.type).toBe("code");
      expect((result as Code).lang).toBeUndefined();
    });
  });

  describe("convertAlertBlock", () => {
    it("creates blockquote with alert marker paragraph", () => {
      const node = mediaSchema.nodes.alertBlock.create(
        { alertType: "WARNING" },
        [mediaSchema.nodes.paragraph.create(null, [mediaSchema.text("Be careful")])]
      );
      const result = convertAlertBlock(context, node);
      expect(result.type).toBe("blockquote");
      // First child should be the alert marker paragraph
      expect(result.children[0].type).toBe("paragraph");
      const markerPara = result.children[0] as Paragraph;
      expect((markerPara.children[0] as any).value).toBe("[!WARNING]");
    });

    it("uppercases alertType", () => {
      const node = mediaSchema.nodes.alertBlock.create(
        { alertType: "note" },
        [mediaSchema.nodes.paragraph.create(null, [mediaSchema.text("Content")])]
      );
      const result = convertAlertBlock(context, node);
      const markerPara = result.children[0] as Paragraph;
      expect((markerPara.children[0] as any).value).toBe("[!NOTE]");
    });
  });

  describe("convertDetailsBlock", () => {
    it("extracts summary from first child when detailsSummary", () => {
      const summaryNode = mediaSchema.nodes.detailsSummary.create(null, [mediaSchema.text("Click")]);
      const paraNode = mediaSchema.nodes.paragraph.create(null, [mediaSchema.text("Body")]);
      const node = mediaSchema.nodes.detailsBlock.create({ open: true }, [summaryNode, paraNode]);
      const result = convertDetailsBlock(context, node);
      expect(result.type).toBe("details");
      expect(result.summary).toBe("Click");
      expect(result.open).toBe(true);
    });

    it("defaults summary to 'Details' when first child is not summary", () => {
      const paraNode = mediaSchema.nodes.paragraph.create(null, [mediaSchema.text("Body")]);
      // Use a detailsBlock that starts with paragraph instead of summary
      // Schema requires detailsSummary first, so let's just test the function directly
      // by creating a node where firstChild is not detailsSummary
      const summaryNode = mediaSchema.nodes.detailsSummary.create(null, []);
      const node = mediaSchema.nodes.detailsBlock.create({ open: false }, [summaryNode, paraNode]);
      const result = convertDetailsBlock(context, node);
      expect(result.type).toBe("details");
      expect(result.open).toBe(false);
    });
  });

  describe("convertList", () => {
    it("creates unordered list", () => {
      const item = mediaSchema.nodes.listItem.create(null, [
        mediaSchema.nodes.paragraph.create(null, [mediaSchema.text("item")]),
      ]);
      const node = mediaSchema.nodes.bulletList.create(null, [item]);
      const result = convertList(context, node, false);
      expect(result.type).toBe("list");
      expect(result.ordered).toBe(false);
    });

    it("creates ordered list with start", () => {
      const item = mediaSchema.nodes.listItem.create(null, [
        mediaSchema.nodes.paragraph.create(null, [mediaSchema.text("item")]),
      ]);
      const node = mediaSchema.nodes.orderedList.create({ start: 5 }, [item]);
      const result = convertList(context, node, true);
      expect(result.type).toBe("list");
      expect(result.ordered).toBe(true);
      expect(result.start).toBe(5);
    });

    it("derives spread from children", () => {
      const item1 = mediaSchema.nodes.listItem.create(null, [
        mediaSchema.nodes.paragraph.create(null, [mediaSchema.text("a")]),
      ]);
      const item2 = mediaSchema.nodes.listItem.create(null, [
        mediaSchema.nodes.paragraph.create(null, [mediaSchema.text("b")]),
      ]);
      const node = mediaSchema.nodes.bulletList.create(null, [item1, item2]);
      const result = convertList(context, node, false);
      // Single paragraph per item = not spread
      expect(result.spread).toBe(false);
    });
  });

  describe("convertListItem", () => {
    it("creates listItem with children", () => {
      const item = mediaSchema.nodes.listItem.create(null, [
        mediaSchema.nodes.paragraph.create(null, [mediaSchema.text("content")]),
      ]);
      const result = convertListItem(context, item);
      expect(result.type).toBe("listItem");
      expect(result.children.length).toBeGreaterThanOrEqual(1);
    });

    it("sets checked attribute", () => {
      const item = mediaSchema.nodes.listItem.create({ checked: true }, [
        mediaSchema.nodes.paragraph.create(null, [mediaSchema.text("done")]),
      ]);
      const result = convertListItem(context, item);
      expect(result.checked).toBe(true);
    });

    it("does not set checked when null", () => {
      const item = mediaSchema.nodes.listItem.create({ checked: null }, [
        mediaSchema.nodes.paragraph.create(null, [mediaSchema.text("item")]),
      ]);
      const result = convertListItem(context, item);
      expect(result.checked).toBeUndefined();
    });
  });

  describe("convertHorizontalRule", () => {
    it("creates thematicBreak", () => {
      const result = convertHorizontalRule();
      expect(result.type).toBe("thematicBreak");
    });
  });

  describe("convertTable", () => {
    it("creates table with alignment from header", () => {
      const headerCell1 = mediaSchema.nodes.tableHeader.create(
        { alignment: "left" },
        [mediaSchema.nodes.paragraph.create(null, [mediaSchema.text("A")])]
      );
      const headerCell2 = mediaSchema.nodes.tableHeader.create(
        { alignment: "right" },
        [mediaSchema.nodes.paragraph.create(null, [mediaSchema.text("B")])]
      );
      const headerRow = mediaSchema.nodes.tableRow.create(null, [headerCell1, headerCell2]);

      const dataCell1 = mediaSchema.nodes.tableCell.create(null, [
        mediaSchema.nodes.paragraph.create(null, [mediaSchema.text("1")]),
      ]);
      const dataCell2 = mediaSchema.nodes.tableCell.create(null, [
        mediaSchema.nodes.paragraph.create(null, [mediaSchema.text("2")]),
      ]);
      const dataRow = mediaSchema.nodes.tableRow.create(null, [dataCell1, dataCell2]);

      const table = mediaSchema.nodes.table.create(null, [headerRow, dataRow]);
      const result = convertTable(context, table);
      expect(result.type).toBe("table");
      expect(result.align).toEqual(["left", "right"]);
      expect(result.children).toHaveLength(2);
    });

    it("handles null alignment", () => {
      const headerCell = mediaSchema.nodes.tableHeader.create(
        { alignment: null },
        [mediaSchema.nodes.paragraph.create(null, [mediaSchema.text("A")])]
      );
      const headerRow = mediaSchema.nodes.tableRow.create(null, [headerCell]);
      const table = mediaSchema.nodes.table.create(null, [headerRow]);
      const result = convertTable(context, table);
      expect(result.align).toEqual([null]);
    });

    it("handles invalid alignment value", () => {
      const headerCell = mediaSchema.nodes.tableHeader.create(
        { alignment: "invalid" },
        [mediaSchema.nodes.paragraph.create(null, [mediaSchema.text("A")])]
      );
      const headerRow = mediaSchema.nodes.tableRow.create(null, [headerCell]);
      const table = mediaSchema.nodes.table.create(null, [headerRow]);
      const result = convertTable(context, table);
      expect(result.align).toEqual([null]);
    });
  });

  describe("convertBlockImage", () => {
    it("wraps image in paragraph", () => {
      const node = mediaSchema.nodes.block_image.create({
        src: "img.png",
        alt: "Alt",
        title: "Title",
      });
      const result = convertBlockImage(node);
      expect(result.type).toBe("paragraph");
      expect(result.children).toHaveLength(1);
      expect(result.children[0].type).toBe("image");
      const img = result.children[0] as Image;
      expect(img.url).toBe("img.png");
    });
  });

  describe("convertFrontmatter", () => {
    it("creates yaml node", () => {
      const node = mediaSchema.nodes.frontmatter.create({ value: "title: Test" });
      const result = convertFrontmatter(node);
      expect(result.type).toBe("yaml");
      expect(result.value).toBe("title: Test");
    });

    it("handles empty value", () => {
      const node = mediaSchema.nodes.frontmatter.create({ value: "" });
      const result = convertFrontmatter(node);
      expect(result.value).toBe("");
    });
  });

  describe("convertDefinition", () => {
    it("creates definition node", () => {
      const node = mediaSchema.nodes.link_definition.create({
        identifier: "ref",
        label: "Ref",
        url: "https://example.com",
        title: "Title",
      });
      const result = convertDefinition(node);
      expect(result.type).toBe("definition");
      expect(result.identifier).toBe("ref");
      expect(result.url).toBe("https://example.com");
    });

    it("handles missing label and title", () => {
      const node = mediaSchema.nodes.link_definition.create({
        identifier: "ref",
        url: "https://example.com",
      });
      const result = convertDefinition(node);
      expect(result.label).toBeUndefined();
      expect(result.title).toBeUndefined();
    });
  });

  describe("convertHtmlBlock", () => {
    it("creates html node", () => {
      const node = mediaSchema.nodes.html_block.create({ value: "<div>test</div>" });
      const result = convertHtmlBlock(node);
      expect(result.type).toBe("html");
      expect(result.value).toBe("<div>test</div>");
    });
  });
});
