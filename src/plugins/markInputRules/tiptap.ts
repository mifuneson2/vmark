/**
 * CJK-Aware Bold & Italic Extensions
 *
 * Purpose: Replaces Tiptap's default Bold and Italic input/paste rules with
 * CJK-compatible versions. The originals use `(?:^|\s)` which requires
 * whitespace before markers — CJK characters aren't `\s`, so `你好**世界**`
 * never triggers. These use lookbehind `(?<=^|[^*])` / `(?<=^|[^_])` instead.
 *
 * @coordinates-with tiptapExtensions.ts — registered after StarterKit (with bold/italic disabled)
 * @module plugins/markInputRules/tiptap
 */

import { Mark, markInputRule, markPasteRule, mergeAttributes } from "@tiptap/core";

// --- Bold regexes (CJK-aware) ---

/** Matches `**text**` preceded by any non-`*` character or start of text */
export const boldStarInputRegex =
  /(?<=^|[^*])(\*\*(?!\s+\*\*)((?:[^*]+))\*\*(?!\s+\*\*))$/;

export const boldStarPasteRegex =
  /(?<=^|[^*])(\*\*(?!\s+\*\*)((?:[^*]+))\*\*(?!\s+\*\*))/g;

/** Matches `__text__` preceded by any non-`_` character or start of text */
export const boldUnderscoreInputRegex =
  /(?<=^|[^_])(__(?!\s+__)((?:[^_]+))__(?!\s+__))$/;

export const boldUnderscorePasteRegex =
  /(?<=^|[^_])(__(?!\s+__)((?:[^_]+))__(?!\s+__))/g;

// --- Italic regexes (CJK-aware) ---

/** Matches `*text*` preceded by any non-`*` character or start of text */
export const italicStarInputRegex =
  /(?<=^|[^*])(\*(?!\s+\*)((?:[^*]+))\*(?!\s+\*))$/;

export const italicStarPasteRegex =
  /(?<=^|[^*])(\*(?!\s+\*)((?:[^*]+))\*(?!\s+\*))/g;

/** Matches `_text_` preceded by any non-`_` character or start of text */
export const italicUnderscoreInputRegex =
  /(?<=^|[^_])(_(?!\s+_)((?:[^_]+))_(?!\s+_))$/;

export const italicUnderscorePasteRegex =
  /(?<=^|[^_])(_(?!\s+_)((?:[^_]+))_(?!\s+_))/g;

// --- Extensions ---

/**
 * CJK-aware Bold extension. Drop-in replacement for `@tiptap/extension-bold`
 * with fixed input/paste rules that work with CJK text.
 */
export const CJKBold = Mark.create({
  name: "bold",

  addOptions() {
    return { HTMLAttributes: {} };
  },

  parseHTML() {
    return [
      { tag: "strong" },
      { tag: "b", getAttrs: (node) => (node as HTMLElement).style.fontWeight !== "normal" && null },
      { style: "font-weight=400", clearMark: (mark) => mark.type.name === this.name },
      { style: "font-weight", getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value as string) && null },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["strong", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setBold: () => ({ commands }) => commands.setMark(this.name),
      toggleBold: () => ({ commands }) => commands.toggleMark(this.name),
      unsetBold: () => ({ commands }) => commands.unsetMark(this.name),
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-b": () => this.editor.commands.toggleBold(),
      "Mod-B": () => this.editor.commands.toggleBold(),
    };
  },

  addInputRules() {
    return [
      markInputRule({ find: boldStarInputRegex, type: this.type }),
      markInputRule({ find: boldUnderscoreInputRegex, type: this.type }),
    ];
  },

  addPasteRules() {
    return [
      markPasteRule({ find: boldStarPasteRegex, type: this.type }),
      markPasteRule({ find: boldUnderscorePasteRegex, type: this.type }),
    ];
  },
});

/**
 * CJK-aware Italic extension. Drop-in replacement for `@tiptap/extension-italic`
 * with fixed input/paste rules that work with CJK text.
 */
export const CJKItalic = Mark.create({
  name: "italic",

  addOptions() {
    return { HTMLAttributes: {} };
  },

  parseHTML() {
    return [
      { tag: "em" },
      { tag: "i", getAttrs: (node) => (node as HTMLElement).style.fontStyle !== "normal" && null },
      { style: "font-style=normal", clearMark: (mark) => mark.type.name === this.name },
      { style: "font-style=italic" },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["em", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setItalic: () => ({ commands }) => commands.setMark(this.name),
      toggleItalic: () => ({ commands }) => commands.toggleMark(this.name),
      unsetItalic: () => ({ commands }) => commands.unsetMark(this.name),
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-i": () => this.editor.commands.toggleItalic(),
      "Mod-I": () => this.editor.commands.toggleItalic(),
    };
  },

  addInputRules() {
    return [
      markInputRule({ find: italicStarInputRegex, type: this.type }),
      markInputRule({ find: italicUnderscoreInputRegex, type: this.type }),
    ];
  },

  addPasteRules() {
    return [
      markPasteRule({ find: italicStarPasteRegex, type: this.type }),
      markPasteRule({ find: italicUnderscorePasteRegex, type: this.type }),
    ];
  },
});
