import { describe, it, expect, vi } from "vitest";
import { matchesShortcutEvent, isMacPlatform } from "@/utils/shortcutMatch";

function makeEvent(options: KeyboardEventInit & { key: string }) {
  return new KeyboardEvent("keydown", options);
}

describe("matchesShortcutEvent", () => {
  it("matches Mod-/ on mac (source mode toggle)", () => {
    const event = makeEvent({ key: "/", metaKey: true });
    expect(matchesShortcutEvent(event, "Mod-/", "mac")).toBe(true);
  });

  it("matches Mod-/ on non-mac (source mode toggle)", () => {
    const event = makeEvent({ key: "/", ctrlKey: true });
    expect(matchesShortcutEvent(event, "Mod-/", "other")).toBe(true);
  });

  it("matches Mod-Shift-P on mac", () => {
    const event = makeEvent({ key: "P", metaKey: true, shiftKey: true });
    expect(matchesShortcutEvent(event, "Mod-Shift-p", "mac")).toBe(true);
  });

  it("matches Mod-Shift-P on non-mac", () => {
    const event = makeEvent({ key: "p", ctrlKey: true, shiftKey: true });
    expect(matchesShortcutEvent(event, "Mod-Shift-p", "other")).toBe(true);
  });

  it("rejects extra modifiers", () => {
    const event = makeEvent({ key: "p", ctrlKey: true, shiftKey: true, altKey: true });
    expect(matchesShortcutEvent(event, "Mod-Shift-p", "other")).toBe(false);
  });

  it("matches Alt-z", () => {
    const event = makeEvent({ key: "z", altKey: true });
    expect(matchesShortcutEvent(event, "Alt-z", "other")).toBe(true);
  });

  it("matches arrow key aliases", () => {
    const event = makeEvent({ key: "ArrowUp", ctrlKey: true, shiftKey: true });
    expect(matchesShortcutEvent(event, "Ctrl-Shift-Up", "other")).toBe(true);
  });

  it("matches shifted symbol variants", () => {
    const event = makeEvent({ key: "?", shiftKey: true, metaKey: true });
    expect(matchesShortcutEvent(event, "Mod-Shift-/", "mac")).toBe(true);
  });

  it("matches shifted . to >", () => {
    const event = makeEvent({ key: ">", shiftKey: true, metaKey: true });
    expect(matchesShortcutEvent(event, "Mod-Shift-.", "mac")).toBe(true);
  });

  describe("Ctrl+letter control character fallback", () => {
    it("matches Ctrl-Shift-b when event.key is control character (macOS)", () => {
      // On macOS, Ctrl+B produces \x02 instead of "b"
      const event = makeEvent({ key: "\x02", code: "KeyB", ctrlKey: true, shiftKey: true });
      expect(matchesShortcutEvent(event, "Ctrl-Shift-b", "mac")).toBe(true);
    });

    it("matches Ctrl-Shift-1 via code fallback (macOS)", () => {
      const event = makeEvent({ key: "1", code: "Digit1", ctrlKey: true, shiftKey: true });
      expect(matchesShortcutEvent(event, "Ctrl-Shift-1", "mac")).toBe(true);
    });

    it("matches Ctrl-Shift-b with normal key value", () => {
      const event = makeEvent({ key: "b", code: "KeyB", ctrlKey: true, shiftKey: true });
      expect(matchesShortcutEvent(event, "Ctrl-Shift-b", "mac")).toBe(true);
    });

    it("rejects when Ctrl is not pressed", () => {
      const event = makeEvent({ key: "\x02", code: "KeyB", shiftKey: true });
      expect(matchesShortcutEvent(event, "Ctrl-Shift-b", "mac")).toBe(false);
    });
  });

  it("returns false for empty shortcut string", () => {
    const event = makeEvent({ key: "a" });
    expect(matchesShortcutEvent(event, "", "mac")).toBe(false);
  });

  it("returns false for shortcut with only separators", () => {
    const event = makeEvent({ key: "a" });
    expect(matchesShortcutEvent(event, "---", "mac")).toBe(false);
  });

  it("ignores metaKey on non-mac (Windows key is not checked)", () => {
    // On non-mac, metaKey (Windows key) is not checked by the matcher
    const event = makeEvent({ key: "a", metaKey: true });
    expect(matchesShortcutEvent(event, "a", "other")).toBe(true);
  });

  it("rejects when Mod not pressed on mac", () => {
    const event = makeEvent({ key: "a" });
    expect(matchesShortcutEvent(event, "Mod-a", "mac")).toBe(false);
  });

  it("rejects metaKey on mac when shortcut has no Mod", () => {
    const event = makeEvent({ key: "a", metaKey: true });
    expect(matchesShortcutEvent(event, "a", "mac")).toBe(false);
  });

  it("matches Ctrl modifier on mac separately from Mod", () => {
    const event = makeEvent({ key: "a", ctrlKey: true });
    expect(matchesShortcutEvent(event, "Ctrl-a", "mac")).toBe(true);
  });

  it("rejects Ctrl mismatch on mac", () => {
    const event = makeEvent({ key: "a", metaKey: true });
    expect(matchesShortcutEvent(event, "Ctrl-Mod-a", "mac")).toBe(false);
  });

  it("matches shifted = to +", () => {
    const event = makeEvent({ key: "+", shiftKey: true, metaKey: true });
    expect(matchesShortcutEvent(event, "Mod-Shift-=", "mac")).toBe(true);
  });

  it("rejects Ctrl mismatch on non-mac when Ctrl required but not pressed (line 102)", () => {
    // On non-mac, Ctrl shortcut requires ctrlKey but it's not pressed
    const event = makeEvent({ key: "a" });
    expect(matchesShortcutEvent(event, "Ctrl-a", "other")).toBe(false);
  });

  it("rejects non-mac when ctrlKey pressed but shortcut has no Ctrl or Mod (line 102)", () => {
    const event = makeEvent({ key: "a", ctrlKey: true });
    expect(matchesShortcutEvent(event, "a", "other")).toBe(false);
  });

  it("matches Ctrl on non-mac (both Ctrl and Mod map to ctrlKey)", () => {
    const event = makeEvent({ key: "a", ctrlKey: true });
    expect(matchesShortcutEvent(event, "Ctrl-a", "other")).toBe(true);
  });

  it("does not match shifted symbol when shiftKey is false", () => {
    const event = makeEvent({ key: "/", metaKey: true });
    // Shift not pressed, so shifted symbol matching should not activate
    expect(matchesShortcutEvent(event, "Mod-/", "mac")).toBe(true);
  });

  it("matches escape key alias", () => {
    const event = makeEvent({ key: "Escape" });
    expect(matchesShortcutEvent(event, "Esc", "mac")).toBe(true);
  });

  it("matches return key alias", () => {
    const event = makeEvent({ key: "Enter" });
    expect(matchesShortcutEvent(event, "Return", "other")).toBe(true);
  });

  it("rejects metaKey on mac when Mod not in shortcut (line 94-95)", () => {
    // metaKey pressed but shortcut has no Mod — should reject on mac
    const event = makeEvent({ key: "a", metaKey: true });
    expect(matchesShortcutEvent(event, "a", "mac")).toBe(false);
  });

  it("matches Ctrl-Mod on non-mac (both require ctrlKey, line 101-102)", () => {
    // On non-mac, both Ctrl and Mod map to ctrlKey
    const event = makeEvent({ key: "a", ctrlKey: true });
    expect(matchesShortcutEvent(event, "Ctrl-Mod-a", "other")).toBe(true);
  });

  it("rejects when shiftKey does not match (line 105)", () => {
    const event = makeEvent({ key: "a", ctrlKey: true, shiftKey: true });
    // Shortcut requires no shift
    expect(matchesShortcutEvent(event, "Mod-a", "other")).toBe(false);
  });

  it("matches shifted . to > via matchesShiftedSymbol (line 68)", () => {
    const event = makeEvent({ key: ">", shiftKey: true, ctrlKey: true });
    expect(matchesShortcutEvent(event, "Mod-Shift-.", "other")).toBe(true);
  });

  it("matches Ctrl+digit via code fallback (line 121-122)", () => {
    const event = makeEvent({ key: "\x00", code: "Digit5", ctrlKey: true });
    expect(matchesShortcutEvent(event, "Ctrl-5", "mac")).toBe(true);
  });

  it("uses default platform detection when platform not specified", () => {
    const event = makeEvent({ key: "a", ctrlKey: true });
    // Should not throw — uses isMacPlatform() internally
    const result = matchesShortcutEvent(event, "Mod-a");
    expect(typeof result).toBe("boolean");
  });

  it("Ctrl+letter code fallback returns false when event.code does not match expected code", () => {
    // branch 34[1]: ctrlKey pressed, targetKey is alpha, but event.code is wrong
    const event = makeEvent({ key: "\x02", code: "KeyC", ctrlKey: true });
    // Shortcut is Ctrl-b, expects KeyB, but event.code is KeyC
    expect(matchesShortcutEvent(event, "Ctrl-b", "mac")).toBe(false);
  });

  it("uses mac as default platform when navigator.platform is Mac (line 75 mac branch)", () => {
    vi.stubGlobal("navigator", { platform: "MacIntel" });
    // isMacPlatform() returns true, so default platform = "mac"
    // Cmd+A (metaKey) should match "Mod-a" on mac via default parameter
    const event = makeEvent({ key: "a", metaKey: true });
    expect(matchesShortcutEvent(event, "Mod-a")).toBe(true);
    vi.unstubAllGlobals();
  });

  describe("CJK IME remapping", () => {
    it.each([
      { name: "Ctrl-` with backtick remapped to middle dot", key: "\u00B7", code: "Backquote", init: { ctrlKey: true }, shortcut: "Ctrl-`", platform: "mac" as const },
      { name: "Mod-Shift-` with backtick remapped (inline code)", key: "\u00B7", code: "Backquote", init: { metaKey: true, shiftKey: true }, shortcut: "Mod-Shift-`", platform: "mac" as const },
      { name: "Mod-[ with bracket remapped to lenticular bracket", key: "\u3010", code: "BracketLeft", init: { metaKey: true }, shortcut: "Mod-[", platform: "mac" as const },
      { name: "Ctrl-` with correct event.key (no remapping)", key: "`", code: "Backquote", init: { ctrlKey: true }, shortcut: "Ctrl-`", platform: "mac" as const },
    ])("matches $name", ({ key, code, init, shortcut, platform }) => {
      const event = makeEvent({ key, code, ...init });
      expect(matchesShortcutEvent(event, shortcut, platform)).toBe(true);
    });

    it("rejects when modifier is missing (code fallback does not bypass modifier check)", () => {
      const event = makeEvent({ key: "\u00B7", code: "Backquote" });
      expect(matchesShortcutEvent(event, "Ctrl-`", "mac")).toBe(false);
    });

    it("rejects when event.code is wrong", () => {
      const event = makeEvent({ key: "\u00B7", code: "KeyA", ctrlKey: true });
      expect(matchesShortcutEvent(event, "Ctrl-`", "mac")).toBe(false);
    });

    it("rejects when event.code is empty", () => {
      const event = makeEvent({ key: "\u00B7", code: "", ctrlKey: true });
      expect(matchesShortcutEvent(event, "Ctrl-`", "mac")).toBe(false);
    });
  });
});

describe("isMacPlatform", () => {
  it("returns true when navigator.platform contains Mac", () => {
    vi.stubGlobal("navigator", { platform: "MacIntel" });
    expect(isMacPlatform()).toBe(true);
    vi.unstubAllGlobals();
  });

  it("returns false on Windows", () => {
    vi.stubGlobal("navigator", { platform: "Win32" });
    expect(isMacPlatform()).toBe(false);
    vi.unstubAllGlobals();
  });

  it("returns false on Linux", () => {
    vi.stubGlobal("navigator", { platform: "Linux x86_64" });
    expect(isMacPlatform()).toBe(false);
    vi.unstubAllGlobals();
  });

  it("returns true for iPad", () => {
    vi.stubGlobal("navigator", { platform: "iPad" });
    expect(isMacPlatform()).toBe(true);
    vi.unstubAllGlobals();
  });

  it("returns false when navigator is undefined (line 49)", () => {
    const origNavigator = globalThis.navigator;
    // @ts-expect-error -- remove navigator to trigger the undefined check
    delete (globalThis as Record<string, unknown>).navigator;
    try {
      expect(isMacPlatform()).toBe(false);
    } finally {
      globalThis.navigator = origNavigator;
    }
  });
});
