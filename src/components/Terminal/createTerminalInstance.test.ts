import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Hoisted mocks (available before vi.mock factories execute) ---

const { mockOpenUrl, mockTerminalLog, MockWebLinksAddon } = vi.hoisted(() => ({
  mockOpenUrl: vi.fn<(url: string) => Promise<void>>(),
  mockTerminalLog: vi.fn(),
  MockWebLinksAddon: vi.fn(),
}));

// --- Module mocks ---

vi.mock("@tauri-apps/plugin-opener", () => ({
  openUrl: (...args: unknown[]) => mockOpenUrl(...(args as [string])),
}));

vi.mock("@/utils/debug", () => ({
  terminalLog: (...args: unknown[]) => mockTerminalLog(...args),
  clipboardWarn: vi.fn(),
}));

vi.mock("@xterm/xterm", () => ({
  Terminal: class MockTerminal {
    loadAddon = vi.fn();
    open = vi.fn();
    dispose = vi.fn();
    onSelectionChange = vi.fn();
    hasSelection = vi.fn(() => false);
    getSelection = vi.fn(() => "");
    attachCustomKeyEventHandler = vi.fn();
    registerLinkProvider = vi.fn();
    cols = 80;
    rows = 24;
    options = {};
    unicode = { activeVersion: "6" };
    buffer = { active: { getLine: vi.fn() } };
  },
}));

vi.mock("@xterm/addon-fit", () => ({
  FitAddon: class { fit = vi.fn(); dispose = vi.fn(); },
}));

vi.mock("@xterm/addon-search", () => ({
  SearchAddon: class { findNext = vi.fn(); findPrevious = vi.fn(); clearDecorations = vi.fn(); dispose = vi.fn(); },
}));

vi.mock("@xterm/addon-serialize", () => ({
  SerializeAddon: class { serialize = vi.fn(() => ""); dispose = vi.fn(); },
}));

vi.mock("@xterm/addon-unicode11", () => ({
  Unicode11Addon: class { dispose = vi.fn(); },
}));

vi.mock("@xterm/addon-web-links", () => ({
  WebLinksAddon: MockWebLinksAddon,
}));

vi.mock("@/stores/settingsStore", () => ({
  useSettingsStore: {
    getState: () => ({
      appearance: { theme: "default" },
      terminal: { copyOnSelect: false },
    }),
  },
  themes: {
    default: { background: "#ffffff", foreground: "#1a1a1a" },
  },
}));

vi.mock("@/stores/tabStore", () => ({
  useTabStore: { getState: () => ({ createTab: vi.fn() }) },
}));

vi.mock("@/stores/documentStore", () => ({
  useDocumentStore: { getState: () => ({ initDocument: vi.fn() }) },
}));

vi.mock("@/utils/workspaceStorage", () => ({
  getCurrentWindowLabel: () => "main",
}));

vi.mock("./fileLinkProvider", () => ({
  createFileLinkProvider: vi.fn(() => ({ provideLinks: vi.fn() })),
}));

vi.mock("./terminalKeyHandler", () => ({
  createTerminalKeyHandler: vi.fn(() => () => true),
}));

// --- Imports ---

import { createTerminalInstance } from "./createTerminalInstance";

// --- Helpers ---

function makeInstance() {
  const parentEl = document.createElement("div");
  return createTerminalInstance({
    parentEl,
    settings: {
      fontSize: 14,
      lineHeight: 1.2,
      cursorStyle: "block",
      cursorBlink: true,
      useWebGL: false,
    },
    ptyRef: { current: null },
    onSearch: vi.fn(),
  });
}

// --- Tests ---

describe("createTerminalInstance link error handling", () => {
  let webLinkHandler: (event: MouseEvent, uri: string) => void;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOpenUrl.mockResolvedValue(undefined);

    makeInstance();

    // Capture the handler passed to WebLinksAddon constructor
    webLinkHandler = MockWebLinksAddon.mock.calls[0][0];
  });

  it("logs error when openUrl rejects", async () => {
    mockOpenUrl.mockRejectedValueOnce(new Error("Sandbox denied"));

    webLinkHandler(new MouseEvent("click"), "https://example.com");

    // Wait for the dynamic import + openUrl promise chain to settle
    await vi.waitFor(() => {
      expect(mockTerminalLog).toHaveBeenCalledWith(
        "Failed to open URL:",
        "Sandbox denied",
      );
    });
  });

  it("logs error when openUrl rejects with non-Error value", async () => {
    mockOpenUrl.mockRejectedValueOnce("string error");

    webLinkHandler(new MouseEvent("click"), "https://example.com");

    await vi.waitFor(() => {
      expect(mockTerminalLog).toHaveBeenCalledWith(
        "Failed to open URL:",
        "string error",
      );
    });
  });
});

describe("createTerminalInstance basics", () => {
  it("creates a child container appended to parentEl", () => {
    const inst = makeInstance();
    expect(inst.container).toBeInstanceOf(HTMLDivElement);
    expect(inst.container.style.display).toBe("none");
  });

  it("exposes term, fitAddon, searchAddon, serializeAddon", () => {
    const inst = makeInstance();
    expect(inst.term).toBeDefined();
    expect(inst.fitAddon).toBeDefined();
    expect(inst.searchAddon).toBeDefined();
    expect(inst.serializeAddon).toBeDefined();
  });

  it("opens terminal in the container", () => {
    const inst = makeInstance();
    expect(inst.term.open).toHaveBeenCalledWith(inst.container);
  });

  it("sets unicode version to 11", () => {
    const inst = makeInstance();
    expect(inst.term.unicode.activeVersion).toBe("11");
  });

  it("attaches custom key event handler", () => {
    const inst = makeInstance();
    expect(inst.term.attachCustomKeyEventHandler).toHaveBeenCalledWith(expect.any(Function));
  });

  it("registers a link provider", () => {
    const inst = makeInstance();
    expect(inst.term.registerLinkProvider).toHaveBeenCalled();
  });

  it("registers selection change handler", () => {
    const inst = makeInstance();
    expect(inst.term.onSelectionChange).toHaveBeenCalledWith(expect.any(Function));
  });
});

describe("createTerminalInstance dispose", () => {
  it("disposes the terminal on dispose()", () => {
    const parentEl = document.createElement("div");
    const inst = createTerminalInstance({
      parentEl,
      settings: {
        fontSize: 14,
        lineHeight: 1.2,
        cursorStyle: "block",
        cursorBlink: true,
        useWebGL: false,
      },
      ptyRef: { current: null },
      onSearch: vi.fn(),
    });
    inst.dispose();
    expect(inst.term.dispose).toHaveBeenCalled();
  });

  it("removes container from parentEl on dispose()", () => {
    const parentEl = document.createElement("div");
    const inst = createTerminalInstance({
      parentEl,
      settings: {
        fontSize: 14,
        lineHeight: 1.2,
        cursorStyle: "block",
        cursorBlink: true,
        useWebGL: false,
      },
      ptyRef: { current: null },
      onSearch: vi.fn(),
    });
    expect(parentEl.contains(inst.container)).toBe(true);
    inst.dispose();
    expect(parentEl.contains(inst.container)).toBe(false);
  });
});

describe("createTerminalInstance composing property", () => {
  it("starts with composing=false", () => {
    const inst = makeInstance();
    expect(inst.composing).toBe(false);
  });

  it("onCompositionCommit starts as null", () => {
    const inst = makeInstance();
    expect(inst.onCompositionCommit).toBeNull();
  });

  it("allows setting onCompositionCommit callback", () => {
    const inst = makeInstance();
    const cb = vi.fn();
    inst.onCompositionCommit = cb;
    expect(inst.onCompositionCommit).toBe(cb);
  });
});

describe("createTerminalInstance with WebGL", () => {
  it("does not throw when WebGL is enabled", () => {
    vi.mock("@xterm/addon-webgl", () => ({
      WebglAddon: class {
        onContextLoss = vi.fn((cb: () => void) => cb);
        dispose = vi.fn();
      },
    }));

    const parentEl = document.createElement("div");
    expect(() =>
      createTerminalInstance({
        parentEl,
        settings: {
          fontSize: 14,
          lineHeight: 1.2,
          cursorStyle: "block",
          cursorBlink: true,
          useWebGL: true,
        },
        ptyRef: { current: null },
        onSearch: vi.fn(),
      })
    ).not.toThrow();
  });
});
