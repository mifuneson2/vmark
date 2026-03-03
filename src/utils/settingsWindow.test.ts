/**
 * Tests for src/utils/settingsWindow.ts
 *
 * Covers openSettingsWindow() with all branches:
 *   - Creating a new window (no existing settings window)
 *   - Refocusing an existing window
 *   - Section navigation (with and without section param)
 *   - Centered positioning (success and failure)
 *   - Edge cases: empty string section, undefined section
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Hoisted mocks (available inside vi.mock factories) ---

const {
  mockSetPosition,
  mockSetFocus,
  mockScaleFactor,
  mockOuterPosition,
  mockOuterSize,
  mockGetCurrentWebviewWindow,
  mockGetByLabel,
  MockWebviewWindowConstructor,
} = vi.hoisted(() => {
  const mockSetPosition = vi.fn(() => Promise.resolve());
  const mockSetFocus = vi.fn(() => Promise.resolve());
  const mockScaleFactor = vi.fn(() => Promise.resolve(1));
  const mockOuterPosition = vi.fn(() => Promise.resolve({ x: 100, y: 200 }));
  const mockOuterSize = vi.fn(() => Promise.resolve({ width: 1200, height: 800 }));

  const mockGetCurrentWebviewWindow = vi.fn(() => ({
    scaleFactor: mockScaleFactor,
    outerPosition: mockOuterPosition,
    outerSize: mockOuterSize,
  }));

  const mockGetByLabel = vi.fn(() => Promise.resolve(null));
  const MockWebviewWindowConstructor = vi.fn();

  return {
    mockSetPosition,
    mockSetFocus,
    mockScaleFactor,
    mockOuterPosition,
    mockOuterSize,
    mockGetCurrentWebviewWindow,
    mockGetByLabel,
    MockWebviewWindowConstructor,
  };
});

vi.mock("@tauri-apps/api/event", () => ({
  emit: vi.fn(() => Promise.resolve()),
}));

vi.mock("@tauri-apps/api/webviewWindow", () => ({
  getCurrentWebviewWindow: (...args: unknown[]) => mockGetCurrentWebviewWindow(...args),
  WebviewWindow: Object.assign(MockWebviewWindowConstructor, {
    getByLabel: (...args: unknown[]) => mockGetByLabel(...args),
  }),
}));

vi.mock("@tauri-apps/api/dpi", () => ({
  LogicalPosition: class MockLogicalPosition {
    x: number;
    y: number;
    constructor(x: number, y: number) {
      this.x = x;
      this.y = y;
    }
  },
}));

// --- Imports (after mocks) ---

import { openSettingsWindow } from "./settingsWindow";
import { emit } from "@tauri-apps/api/event";

// --- Tests ---

beforeEach(() => {
  vi.clearAllMocks();
  // Defaults: scale factor 1, position (100, 200), size 1200x800, no existing window
  mockScaleFactor.mockResolvedValue(1);
  mockOuterPosition.mockResolvedValue({ x: 100, y: 200 });
  mockOuterSize.mockResolvedValue({ width: 1200, height: 800 });
  mockGetByLabel.mockResolvedValue(null);
});

/* ------------------------------------------------------------------ */
/*  Creating a new Settings window                                     */
/* ------------------------------------------------------------------ */

describe("openSettingsWindow — new window creation", () => {
  it("creates a new WebviewWindow with correct dimensions", async () => {
    await openSettingsWindow();

    expect(MockWebviewWindowConstructor).toHaveBeenCalledTimes(1);
    const [label, opts] = MockWebviewWindowConstructor.mock.calls[0];
    expect(label).toBe("settings");
    expect(opts.width).toBe(760);
    expect(opts.height).toBe(540);
    expect(opts.minWidth).toBe(600);
    expect(opts.minHeight).toBe(400);
    expect(opts.title).toBe("Settings");
    expect(opts.resizable).toBe(true);
    expect(opts.hiddenTitle).toBe(true);
    expect(opts.titleBarStyle).toBe("overlay");
  });

  it("passes centered position when calculation succeeds", async () => {
    // Window at (100, 200), size 1200x800, scale 1
    // x = round(100/1 + (1200/1 - 760)/2) = round(100 + 220) = 320
    // y = round(200/1 + (800/1 - 540)/2) = round(200 + 130) = 330
    await openSettingsWindow();

    const [, opts] = MockWebviewWindowConstructor.mock.calls[0];
    expect(opts.x).toBe(320);
    expect(opts.y).toBe(330);
    expect(opts.center).toBe(false);
  });

  it("uses center:true when position calculation fails", async () => {
    mockScaleFactor.mockRejectedValue(new Error("no window"));

    await openSettingsWindow();

    const [, opts] = MockWebviewWindowConstructor.mock.calls[0];
    expect(opts.x).toBeUndefined();
    expect(opts.y).toBeUndefined();
    expect(opts.center).toBe(true);
  });

  it("sets url to /settings when no section provided", async () => {
    await openSettingsWindow();

    const [, opts] = MockWebviewWindowConstructor.mock.calls[0];
    expect(opts.url).toBe("/settings");
  });

  it("sets url to /settings when section is undefined", async () => {
    await openSettingsWindow(undefined);

    const [, opts] = MockWebviewWindowConstructor.mock.calls[0];
    expect(opts.url).toBe("/settings");
  });

  it("includes section as query param in url", async () => {
    await openSettingsWindow("integrations");

    const [, opts] = MockWebviewWindowConstructor.mock.calls[0];
    expect(opts.url).toBe("/settings?section=integrations");
  });

  it("does not emit settings:navigate for new window", async () => {
    await openSettingsWindow("about");

    expect(emit).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ */
/*  Refocusing an existing Settings window                             */
/* ------------------------------------------------------------------ */

describe("openSettingsWindow — existing window", () => {
  const existingWindow = {
    setPosition: mockSetPosition,
    setFocus: mockSetFocus,
  };

  beforeEach(() => {
    mockGetByLabel.mockResolvedValue(existingWindow);
  });

  it("focuses the existing window instead of creating a new one", async () => {
    await openSettingsWindow();

    expect(mockSetFocus).toHaveBeenCalledTimes(1);
    expect(MockWebviewWindowConstructor).not.toHaveBeenCalled();
  });

  it("repositions the existing window to center", async () => {
    await openSettingsWindow();

    expect(mockSetPosition).toHaveBeenCalledTimes(1);
    const posArg = mockSetPosition.mock.calls[0][0];
    expect(posArg.x).toBe(320);
    expect(posArg.y).toBe(330);
  });

  it("skips setPosition when position calculation fails", async () => {
    mockOuterPosition.mockRejectedValue(new Error("fail"));

    await openSettingsWindow();

    expect(mockSetPosition).not.toHaveBeenCalled();
    expect(mockSetFocus).toHaveBeenCalledTimes(1);
  });

  it("emits settings:navigate when section is provided", async () => {
    await openSettingsWindow("about");

    expect(emit).toHaveBeenCalledWith("settings:navigate", "about");
  });

  it("does not emit settings:navigate when no section", async () => {
    await openSettingsWindow();

    expect(emit).not.toHaveBeenCalled();
  });

  it("does not emit settings:navigate when section is undefined", async () => {
    await openSettingsWindow(undefined);

    expect(emit).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ */
/*  Position calculation with different scale factors                   */
/* ------------------------------------------------------------------ */

describe("openSettingsWindow — scale factor handling", () => {
  it("accounts for HiDPI (scale factor 2)", async () => {
    mockScaleFactor.mockResolvedValue(2);
    mockOuterPosition.mockResolvedValue({ x: 200, y: 400 });
    mockOuterSize.mockResolvedValue({ width: 2400, height: 1600 });

    await openSettingsWindow();

    // x = round(200/2 + (2400/2 - 760)/2) = round(100 + 220) = 320
    // y = round(400/2 + (1600/2 - 540)/2) = round(200 + 130) = 330
    const [, opts] = MockWebviewWindowConstructor.mock.calls[0];
    expect(opts.x).toBe(320);
    expect(opts.y).toBe(330);
  });

  it("accounts for fractional scale factor (1.5)", async () => {
    mockScaleFactor.mockResolvedValue(1.5);
    mockOuterPosition.mockResolvedValue({ x: 150, y: 300 });
    mockOuterSize.mockResolvedValue({ width: 1800, height: 1200 });

    await openSettingsWindow();

    // x = round(150/1.5 + (1800/1.5 - 760)/2) = round(100 + 220) = 320
    // y = round(300/1.5 + (1200/1.5 - 540)/2) = round(200 + 130) = 330
    const [, opts] = MockWebviewWindowConstructor.mock.calls[0];
    expect(opts.x).toBe(320);
    expect(opts.y).toBe(330);
  });

  it("handles very small window (settings larger than parent)", async () => {
    mockScaleFactor.mockResolvedValue(1);
    mockOuterPosition.mockResolvedValue({ x: 50, y: 50 });
    mockOuterSize.mockResolvedValue({ width: 400, height: 300 });

    await openSettingsWindow();

    // x = round(50 + (400 - 760)/2) = round(50 + (-180)) = -130
    // y = round(50 + (300 - 540)/2) = round(50 + (-120)) = -70
    const [, opts] = MockWebviewWindowConstructor.mock.calls[0];
    expect(opts.x).toBe(-130);
    expect(opts.y).toBe(-70);
  });

  it("handles window at origin (0, 0)", async () => {
    mockScaleFactor.mockResolvedValue(1);
    mockOuterPosition.mockResolvedValue({ x: 0, y: 0 });
    mockOuterSize.mockResolvedValue({ width: 1200, height: 800 });

    await openSettingsWindow();

    // x = round(0 + (1200 - 760)/2) = 220
    // y = round(0 + (800 - 540)/2) = 130
    const [, opts] = MockWebviewWindowConstructor.mock.calls[0];
    expect(opts.x).toBe(220);
    expect(opts.y).toBe(130);
  });
});

/* ------------------------------------------------------------------ */
/*  Edge cases: section parameter                                      */
/* ------------------------------------------------------------------ */

describe("openSettingsWindow — section edge cases", () => {
  it("handles empty string section for new window", async () => {
    await openSettingsWindow("");

    // Empty string is falsy, so url should be /settings (no query param)
    const [, opts] = MockWebviewWindowConstructor.mock.calls[0];
    expect(opts.url).toBe("/settings");
  });

  it("handles empty string section for existing window (no emit)", async () => {
    mockGetByLabel.mockResolvedValue({
      setPosition: mockSetPosition,
      setFocus: mockSetFocus,
    });

    await openSettingsWindow("");

    // Empty string is falsy, so emit should not be called
    expect(emit).not.toHaveBeenCalled();
  });

  it("handles section with special characters", async () => {
    await openSettingsWindow("ai-providers");

    const [, opts] = MockWebviewWindowConstructor.mock.calls[0];
    expect(opts.url).toBe("/settings?section=ai-providers");
  });
});

/* ------------------------------------------------------------------ */
/*  Error resilience                                                   */
/* ------------------------------------------------------------------ */

describe("openSettingsWindow — error resilience", () => {
  it("still creates window when outerSize rejects", async () => {
    mockOuterSize.mockRejectedValue(new Error("size error"));

    await openSettingsWindow();

    // Position calculation fails, falls back to center
    expect(MockWebviewWindowConstructor).toHaveBeenCalledTimes(1);
    const [, opts] = MockWebviewWindowConstructor.mock.calls[0];
    expect(opts.center).toBe(true);
    expect(opts.x).toBeUndefined();
    expect(opts.y).toBeUndefined();
  });

  it("still creates window when outerPosition rejects", async () => {
    mockOuterPosition.mockRejectedValue(new Error("position error"));

    await openSettingsWindow();

    expect(MockWebviewWindowConstructor).toHaveBeenCalledTimes(1);
    const [, opts] = MockWebviewWindowConstructor.mock.calls[0];
    expect(opts.center).toBe(true);
  });

  it("getByLabel is always called with 'settings'", async () => {
    await openSettingsWindow();

    expect(mockGetByLabel).toHaveBeenCalledWith("settings");
  });
});
