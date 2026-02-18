import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  resolveTerminalCwd,
  wirePtyFlowControl,
  CALLBACK_BYTE_LIMIT,
  HIGH_WATERMARK,
  LOW_WATERMARK,
  type FlowControlPty,
} from "./spawnPty";

// Mock stores
vi.mock("@/stores/workspaceStore", () => ({
  useWorkspaceStore: { getState: vi.fn(() => ({ rootPath: null })) },
}));

vi.mock("@/stores/tabStore", () => ({
  useTabStore: { getState: vi.fn(() => ({ activeTabId: {} })) },
}));

vi.mock("@/stores/documentStore", () => ({
  useDocumentStore: { getState: vi.fn(() => ({ getDocument: () => null })) },
}));

vi.mock("@/utils/workspaceStorage", () => ({
  getCurrentWindowLabel: vi.fn(() => "main"),
}));

vi.mock("tauri-pty", () => ({
  spawn: vi.fn(() => ({
    onData: vi.fn(),
    onExit: vi.fn(),
    write: vi.fn(),
    resize: vi.fn(),
    kill: vi.fn(),
  })),
}));

import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useTabStore } from "@/stores/tabStore";
import { useDocumentStore } from "@/stores/documentStore";

describe("resolveTerminalCwd", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns workspace root when available", () => {
    vi.mocked(useWorkspaceStore.getState).mockReturnValue({
      rootPath: "/workspace/root",
    } as ReturnType<typeof useWorkspaceStore.getState>);

    expect(resolveTerminalCwd()).toBe("/workspace/root");
  });

  it("returns active file parent dir when no workspace", () => {
    vi.mocked(useWorkspaceStore.getState).mockReturnValue({
      rootPath: null,
    } as ReturnType<typeof useWorkspaceStore.getState>);
    vi.mocked(useTabStore.getState).mockReturnValue({
      activeTabId: { main: "tab1" },
    } as unknown as ReturnType<typeof useTabStore.getState>);
    vi.mocked(useDocumentStore.getState).mockReturnValue({
      getDocument: () => ({ filePath: "/Users/test/docs/file.md" }),
    } as unknown as ReturnType<typeof useDocumentStore.getState>);

    expect(resolveTerminalCwd()).toBe("/Users/test/docs");
  });

  it("returns undefined when no workspace and no active file", () => {
    vi.mocked(useWorkspaceStore.getState).mockReturnValue({
      rootPath: null,
    } as ReturnType<typeof useWorkspaceStore.getState>);
    vi.mocked(useTabStore.getState).mockReturnValue({
      activeTabId: {},
    } as unknown as ReturnType<typeof useTabStore.getState>);

    expect(resolveTerminalCwd()).toBeUndefined();
  });

  it("returns undefined when active file has no path", () => {
    vi.mocked(useWorkspaceStore.getState).mockReturnValue({
      rootPath: null,
    } as ReturnType<typeof useWorkspaceStore.getState>);
    vi.mocked(useTabStore.getState).mockReturnValue({
      activeTabId: { main: "tab1" },
    } as unknown as ReturnType<typeof useTabStore.getState>);
    vi.mocked(useDocumentStore.getState).mockReturnValue({
      getDocument: () => ({ filePath: null }),
    } as unknown as ReturnType<typeof useDocumentStore.getState>);

    expect(resolveTerminalCwd()).toBeUndefined();
  });
});

describe("wirePtyFlowControl", () => {
  let dataHandler: (data: Uint8Array) => void;
  let writeCallbacks: Array<() => void>;
  let mockPty: FlowControlPty;
  let mockTerm: Pick<import("@xterm/xterm").Terminal, "write">;

  beforeEach(() => {
    writeCallbacks = [];
    mockPty = {
      onData: vi.fn((handler: (e: Uint8Array) => void) => {
        dataHandler = handler;
        return { dispose: vi.fn() };
      }) as unknown as FlowControlPty["onData"],
      pause: vi.fn(),
      resume: vi.fn(),
    };
    mockTerm = {
      write: vi.fn((_data: string | Uint8Array, cb?: () => void) => {
        if (cb) writeCallbacks.push(cb);
      }) as unknown as Pick<import("@xterm/xterm").Terminal, "write">["write"],
    };
  });

  /** Send a chunk of the given byte size through the PTY data handler. */
  function sendChunk(size: number): void {
    dataHandler(new Uint8Array(size));
  }

  it("writes small chunks directly without callback (fast path)", () => {
    wirePtyFlowControl(mockPty, mockTerm, () => false);

    sendChunk(1000);
    expect(mockTerm.write).toHaveBeenCalledWith(expect.any(Uint8Array));
    expect(writeCallbacks).toHaveLength(0);
    expect(mockPty.pause).not.toHaveBeenCalled();
  });

  it("skips write when disposed", () => {
    wirePtyFlowControl(mockPty, mockTerm, () => true);

    sendChunk(1000);
    expect(mockTerm.write).not.toHaveBeenCalled();
  });

  it("attaches callback when cumulative bytes exceed CALLBACK_BYTE_LIMIT", () => {
    wirePtyFlowControl(mockPty, mockTerm, () => false);

    // First chunk under limit — fast path
    sendChunk(CALLBACK_BYTE_LIMIT - 1);
    expect(writeCallbacks).toHaveLength(0);

    // Second chunk crosses limit — callback path
    sendChunk(2);
    expect(writeCallbacks).toHaveLength(1);
  });

  it("pauses PTY when pending callbacks exceed HIGH_WATERMARK", () => {
    wirePtyFlowControl(mockPty, mockTerm, () => false);

    // Each chunk exceeds CALLBACK_BYTE_LIMIT, incrementing pendingCallbacks
    for (let i = 0; i <= HIGH_WATERMARK; i++) {
      sendChunk(CALLBACK_BYTE_LIMIT + 1);
    }

    expect(mockPty.pause).toHaveBeenCalled();
  });

  it("does not pause PTY when pending callbacks are at or below HIGH_WATERMARK", () => {
    wirePtyFlowControl(mockPty, mockTerm, () => false);

    // Send exactly HIGH_WATERMARK chunks (pendingCallbacks reaches HIGH_WATERMARK, not exceeding)
    for (let i = 0; i < HIGH_WATERMARK; i++) {
      sendChunk(CALLBACK_BYTE_LIMIT + 1);
    }

    expect(mockPty.pause).not.toHaveBeenCalled();
  });

  it("resumes PTY when pending callbacks drop below LOW_WATERMARK", () => {
    wirePtyFlowControl(mockPty, mockTerm, () => false);

    // Build up enough pending callbacks to trigger pause
    for (let i = 0; i <= HIGH_WATERMARK; i++) {
      sendChunk(CALLBACK_BYTE_LIMIT + 1);
    }
    expect(mockPty.pause).toHaveBeenCalled();

    // Flush callbacks until pendingCallbacks drops below LOW_WATERMARK
    // We have HIGH_WATERMARK + 1 callbacks; flush enough to get below LOW_WATERMARK
    const toFlush = writeCallbacks.length - LOW_WATERMARK + 1;
    for (let i = 0; i < toFlush; i++) {
      const cb = writeCallbacks.shift();
      cb?.();
    }

    expect(mockPty.resume).toHaveBeenCalled();
  });

  it("resets byte counter after callback-path write", () => {
    wirePtyFlowControl(mockPty, mockTerm, () => false);

    // Cross the limit — triggers callback path and resets written to 0
    sendChunk(CALLBACK_BYTE_LIMIT + 1);
    expect(writeCallbacks).toHaveLength(1);

    // Next small chunk should go fast path (written was reset)
    sendChunk(100);
    expect(writeCallbacks).toHaveLength(1); // no new callback
  });

  it("survives when pause() throws (tauri-pty 0.2.x unimplemented)", () => {
    mockPty.pause = vi.fn(() => { throw new Error("Method not implemented."); });
    wirePtyFlowControl(mockPty, mockTerm, () => false);

    // Should not throw even when pause() is unimplemented
    expect(() => {
      for (let i = 0; i <= HIGH_WATERMARK; i++) {
        sendChunk(CALLBACK_BYTE_LIMIT + 1);
      }
    }).not.toThrow();
  });

  it("survives when resume() throws (tauri-pty 0.2.x unimplemented)", () => {
    mockPty.resume = vi.fn(() => { throw new Error("Method not implemented."); });
    wirePtyFlowControl(mockPty, mockTerm, () => false);

    // Build up callbacks then flush — resume() should not throw
    for (let i = 0; i <= HIGH_WATERMARK; i++) {
      sendChunk(CALLBACK_BYTE_LIMIT + 1);
    }
    expect(() => {
      const toFlush = writeCallbacks.length - LOW_WATERMARK + 1;
      for (let i = 0; i < toFlush; i++) {
        writeCallbacks.shift()?.();
      }
    }).not.toThrow();
  });

  it("does not resume when callbacks drop but stay at LOW_WATERMARK", () => {
    wirePtyFlowControl(mockPty, mockTerm, () => false);

    // Build up LOW_WATERMARK + 1 pending callbacks (not enough to pause, but enough to test resume threshold)
    for (let i = 0; i < LOW_WATERMARK + 1; i++) {
      sendChunk(CALLBACK_BYTE_LIMIT + 1);
    }

    // Flush one — pendingCallbacks goes from LOW_WATERMARK+1 to LOW_WATERMARK (not below)
    const cb = writeCallbacks.shift();
    cb?.();

    expect(mockPty.resume).not.toHaveBeenCalled();
  });
});
