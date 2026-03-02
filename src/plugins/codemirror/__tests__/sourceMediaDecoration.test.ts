/**
 * Tests for sourceMediaDecoration — media block detection via the ViewPlugin.
 *
 * Tests findMediaBlocks logic through the actual plugin:
 * - Video, audio, and iframe (YouTube/Vimeo/Bilibili) detection
 * - Self-closing tags, multi-line blocks, bounded lookahead
 * - Edge cases: empty doc, no close tag, unknown iframe src
 */

import { describe, it, expect, afterEach } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

import { createSourceMediaDecorationPlugin } from "../sourceMediaDecoration";

let pluginRef: ReturnType<typeof createSourceMediaDecorationPlugin>;

function createView(content: string): EditorView {
  pluginRef = createSourceMediaDecorationPlugin();
  const state = EditorState.create({
    doc: content,
    extensions: [pluginRef],
  });
  return new EditorView({ state, parent: document.createElement("div") });
}

function getDecorationSpecs(view: EditorView): Array<{ from: number; to: number; class: string }> {
  const value = view.plugin(pluginRef);
  if (!value) return [];

  const result: Array<{ from: number; to: number; class: string }> = [];
  const iter = value.decorations.iter();
  while (iter.value) {
    const spec = iter.value.spec as { class?: string };
    result.push({ from: iter.from, to: iter.to, class: spec.class ?? "" });
    iter.next();
  }
  return result;
}

const createdViews: EditorView[] = [];
function tracked(content: string): EditorView {
  const v = createView(content);
  createdViews.push(v);
  return v;
}

afterEach(() => {
  createdViews.forEach((v) => v.destroy());
  createdViews.length = 0;
});

describe("sourceMediaDecoration (plugin integration)", () => {
  describe("empty and no-match documents", () => {
    it("produces no decorations for empty document", () => {
      const view = tracked("");
      expect(getDecorationSpecs(view)).toHaveLength(0);
    });

    it("produces no decorations for plain text", () => {
      const view = tracked("Hello world\nJust text.");
      expect(getDecorationSpecs(view)).toHaveLength(0);
    });

    it("produces no decorations for non-media HTML tags", () => {
      const view = tracked("<div>Hello</div>\n<p>World</p>");
      expect(getDecorationSpecs(view)).toHaveLength(0);
    });
  });

  describe("video tag detection", () => {
    it("detects single-line <video> with close on same line", () => {
      const content = '<video src="test.mp4"></video>';
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(1);
      expect(specs[0].class).toContain("cm-media-video");
      expect(specs[0].class).toContain("cm-media-first");
    });

    it("detects multi-line <video> block", () => {
      const content = '<video controls>\n  <source src="test.mp4">\n</video>';
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(3);
      expect(specs[0].class).toContain("cm-media-first");
      expect(specs[0].class).toContain("cm-media-video");
      expect(specs[1].class).toContain("cm-media-video");
      expect(specs[1].class).not.toContain("cm-media-first");
      expect(specs[2].class).toContain("cm-media-video");
    });

    it("detects self-closing <video />", () => {
      const content = '<video src="test.mp4" />';
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(1);
      expect(specs[0].class).toContain("cm-media-video");
    });
  });

  describe("audio tag detection", () => {
    it("detects <audio> tag", () => {
      const content = '<audio src="song.mp3"></audio>';
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(1);
      expect(specs[0].class).toContain("cm-media-audio");
    });

    it("detects multi-line <audio> block", () => {
      const content = '<audio controls>\n  <source src="song.mp3">\n</audio>';
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(3);
      specs.forEach((s) => expect(s.class).toContain("cm-media-audio"));
    });
  });

  describe("iframe detection", () => {
    it("detects YouTube iframe", () => {
      const content = '<iframe src="https://www.youtube.com/embed/abc"></iframe>';
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(1);
      expect(specs[0].class).toContain("cm-media-youtube");
    });

    it("detects YouTube-nocookie iframe", () => {
      const content = '<iframe src="https://www.youtube-nocookie.com/embed/abc"></iframe>';
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(1);
      expect(specs[0].class).toContain("cm-media-youtube");
    });

    it("detects Vimeo iframe", () => {
      const content = '<iframe src="https://player.vimeo.com/video/123"></iframe>';
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(1);
      expect(specs[0].class).toContain("cm-media-vimeo");
    });

    it("detects Bilibili iframe", () => {
      const content = '<iframe src="https://player.bilibili.com/player.html?bvid=abc"></iframe>';
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(1);
      expect(specs[0].class).toContain("cm-media-bilibili");
    });

    it("ignores iframe with unknown src", () => {
      const content = '<iframe src="https://example.com"></iframe>';
      const view = tracked(content);
      expect(getDecorationSpecs(view)).toHaveLength(0);
    });

    it("does not detect iframe when src is on a different line", () => {
      const content = '<iframe\n  src="https://www.youtube.com/embed/abc"\n  width="560"\n></iframe>';
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      // iframe src must be on the same line as the tag for classification
      expect(specs).toHaveLength(0);
    });
  });

  describe("indented tags", () => {
    it("detects indented <video> tag", () => {
      const content = '  <video src="test.mp4"></video>';
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(1);
      expect(specs[0].class).toContain("cm-media-video");
    });
  });

  describe("multiple media blocks", () => {
    it("detects two different media blocks", () => {
      const content = '<video src="a.mp4"></video>\n\n<audio src="b.mp3"></audio>';
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(2);
      expect(specs[0].class).toContain("cm-media-video");
      expect(specs[1].class).toContain("cm-media-audio");
    });
  });

  describe("unclosed tags (bounded lookahead)", () => {
    it("treats unclosed tag as single-line when no close found", () => {
      const content = "<video controls>\nLine 2\nLine 3";
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(1);
      expect(specs[0].class).toContain("cm-media-video");
    });
  });

  describe("cm-media-tag and cm-media-first classes", () => {
    it("all lines get cm-media-tag", () => {
      const content = '<video controls>\n  <source src="a.mp4">\n</video>';
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      specs.forEach((s) => expect(s.class).toContain("cm-media-tag"));
    });

    it("only first line gets cm-media-first", () => {
      const content = '<audio controls>\n  <source src="a.mp3">\n</audio>';
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs[0].class).toContain("cm-media-first");
      expect(specs[1].class).not.toContain("cm-media-first");
      expect(specs[2].class).not.toContain("cm-media-first");
    });
  });

  describe("update on doc change", () => {
    it("rebuilds decorations when document changes", () => {
      const view = tracked("Hello");
      expect(getDecorationSpecs(view)).toHaveLength(0);

      view.dispatch({
        changes: { from: 0, to: 5, insert: '<video src="x.mp4"></video>' },
      });

      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(1);
      expect(specs[0].class).toContain("cm-media-video");
    });
  });

  describe("case insensitivity", () => {
    it("detects <VIDEO> (uppercase)", () => {
      const content = '<VIDEO src="test.mp4"></VIDEO>';
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(1);
      expect(specs[0].class).toContain("cm-media-video");
    });

    it("detects <Audio> (mixed case) with close on same line", () => {
      const content = '<Audio src="test.mp3"></Audio>';
      const view = tracked(content);
      const specs = getDecorationSpecs(view);
      expect(specs.length).toBe(1);
      expect(specs[0].class).toContain("cm-media-audio");
    });
  });
});
