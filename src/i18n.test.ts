import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/stores/settingsStore", () => ({
  useSettingsStore: {
    getState: () => ({
      general: { language: "en" },
    }),
  },
}));

describe("i18n initialization", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("initializes with language from settings", async () => {
    const { default: i18n } = await import("./i18n");
    expect(i18n.language).toBe("en");
  });

  it("has common as default namespace", async () => {
    const { default: i18n } = await import("./i18n");
    expect(i18n.options.defaultNS).toBe("common");
  });

  it("uses currentOnly load strategy", async () => {
    const { default: i18n } = await import("./i18n");
    expect(i18n.options.load).toBe("currentOnly");
  });
});
