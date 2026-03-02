/**
 * Tests for perfLog.ts — performance logging utility.
 *
 * The module gates all output behind localStorage("PERF_LOG") === "true".
 * Tests verify both enabled and disabled paths, timing logic, and color coding.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We need fresh imports per test group because the module auto-runs perfReset()
// on load and reads localStorage at call time via PERF_ENABLED().

describe("perfLog — disabled (default)", () => {
  beforeEach(() => {
    localStorage.removeItem("PERF_LOG");
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("perfStart does nothing when disabled", async () => {
    vi.resetModules();
    const { perfStart } = await import("./perfLog");
    perfStart("test-label");
    // No console output
    expect(console.log).not.toHaveBeenCalled();
  });

  it("perfEnd does nothing when disabled", async () => {
    vi.resetModules();
    const { perfEnd } = await import("./perfLog");
    perfEnd("test-label");
    expect(console.log).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("perfMark does nothing when disabled", async () => {
    vi.resetModules();
    const { perfMark } = await import("./perfLog");
    perfMark("mark-label");
    expect(console.log).not.toHaveBeenCalled();
  });

  it("perfSince does nothing when disabled", async () => {
    vi.resetModules();
    const { perfSince } = await import("./perfLog");
    perfSince("label", "since-label");
    expect(console.log).not.toHaveBeenCalled();
  });

  it("perfLog does nothing when disabled", async () => {
    vi.resetModules();
    const { perfLog } = await import("./perfLog");
    perfLog("message");
    expect(console.log).not.toHaveBeenCalled();
  });

  it("perfReset does not log when disabled", async () => {
    vi.resetModules();
    const { perfReset } = await import("./perfLog");
    // The module auto-calls perfReset on load; clear spy counts
    vi.mocked(console.log).mockClear();
    perfReset();
    expect(console.log).not.toHaveBeenCalled();
  });
});

describe("perfLog — enabled", () => {
  beforeEach(() => {
    localStorage.setItem("PERF_LOG", "true");
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.removeItem("PERF_LOG");
    vi.restoreAllMocks();
  });

  it("perfReset logs session start banner", async () => {
    vi.resetModules();
    const { perfReset } = await import("./perfLog");
    vi.mocked(console.log).mockClear();
    perfReset();
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("PERF SESSION START"),
      expect.any(String),
    );
  });

  it("perfStart + perfEnd logs elapsed time", async () => {
    vi.resetModules();
    const { perfReset, perfStart, perfEnd } = await import("./perfLog");
    perfReset();
    vi.mocked(console.log).mockClear();

    perfStart("op");
    perfEnd("op");

    // Should log with [PERF] prefix and timing info
    expect(console.log).toHaveBeenCalledTimes(1);
    const logArgs = vi.mocked(console.log).mock.calls[0];
    expect(logArgs[0]).toContain("[PERF] op:");
    expect(logArgs[0]).toContain("ms");
  });

  it("perfEnd with details includes JSON details", async () => {
    vi.resetModules();
    const { perfReset, perfStart, perfEnd } = await import("./perfLog");
    perfReset();
    vi.mocked(console.log).mockClear();

    perfStart("op");
    perfEnd("op", { nodes: 42 });

    const logArgs = vi.mocked(console.log).mock.calls[0];
    expect(logArgs[0]).toContain('"nodes":42');
  });

  it("perfEnd warns when no matching start exists", async () => {
    vi.resetModules();
    const { perfReset, perfEnd } = await import("./perfLog");
    perfReset();
    vi.mocked(console.log).mockClear();

    perfEnd("nonexistent");

    expect(console.warn).toHaveBeenCalledWith(
      "[PERF] No start time for: nonexistent",
    );
  });

  it("perfMark logs mark with timestamp", async () => {
    vi.resetModules();
    const { perfReset, perfMark } = await import("./perfLog");
    perfReset();
    vi.mocked(console.log).mockClear();

    perfMark("checkpoint");

    expect(console.log).toHaveBeenCalledTimes(1);
    const logArgs = vi.mocked(console.log).mock.calls[0];
    expect(logArgs[0]).toContain("[PERF]");
    expect(logArgs[0]).toContain("checkpoint");
  });

  it("perfMark with details includes JSON", async () => {
    vi.resetModules();
    const { perfReset, perfMark } = await import("./perfLog");
    perfReset();
    vi.mocked(console.log).mockClear();

    perfMark("checkpoint", { phase: "init" });

    const logArgs = vi.mocked(console.log).mock.calls[0];
    expect(logArgs[0]).toContain('"phase":"init"');
  });

  it("perfSince logs elapsed since a mark", async () => {
    vi.resetModules();
    const { perfReset, perfMark, perfSince } = await import("./perfLog");
    perfReset();
    vi.mocked(console.log).mockClear();

    perfMark("start-mark");
    perfSince("elapsed", "start-mark");

    // Two calls: perfMark + perfSince
    expect(console.log).toHaveBeenCalledTimes(2);
    const sinceArgs = vi.mocked(console.log).mock.calls[1];
    expect(sinceArgs[0]).toContain("elapsed");
    expect(sinceArgs[0]).toContain("since start-mark");
  });

  it("perfSince warns when mark does not exist", async () => {
    vi.resetModules();
    const { perfReset, perfSince } = await import("./perfLog");
    perfReset();

    perfSince("elapsed", "missing-mark");

    expect(console.warn).toHaveBeenCalledWith(
      "[PERF] No mark for: missing-mark",
    );
  });

  it("perfLog outputs message with timestamp", async () => {
    vi.resetModules();
    const { perfReset, perfLog } = await import("./perfLog");
    perfReset();
    vi.mocked(console.log).mockClear();

    perfLog("custom message");

    expect(console.log).toHaveBeenCalledTimes(1);
    const logArgs = vi.mocked(console.log).mock.calls[0];
    expect(logArgs[0]).toContain("[PERF] custom message");
  });

  it("perfLog with details includes JSON", async () => {
    vi.resetModules();
    const { perfReset, perfLog } = await import("./perfLog");
    perfReset();
    vi.mocked(console.log).mockClear();

    perfLog("info", { count: 5 });

    const logArgs = vi.mocked(console.log).mock.calls[0];
    expect(logArgs[0]).toContain('"count":5');
  });

  it("perfEnd removes label from startTimes (no double-end)", async () => {
    vi.resetModules();
    const { perfReset, perfStart, perfEnd } = await import("./perfLog");
    perfReset();
    vi.mocked(console.log).mockClear();
    vi.mocked(console.warn).mockClear();

    perfStart("once");
    perfEnd("once");
    perfEnd("once"); // second call — no start time

    expect(console.warn).toHaveBeenCalledWith(
      "[PERF] No start time for: once",
    );
  });
});

describe("perfLog — localStorage error handling", () => {
  it("PERF_ENABLED returns false when localStorage throws", async () => {
    const original = localStorage.getItem;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (localStorage as any).getItem = () => {
      throw new Error("SecurityError");
    };

    vi.resetModules();
    vi.spyOn(console, "log").mockImplementation(() => {});

    const { perfStart } = await import("./perfLog");
    perfStart("test");
    expect(console.log).not.toHaveBeenCalled();

    localStorage.getItem = original;
    vi.restoreAllMocks();
  });
});

describe("perfLog — color coding", () => {
  beforeEach(() => {
    localStorage.setItem("PERF_LOG", "true");
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.removeItem("PERF_LOG");
    vi.restoreAllMocks();
  });

  it("uses green color for fast operations (<50ms)", async () => {
    vi.resetModules();
    const { perfReset, perfStart, perfEnd } = await import("./perfLog");
    perfReset();
    vi.mocked(console.log).mockClear();

    // perfStart/perfEnd happen almost instantly -> < 50ms
    perfStart("fast-op");
    perfEnd("fast-op");

    const colorArg = vi.mocked(console.log).mock.calls[0][1];
    expect(colorArg).toBe("color: #1a7f37"); // green
  });
});
