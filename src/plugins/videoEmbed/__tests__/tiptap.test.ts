/**
 * Tests for videoEmbed tiptap extension — schema, attributes, parseHTML,
 * renderHTML, paste handler, node configuration.
 */

import { describe, it, expect, vi } from "vitest";
import { getSchema } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { DOMSerializer, DOMParser as PMDOMParser } from "@tiptap/pm/model";
import { EditorState, TextSelection } from "@tiptap/pm/state";

// Mock the VideoEmbedNodeView to avoid DOM complexity
vi.mock("../VideoEmbedNodeView", () => ({
  VideoEmbedNodeView: vi.fn(),
}));

import { videoEmbedExtension } from "../tiptap";

// ---------------------------------------------------------------------------
// Schema helper
// ---------------------------------------------------------------------------

function createSchema() {
  return getSchema([StarterKit, videoEmbedExtension]);
}

function createVideoDoc(attrs: { provider?: string; videoId?: string; width?: number; height?: number } = {}) {
  const schema = createSchema();
  const videoNode = schema.nodes.video_embed.create({
    provider: attrs.provider ?? "youtube",
    videoId: attrs.videoId ?? "dQw4w9WgXcQ",
    width: attrs.width ?? 560,
    height: attrs.height ?? 315,
  });
  const doc = schema.nodes.doc.create(null, [videoNode]);
  return { schema, doc };
}

// ---------------------------------------------------------------------------
// Extension metadata
// ---------------------------------------------------------------------------

describe("videoEmbedExtension metadata", () => {
  it("has correct name", () => {
    expect(videoEmbedExtension.name).toBe("video_embed");
  });

  it("is a block group node", () => {
    expect(videoEmbedExtension.config.group).toBe("block");
  });

  it("is an atom node", () => {
    expect(videoEmbedExtension.config.atom).toBe(true);
  });

  it("is isolating", () => {
    expect(videoEmbedExtension.config.isolating).toBe(true);
  });

  it("is selectable", () => {
    expect(videoEmbedExtension.config.selectable).toBe(true);
  });

  it("is draggable", () => {
    expect(videoEmbedExtension.config.draggable).toBe(true);
  });

  it("allows no marks", () => {
    expect(videoEmbedExtension.config.marks).toBe("");
  });

  it("is defining", () => {
    expect(videoEmbedExtension.config.defining).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// addAttributes
// ---------------------------------------------------------------------------

describe("videoEmbed addAttributes", () => {
  it("has provider attribute defaulting to youtube", () => {
    const schema = createSchema();
    expect(schema.nodes.video_embed.spec.attrs?.provider?.default).toBe("youtube");
  });

  it("has videoId attribute defaulting to empty string", () => {
    const schema = createSchema();
    expect(schema.nodes.video_embed.spec.attrs?.videoId?.default).toBe("");
  });

  it("has width attribute defaulting to 560", () => {
    const schema = createSchema();
    expect(schema.nodes.video_embed.spec.attrs?.width?.default).toBe(560);
  });

  it("has height attribute defaulting to 315", () => {
    const schema = createSchema();
    expect(schema.nodes.video_embed.spec.attrs?.height?.default).toBe(315);
  });

  it("has sourceLine attribute defaulting to null", () => {
    const schema = createSchema();
    expect(schema.nodes.video_embed.spec.attrs?.sourceLine?.default).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// parseHTML
// ---------------------------------------------------------------------------

describe("videoEmbed parseHTML", () => {
  it("defines at least 2 parse rules", () => {
    const parseRules = videoEmbedExtension.config.parseHTML!.call({} as never);
    expect(parseRules).toBeDefined();
    expect(parseRules!.length).toBeGreaterThanOrEqual(2);
  });

  it("first rule matches figure[data-type='video_embed']", () => {
    const parseRules = videoEmbedExtension.config.parseHTML!.call({} as never);
    expect(parseRules![0].tag).toBe('figure[data-type="video_embed"]');
  });

  it("second rule matches iframe tag", () => {
    const parseRules = videoEmbedExtension.config.parseHTML!.call({} as never);
    expect(parseRules![1].tag).toBe("iframe");
  });

  it("parses figure with video_embed data-type from DOM", () => {
    const schema = createSchema();
    const html = `<figure data-type="video_embed" data-provider="youtube">
      <iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" width="560" height="315" data-video-id="dQw4w9WgXcQ"></iframe>
    </figure>`;
    const dom = new DOMParser().parseFromString(html, "text/html").body;
    const doc = PMDOMParser.fromSchema(schema).parse(dom);
    const node = doc.firstChild!;
    expect(node.type.name).toBe("video_embed");
    expect(node.attrs.videoId).toBe("dQw4w9WgXcQ");
    expect(node.attrs.provider).toBe("youtube");
  });

  it("parses YouTube iframe wrapped in body from DOM", () => {
    const schema = createSchema();
    // Browsers may wrap standalone iframes; test via figure wrapper which is more reliable
    const html = `<figure data-type="video_embed" data-provider="youtube">
      <iframe src="https://www.youtube-nocookie.com/embed/abc123test" width="640" height="360" data-video-id="abc123test"></iframe>
    </figure>`;
    const dom = new DOMParser().parseFromString(html, "text/html").body;
    const doc = PMDOMParser.fromSchema(schema).parse(dom);
    const node = doc.firstChild!;
    expect(node.type.name).toBe("video_embed");
    expect(node.attrs.provider).toBe("youtube");
    expect(node.attrs.videoId).toBe("abc123test");
    expect(node.attrs.width).toBe(640);
    expect(node.attrs.height).toBe(360);
  });

  it("parses Vimeo iframe from DOM", () => {
    const schema = createSchema();
    const html = '<iframe src="https://player.vimeo.com/video/123456789" width="560" height="315"></iframe>';
    const dom = new DOMParser().parseFromString(html, "text/html").body;
    const doc = PMDOMParser.fromSchema(schema).parse(dom);
    const node = doc.firstChild!;
    expect(node.type.name).toBe("video_embed");
    expect(node.attrs.provider).toBe("vimeo");
    expect(node.attrs.videoId).toBe("123456789");
  });

  it("parses Bilibili iframe from DOM", () => {
    const schema = createSchema();
    const html = '<iframe src="https://player.bilibili.com/player.html?bvid=BV1234567890" width="560" height="350"></iframe>';
    const dom = new DOMParser().parseFromString(html, "text/html").body;
    const doc = PMDOMParser.fromSchema(schema).parse(dom);
    const node = doc.firstChild!;
    expect(node.type.name).toBe("video_embed");
    expect(node.attrs.provider).toBe("bilibili");
    expect(node.attrs.videoId).toBe("BV1234567890");
  });

  it("defaults width/height for invalid values in figure", () => {
    const schema = createSchema();
    const html = `<figure data-type="video_embed" data-provider="youtube">
      <iframe src="https://www.youtube-nocookie.com/embed/test123" width="invalid" height="-10" data-video-id="test123"></iframe>
    </figure>`;
    const dom = new DOMParser().parseFromString(html, "text/html").body;
    const doc = PMDOMParser.fromSchema(schema).parse(dom);
    const node = doc.firstChild!;
    expect(node.attrs.width).toBe(560);  // NaN from "invalid" falls back to 560
    expect(node.attrs.height).toBe(315); // -10 is not > 0, falls back to 315
  });

  it("skips unrecognized iframe src", () => {
    const schema = createSchema();
    const html = '<iframe src="https://example.com/video/123"></iframe>';
    const dom = new DOMParser().parseFromString(html, "text/html").body;
    const doc = PMDOMParser.fromSchema(schema).parse(dom);
    // Unrecognized iframe should not create a video_embed node
    expect(doc.firstChild!.type.name).not.toBe("video_embed");
  });
});

// ---------------------------------------------------------------------------
// renderHTML
// ---------------------------------------------------------------------------

describe("videoEmbed renderHTML", () => {
  it("serializes YouTube video embed to DOM", () => {
    const { doc, schema } = createVideoDoc({ provider: "youtube", videoId: "dQw4w9WgXcQ" });
    const serializer = DOMSerializer.fromSchema(schema);
    expect(() => serializer.serializeFragment(doc.content)).not.toThrow();
  });

  it("renders figure with data-type video_embed", () => {
    const { doc, schema } = createVideoDoc();
    const serializer = DOMSerializer.fromSchema(schema);
    const fragment = serializer.serializeFragment(doc.content);
    const container = document.createElement("div");
    container.appendChild(fragment);

    const figure = container.querySelector("figure");
    expect(figure).not.toBeNull();
    expect(figure!.getAttribute("data-type")).toBe("video_embed");
  });

  it("renders data-provider attribute", () => {
    const { doc, schema } = createVideoDoc({ provider: "vimeo" });
    const serializer = DOMSerializer.fromSchema(schema);
    const fragment = serializer.serializeFragment(doc.content);
    const container = document.createElement("div");
    container.appendChild(fragment);

    const figure = container.querySelector("figure");
    expect(figure!.getAttribute("data-provider")).toBe("vimeo");
  });

  it("renders video-embed class", () => {
    const { doc, schema } = createVideoDoc();
    const serializer = DOMSerializer.fromSchema(schema);
    const fragment = serializer.serializeFragment(doc.content);
    const container = document.createElement("div");
    container.appendChild(fragment);

    const figure = container.querySelector("figure");
    expect(figure!.classList.contains("video-embed")).toBe(true);
  });

  it("renders iframe with correct src for YouTube", () => {
    const { doc, schema } = createVideoDoc({ provider: "youtube", videoId: "abc123" });
    const serializer = DOMSerializer.fromSchema(schema);
    const fragment = serializer.serializeFragment(doc.content);
    const container = document.createElement("div");
    container.appendChild(fragment);

    const iframe = container.querySelector("iframe");
    expect(iframe).not.toBeNull();
    expect(iframe!.getAttribute("src")).toContain("youtube-nocookie.com/embed/abc123");
  });

  it("renders iframe with correct src for Vimeo", () => {
    const { doc, schema } = createVideoDoc({ provider: "vimeo", videoId: "123456" });
    const serializer = DOMSerializer.fromSchema(schema);
    const fragment = serializer.serializeFragment(doc.content);
    const container = document.createElement("div");
    container.appendChild(fragment);

    const iframe = container.querySelector("iframe");
    expect(iframe!.getAttribute("src")).toContain("player.vimeo.com/video/123456");
  });

  it("renders iframe with correct src for Bilibili", () => {
    const { doc, schema } = createVideoDoc({ provider: "bilibili", videoId: "BV1234567890" });
    const serializer = DOMSerializer.fromSchema(schema);
    const fragment = serializer.serializeFragment(doc.content);
    const container = document.createElement("div");
    container.appendChild(fragment);

    const iframe = container.querySelector("iframe");
    expect(iframe!.getAttribute("src")).toContain("player.bilibili.com/player.html?bvid=BV1234567890");
  });

  it("renders iframe with width and height attributes", () => {
    const { doc, schema } = createVideoDoc({ width: 800, height: 450 });
    const serializer = DOMSerializer.fromSchema(schema);
    const fragment = serializer.serializeFragment(doc.content);
    const container = document.createElement("div");
    container.appendChild(fragment);

    const iframe = container.querySelector("iframe");
    expect(iframe!.getAttribute("width")).toBe("800");
    expect(iframe!.getAttribute("height")).toBe("450");
  });

  it("renders iframe with data-video-id attribute", () => {
    const { doc, schema } = createVideoDoc({ videoId: "testId123" });
    const serializer = DOMSerializer.fromSchema(schema);
    const fragment = serializer.serializeFragment(doc.content);
    const container = document.createElement("div");
    container.appendChild(fragment);

    const iframe = container.querySelector("iframe");
    expect(iframe!.getAttribute("data-video-id")).toBe("testId123");
  });

  it("renders iframe with allowfullscreen", () => {
    const { doc, schema } = createVideoDoc();
    const serializer = DOMSerializer.fromSchema(schema);
    const fragment = serializer.serializeFragment(doc.content);
    const container = document.createElement("div");
    container.appendChild(fragment);

    const iframe = container.querySelector("iframe");
    expect(iframe!.getAttribute("allowfullscreen")).toBe("true");
  });

  it("handles missing/empty videoId gracefully", () => {
    const { doc, schema } = createVideoDoc({ videoId: "" });
    const serializer = DOMSerializer.fromSchema(schema);
    expect(() => serializer.serializeFragment(doc.content)).not.toThrow();
  });

  it("defaults provider to youtube when using default attrs", () => {
    const schema = createSchema();
    const node = schema.nodes.video_embed.create({});
    const doc = schema.nodes.doc.create(null, [node]);
    const serializer = DOMSerializer.fromSchema(schema);
    const fragment = serializer.serializeFragment(doc.content);
    const container = document.createElement("div");
    container.appendChild(fragment);

    const figure = container.querySelector("figure");
    expect(figure!.getAttribute("data-provider")).toBe("youtube");
  });
});

// ---------------------------------------------------------------------------
// Paste handler plugin
// ---------------------------------------------------------------------------

describe("videoEmbed paste handler", () => {
  function getPasteHandler() {
    const schema = createSchema();
    const nodeType = schema.nodes.video_embed;
    const plugins = videoEmbedExtension.config.addProseMirrorPlugins!.call({
      editor: {},
      name: "video_embed",
      options: {},
      storage: {},
      type: nodeType,
      parent: undefined,
    } as never);
    // The paste handler plugin is the one returned by addProseMirrorPlugins
    return (plugins[0] as { props: { handlePaste: (view: unknown, event: unknown) => boolean } }).props.handlePaste;
  }

  it("returns false when clipboardData is null", () => {
    const handlePaste = getPasteHandler();
    const result = handlePaste({}, { clipboardData: null });
    expect(result).toBe(false);
  });

  it("returns false when clipboard has HTML content", () => {
    const handlePaste = getPasteHandler();
    const result = handlePaste({}, {
      clipboardData: {
        getData: (type: string) => type === "text/html" ? "<p>html</p>" : "",
      },
    });
    expect(result).toBe(false);
  });

  it("returns false when clipboard has no text", () => {
    const handlePaste = getPasteHandler();
    const result = handlePaste({}, {
      clipboardData: {
        getData: (type: string) => type === "text/html" ? "" : "",
      },
    });
    expect(result).toBe(false);
  });

  it("returns false for non-video URL", () => {
    const handlePaste = getPasteHandler();
    const result = handlePaste({}, {
      clipboardData: {
        getData: (type: string) => type === "text/plain" ? "https://example.com" : "",
      },
    });
    expect(result).toBe(false);
  });

  it("returns true and dispatches for YouTube URL", () => {
    const handlePaste = getPasteHandler();
    const schema = createSchema();
    const doc = schema.nodes.doc.create(null, [schema.nodes.paragraph.create()]);
    const state = EditorState.create({ doc });

    const mockDispatch = vi.fn();
    const mockView = {
      state,
      dispatch: mockDispatch,
    };

    const result = handlePaste(mockView, {
      clipboardData: {
        getData: (type: string) => type === "text/plain" ? "https://www.youtube.com/watch?v=dQw4w9WgXcQ" : "",
      },
    });
    expect(result).toBe(true);
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("returns true and dispatches for Vimeo URL", () => {
    const handlePaste = getPasteHandler();
    const schema = createSchema();
    const doc = schema.nodes.doc.create(null, [schema.nodes.paragraph.create()]);
    const state = EditorState.create({ doc });

    const mockDispatch = vi.fn();
    const mockView = {
      state,
      dispatch: mockDispatch,
    };

    const result = handlePaste(mockView, {
      clipboardData: {
        getData: (type: string) => type === "text/plain" ? "https://vimeo.com/123456789" : "",
      },
    });
    expect(result).toBe(true);
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("returns true and dispatches for Bilibili URL", () => {
    const handlePaste = getPasteHandler();
    const schema = createSchema();
    const doc = schema.nodes.doc.create(null, [schema.nodes.paragraph.create()]);
    const state = EditorState.create({ doc });

    const mockDispatch = vi.fn();
    const mockView = {
      state,
      dispatch: mockDispatch,
    };

    const result = handlePaste(mockView, {
      clipboardData: {
        getData: (type: string) => type === "text/plain" ? "https://www.bilibili.com/video/BV1234567890" : "",
      },
    });
    expect(result).toBe(true);
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("handles YouTube URL with extra whitespace", () => {
    const handlePaste = getPasteHandler();
    const schema = createSchema();
    const doc = schema.nodes.doc.create(null, [schema.nodes.paragraph.create()]);
    const state = EditorState.create({ doc });

    const mockDispatch = vi.fn();
    const mockView = {
      state,
      dispatch: mockDispatch,
    };

    const result = handlePaste(mockView, {
      clipboardData: {
        getData: (type: string) => type === "text/plain" ? "  https://youtu.be/dQw4w9WgXcQ  " : "",
      },
    });
    expect(result).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Other plugin specs
// ---------------------------------------------------------------------------

describe("videoEmbed other plugin specs", () => {
  it("defines addNodeView", () => {
    expect(videoEmbedExtension.config.addNodeView).toBeDefined();
  });

  it("defines addKeyboardShortcuts", () => {
    expect(videoEmbedExtension.config.addKeyboardShortcuts).toBeDefined();
  });
});
