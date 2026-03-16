import { describe, it, expect, vi, beforeEach } from "vitest";

// The global test setup mocks @/i18n for all other tests.
// This file tests the real i18n module, so we unmock it here.
vi.unmock("@/i18n");

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
