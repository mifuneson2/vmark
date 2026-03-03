import { describe, it, expect } from "vitest";
import {
  parseVideoUrl,
  buildEmbedUrl,
  detectProviderFromIframeSrc,
  getProviderConfig,
  extractVideoIdFromSrc,
} from "./videoProviderRegistry";

describe("parseVideoUrl", () => {
  it("returns null for empty string", () => {
    expect(parseVideoUrl("")).toBeNull();
  });

  describe("YouTube", () => {
    it("parses youtube.com/watch?v= URL", () => {
      const result = parseVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
      expect(result).toEqual({ provider: "youtube", videoId: "dQw4w9WgXcQ" });
    });

    it("parses youtu.be short URL", () => {
      const result = parseVideoUrl("https://youtu.be/dQw4w9WgXcQ");
      expect(result).toEqual({ provider: "youtube", videoId: "dQw4w9WgXcQ" });
    });

    it("parses youtube-nocookie embed URL", () => {
      const result = parseVideoUrl(
        "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
      );
      expect(result).toEqual({ provider: "youtube", videoId: "dQw4w9WgXcQ" });
    });
  });

  describe("Vimeo", () => {
    it("parses vimeo.com/{id} URL", () => {
      const result = parseVideoUrl("https://vimeo.com/123456789");
      expect(result).toEqual({ provider: "vimeo", videoId: "123456789" });
    });

    it("parses player.vimeo.com embed URL", () => {
      const result = parseVideoUrl(
        "https://player.vimeo.com/video/123456789"
      );
      expect(result).toEqual({ provider: "vimeo", videoId: "123456789" });
    });

    it("returns null for non-video vimeo path", () => {
      expect(parseVideoUrl("https://vimeo.com/channels/mychannel")).toBeNull();
    });

    it("returns null for vimeo URL without numeric ID", () => {
      expect(parseVideoUrl("https://vimeo.com/myvideo")).toBeNull();
    });

    it("returns null for invalid Vimeo URL", () => {
      expect(parseVideoUrl("not-a-url")).toBeNull();
    });

    it("returns null for non-http Vimeo URL", () => {
      expect(parseVideoUrl("ftp://vimeo.com/123")).toBeNull();
    });

    it("returns null for empty Vimeo URL", () => {
      expect(parseVideoUrl("")).toBeNull();
    });
  });

  describe("Bilibili", () => {
    it("parses bilibili.com/video/BV URL", () => {
      const result = parseVideoUrl(
        "https://www.bilibili.com/video/BV1xx411c7mD"
      );
      expect(result).toEqual({ provider: "bilibili", videoId: "BV1xx411c7mD" });
    });

    it("parses player.bilibili.com embed URL with bvid param", () => {
      const result = parseVideoUrl(
        "https://player.bilibili.com/player.html?bvid=BV1xx411c7mD"
      );
      expect(result).toEqual({ provider: "bilibili", videoId: "BV1xx411c7mD" });
    });

    it("returns null for bilibili player URL without bvid", () => {
      expect(
        parseVideoUrl("https://player.bilibili.com/player.html")
      ).toBeNull();
    });

    it("returns null for bilibili player URL with invalid bvid", () => {
      expect(
        parseVideoUrl("https://player.bilibili.com/player.html?bvid=invalid")
      ).toBeNull();
    });

    it("returns null for bilibili URL without /video/ prefix", () => {
      expect(parseVideoUrl("https://bilibili.com/BV1xx411c7mD")).toBeNull();
    });

    it("returns null for non-http Bilibili URL", () => {
      expect(parseVideoUrl("ftp://bilibili.com/video/BV1xx411c7mD")).toBeNull();
    });

    it("returns null for empty Bilibili URL", () => {
      // parseVimeoUrl and parseBilibiliUrl both handle empty
      const result = parseVideoUrl("  ");
      expect(result).toBeNull();
    });
  });

  it("returns null for unrecognized URL", () => {
    expect(parseVideoUrl("https://example.com/video")).toBeNull();
  });
});

describe("buildEmbedUrl", () => {
  it("builds YouTube embed URL", () => {
    expect(buildEmbedUrl("youtube", "dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    );
  });

  it("builds Vimeo embed URL", () => {
    expect(buildEmbedUrl("vimeo", "123456789")).toBe(
      "https://player.vimeo.com/video/123456789"
    );
  });

  it("builds Bilibili embed URL", () => {
    expect(buildEmbedUrl("bilibili", "BV1xx411c7mD")).toBe(
      "https://player.bilibili.com/player.html?bvid=BV1xx411c7mD"
    );
  });
});

describe("detectProviderFromIframeSrc", () => {
  it("returns null for empty string", () => {
    expect(detectProviderFromIframeSrc("")).toBeNull();
  });

  it("detects YouTube from embed src", () => {
    expect(
      detectProviderFromIframeSrc(
        "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
      )
    ).toBe("youtube");
  });

  it("detects YouTube from youtube.com/embed src", () => {
    expect(
      detectProviderFromIframeSrc("https://www.youtube.com/embed/dQw4w9WgXcQ")
    ).toBe("youtube");
  });

  it("detects Vimeo from player.vimeo.com src", () => {
    expect(
      detectProviderFromIframeSrc("https://player.vimeo.com/video/123456789")
    ).toBe("vimeo");
  });

  it("detects Bilibili from player.bilibili.com src", () => {
    expect(
      detectProviderFromIframeSrc(
        "https://player.bilibili.com/player.html?bvid=BV1xx411c7mD"
      )
    ).toBe("bilibili");
  });

  it("returns null for non-video iframe src", () => {
    expect(detectProviderFromIframeSrc("https://example.com/embed")).toBeNull();
  });
});

describe("getProviderConfig", () => {
  it("returns config for youtube", () => {
    const config = getProviderConfig("youtube");
    expect(config).toBeDefined();
    expect(config?.name).toBe("youtube");
    expect(config?.defaultWidth).toBe(560);
    expect(config?.defaultHeight).toBe(315);
    expect(config?.aspectRatio).toBe("56.25%");
  });

  it("returns config for vimeo", () => {
    const config = getProviderConfig("vimeo");
    expect(config).toBeDefined();
    expect(config?.name).toBe("vimeo");
  });

  it("returns config for bilibili", () => {
    const config = getProviderConfig("bilibili");
    expect(config).toBeDefined();
    expect(config?.name).toBe("bilibili");
    expect(config?.defaultHeight).toBe(350);
    expect(config?.aspectRatio).toBe("62.5%");
  });
});

describe("extractVideoIdFromSrc", () => {
  it("extracts YouTube video ID from embed src", () => {
    expect(
      extractVideoIdFromSrc(
        "youtube",
        "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
      )
    ).toBe("dQw4w9WgXcQ");
  });

  it("extracts Vimeo video ID from embed src", () => {
    expect(
      extractVideoIdFromSrc(
        "vimeo",
        "https://player.vimeo.com/video/123456789"
      )
    ).toBe("123456789");
  });

  it("extracts Bilibili video ID from embed src", () => {
    expect(
      extractVideoIdFromSrc(
        "bilibili",
        "https://player.bilibili.com/player.html?bvid=BV1xx411c7mD"
      )
    ).toBe("BV1xx411c7mD");
  });

  it("returns null for unrecognized URL", () => {
    expect(extractVideoIdFromSrc("youtube", "https://example.com")).toBeNull();
  });
});

describe("parseVimeoUrl edge cases", () => {
  it("handles vimeo groups path (non-video)", () => {
    expect(parseVideoUrl("https://vimeo.com/groups/mygroup")).toBeNull();
  });

  it("handles vimeo showcase path (non-video)", () => {
    expect(parseVideoUrl("https://vimeo.com/showcase/123")).toBeNull();
  });

  it("handles vimeo ondemand path (non-video)", () => {
    expect(parseVideoUrl("https://vimeo.com/ondemand/myfilm")).toBeNull();
  });

  it("handles www.vimeo.com (www prefix stripped)", () => {
    const result = parseVideoUrl("https://www.vimeo.com/123456789");
    expect(result).toEqual({ provider: "vimeo", videoId: "123456789" });
  });
});

describe("parseBilibiliUrl edge cases", () => {
  it("handles www.bilibili.com (www prefix stripped)", () => {
    const result = parseVideoUrl("https://www.bilibili.com/video/BV1xx411c7mD");
    expect(result).toEqual({ provider: "bilibili", videoId: "BV1xx411c7mD" });
  });

  it("returns null for malformed URL", () => {
    expect(parseVideoUrl("not://a-real-url")).toBeNull();
  });
});
