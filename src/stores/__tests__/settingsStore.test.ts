import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "../settingsStore";

describe("settingsStore — tableFitToWidth", () => {
  beforeEach(() => {
    // Reset to initial state
    useSettingsStore.getState().resetSettings();
  });

  it("defaults to false", () => {
    const { markdown } = useSettingsStore.getState();
    expect(markdown.tableFitToWidth).toBe(false);
  });

  it("can be toggled to true via updateMarkdownSetting", () => {
    useSettingsStore.getState().updateMarkdownSetting("tableFitToWidth", true);
    expect(useSettingsStore.getState().markdown.tableFitToWidth).toBe(true);
  });

  it("can be toggled back to false", () => {
    useSettingsStore.getState().updateMarkdownSetting("tableFitToWidth", true);
    useSettingsStore.getState().updateMarkdownSetting("tableFitToWidth", false);
    expect(useSettingsStore.getState().markdown.tableFitToWidth).toBe(false);
  });
});

describe("settingsStore — lintEnabled", () => {
  beforeEach(() => {
    useSettingsStore.getState().resetSettings();
  });

  it("defaults to true", () => {
    const { markdown } = useSettingsStore.getState();
    expect(markdown.lintEnabled).toBe(true);
  });

  it("can be toggled to false via updateMarkdownSetting", () => {
    useSettingsStore.getState().updateMarkdownSetting("lintEnabled", false);
    expect(useSettingsStore.getState().markdown.lintEnabled).toBe(false);
  });

  it("can be toggled back to true", () => {
    useSettingsStore.getState().updateMarkdownSetting("lintEnabled", false);
    useSettingsStore.getState().updateMarkdownSetting("lintEnabled", true);
    expect(useSettingsStore.getState().markdown.lintEnabled).toBe(true);
  });
});
