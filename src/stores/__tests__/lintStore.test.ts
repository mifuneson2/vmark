import { describe, it, expect, beforeEach } from "vitest";
import { useLintStore } from "../lintStore";
import { useSettingsStore } from "../settingsStore";

describe("lintStore", () => {
  beforeEach(() => {
    useLintStore.getState().clearAllDiagnostics();
  });

  it("starts with empty diagnostics", () => {
    expect(useLintStore.getState().diagnosticsByTab).toEqual({});
  });

  it("runLint stores diagnostics keyed by tabId", () => {
    // Use a doc that triggers W01 (heading skip h1→h3)
    useLintStore.getState().runLint("tab-1", "# Title\n\n### Skip");
    const diags = useLintStore.getState().diagnosticsByTab["tab-1"];
    expect(diags).toBeDefined();
    expect(diags!.length).toBeGreaterThan(0);
  });

  it("runLint returns the diagnostics array", () => {
    const result = useLintStore.getState().runLint("tab-1", "# Title\n\n### Skip");
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("runLint on clean doc returns empty array", () => {
    const result = useLintStore.getState().runLint("tab-1", "# Title\n\n## Section");
    expect(result).toEqual([]);
  });

  it("clearDiagnostics removes for specific tab only", () => {
    useLintStore.getState().runLint("tab-1", "# Title\n\n### Skip");
    useLintStore.getState().runLint("tab-2", "# Title\n\n### Skip");
    useLintStore.getState().clearDiagnostics("tab-1");
    expect(useLintStore.getState().diagnosticsByTab["tab-1"]).toBeUndefined();
    expect(useLintStore.getState().diagnosticsByTab["tab-2"]).toBeDefined();
  });

  it("clearAllDiagnostics removes everything", () => {
    useLintStore.getState().runLint("tab-1", "# Title\n\n### Skip");
    useLintStore.getState().runLint("tab-2", "# Title\n\n### Skip");
    useLintStore.getState().clearAllDiagnostics();
    expect(useLintStore.getState().diagnosticsByTab).toEqual({});
  });

  it("selectNext wraps around", () => {
    useLintStore.getState().runLint("tab-1", "# Title\n\n### Skip\n\n![](img.png)");
    const count = useLintStore.getState().diagnosticsByTab["tab-1"]!.length;
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      useLintStore.getState().selectNext("tab-1");
    }
    // Should wrap to 0
    expect(useLintStore.getState().selectedIndexByTab["tab-1"]).toBe(0);
  });

  it("selectPrev wraps to last from index 0", () => {
    useLintStore.getState().runLint("tab-1", "# Title\n\n### Skip\n\n![](img.png)");
    const count = useLintStore.getState().diagnosticsByTab["tab-1"]!.length;
    // selectedIndexByTab starts at 0, selectPrev should wrap to last
    useLintStore.getState().selectPrev("tab-1");
    expect(useLintStore.getState().selectedIndexByTab["tab-1"]).toBe(count - 1);
  });

  it("selectNext/Prev with no diagnostics is a no-op", () => {
    useLintStore.getState().selectNext("nonexistent");
    expect(useLintStore.getState().selectedIndexByTab["nonexistent"]).toBeUndefined();
    useLintStore.getState().selectPrev("nonexistent");
    expect(useLintStore.getState().selectedIndexByTab["nonexistent"]).toBeUndefined();
  });

  it("selectNext falls back to 0 when selectedIndexByTab entry is missing", () => {
    // Use a doc that triggers multiple diagnostics so (0+1)%count != 0
    useLintStore.getState().runLint("tab-x", "# Title\n\n### Skip\n\n![](img.png)");
    const count = useLintStore.getState().diagnosticsByTab["tab-x"]!.length;
    expect(count).toBeGreaterThanOrEqual(2);
    // Manually remove the selectedIndex entry to force the ?? 0 fallback
    useLintStore.setState((s) => {
      const { ["tab-x"]: _, ...rest } = s.selectedIndexByTab;
      return { selectedIndexByTab: rest };
    });
    expect(useLintStore.getState().selectedIndexByTab["tab-x"]).toBeUndefined();
    useLintStore.getState().selectNext("tab-x");
    // ?? 0 fallback means current=0, so (0+1) % count = 1
    expect(useLintStore.getState().selectedIndexByTab["tab-x"]).toBe(1);
  });

  it("selectPrev falls back to 0 when selectedIndexByTab entry is missing", () => {
    // Use a doc that triggers multiple diagnostics
    useLintStore.getState().runLint("tab-y", "# Title\n\n### Skip\n\n![](img.png)");
    const count = useLintStore.getState().diagnosticsByTab["tab-y"]!.length;
    expect(count).toBeGreaterThanOrEqual(2);
    // Manually remove the selectedIndex entry to force the ?? 0 fallback
    useLintStore.setState((s) => {
      const { ["tab-y"]: _, ...rest } = s.selectedIndexByTab;
      return { selectedIndexByTab: rest };
    });
    expect(useLintStore.getState().selectedIndexByTab["tab-y"]).toBeUndefined();
    useLintStore.getState().selectPrev("tab-y");
    // ?? 0 fallback means current=0, 0 <= 0 so wraps to last
    expect(useLintStore.getState().selectedIndexByTab["tab-y"]).toBe(count - 1);
  });

  it("selectPrev decrements when current > 0", () => {
    useLintStore.getState().runLint("tab-z", "# Title\n\n### Skip\n\n![](img.png)");
    const count = useLintStore.getState().diagnosticsByTab["tab-z"]!.length;
    expect(count).toBeGreaterThanOrEqual(2);
    // Move forward first so current > 0
    useLintStore.getState().selectNext("tab-z");
    expect(useLintStore.getState().selectedIndexByTab["tab-z"]).toBe(1);
    // Now selectPrev should decrement to 0 (current - 1 branch)
    useLintStore.getState().selectPrev("tab-z");
    expect(useLintStore.getState().selectedIndexByTab["tab-z"]).toBe(0);
  });

  it("resets selectedIndexByTab when running lint on new content", () => {
    useLintStore.getState().runLint("tab-1", "# Title\n\n### Skip\n\n![](img.png)");
    // Move to index 1
    useLintStore.getState().selectNext("tab-1");
    expect(useLintStore.getState().selectedIndexByTab["tab-1"]).toBe(1);
    // Re-run lint resets index to 0
    useLintStore.getState().runLint("tab-1", "# Title\n\n### Skip");
    expect(useLintStore.getState().selectedIndexByTab["tab-1"]).toBe(0);
  });

  it("selectedIndexByTab is independent across tabs", () => {
    useLintStore.getState().runLint("tab-1", "# Title\n\n### Skip\n\n![](img.png)");
    useLintStore.getState().runLint("tab-2", "# Title\n\n### Skip\n\n![](img.png)");
    // Advance tab-1 once; tab-2 should remain at 0
    useLintStore.getState().selectNext("tab-1");
    expect(useLintStore.getState().selectedIndexByTab["tab-1"]).toBe(1);
    expect(useLintStore.getState().selectedIndexByTab["tab-2"]).toBe(0);
  });

  describe("settings subscription", () => {
    it("clears all diagnostics when lint is disabled", () => {
      // Ensure lint is enabled first
      useSettingsStore.setState({
        markdown: { ...useSettingsStore.getState().markdown, lintEnabled: true },
      });

      // Add some diagnostics
      useLintStore.getState().runLint("tab-1", "# Title\n\n### Skip");
      expect(Object.keys(useLintStore.getState().diagnosticsByTab).length).toBeGreaterThan(0);

      // Disable lint
      useSettingsStore.setState({
        markdown: { ...useSettingsStore.getState().markdown, lintEnabled: false },
      });

      // Diagnostics should be cleared
      expect(useLintStore.getState().diagnosticsByTab).toEqual({});
    });

    it("does not clear diagnostics when lint stays enabled", () => {
      useSettingsStore.setState({
        markdown: { ...useSettingsStore.getState().markdown, lintEnabled: true },
      });

      useLintStore.getState().runLint("tab-1", "# Title\n\n### Skip");
      const before = Object.keys(useLintStore.getState().diagnosticsByTab).length;

      // Toggle another setting (lint stays enabled)
      useSettingsStore.setState({
        markdown: { ...useSettingsStore.getState().markdown, lintEnabled: true },
      });

      expect(Object.keys(useLintStore.getState().diagnosticsByTab).length).toBe(before);
    });
  });
});
