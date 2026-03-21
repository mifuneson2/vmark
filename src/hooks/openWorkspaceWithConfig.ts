/**
 * Open Workspace With Config
 *
 * Purpose: Opens a workspace by reading its config from disk (if available)
 *   and updating the workspace store — returns the config for callers
 *   that need to restore tabs or apply settings.
 *
 * @coordinates-with workspaceStore.ts — openWorkspace action
 * @module hooks/openWorkspaceWithConfig
 */

import { invoke } from "@tauri-apps/api/core";
import { useWorkspaceStore, type WorkspaceConfig } from "@/stores/workspaceStore";
import { workspaceError } from "@/utils/debug";
/** Reads workspace config from disk and opens the workspace in the store; returns the config or null on failure. */
export async function openWorkspaceWithConfig(
  rootPath: string
): Promise<WorkspaceConfig | null> {
  try {
    const config = await invoke<WorkspaceConfig | null>("read_workspace_config", {
      rootPath,
    });
    useWorkspaceStore.getState().openWorkspace(rootPath, config);
    return config;
  } catch (error) {
    workspaceError("Failed to load config:", error);
    useWorkspaceStore.getState().openWorkspace(rootPath);
    return null;
  }
}
