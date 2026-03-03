/**
 * Tests for openWorkspaceWithConfig — workspace opening with config loading
 *
 * @module hooks/openWorkspaceWithConfig.test
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockInvoke, mockOpenWorkspace } = vi.hoisted(() => ({
  mockInvoke: vi.fn(() => Promise.resolve(null)),
  mockOpenWorkspace: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: mockInvoke,
}));

vi.mock("@/stores/workspaceStore", () => ({
  useWorkspaceStore: {
    getState: vi.fn(() => ({
      openWorkspace: mockOpenWorkspace,
    })),
  },
}));

import { openWorkspaceWithConfig } from "./openWorkspaceWithConfig";

describe("openWorkspaceWithConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads workspace config from disk via invoke", async () => {
    mockInvoke.mockResolvedValueOnce(null);

    await openWorkspaceWithConfig("/workspace/root");

    expect(mockInvoke).toHaveBeenCalledWith("read_workspace_config", {
      rootPath: "/workspace/root",
    });
  });

  it("opens workspace with config when config exists", async () => {
    const config = { version: 1, excludedFolders: [".git"] };
    mockInvoke.mockResolvedValueOnce(config);

    const result = await openWorkspaceWithConfig("/workspace/root");

    expect(mockOpenWorkspace).toHaveBeenCalledWith("/workspace/root", config);
    expect(result).toEqual(config);
  });

  it("opens workspace with null config when no config on disk", async () => {
    mockInvoke.mockResolvedValueOnce(null);

    const result = await openWorkspaceWithConfig("/workspace/root");

    expect(mockOpenWorkspace).toHaveBeenCalledWith("/workspace/root", null);
    expect(result).toBeNull();
  });

  it("opens workspace without config on invoke error", async () => {
    mockInvoke.mockRejectedValueOnce(new Error("File not found"));

    const result = await openWorkspaceWithConfig("/workspace/root");

    expect(mockOpenWorkspace).toHaveBeenCalledWith("/workspace/root");
    expect(result).toBeNull();
  });

  it("opens workspace without config on non-Error rejection", async () => {
    mockInvoke.mockRejectedValueOnce("string error");

    const result = await openWorkspaceWithConfig("/workspace/root");

    expect(mockOpenWorkspace).toHaveBeenCalledWith("/workspace/root");
    expect(result).toBeNull();
  });

  it("returns the config object from Rust", async () => {
    const config = {
      version: 1,
      excludedFolders: [".git", "node_modules"],
      lastOpenTabs: ["/workspace/root/file.md"],
    };
    mockInvoke.mockResolvedValueOnce(config);

    const result = await openWorkspaceWithConfig("/workspace/root");

    expect(result).toBe(config);
  });

  it("handles empty root path", async () => {
    mockInvoke.mockResolvedValueOnce(null);

    await openWorkspaceWithConfig("");

    expect(mockInvoke).toHaveBeenCalledWith("read_workspace_config", {
      rootPath: "",
    });
    expect(mockOpenWorkspace).toHaveBeenCalledWith("", null);
  });

  it("handles paths with special characters", async () => {
    mockInvoke.mockResolvedValueOnce(null);

    await openWorkspaceWithConfig("/Users/test/My Documents/project (v2)");

    expect(mockInvoke).toHaveBeenCalledWith("read_workspace_config", {
      rootPath: "/Users/test/My Documents/project (v2)",
    });
  });
});
