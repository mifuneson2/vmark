/**
 * Tests for autoPair tiptap extension — extension creation, plugin structure,
 * config reading, IME composition guard.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock settingsStore before importing the extension
vi.mock("@/stores/settingsStore", () => ({
  useSettingsStore: {
    getState: vi.fn(() => ({
      markdown: {
        autoPairEnabled: true,
        autoPairCJKStyle: "off",
        autoPairCurlyQuotes: false,
        autoPairRightDoubleQuote: false,
      },
    })),
  },
}));

// Mock imeGuard
const mockIsProseMirrorComposing = vi.fn(() => false);
const mockIsProseMirrorInCompositionGrace = vi.fn(() => false);
const mockMarkProseMirrorCompositionEnd = vi.fn();
const mockIsImeKeyEvent = vi.fn(() => false);

vi.mock("@/utils/imeGuard", () => ({
  isProseMirrorComposing: (...args: unknown[]) => mockIsProseMirrorComposing(...args),
  isProseMirrorInCompositionGrace: (...args: unknown[]) => mockIsProseMirrorInCompositionGrace(...args),
  markProseMirrorCompositionEnd: (...args: unknown[]) => mockMarkProseMirrorCompositionEnd(...args),
  isImeKeyEvent: (...args: unknown[]) => mockIsImeKeyEvent(...args),
}));

// Mock handlers
const mockHandleTextInput = vi.fn(() => false);
const mockCreateKeyHandler = vi.fn(() => vi.fn(() => false));

vi.mock("../handlers", () => ({
  handleTextInput: (...args: unknown[]) => mockHandleTextInput(...args),
}));

vi.mock("../keyHandler", () => ({
  createKeyHandler: (...args: unknown[]) => mockCreateKeyHandler(...args),
}));

import { autoPairExtension } from "../tiptap";
import { useSettingsStore } from "@/stores/settingsStore";

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Extension metadata
// ---------------------------------------------------------------------------

describe("autoPairExtension metadata", () => {
  it("has correct name", () => {
    expect(autoPairExtension.name).toBe("autoPair");
  });

  it("is an Extension (not a Node or Mark)", () => {
    expect(autoPairExtension.type).toBe("extension");
  });
});

// ---------------------------------------------------------------------------
// Plugin creation
// ---------------------------------------------------------------------------

describe("autoPairExtension addProseMirrorPlugins", () => {
  it("returns exactly one plugin", () => {
    const plugins = autoPairExtension.config.addProseMirrorPlugins!.call({
      editor: {},
      name: "autoPair",
      options: {},
      storage: {},
      type: undefined,
      parent: undefined,
    } as never);
    expect(plugins).toHaveLength(1);
  });

  it("creates key handler with config getter on plugin creation", () => {
    autoPairExtension.config.addProseMirrorPlugins!.call({
      editor: {},
      name: "autoPair",
      options: {},
      storage: {},
      type: undefined,
      parent: undefined,
    } as never);
    expect(mockCreateKeyHandler).toHaveBeenCalledTimes(1);
    expect(typeof mockCreateKeyHandler.mock.calls[0][0]).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// Config reading from settings store
// ---------------------------------------------------------------------------

describe("autoPair config reading", () => {
  it("reads config from settingsStore with defaults", () => {
    // Call the plugin factory to get the config getter invoked
    autoPairExtension.config.addProseMirrorPlugins!.call({
      editor: {},
      name: "autoPair",
      options: {},
      storage: {},
      type: undefined,
      parent: undefined,
    } as never);

    // The config getter is passed to createKeyHandler — call it to verify
    const configGetter = mockCreateKeyHandler.mock.calls[0][0] as () => unknown;
    const config = configGetter();
    expect(config).toEqual({
      enabled: true,
      includeCJK: false,
      includeCurlyQuotes: false,
      normalizeRightDoubleQuote: false,
    });
  });

  it("reads CJK enabled when autoPairCJKStyle is not 'off'", () => {
    vi.mocked(useSettingsStore.getState).mockReturnValue({
      markdown: {
        autoPairEnabled: true,
        autoPairCJKStyle: "chinese",
        autoPairCurlyQuotes: true,
        autoPairRightDoubleQuote: true,
      },
    } as never);

    autoPairExtension.config.addProseMirrorPlugins!.call({
      editor: {},
      name: "autoPair",
      options: {},
      storage: {},
      type: undefined,
      parent: undefined,
    } as never);

    const configGetter = mockCreateKeyHandler.mock.calls[0][0] as () => unknown;
    const config = configGetter();
    expect(config).toEqual({
      enabled: true,
      includeCJK: true,
      includeCurlyQuotes: true,
      normalizeRightDoubleQuote: true,
    });
  });

  it("normalizeRightDoubleQuote is false when CJK is off even if other flags are true", () => {
    vi.mocked(useSettingsStore.getState).mockReturnValue({
      markdown: {
        autoPairEnabled: true,
        autoPairCJKStyle: "off",
        autoPairCurlyQuotes: true,
        autoPairRightDoubleQuote: true,
      },
    } as never);

    autoPairExtension.config.addProseMirrorPlugins!.call({
      editor: {},
      name: "autoPair",
      options: {},
      storage: {},
      type: undefined,
      parent: undefined,
    } as never);

    const configGetter = mockCreateKeyHandler.mock.calls[0][0] as () => unknown;
    const config = configGetter();
    expect(config).toEqual(
      expect.objectContaining({ normalizeRightDoubleQuote: false }),
    );
  });

  it("enabled defaults to true when setting is undefined", () => {
    vi.mocked(useSettingsStore.getState).mockReturnValue({
      markdown: {},
    } as never);

    autoPairExtension.config.addProseMirrorPlugins!.call({
      editor: {},
      name: "autoPair",
      options: {},
      storage: {},
      type: undefined,
      parent: undefined,
    } as never);

    const configGetter = mockCreateKeyHandler.mock.calls[0][0] as () => unknown;
    const config = configGetter() as { enabled: boolean };
    expect(config.enabled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Plugin props — IME guard behavior
// ---------------------------------------------------------------------------

describe("autoPair IME composition guard", () => {
  function getPluginProps() {
    const plugins = autoPairExtension.config.addProseMirrorPlugins!.call({
      editor: {},
      name: "autoPair",
      options: {},
      storage: {},
      type: undefined,
      parent: undefined,
    } as never);
    return (plugins[0] as { props: Record<string, unknown> }).props;
  }

  it("handleTextInput blocks during IME composing", () => {
    mockIsProseMirrorComposing.mockReturnValue(true);
    const props = getPluginProps();
    const handleTextInput = props.handleTextInput as (view: unknown, from: number, to: number, text: string) => boolean;
    const result = handleTextInput({}, 0, 0, "a");
    expect(result).toBe(false);
    expect(mockHandleTextInput).not.toHaveBeenCalled();
  });

  it("handleTextInput blocks during composition grace period", () => {
    mockIsProseMirrorComposing.mockReturnValue(false);
    mockIsProseMirrorInCompositionGrace.mockReturnValue(true);
    const props = getPluginProps();
    const handleTextInput = props.handleTextInput as (view: unknown, from: number, to: number, text: string) => boolean;
    const result = handleTextInput({}, 0, 0, "a");
    expect(result).toBe(false);
    expect(mockHandleTextInput).not.toHaveBeenCalled();
  });

  it("handleTextInput delegates to handler when not composing", () => {
    mockIsProseMirrorComposing.mockReturnValue(false);
    mockIsProseMirrorInCompositionGrace.mockReturnValue(false);
    mockHandleTextInput.mockReturnValue(true);
    const props = getPluginProps();
    const handleTextInput = props.handleTextInput as (view: unknown, from: number, to: number, text: string) => boolean;
    const result = handleTextInput({}, 0, 5, "(");
    expect(result).toBe(true);
    expect(mockHandleTextInput).toHaveBeenCalledWith({}, 0, 5, "(", expect.any(Object));
  });

  it("keydown blocks during IME key event", () => {
    mockIsImeKeyEvent.mockReturnValue(true);
    const props = getPluginProps();
    const handleDOMEvents = props.handleDOMEvents as { keydown: (view: unknown, event: unknown) => boolean };
    const result = handleDOMEvents.keydown({}, { keyCode: 229 });
    expect(result).toBe(false);
  });

  it("keydown delegates to keyHandler when not composing and not IME (line 80)", () => {
    mockIsProseMirrorComposing.mockReturnValue(false);
    mockIsProseMirrorInCompositionGrace.mockReturnValue(false);
    mockIsImeKeyEvent.mockReturnValue(false);
    const props = getPluginProps();
    const handleDOMEvents = props.handleDOMEvents as { keydown: (view: unknown, event: unknown) => boolean };
    const result = handleDOMEvents.keydown({}, { key: "Tab", keyCode: 9 });
    // The mockCreateKeyHandler returns a vi.fn(() => false), so keyHandler returns false
    expect(result).toBe(false);
  });

  it("keydown returns false when isComposingOrGrace returns true (composing branch, line ~79)", () => {
    // isComposingOrGrace = isProseMirrorComposing || isProseMirrorInCompositionGrace
    // This branch is distinct from the isImeKeyEvent branch
    mockIsProseMirrorComposing.mockReturnValue(true);
    mockIsProseMirrorInCompositionGrace.mockReturnValue(false);
    mockIsImeKeyEvent.mockReturnValue(false);
    const props = getPluginProps();
    const handleDOMEvents = props.handleDOMEvents as { keydown: (view: unknown, event: unknown) => boolean };
    const result = handleDOMEvents.keydown({}, { key: ")", keyCode: 41 });
    // isComposingOrGrace is true → returns false immediately, keyHandler not called
    expect(result).toBe(false);
    // The inner keyHandler (from createKeyHandler) should NOT be called
    const keyHandler = mockCreateKeyHandler.mock.results[0]?.value as ReturnType<typeof vi.fn> | undefined;
    if (keyHandler) {
      expect(keyHandler).not.toHaveBeenCalled();
    }
  });

  it("compositionend marks composition end", () => {
    const props = getPluginProps();
    const handleDOMEvents = props.handleDOMEvents as { compositionend: (view: unknown) => boolean };
    const mockView = {};
    const result = handleDOMEvents.compositionend(mockView);
    expect(result).toBe(false);
    expect(mockMarkProseMirrorCompositionEnd).toHaveBeenCalledWith(mockView);
  });
});
