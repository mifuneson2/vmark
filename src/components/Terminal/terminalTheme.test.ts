/**
 * Tests for terminalTheme — ANSI palette builder.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetState = vi.fn();
vi.mock("@/stores/settingsStore", () => ({
  useSettingsStore: { getState: () => mockGetState() },
  themes: {
    paper: {
      background: "#EEEDED",
      foreground: "#1a1a1a",
      link: "#0066cc",
      secondary: "#e5e4e4",
      border: "#d5d4d4",
    },
    night: {
      background: "#23262b",
      foreground: "#d6d9de",
      link: "#5aa8ff",
      secondary: "#2a2e34",
      border: "#3a3f46",
      isDark: true,
      selection: "rgba(90,168,255,0.22)",
    },
    // Unknown theme to test fallback
    custom: {
      background: "#ff0000",
      foreground: "#00ff00",
      link: "#0000ff",
      secondary: "#111111",
      border: "#222222",
    },
  },
}));

import { buildXtermTheme, buildXtermThemeForId } from "./terminalTheme";
import type { ThemeId } from "@/stores/settingsStore";

describe("terminalTheme", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("buildXtermTheme reads theme from store", () => {
    mockGetState.mockReturnValue({ appearance: { theme: "paper" } });
    const theme = buildXtermTheme();
    expect(theme.background).toBe("#EEEDED");
    expect(theme.foreground).toBe("#1a1a1a");
  });

  it("includes all 16 ANSI colors for paper theme", () => {
    const theme = buildXtermThemeForId("paper" as ThemeId);
    const ansiKeys = [
      "black", "red", "green", "yellow", "blue", "magenta", "cyan", "white",
      "brightBlack", "brightRed", "brightGreen", "brightYellow",
      "brightBlue", "brightMagenta", "brightCyan", "brightWhite",
    ] as const;
    for (const key of ansiKeys) {
      expect(theme[key]).toBeDefined();
      expect(theme[key]).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("includes all 16 ANSI colors for night theme", () => {
    const theme = buildXtermThemeForId("night" as ThemeId);
    expect(theme.background).toBe("#23262b");
    expect(theme.black).toBeDefined();
    expect(theme.brightWhite).toBeDefined();
  });

  it("uses dark scrollbar for night theme", () => {
    const theme = buildXtermThemeForId("night" as ThemeId);
    expect(theme.scrollbarSliderBackground).toContain("255,255,255");
  });

  it("uses light scrollbar for paper theme", () => {
    const theme = buildXtermThemeForId("paper" as ThemeId);
    expect(theme.scrollbarSliderBackground).toContain("0,0,0");
  });

  it("falls back to paper palette for unknown light theme", () => {
    const theme = buildXtermThemeForId("custom" as ThemeId);
    // Should still have ANSI colors (from paper fallback)
    expect(theme.black).toBeDefined();
    expect(theme.background).toBe("#ff0000");
  });

  it("falls back to paper colors when theme ID not in themes map", () => {
    const theme = buildXtermThemeForId("nonexistent" as ThemeId);
    // Both colors and ansi should fall back to paper
    expect(theme.background).toBe("#EEEDED");
    expect(theme.black).toBeDefined();
  });

  it("sets cursor to foreground and cursorAccent to background", () => {
    const theme = buildXtermThemeForId("paper" as ThemeId);
    expect(theme.cursor).toBe("#1a1a1a");
    expect(theme.cursorAccent).toBe("#EEEDED");
  });

  it("uses theme selection color when available", () => {
    const theme = buildXtermThemeForId("night" as ThemeId);
    expect(theme.selectionBackground).toBe("rgba(90,168,255,0.22)");
  });

  it("falls back selection color when not set", () => {
    const theme = buildXtermThemeForId("paper" as ThemeId);
    expect(theme.selectionBackground).toBe("rgba(0,102,204,0.25)");
  });
});
