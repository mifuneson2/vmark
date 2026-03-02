/**
 * Extra Handler Tests — coverage gaps
 *
 * Extends handlers.test.ts to cover handleTabJump, createKeyHandler,
 * normalizeRightDoubleQuote, and additional edge cases.
 */

import { describe, it, expect, vi } from "vitest";
import { Schema } from "@tiptap/pm/model";
import { EditorState, TextSelection } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";
import {
  handleTextInput,
  handleTabJump,
  handleClosingBracket,
  handleBackspacePair,
  createKeyHandler,
  type AutoPairConfig,
} from "../handlers";

/* ------------------------------------------------------------------ */
/*  Minimal schema & helpers                                           */
/* ------------------------------------------------------------------ */

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { content: "text*", group: "block" },
    code_block: { content: "text*", group: "block", code: true },
    text: { inline: true },
  },
  marks: {
    code: {
      excludes: "_",
      parseDOM: [{ tag: "code" }],
      toDOM() {
        return ["code", 0];
      },
    },
  },
});

function createState(text: string, cursorOffset?: number): EditorState {
  const textNode = text ? schema.text(text) : undefined;
  const para = schema.node("paragraph", null, textNode ? [textNode] : []);
  const doc = schema.node("doc", null, [para]);
  const state = EditorState.create({ doc, schema });

  if (cursorOffset !== undefined) {
    const pos = 1 + cursorOffset;
    return state.apply(
      state.tr.setSelection(TextSelection.create(state.doc, pos)),
    );
  }
  return state;
}

function createMockView(state: EditorState) {
  const view = {
    state,
    dispatch: vi.fn((tr: ReturnType<EditorState["tr"]["setSelection"]>) => {
      view.state = view.state.apply(tr);
    }),
  } as unknown as EditorView & { dispatch: ReturnType<typeof vi.fn> };
  return view;
}

function getCursorOffset(state: EditorState): number {
  return state.selection.from - 1;
}

const ENABLED: AutoPairConfig = {
  enabled: true,
  includeCJK: true,
  includeCurlyQuotes: true,
  normalizeRightDoubleQuote: false,
};

const DISABLED: AutoPairConfig = {
  enabled: false,
  includeCJK: false,
  includeCurlyQuotes: false,
  normalizeRightDoubleQuote: false,
};

const NORMALIZE_ON: AutoPairConfig = {
  enabled: true,
  includeCJK: true,
  includeCurlyQuotes: true,
  normalizeRightDoubleQuote: true,
};

const CJK_OFF: AutoPairConfig = {
  enabled: true,
  includeCJK: false,
  includeCurlyQuotes: false,
  normalizeRightDoubleQuote: false,
};

/* ================================================================== */
/*  handleTabJump                                                      */
/* ================================================================== */

describe("handleTabJump", () => {
  it("jumps over closing parenthesis", () => {
    const state = createState("()", 1); // cursor between ( and )
    const view = createMockView(state);

    const handled = handleTabJump(view, ENABLED);

    expect(handled).toBe(true);
    expect(getCursorOffset(view.state)).toBe(2);
  });

  it("jumps over closing bracket", () => {
    const state = createState("[]", 1);
    const view = createMockView(state);

    expect(handleTabJump(view, ENABLED)).toBe(true);
    expect(getCursorOffset(view.state)).toBe(2);
  });

  it("jumps over closing curly quote", () => {
    const state = createState("\u201C\u201D", 1);
    const view = createMockView(state);

    expect(handleTabJump(view, ENABLED)).toBe(true);
    expect(getCursorOffset(view.state)).toBe(2);
  });

  it("returns false when disabled", () => {
    const state = createState("()", 1);
    const view = createMockView(state);

    expect(handleTabJump(view, DISABLED)).toBe(false);
  });

  it("returns false when next char is not a closing bracket", () => {
    const state = createState("(x", 1);
    const view = createMockView(state);

    expect(handleTabJump(view, ENABLED)).toBe(false);
  });

  it("returns false when there is a selection", () => {
    const state = createState("()", 0);
    const withSel = state.apply(
      state.tr.setSelection(TextSelection.create(state.doc, 1, 3)),
    );
    const view = createMockView(withSel);

    expect(handleTabJump(view, ENABLED)).toBe(false);
  });

  it("does not jump over closing chars disabled by config", () => {
    // CJK curly quotes should not be jumpable when CJK is off
    const state = createState("\u201C\u201D", 1);
    const view = createMockView(state);

    expect(handleTabJump(view, CJK_OFF)).toBe(false);
  });

  it("does not add to history", () => {
    const state = createState("()", 1);
    const view = createMockView(state);

    handleTabJump(view, ENABLED);

    const tr = (view.dispatch as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(tr.getMeta("addToHistory")).toBe(false);
  });
});

/* ================================================================== */
/*  handleTextInput — normalizeRightDoubleQuote                        */
/* ================================================================== */

describe("handleTextInput — normalizeRightDoubleQuote", () => {
  it("normalizes right double quote U+201D to left U+201C when enabled", () => {
    const state = createState("", 0);
    const view = createMockView(state);

    const handled = handleTextInput(view, 1, 1, "\u201D", NORMALIZE_ON);

    expect(handled).toBe(true);
    // Should produce \u201C\u201D pair (left/right curly double quotes)
    expect(view.state.doc.firstChild!.textContent).toBe("\u201C\u201D");
  });

  it("does not normalize when normalizeRightDoubleQuote is false", () => {
    const config: AutoPairConfig = {
      enabled: true,
      includeCJK: true,
      includeCurlyQuotes: true,
      normalizeRightDoubleQuote: false,
    };
    const state = createState("", 0);
    const view = createMockView(state);

    // U+201D is a closing char, but without normalization it won't be treated
    // as an opening char. handleTextInput checks getClosingChar on the input.
    const handled = handleTextInput(view, 1, 1, "\u201D", config);

    // U+201D has no closing pair (it IS the closing char), so not handled
    expect(handled).toBe(false);
  });
});

/* ================================================================== */
/*  handleClosingBracket — additional edge cases                       */
/* ================================================================== */

describe("handleClosingBracket — extra", () => {
  it("skips over closing square bracket", () => {
    const state = createState("[]", 1);
    const view = createMockView(state);

    expect(handleClosingBracket(view, "]", ENABLED)).toBe(true);
    expect(getCursorOffset(view.state)).toBe(2);
  });

  it("skips over closing curly brace", () => {
    const state = createState("{}", 1);
    const view = createMockView(state);

    expect(handleClosingBracket(view, "}", ENABLED)).toBe(true);
    expect(getCursorOffset(view.state)).toBe(2);
  });

  it("does not skip when CJK closing char and CJK disabled", () => {
    const state = createState("\u201C\u201D", 1);
    const view = createMockView(state);

    // CJK curly quote closing should not be skippable when CJK is off
    expect(handleClosingBracket(view, "\u201D", CJK_OFF)).toBe(false);
  });

  it("does not skip when selection exists", () => {
    const state = createState("()", 0);
    const withSel = state.apply(
      state.tr.setSelection(TextSelection.create(state.doc, 1, 3)),
    );
    const view = createMockView(withSel);

    expect(handleClosingBracket(view, ")", ENABLED)).toBe(false);
  });
});

/* ================================================================== */
/*  handleBackspacePair — additional edge cases                        */
/* ================================================================== */

describe("handleBackspacePair — extra", () => {
  it("returns false when disabled", () => {
    const state = createState("()", 1);
    const view = createMockView(state);

    expect(handleBackspacePair(view, DISABLED)).toBe(false);
  });

  it("returns false with selection", () => {
    const state = createState("()", 0);
    const withSel = state.apply(
      state.tr.setSelection(TextSelection.create(state.doc, 1, 3)),
    );
    const view = createMockView(withSel);

    expect(handleBackspacePair(view, ENABLED)).toBe(false);
  });

  it("returns false at position 0 (start of document)", () => {
    const state = createState("()", 0);
    // Cursor at position 1 (paragraph start), from = 1, but we need from < 1
    // Actually from = 1 > 0, so let's check default selection (from = 1)
    // The function checks from < 1, position 1 is >= 1 so it proceeds.
    // We need the default state with cursor at pos 0
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, [schema.text("()")]),
    ]);
    const st = EditorState.create({ doc, schema });
    // Default selection is at end. Let's check it works.
    expect(handleBackspacePair(createMockView(st), ENABLED)).toBe(false);
  });

  it("deletes CJK bracket pair", () => {
    const state = createState("\u300C\u300D", 1); // Corner brackets
    const view = createMockView(state);

    expect(handleBackspacePair(view, ENABLED)).toBe(true);
    expect(view.state.doc.firstChild!.textContent).toBe("");
  });

  it("does not delete CJK pair when CJK disabled", () => {
    const state = createState("\u300C\u300D", 1);
    const view = createMockView(state);

    expect(handleBackspacePair(view, CJK_OFF)).toBe(false);
  });
});

/* ================================================================== */
/*  createKeyHandler                                                   */
/* ================================================================== */

describe("createKeyHandler", () => {
  function createKeyEvent(key: string, opts: Partial<KeyboardEvent> = {}): KeyboardEvent {
    return {
      key,
      ctrlKey: false,
      altKey: false,
      metaKey: false,
      shiftKey: false,
      preventDefault: vi.fn(),
      ...opts,
    } as unknown as KeyboardEvent;
  }

  it("returns false when ctrl is pressed", () => {
    const handler = createKeyHandler(() => ENABLED);
    const state = createState("()", 1);
    const view = createMockView(state);
    const event = createKeyEvent(")", { ctrlKey: true });

    expect(handler(view, event)).toBe(false);
  });

  it("returns false when alt is pressed", () => {
    const handler = createKeyHandler(() => ENABLED);
    const state = createState("()", 1);
    const view = createMockView(state);
    const event = createKeyEvent(")", { altKey: true });

    expect(handler(view, event)).toBe(false);
  });

  it("returns false when meta is pressed", () => {
    const handler = createKeyHandler(() => ENABLED);
    const state = createState("()", 1);
    const view = createMockView(state);
    const event = createKeyEvent(")", { metaKey: true });

    expect(handler(view, event)).toBe(false);
  });

  it("handles Tab key to jump over closing bracket", () => {
    const handler = createKeyHandler(() => ENABLED);
    const state = createState("()", 1);
    const view = createMockView(state);
    const event = createKeyEvent("Tab");

    const result = handler(view, event);

    expect(result).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("does not handle Shift+Tab", () => {
    const handler = createKeyHandler(() => ENABLED);
    const state = createState("()", 1);
    const view = createMockView(state);
    const event = createKeyEvent("Tab", { shiftKey: true });

    expect(handler(view, event)).toBe(false);
  });

  it("returns false for Tab when not next to closing bracket", () => {
    const handler = createKeyHandler(() => ENABLED);
    const state = createState("hello", 2);
    const view = createMockView(state);
    const event = createKeyEvent("Tab");

    expect(handler(view, event)).toBe(false);
  });

  it("handles Backspace to delete pair", () => {
    const handler = createKeyHandler(() => ENABLED);
    const state = createState("()", 1);
    const view = createMockView(state);
    const event = createKeyEvent("Backspace");

    const result = handler(view, event);

    expect(result).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("returns false for Backspace when not between pair", () => {
    const handler = createKeyHandler(() => ENABLED);
    const state = createState("ab", 1);
    const view = createMockView(state);
    const event = createKeyEvent("Backspace");

    expect(handler(view, event)).toBe(false);
  });

  it("handles closing bracket skip", () => {
    const handler = createKeyHandler(() => ENABLED);
    const state = createState("()", 1);
    const view = createMockView(state);
    const event = createKeyEvent(")");

    const result = handler(view, event);

    expect(result).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("returns false for non-closing single char", () => {
    const handler = createKeyHandler(() => ENABLED);
    const state = createState("hello", 2);
    const view = createMockView(state);
    const event = createKeyEvent("x");

    expect(handler(view, event)).toBe(false);
  });

  it("handles straight quote skip-over for curly closing equivalent", () => {
    // When curly quotes enabled, typing " (straight) should skip over \u201D (curly closing)
    const handler = createKeyHandler(() => ENABLED);
    const state = createState("\u201C\u201D", 1); // cursor between curly pair
    const view = createMockView(state);

    // event.key is " (straight) but doc has \u201D
    // First handleClosingBracket with " fails (next char is \u201D not ")
    // Then curly closing conversion: " -> \u201D, matches next char, skip
    const event = createKeyEvent('"');
    const result = handler(view, event);

    expect(result).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("reads fresh config on each keydown", () => {
    let config = DISABLED;
    const handler = createKeyHandler(() => config);
    const state = createState("()", 1);

    // First call: disabled
    const view1 = createMockView(state);
    const event1 = createKeyEvent("Backspace");
    expect(handler(view1, event1)).toBe(false);

    // Enable config
    config = ENABLED;

    // Second call: enabled
    const view2 = createMockView(state);
    const event2 = createKeyEvent("Backspace");
    expect(handler(view2, event2)).toBe(true);
  });

  it("returns false for multi-char keys (non-single-char input)", () => {
    const handler = createKeyHandler(() => ENABLED);
    const state = createState("hello", 2);
    const view = createMockView(state);
    const event = createKeyEvent("Enter");

    expect(handler(view, event)).toBe(false);
  });
});
