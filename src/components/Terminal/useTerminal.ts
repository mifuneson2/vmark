import { useRef, useEffect, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { spawn, type IPty } from "tauri-pty";
import { useSettingsStore, themes } from "@/stores/settingsStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useTabStore } from "@/stores/tabStore";
import { useDocumentStore } from "@/stores/documentStore";
import { getCurrentWindowLabel } from "@/utils/workspaceStorage";
import { createFileLinkProvider } from "./fileLinkProvider";

import "@xterm/xterm/css/xterm.css";

/** Resolve --font-mono CSS variable to actual font family names. */
function resolveMonoFont(): string {
  const style = getComputedStyle(document.documentElement);
  const mono = style.getPropertyValue("--font-mono").trim();
  return mono || "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace";
}

/** Build xterm ITheme from the app's current theme. */
function buildXtermTheme() {
  const themeId = useSettingsStore.getState().appearance.theme;
  const colors = themes[themeId];
  return {
    background: colors.background,
    foreground: colors.foreground,
    cursor: colors.foreground,
    cursorAccent: colors.background,
    selectionBackground: colors.selection ?? "rgba(0,102,204,0.25)",
  };
}

/** Detect default shell on macOS/Linux. */
function getDefaultShell(): string {
  return "/bin/zsh";
}

/**
 * Resolve terminal working directory:
 * 1. Workspace root (if open)
 * 2. Active file's parent directory (if saved)
 * 3. undefined — lets the shell start in its default ($HOME)
 */
function resolveTerminalCwd(): string | undefined {
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

/**
 * Hook managing xterm Terminal lifecycle and PTY connection.
 * The terminal instance persists across hide/show toggles because
 * TerminalPanel keeps its DOM alive (display:none when hidden).
 */
export function useTerminal(containerRef: React.RefObject<HTMLDivElement | null>) {
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const ptyRef = useRef<IPty | null>(null);
  const initializedRef = useRef(false);

  // Fit the terminal to its container
  const fit = useCallback(() => {
    if (!fitAddonRef.current || !termRef.current) return;
    try {
      fitAddonRef.current.fit();
      const pty = ptyRef.current;
      const term = termRef.current;
      if (pty && term.cols > 0 && term.rows > 0) {
        pty.resize(term.cols, term.rows);
      }
    } catch {
      // Container may not be visible yet
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || initializedRef.current) return;
    initializedRef.current = true;

    // Create terminal
    const term = new Terminal({
      theme: buildXtermTheme(),
      fontFamily: resolveMonoFont(),
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      allowProposedApi: true,
      scrollback: 5000,
    });
    termRef.current = term;

    // Load fit addon
    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    term.loadAddon(fitAddon);

    // Open terminal in container
    term.open(container);

    // Try WebGL renderer for performance
    try {
      const webglAddon = new WebglAddon();
      webglAddon.onContextLoss(() => {
        webglAddon.dispose();
      });
      term.loadAddon(webglAddon);
    } catch {
      // Fallback to canvas renderer
    }

    // Web links — clickable URLs open in default browser
    term.loadAddon(new WebLinksAddon((_event, uri) => {
      import("@tauri-apps/plugin-opener").then(({ openUrl }) => {
        openUrl(uri);
      });
    }));

    // File links — clickable file paths open in editor
    term.registerLinkProvider(createFileLinkProvider(term, (filePath) => {
      import("@tauri-apps/plugin-fs").then(({ readTextFile }) => {
        readTextFile(filePath).then((content) => {
          const windowLabel = getCurrentWindowLabel();
          const tabId = useTabStore.getState().createTab(windowLabel, filePath);
          useDocumentStore.getState().initDocument(tabId, content, filePath);
        }).catch(() => {
          // File not readable — ignore
        });
      });
    }));

    // Initial fit (after layout settles)
    requestAnimationFrame(() => fit());

    // Spawn PTY
    try {
      const pty = spawn(getDefaultShell(), [], {
        cols: term.cols || 80,
        rows: term.rows || 24,
        cwd: resolveTerminalCwd(),
      });
      ptyRef.current = pty;

      // PTY → xterm (onData sends Uint8Array)
      pty.onData((data) => {
        term.write(data);
      });

      // PTY exit
      pty.onExit(({ exitCode }) => {
        term.write(`\r\n[Process exited with code ${exitCode}]\r\n`);
        ptyRef.current = null;
      });

      // xterm → PTY
      term.onData((data) => {
        if (ptyRef.current) {
          ptyRef.current.write(data);
        }
      });
    } catch (err) {
      term.write(`\r\nFailed to start shell: ${err}\r\n`);
    }

    return () => {
      if (ptyRef.current) {
        try { ptyRef.current.kill(); } catch { /* ignore */ }
        ptyRef.current = null;
      }
      term.dispose();
      termRef.current = null;
      fitAddonRef.current = null;
      initializedRef.current = false;
    };
  }, [containerRef, fit]);

  // Sync theme when settings change
  useEffect(() => {
    let prevTheme = useSettingsStore.getState().appearance.theme;
    return useSettingsStore.subscribe((state) => {
      const themeId = state.appearance.theme;
      if (themeId === prevTheme) return;
      prevTheme = themeId;
      if (!termRef.current) return;
      const colors = themes[themeId];
      termRef.current.options.theme = {
        background: colors.background,
        foreground: colors.foreground,
        cursor: colors.foreground,
        cursorAccent: colors.background,
        selectionBackground: colors.selection ?? "rgba(0,102,204,0.25)",
      };
    });
  }, []);

  return { fit, termRef };
}
