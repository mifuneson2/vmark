/**
 * Source Mode Media Tag Decoration Plugin
 *
 * Purpose: Adds visual markers (colored left border + icon) to media HTML tags
 * in Source mode so users can identify <video>, <audio>, and video embed <iframe>
 * blocks at a glance without switching to WYSIWYG.
 *
 * Key decisions:
 *   - Detects opening tags (<video, <audio, <iframe with YouTube/Vimeo/Bilibili src)
 *     and decorates all lines through the closing tag
 *   - Uses a single combined regex per line instead of 5 separate tests
 *   - Closing-tag lookahead is bounded to 200 lines to prevent O(n) scans on unclosed tags
 *   - Each media type gets a distinct CSS class for type-specific colors
 *   - Rebuilds decorations on doc change or viewport change
 *
 * @coordinates-with blockVideo/tiptap.ts — WYSIWYG counterpart for video
 * @coordinates-with blockAudio/tiptap.ts — WYSIWYG counterpart for audio
 * @coordinates-with videoEmbed/tiptap.ts — WYSIWYG counterpart for video embeds
 * @module plugins/codemirror/sourceMediaDecoration
 */

import { RangeSetBuilder } from "@codemirror/state";
import {
  EditorView,
  Decoration,
  ViewPlugin,
  type DecorationSet,
  type ViewUpdate,
} from "@codemirror/view";

type MediaType = "video" | "audio" | "youtube" | "vimeo" | "bilibili";

interface MediaBlock {
  type: MediaType;
  startLine: number;
  endLine: number;
}

/** Maximum lines to scan forward looking for a closing tag */
const MAX_LOOKAHEAD = 200;

/** Combined opening tag regex — single pass per line instead of 5 separate tests */
const MEDIA_OPEN_REGEX = /^\s*<(video|audio|iframe)([\s>])/i;

/** Identify iframe media type by src attribute */
const IFRAME_SRC_YOUTUBE = /youtube(?:-nocookie)?\.com/i;
const IFRAME_SRC_VIMEO = /player\.vimeo\.com/i;
const IFRAME_SRC_BILIBILI = /player\.bilibili\.com/i;

const CLOSE_REGEXES: Record<string, RegExp> = {
  video: /<\/video>/i,
  audio: /<\/audio>/i,
  iframe: /<\/iframe>/i,
};

/** Check if a line contains a self-closing pattern (ends with />) */
const SELF_CLOSING_REGEX = /\/>\s*$/;

/**
 * Classify an iframe line by its src attribute.
 * Returns null if the iframe doesn't match any known video platform.
 */
function classifyIframe(text: string): MediaType | null {
  if (IFRAME_SRC_YOUTUBE.test(text)) return "youtube";
  if (IFRAME_SRC_VIMEO.test(text)) return "vimeo";
  if (IFRAME_SRC_BILIBILI.test(text)) return "bilibili";
  return null;
}

/**
 * Find all media blocks in the document.
 * Uses a single combined regex per line and bounded lookahead for closing tags.
 */
function findMediaBlocks(doc: { lines: number; line: (n: number) => { text: string; from: number } }): MediaBlock[] {
  const blocks: MediaBlock[] = [];
  let i = 1;

  while (i <= doc.lines) {
    const line = doc.line(i);
    const text = line.text;

    const openMatch = MEDIA_OPEN_REGEX.exec(text);
    if (!openMatch) {
      i++;
      continue;
    }

    const tag = openMatch[1].toLowerCase(); // "video", "audio", or "iframe"
    let type: MediaType | null = null;

    if (tag === "video" || tag === "audio") {
      type = tag;
    } else {
      // iframe — classify by src
      type = classifyIframe(text);
    }

    if (!type) {
      i++;
      continue;
    }

    const closeRegex = CLOSE_REGEXES[tag];
    const startLine = i;

    // Check if self-closing or close tag on same line
    if (SELF_CLOSING_REGEX.test(text) || closeRegex.test(text)) {
      blocks.push({ type, startLine, endLine: i });
      i++;
      continue;
    }

    // Find the closing tag on subsequent lines (bounded lookahead)
    let endLine = i;
    let foundClose = false;
    while (endLine < doc.lines && endLine - startLine < MAX_LOOKAHEAD) {
      endLine++;
      const nextLine = doc.line(endLine);
      if (closeRegex.test(nextLine.text)) {
        foundClose = true;
        break;
      }
    }

    if (foundClose) {
      blocks.push({ type, startLine, endLine });
    } else {
      // No close tag within lookahead — treat as single-line
      blocks.push({ type, startLine, endLine: startLine });
    }
    i = (foundClose ? endLine : startLine) + 1;
  }

  return blocks;
}

/**
 * Build decorations for media blocks.
 */
function buildMediaDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc;

  const mediaBlocks = findMediaBlocks(doc);

  for (const block of mediaBlocks) {
    const typeClass = `cm-media-${block.type}`;

    for (let lineNum = block.startLine; lineNum <= block.endLine; lineNum++) {
      const line = doc.line(lineNum);
      const classes = ["cm-media-tag", typeClass];

      if (lineNum === block.startLine) {
        classes.push("cm-media-first");
      }

      const decoration = Decoration.line({
        class: classes.join(" "),
      });
      builder.add(line.from, line.from, decoration);
    }
  }

  return builder.finish();
}

/**
 * ViewPlugin that applies media tag decorations.
 */
export function createSourceMediaDecorationPlugin() {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = buildMediaDecorations(view);
      }

      update(update: ViewUpdate) {
        /* v8 ignore next 3 -- @preserve viewportChanged branch and else path not covered in tests */
        if (update.docChanged || update.viewportChanged) {
          this.decorations = buildMediaDecorations(update.view);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
}

/**
 * All extensions for source media decoration.
 */
export const sourceMediaDecorationExtensions = [createSourceMediaDecorationPlugin()];
