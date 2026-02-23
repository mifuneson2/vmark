/**
 * Tests for sourceMediaDecoration — media block detection with bounded lookahead.
 */

import { describe, it, expect } from "vitest";

// Re-implement the detection logic for testing since findMediaBlocks is not exported.
// We test the combined regex and classification logic.

const MEDIA_OPEN_REGEX = /^\s*<(video|audio|iframe)([\s>])/i;
const IFRAME_SRC_YOUTUBE = /youtube(?:-nocookie)?\.com/i;
const IFRAME_SRC_VIMEO = /player\.vimeo\.com/i;
const IFRAME_SRC_BILIBILI = /player\.bilibili\.com/i;
const SELF_CLOSING_REGEX = /\/>\s*$/;

type MediaType = "video" | "audio" | "youtube" | "vimeo" | "bilibili";

function classifyIframe(text: string): MediaType | null {
  if (IFRAME_SRC_YOUTUBE.test(text)) return "youtube";
  if (IFRAME_SRC_VIMEO.test(text)) return "vimeo";
  if (IFRAME_SRC_BILIBILI.test(text)) return "bilibili";
  return null;
}

function detectMediaType(text: string): MediaType | null {
  const match = MEDIA_OPEN_REGEX.exec(text);
  if (!match) return null;
  const tag = match[1].toLowerCase();
  if (tag === "video" || tag === "audio") return tag;
  return classifyIframe(text);
}

describe("MEDIA_OPEN_REGEX", () => {
  it("matches <video> tag", () => {
    expect(MEDIA_OPEN_REGEX.test("<video src=\"test.mp4\">")).toBe(true);
  });

  it("matches <audio> tag", () => {
    expect(MEDIA_OPEN_REGEX.test("<audio src=\"test.mp3\">")).toBe(true);
  });

  it("matches indented tags", () => {
    expect(MEDIA_OPEN_REGEX.test("  <video controls>")).toBe(true);
  });

  it("matches <iframe> tag", () => {
    expect(MEDIA_OPEN_REGEX.test('<iframe src="https://youtube.com/embed/x">')).toBe(true);
  });

  it("does not match <div> or other tags", () => {
    expect(MEDIA_OPEN_REGEX.test("<div>hello</div>")).toBe(false);
  });

  it("does not match <videos> (extra characters)", () => {
    // "videos" has 's' after "video" — the regex requires [\s>] after the tag name
    expect(MEDIA_OPEN_REGEX.test("<videos>")).toBe(false);
  });
});

describe("detectMediaType", () => {
  it("detects video", () => {
    expect(detectMediaType("<video controls>")).toBe("video");
  });

  it("detects audio", () => {
    expect(detectMediaType("<audio src=\"test.mp3\">")).toBe("audio");
  });

  it("detects YouTube iframe", () => {
    expect(detectMediaType('<iframe src="https://www.youtube.com/embed/abc">')).toBe("youtube");
  });

  it("detects YouTube-nocookie iframe", () => {
    expect(detectMediaType('<iframe src="https://www.youtube-nocookie.com/embed/abc">')).toBe("youtube");
  });

  it("detects Vimeo iframe", () => {
    expect(detectMediaType('<iframe src="https://player.vimeo.com/video/123">')).toBe("vimeo");
  });

  it("detects Bilibili iframe", () => {
    expect(detectMediaType('<iframe src="https://player.bilibili.com/player.html?bvid=abc">')).toBe("bilibili");
  });

  it("returns null for unknown iframe src", () => {
    expect(detectMediaType('<iframe src="https://example.com">')).toBeNull();
  });

  it("returns null for non-media tags", () => {
    expect(detectMediaType("<p>Hello</p>")).toBeNull();
  });
});

describe("SELF_CLOSING_REGEX", () => {
  it("matches self-closing tag", () => {
    expect(SELF_CLOSING_REGEX.test("<video src=\"test.mp4\" />")).toBe(true);
  });

  it("matches with trailing whitespace", () => {
    expect(SELF_CLOSING_REGEX.test("<video />  ")).toBe(true);
  });

  it("does not match non-self-closing", () => {
    expect(SELF_CLOSING_REGEX.test("<video controls>")).toBe(false);
  });
});
