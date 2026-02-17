/**
 * spawnPty
 *
 * Purpose: Spawns a PTY (pseudo-terminal) process connected to an xterm instance.
 * Resolves the working directory, gets the default shell from Rust, and wires
 * up bidirectional data streams.
 *
 * Key decisions:
 *   - CWD priority: workspace root > active file's parent directory > shell default ($HOME).
 *   - Shell is determined by the Rust backend (get_default_shell), not hardcoded,
 *     to respect the user's configured shell on any platform.
 *   - Sets TERM_PROGRAM=vmark and EDITOR=vmark so CLI tools can detect the host.
 *   - Sets VMARK_WORKSPACE when a workspace is open, enabling shell scripts
 *     to access the workspace root.
 *   - The disposed() callback lets the caller abort if the session was removed
 *     while the async spawn was in flight.
 *   - Watermark-based flow control pauses the PTY when xterm.js can't keep up
 *     with rapid output (e.g. AI tool redraws), preventing lag and freezes.
 *
 * @coordinates-with useTerminalSessions.ts — calls spawnPty when starting a shell
 * @coordinates-with createTerminalInstance.ts — provides the xterm Terminal instance
 * @module components/Terminal/spawnPty
 */
import { spawn, type IPty, type IEvent } from "tauri-pty";
import { invoke } from "@tauri-apps/api/core";
import type { Terminal } from "@xterm/xterm";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useTabStore } from "@/stores/tabStore";
import { useDocumentStore } from "@/stores/documentStore";
import { getCurrentWindowLabel } from "@/utils/workspaceStorage";

/**
 * Resolve terminal working directory:
 * 1. Workspace root (if open)
 * 2. Active file's parent directory (if saved)
 * 3. undefined — lets the shell start in its default ($HOME)
 */
export function resolveTerminalCwd(): string | undefined {
  const workspaceRoot = useWorkspaceStore.getState().rootPath;
  if (workspaceRoot) return workspaceRoot;

  const windowLabel = getCurrentWindowLabel();
  const activeTabId = useTabStore.getState().activeTabId[windowLabel];
  if (activeTabId) {
    const doc = useDocumentStore.getState().getDocument(activeTabId);
    if (doc?.filePath) {
      const lastSlash = doc.filePath.lastIndexOf("/");
      if (lastSlash > 0) return doc.filePath.substring(0, lastSlash);
    }
  }

  return undefined;
}

export interface SpawnOptions {
  term: Terminal;
  cwd?: string;
  onExit: (exitCode: number) => void;
  disposed: () => boolean;
}

/** Flow control constants — exported for tests. */
export const CALLBACK_BYTE_LIMIT = 100_000;
export const HIGH_WATERMARK = 5;
export const LOW_WATERMARK = 2;

/**
 * Wire PTY → xterm with watermark-based flow control.
 * Fast producers (e.g. claude-code with rapid ANSI redraws) can overwhelm
 * xterm.js. We pause the PTY when too many write callbacks are pending,
 * and resume when the parser catches up.
 */
/** Minimal PTY interface for flow control wiring (testable without full IPty). */
export interface FlowControlPty {
  onData: IEvent<Uint8Array>;
  pause(): void;
  resume(): void;
}

export function wirePtyFlowControl(
  pty: FlowControlPty,
  term: Pick<Terminal, "write">,
  disposed: () => boolean,
): void {
  let written = 0;
  let pendingCallbacks = 0;

  pty.onData((data) => {
    if (disposed()) return;
    written += data.length;

    if (written > CALLBACK_BYTE_LIMIT) {
      term.write(data, () => {
        pendingCallbacks = Math.max(pendingCallbacks - 1, 0);
        if (pendingCallbacks < LOW_WATERMARK) {
          pty.resume();
        }
      });
      pendingCallbacks++;
      written = 0;
      if (pendingCallbacks > HIGH_WATERMARK) {
        pty.pause();
      }
    } else {
      term.write(data);
    }
  });
}

/**
 * Spawn a PTY process connected to the terminal.
 * Reads shell from Tauri backend, accepts optional cwd, wires data streams.
 */
export async function spawnPty(options: SpawnOptions): Promise<IPty> {
  const { term, cwd, onExit, disposed } = options;

  const shell = await invoke<string>("get_default_shell");
  if (disposed()) throw new Error("disposed before spawn");
  const workspaceRoot = useWorkspaceStore.getState().rootPath;

  const env: Record<string, string> = {
    // Ensure consistent color capabilities in xterm.js; Tauri GUI apps may not inherit terminal env vars.
    TERM: "xterm-256color",
    TERM_PROGRAM: "vmark",
    EDITOR: "vmark",
  };
  if (workspaceRoot) {
    env.VMARK_WORKSPACE = workspaceRoot;
  }

  const pty = spawn(shell, [], {
    cols: term.cols || 80,
    rows: term.rows || 24,
    cwd,
    env,
  });

  // PTY → xterm with watermark-based flow control
  wirePtyFlowControl(pty, term, disposed);

  // PTY exit
  pty.onExit(({ exitCode }) => {
    onExit(exitCode);
  });

  return pty;
}
