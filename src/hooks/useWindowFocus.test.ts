/**
 * Tests for useWindowFocus — window focus check and label retrieval
 *
 * @module hooks/useWindowFocus.test
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockIsFocused } = vi.hoisted(() => ({
  mockIsFocused: vi.fn(() => Promise.resolve(true)),
}));

vi.mock("@tauri-apps/api/webviewWindow", () => ({
  getCurrentWebviewWindow: vi.fn(() => ({
    label: "main",
    isFocused: mockIsFocused,
  })),
}));

import { isWindowFocused, getWindowLabel } from "./useWindowFocus";

describe("isWindowFocused", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true when window is focused", async () => {
    mockIsFocused.mockResolvedValueOnce(true);

    const result = await isWindowFocused();

    expect(result).toBe(true);
  });

  it("returns false when window is not focused", async () => {
    mockIsFocused.mockResolvedValueOnce(false);

    const result = await isWindowFocused();

    expect(result).toBe(false);
  });

  it("returns false when isFocused throws", async () => {
    mockIsFocused.mockRejectedValueOnce(new Error("Window not found"));

    const result = await isWindowFocused();

    expect(result).toBe(false);
  });

  it("returns false on unexpected error type", async () => {
    mockIsFocused.mockRejectedValueOnce("string error");

    const result = await isWindowFocused();

    expect(result).toBe(false);
  });
});

describe("getWindowLabel", () => {
  it("returns the current window label", () => {
    const label = getWindowLabel();

    expect(label).toBe("main");
  });
});
