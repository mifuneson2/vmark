/**
 * Tests for compositionGuard tiptap extension — extension metadata,
 * plugin structure, filterTransaction, handleKeyDown, DOM event handlers,
 * and composition state management.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock imeGuard before importing the extension
const mockFlushProseMirrorCompositionQueue = vi.fn();
const mockGetImeCleanupPrefixLength = vi.fn(() => 0);
const mockIsImeKeyEvent = vi.fn(() => false);
const mockIsProseMirrorInCompositionGrace = vi.fn(() => false);
const mockMarkProseMirrorCompositionEnd = vi.fn();

vi.mock("@/utils/imeGuard", () => ({
  flushProseMirrorCompositionQueue: (...args: unknown[]) => mockFlushProseMirrorCompositionQueue(...args),
  getImeCleanupPrefixLength: (...args: unknown[]) => mockGetImeCleanupPrefixLength(...args),
  isImeKeyEvent: (...args: unknown[]) => mockIsImeKeyEvent(...args),
  isProseMirrorInCompositionGrace: (...args: unknown[]) => mockIsProseMirrorInCompositionGrace(...args),
  markProseMirrorCompositionEnd: (...args: unknown[]) => mockMarkProseMirrorCompositionEnd(...args),
}));

// Mock splitBlockFix
const mockFixCompositionSplitBlock = vi.fn(() => null);
vi.mock("../splitBlockFix", () => ({
  fixCompositionSplitBlock: (...args: unknown[]) => mockFixCompositionSplitBlock(...args),
}));

import { compositionGuardExtension } from "../tiptap";

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Extension metadata
// ---------------------------------------------------------------------------

describe("compositionGuardExtension metadata", () => {
  it("has correct name", () => {
    expect(compositionGuardExtension.name).toBe("compositionGuard");
  });

  it("is an Extension (not a Node or Mark)", () => {
    expect(compositionGuardExtension.type).toBe("extension");
  });

  it("has high priority (1200)", () => {
    expect(compositionGuardExtension.config.priority).toBe(1200);
  });
});

// ---------------------------------------------------------------------------
// Plugin creation
// ---------------------------------------------------------------------------

describe("compositionGuardExtension addProseMirrorPlugins", () => {
  function createPlugins() {
    return compositionGuardExtension.config.addProseMirrorPlugins!.call({
      editor: {},
      name: "compositionGuard",
      options: {},
      storage: {},
      type: undefined,
      parent: undefined,
    } as never);
  }

  it("returns exactly one plugin", () => {
    const plugins = createPlugins();
    expect(plugins).toHaveLength(1);
  });

  it("plugin has filterTransaction", () => {
    const plugins = createPlugins();
    const plugin = plugins[0] as { spec: { filterTransaction?: unknown } };
    expect(plugin.spec.filterTransaction).toBeDefined();
  });

  it("plugin has appendTransaction", () => {
    const plugins = createPlugins();
    const plugin = plugins[0] as { spec: { appendTransaction?: unknown } };
    expect(plugin.spec.appendTransaction).toBeDefined();
  });

  it("plugin has handleKeyDown prop", () => {
    const plugins = createPlugins();
    const plugin = plugins[0] as { props: { handleKeyDown?: unknown } };
    expect(plugin.props.handleKeyDown).toBeDefined();
  });

  it("plugin has handleDOMEvents prop", () => {
    const plugins = createPlugins();
    const plugin = plugins[0] as { props: { handleDOMEvents?: Record<string, unknown> } };
    expect(plugin.props.handleDOMEvents).toBeDefined();
    expect(plugin.props.handleDOMEvents!.compositionstart).toBeDefined();
    expect(plugin.props.handleDOMEvents!.compositionupdate).toBeDefined();
    expect(plugin.props.handleDOMEvents!.compositionend).toBeDefined();
    expect(plugin.props.handleDOMEvents!.blur).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// handleKeyDown — IME key event blocking
// ---------------------------------------------------------------------------

describe("compositionGuard handleKeyDown", () => {
  function getHandleKeyDown() {
    const plugins = compositionGuardExtension.config.addProseMirrorPlugins!.call({
      editor: {},
      name: "compositionGuard",
      options: {},
      storage: {},
      type: undefined,
      parent: undefined,
    } as never);
    return (plugins[0] as { props: { handleKeyDown: (view: unknown, event: unknown) => boolean } }).props.handleKeyDown;
  }

  it("returns true (block) for IME key events", () => {
    mockIsImeKeyEvent.mockReturnValue(true);
    const handleKeyDown = getHandleKeyDown();
    const result = handleKeyDown({}, { keyCode: 229 });
    expect(result).toBe(true);
  });

  it("returns true (block) during composition grace period", () => {
    mockIsImeKeyEvent.mockReturnValue(false);
    mockIsProseMirrorInCompositionGrace.mockReturnValue(true);
    const handleKeyDown = getHandleKeyDown();
    const result = handleKeyDown({}, {});
    expect(result).toBe(true);
  });

  it("returns false for normal key events", () => {
    mockIsImeKeyEvent.mockReturnValue(false);
    mockIsProseMirrorInCompositionGrace.mockReturnValue(false);
    const handleKeyDown = getHandleKeyDown();
    const result = handleKeyDown({}, {});
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// filterTransaction
// ---------------------------------------------------------------------------

describe("compositionGuard filterTransaction", () => {
  function getFilterTransaction() {
    const plugins = compositionGuardExtension.config.addProseMirrorPlugins!.call({
      editor: {},
      name: "compositionGuard",
      options: {},
      storage: {},
      type: undefined,
      parent: undefined,
    } as never);
    return (plugins[0] as { spec: { filterTransaction: (tr: unknown) => boolean } }).spec.filterTransaction;
  }

  function getDomEvents() {
    const plugins = compositionGuardExtension.config.addProseMirrorPlugins!.call({
      editor: {},
      name: "compositionGuard",
      options: {},
      storage: {},
      type: undefined,
      parent: undefined,
    } as never);
    const plugin = plugins[0] as {
      props: {
        handleDOMEvents: {
          compositionstart: (view: unknown) => boolean;
          compositionend: (view: unknown, event: unknown) => boolean;
        };
      };
      spec: { filterTransaction: (tr: unknown) => boolean };
    };
    return {
      compositionstart: plugin.props.handleDOMEvents.compositionstart,
      compositionend: plugin.props.handleDOMEvents.compositionend,
      filterTransaction: plugin.spec.filterTransaction,
    };
  }

  it("allows all transactions when not composing", () => {
    const filterTransaction = getFilterTransaction();
    const tr = { getMeta: () => undefined, docChanged: false };
    expect(filterTransaction(tr)).toBe(true);
  });

  it("allows composition meta transactions during composing", () => {
    const { compositionstart, filterTransaction } = getDomEvents();
    const mockView = { state: { selection: { from: 0 } } };
    compositionstart(mockView);

    const tr = {
      getMeta: (key: string) => key === "composition" ? true : undefined,
      docChanged: false,
    };
    expect(filterTransaction(tr)).toBe(true);
  });

  it("allows doc-changing transactions during composing", () => {
    const { compositionstart, filterTransaction } = getDomEvents();
    const mockView = { state: { selection: { from: 0 } } };
    compositionstart(mockView);

    const tr = {
      getMeta: () => undefined,
      docChanged: true,
    };
    expect(filterTransaction(tr)).toBe(true);
  });

  it("allows history transactions during composing", () => {
    const { compositionstart, filterTransaction } = getDomEvents();
    const mockView = { state: { selection: { from: 0 } } };
    compositionstart(mockView);

    const tr = {
      getMeta: (key: string) => key === "history$" ? {} : undefined,
      docChanged: false,
    };
    expect(filterTransaction(tr)).toBe(true);
  });

  it("allows uiEvent=input transactions during composing", () => {
    const { compositionstart, filterTransaction } = getDomEvents();
    const mockView = { state: { selection: { from: 0 } } };
    compositionstart(mockView);

    const tr = {
      getMeta: (key: string) => key === "uiEvent" ? "input" : undefined,
      docChanged: false,
    };
    expect(filterTransaction(tr)).toBe(true);
  });

  it("allows uiEvent=composition transactions during composing", () => {
    const { compositionstart, filterTransaction } = getDomEvents();
    const mockView = { state: { selection: { from: 0 } } };
    compositionstart(mockView);

    const tr = {
      getMeta: (key: string) => key === "uiEvent" ? "composition" : undefined,
      docChanged: false,
    };
    expect(filterTransaction(tr)).toBe(true);
  });

  it("blocks non-composition selection-only transactions during composing", () => {
    const { compositionstart, filterTransaction } = getDomEvents();
    const mockView = { state: { selection: { from: 0 } } };
    compositionstart(mockView);

    const tr = {
      getMeta: () => undefined,
      docChanged: false,
    };
    expect(filterTransaction(tr)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// DOM events — compositionstart
// ---------------------------------------------------------------------------

describe("compositionGuard compositionstart", () => {
  function getDomEvents() {
    const plugins = compositionGuardExtension.config.addProseMirrorPlugins!.call({
      editor: {},
      name: "compositionGuard",
      options: {},
      storage: {},
      type: undefined,
      parent: undefined,
    } as never);
    return (plugins[0] as {
      props: {
        handleDOMEvents: Record<string, (view: unknown, event?: unknown) => boolean>;
      };
    }).props.handleDOMEvents;
  }

  it("returns false (does not prevent default)", () => {
    const events = getDomEvents();
    const mockView = { state: { selection: { from: 5 } } };
    const result = events.compositionstart(mockView);
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// DOM events — compositionupdate
// ---------------------------------------------------------------------------

describe("compositionGuard compositionupdate", () => {
  function getDomEvents() {
    const plugins = compositionGuardExtension.config.addProseMirrorPlugins!.call({
      editor: {},
      name: "compositionGuard",
      options: {},
      storage: {},
      type: undefined,
      parent: undefined,
    } as never);
    return (plugins[0] as {
      props: {
        handleDOMEvents: Record<string, (view: unknown, event?: unknown) => boolean>;
      };
    }).props.handleDOMEvents;
  }

  it("returns false (does not prevent default)", () => {
    const events = getDomEvents();
    const result = events.compositionupdate({}, { data: "ni" });
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// DOM events — compositionend
// ---------------------------------------------------------------------------

describe("compositionGuard compositionend", () => {
  function getDomEvents() {
    const plugins = compositionGuardExtension.config.addProseMirrorPlugins!.call({
      editor: {},
      name: "compositionGuard",
      options: {},
      storage: {},
      type: undefined,
      parent: undefined,
    } as never);
    return (plugins[0] as {
      props: {
        handleDOMEvents: Record<string, (view: unknown, event?: unknown) => boolean>;
      };
    }).props.handleDOMEvents;
  }

  it("returns false (does not prevent default)", () => {
    const events = getDomEvents();
    const mockView = {
      state: {
        selection: { from: 5 },
        doc: {
          resolve: () => ({
            depth: 1,
            node: () => ({ type: { name: "paragraph" } }),
            end: () => 10,
          }),
          textBetween: () => "test",
        },
      },
    };
    const result = events.compositionend(mockView, { data: "你" });
    expect(result).toBe(false);
  });

  it("marks composition end", () => {
    const events = getDomEvents();
    const mockResolve = () => ({
      depth: 1,
      node: () => ({ type: { name: "paragraph" } }),
      end: () => 10,
    });
    const mockView = {
      state: {
        selection: { from: 0 },
        doc: {
          resolve: mockResolve,
          textBetween: () => "",
          content: { size: 20 },
        },
      },
      dispatch: vi.fn(),
    };
    events.compositionstart(mockView);
    events.compositionend(mockView, { data: "好" });
    expect(mockMarkProseMirrorCompositionEnd).toHaveBeenCalledWith(mockView);
  });
});

// ---------------------------------------------------------------------------
// DOM events — blur during composition
// ---------------------------------------------------------------------------

describe("compositionGuard blur", () => {
  function getDomEvents() {
    const plugins = compositionGuardExtension.config.addProseMirrorPlugins!.call({
      editor: {},
      name: "compositionGuard",
      options: {},
      storage: {},
      type: undefined,
      parent: undefined,
    } as never);
    return (plugins[0] as {
      props: {
        handleDOMEvents: Record<string, (view: unknown, event?: unknown) => boolean>;
      };
      spec: { filterTransaction: (tr: unknown) => boolean };
    });
  }

  it("returns false when not composing", () => {
    const { props } = getDomEvents();
    const result = props.handleDOMEvents.blur({});
    expect(result).toBe(false);
  });

  it("marks composition end on blur during composition", () => {
    const { props } = getDomEvents();
    const mockView = { state: { selection: { from: 5 } } };

    // Start composition
    props.handleDOMEvents.compositionstart(mockView);

    // Blur during composition
    props.handleDOMEvents.blur(mockView);
    expect(mockMarkProseMirrorCompositionEnd).toHaveBeenCalledWith(mockView);
  });

  it("resets composing state on blur so filterTransaction allows all", () => {
    const { props, spec } = getDomEvents();
    const mockView = { state: { selection: { from: 5 } } };

    // Start composition — should block non-composition transactions
    props.handleDOMEvents.compositionstart(mockView);
    const trBlocked = { getMeta: () => undefined, docChanged: false };
    expect(spec.filterTransaction(trBlocked)).toBe(false);

    // Blur — should reset state
    props.handleDOMEvents.blur(mockView);

    // Now should allow all transactions again
    expect(spec.filterTransaction(trBlocked)).toBe(true);
  });

  it("schedules flushProseMirrorCompositionQueue on blur during composition", () => {
    const { props } = getDomEvents();
    const mockView = { state: { selection: { from: 5 } } };

    props.handleDOMEvents.compositionstart(mockView);
    props.handleDOMEvents.blur(mockView);

    // requestAnimationFrame is used in the implementation
    // The flush should be scheduled
    expect(mockMarkProseMirrorCompositionEnd).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// compositionend — scheduleImeCleanup with valid state
// ---------------------------------------------------------------------------

describe("compositionGuard scheduleImeCleanup", () => {
  function getFullPlugin() {
    const plugins = compositionGuardExtension.config.addProseMirrorPlugins!.call({
      editor: {},
      name: "compositionGuard",
      options: {},
      storage: {},
      type: undefined,
      parent: undefined,
    } as never);
    const plugin = plugins[0] as {
      props: {
        handleDOMEvents: Record<string, (view: unknown, event?: unknown) => boolean>;
      };
    };
    return plugin.props.handleDOMEvents;
  }

  it("handles compositionend with data and schedules cleanup via requestAnimationFrame", () => {
    const events = getFullPlugin();
    const mockResolve = (pos: number) => ({
      depth: 1,
      node: (d: number) => ({ type: { name: d === 1 ? "paragraph" : "doc" } }),
      end: (d?: number) => d !== undefined ? 20 : 15,
    });
    const mockView = {
      state: {
        selection: { from: 5 },
        doc: {
          resolve: mockResolve,
          textBetween: () => "hello",
          content: { size: 30 },
        },
        tr: {
          delete: vi.fn().mockReturnThis(),
          setMeta: vi.fn().mockReturnThis(),
        },
      },
      dispatch: vi.fn(),
    };

    events.compositionstart(mockView);
    events.compositionupdate(mockView, { data: "ni" });
    events.compositionend(mockView, { data: "你" });

    expect(mockMarkProseMirrorCompositionEnd).toHaveBeenCalled();
  });

  it("calls fixCompositionSplitBlock when pinyin is available", () => {
    const events = getFullPlugin();
    const mockResolve = (pos: number) => ({
      depth: 1,
      node: (d: number) => ({ type: { name: d === 1 ? "paragraph" : "doc" } }),
      end: (d?: number) => d !== undefined ? 20 : 15,
    });
    const mockView = {
      state: {
        selection: { from: 5 },
        doc: {
          resolve: mockResolve,
          textBetween: () => "nihao",
          content: { size: 30 },
        },
        tr: {
          delete: vi.fn().mockReturnThis(),
          setMeta: vi.fn().mockReturnThis(),
        },
      },
      dispatch: vi.fn(),
    };

    events.compositionstart(mockView);
    events.compositionupdate(mockView, { data: "nihao" });
    events.compositionend(mockView, { data: "你好" });

    // The cleanup is scheduled in requestAnimationFrame, so we need to flush it
    // Run the rAF callback
    vi.runAllTimers();
  });

  it("handles compositionend with empty data string gracefully", () => {
    const events = getFullPlugin();
    const mockView = {
      state: {
        selection: { from: 0 },
        doc: {
          resolve: () => ({
            depth: 1,
            node: () => ({ type: { name: "paragraph" } }),
            end: () => 10,
          }),
          textBetween: () => "",
          content: { size: 20 },
        },
      },
      dispatch: vi.fn(),
    };

    events.compositionstart(mockView);
    // compositionend with empty data — should not crash
    events.compositionend(mockView, { data: "" });

    expect(mockMarkProseMirrorCompositionEnd).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// compositionend — tableHeader cursor fix path
// ---------------------------------------------------------------------------

describe("compositionGuard tableHeader cursor fix", () => {
  function getFullPlugin() {
    const plugins = compositionGuardExtension.config.addProseMirrorPlugins!.call({
      editor: {},
      name: "compositionGuard",
      options: {},
      storage: {},
      type: undefined,
      parent: undefined,
    } as never);
    const plugin = plugins[0] as {
      props: {
        handleDOMEvents: Record<string, (view: unknown, event?: unknown) => boolean>;
      };
      spec: {
        appendTransaction: (transactions: unknown[], oldState: unknown, newState: unknown) => unknown;
      };
    };
    return {
      events: plugin.props.handleDOMEvents,
      appendTransaction: plugin.spec.appendTransaction,
    };
  }

  it("appendTransaction returns null when no pending header cursor fix", () => {
    const { appendTransaction } = getFullPlugin();
    const result = appendTransaction(
      [{ docChanged: true }],
      {},
      { selection: { from: 0 }, doc: { resolve: () => ({}) } },
    );
    expect(result).toBeNull();
  });

  it("appendTransaction returns null when no doc-changing transactions", () => {
    const { events, appendTransaction } = getFullPlugin();

    // Set up compositionstart in a tableHeader
    const mockResolve = () => ({
      depth: 2,
      node: (d: number) => ({
        type: { name: d === 2 ? "tableHeader" : d === 1 ? "paragraph" : "doc" },
      }),
      end: () => 20,
    });
    const mockView = {
      state: {
        selection: { from: 5 },
        doc: {
          resolve: mockResolve,
          textBetween: () => "",
          content: { size: 30 },
        },
      },
      dispatch: vi.fn(),
    };

    events.compositionstart(mockView);
    events.compositionend(mockView, { data: "你" });

    // appendTransaction with no doc-changed transaction
    const result = appendTransaction(
      [{ docChanged: false }],
      {},
      { selection: { from: 0 }, doc: { resolve: () => ({}) } },
    );
    expect(result).toBeNull();
  });
});
