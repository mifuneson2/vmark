import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  registerActiveWysiwygFlusher,
  flushActiveWysiwygNow,
} from "./wysiwygFlush";

describe("wysiwygFlush", () => {
  beforeEach(() => {
    // Reset flusher to null between tests
    registerActiveWysiwygFlusher(null);
  });

  it("calls the registered flusher", () => {
    const flusher = vi.fn();
    registerActiveWysiwygFlusher(flusher);

    flushActiveWysiwygNow();

    expect(flusher).toHaveBeenCalledTimes(1);
  });

  it("does nothing when no flusher is registered", () => {
    // Should not throw
    expect(() => flushActiveWysiwygNow()).not.toThrow();
  });

  it("does nothing when flusher is set to null", () => {
    const flusher = vi.fn();
    registerActiveWysiwygFlusher(flusher);
    registerActiveWysiwygFlusher(null);

    flushActiveWysiwygNow();

    expect(flusher).not.toHaveBeenCalled();
  });

  it("replaces the previous flusher", () => {
    const first = vi.fn();
    const second = vi.fn();

    registerActiveWysiwygFlusher(first);
    registerActiveWysiwygFlusher(second);

    flushActiveWysiwygNow();

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
