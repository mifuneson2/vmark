import { describe, it, expect, vi } from "vitest";
import type { EditorView as CodeMirrorView } from "@codemirror/view";
import { getToolbarButtonState, getToolbarItemState } from "./enableRules";
import type { ToolbarGroupButton, ToolbarActionItem, ToolbarMenuItem } from "@/components/Editor/UniversalToolbar/toolbarGroups";

function createItem(action: string, enabledIn: ToolbarActionItem["enabledIn"]): ToolbarActionItem {
  return {
    id: `${action}-item`,
    icon: "",
    label: action,
    action,
    enabledIn,
  };
}

function createGroupButton(action: string, items: ToolbarActionItem[]): ToolbarGroupButton {
  return {
    id: action,
    type: "dropdown",
    icon: "",
    label: action,
    action,
    enabledIn: ["always"],
    items,
  };
}

describe("getToolbarButtonState (source)", () => {
  const view = {} as CodeMirrorView;

  it("keeps dropdown button clickable even when items are disabled (no selection)", () => {
    const button = createGroupButton("inline", [createItem("bold", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: {
        inCodeBlock: null,
        inBlockMath: null,
        inTable: null,
        inList: null,
        inBlockquote: null,
        inHeading: null,
        inLink: null,
        inImage: null,
        inInlineMath: null,
        inFootnote: null,
        activeFormats: [],
        formatRanges: [],
        innermostFormat: null,
        atLineStart: false,
        atBlankLine: false,
        inWord: null,
        contextMode: "inline-insert",
        nearSpace: false,
        nearPunctuation: false,
        hasSelection: false,
        selectionFrom: 0,
        selectionTo: 0,
      },
    });

    // Dropdown buttons are always clickable so users can see the menu
    expect(state.disabled).toBe(false);
    // But individual items inside are disabled based on context
    expect(state.itemStates?.[0].disabled).toBe(true);
  });

  it("enables inline formats with selection", () => {
    const button = createGroupButton("inline", [createItem("bold", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: {
        inCodeBlock: null,
        inBlockMath: null,
        inTable: null,
        inList: null,
        inBlockquote: null,
        inHeading: null,
        inLink: null,
        inImage: null,
        inInlineMath: null,
        inFootnote: null,
        activeFormats: [],
        formatRanges: [],
        innermostFormat: null,
        atLineStart: false,
        atBlankLine: false,
        inWord: null,
        contextMode: "inline-insert",
        nearSpace: false,
        nearPunctuation: false,
        hasSelection: true,
        selectionFrom: 1,
        selectionTo: 3,
      },
    });

    expect(state.disabled).toBe(false);
  });

  it("disables actions with enabledIn: never", () => {
    // Use enabledIn: ["never"] to test not-implemented logic since all Source actions are now implemented
    const button = createGroupButton("hypothetical", [createItem("futureAction", ["never"])]);
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: {
        inCodeBlock: null,
        inBlockMath: null,
        inTable: null,
        inList: null,
        inBlockquote: null,
        inHeading: null,
        inLink: null,
        inImage: null,
        inInlineMath: null,
        inFootnote: null,
        activeFormats: [],
        formatRanges: [],
        innermostFormat: null,
        atLineStart: false,
        atBlankLine: false,
        inWord: null,
        contextMode: "inline-insert",
        nearSpace: false,
        nearPunctuation: false,
        hasSelection: false,
        selectionFrom: 0,
        selectionTo: 0,
      },
    });

    expect(state.notImplemented).toBe(true);
    expect(state.disabled).toBe(true);
  });

  it("enables insertDetails in source mode (now implemented)", () => {
    const button = createGroupButton("expandables", [createItem("insertDetails", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: {
        inCodeBlock: null,
        inBlockMath: null,
        inTable: null,
        inList: null,
        inBlockquote: null,
        inHeading: null,
        inLink: null,
        inImage: null,
        inInlineMath: null,
        inFootnote: null,
        activeFormats: [],
        formatRanges: [],
        innermostFormat: null,
        atLineStart: false,
        atBlankLine: false,
        inWord: null,
        contextMode: "inline-insert",
        nearSpace: false,
        nearPunctuation: false,
        hasSelection: false,
        selectionFrom: 0,
        selectionTo: 0,
      },
    });

    expect(state.notImplemented).toBe(false);
    expect(state.disabled).toBe(false); // enabled in textblock context
  });

  it("enables alert insert actions in source mode", () => {
    const alertActions = [
      "insertAlertNote",
      "insertAlertTip",
      "insertAlertImportant",
      "insertAlertWarning",
      "insertAlertCaution",
    ];

    for (const action of alertActions) {
      const button = createGroupButton("expandables", [createItem(action, ["textblock"])]);
      const state = getToolbarButtonState(button, {
        surface: "source",
        view,
        context: {
          inCodeBlock: null,
          inBlockMath: null,
          inTable: null,
          inList: null,
          inBlockquote: null,
          inHeading: null,
          inLink: null,
          inImage: null,
          inInlineMath: null,
          inFootnote: null,
          activeFormats: [],
          formatRanges: [],
          innermostFormat: null,
          atLineStart: false,
          atBlankLine: false,
          inWord: null,
          contextMode: "inline-insert",
          nearSpace: false,
          nearPunctuation: false,
          hasSelection: false,
          selectionFrom: 0,
          selectionTo: 0,
        },
      });

      expect(state.notImplemented).toBe(false);
      expect(state.disabled).toBe(false);
    }
  });

  it("enables list actions when in list", () => {
    const button = createGroupButton("list", [createItem("indent", ["list"])]);
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: {
        inCodeBlock: null,
        inBlockMath: null,
        inTable: null,
        inList: { type: "bullet", depth: 1, nodePos: 0 },
        inBlockquote: null,
        inHeading: null,
        inLink: null,
        inImage: null,
        inInlineMath: null,
        inFootnote: null,
        activeFormats: [],
        formatRanges: [],
        innermostFormat: null,
        atLineStart: false,
        atBlankLine: false,
        inWord: null,
        contextMode: "inline-insert",
        nearSpace: false,
        nearPunctuation: false,
        hasSelection: false,
        selectionFrom: 0,
        selectionTo: 0,
      },
    });

    expect(state.disabled).toBe(false);
  });

  it("disables link action when cursor is inside a link", () => {
    const button = createGroupButton("link", [createItem("link", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: {
        inCodeBlock: null,
        inBlockMath: null,
        inTable: null,
        inList: null,
        inBlockquote: null,
        inHeading: null,
        inLink: { href: "https://example.com", text: "example", from: 0, to: 28, contentFrom: 1, contentTo: 8 },
        inImage: null,
        inInlineMath: null,
        inFootnote: null,
        activeFormats: [],
        formatRanges: [],
        innermostFormat: null,
        atLineStart: false,
        atBlankLine: false,
        inWord: null,
        contextMode: "inline-insert",
        nearSpace: false,
        nearPunctuation: false,
        hasSelection: false,
        selectionFrom: 0,
        selectionTo: 0,
      },
    });

    expect(state.itemStates?.[0].disabled).toBe(true);
  });

  it("disables wiki link action when cursor is inside a link", () => {
    const button = createGroupButton("link", [createItem("link:wiki", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: {
        inCodeBlock: null,
        inBlockMath: null,
        inTable: null,
        inList: null,
        inBlockquote: null,
        inHeading: null,
        inLink: { href: "https://example.com", text: "example", from: 0, to: 28, contentFrom: 1, contentTo: 8 },
        inImage: null,
        inInlineMath: null,
        inFootnote: null,
        activeFormats: [],
        formatRanges: [],
        innermostFormat: null,
        atLineStart: false,
        atBlankLine: false,
        inWord: null,
        contextMode: "inline-insert",
        nearSpace: false,
        nearPunctuation: false,
        hasSelection: false,
        selectionFrom: 0,
        selectionTo: 0,
      },
    });

    expect(state.itemStates?.[0].disabled).toBe(true);
  });

  it("disables code action when cursor is inside a link", () => {
    const button = createGroupButton("inline", [createItem("code", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: {
        inCodeBlock: null,
        inBlockMath: null,
        inTable: null,
        inList: null,
        inBlockquote: null,
        inHeading: null,
        inLink: { href: "https://example.com", text: "example", from: 0, to: 28, contentFrom: 1, contentTo: 8 },
        inImage: null,
        inInlineMath: null,
        inFootnote: null,
        activeFormats: [],
        formatRanges: [],
        innermostFormat: null,
        atLineStart: false,
        atBlankLine: false,
        inWord: null,
        contextMode: "inline-insert",
        nearSpace: false,
        nearPunctuation: false,
        hasSelection: true,
        selectionFrom: 1,
        selectionTo: 5,
      },
    });

    expect(state.itemStates?.[0].disabled).toBe(true);
  });

  it("enables bold action when cursor is inside a link (basic marks allowed)", () => {
    const button = createGroupButton("inline", [createItem("bold", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: {
        inCodeBlock: null,
        inBlockMath: null,
        inTable: null,
        inList: null,
        inBlockquote: null,
        inHeading: null,
        inLink: { href: "https://example.com", text: "example", from: 0, to: 28, contentFrom: 1, contentTo: 8 },
        inImage: null,
        inInlineMath: null,
        inFootnote: null,
        activeFormats: [],
        formatRanges: [],
        innermostFormat: null,
        atLineStart: false,
        atBlankLine: false,
        inWord: null,
        contextMode: "inline-insert",
        nearSpace: false,
        nearPunctuation: false,
        hasSelection: true,
        selectionFrom: 1,
        selectionTo: 5,
      },
    });

    // Bold is allowed inside links (basic marks permitted)
    expect(state.itemStates?.[0].disabled).toBe(false);
  });

  it("enables link action when cursor is NOT inside a link", () => {
    const button = createGroupButton("link", [createItem("link", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: {
        inCodeBlock: null,
        inBlockMath: null,
        inTable: null,
        inList: null,
        inBlockquote: null,
        inHeading: null,
        inLink: null,
        inImage: null,
        inInlineMath: null,
        inFootnote: null,
        activeFormats: [],
        formatRanges: [],
        innermostFormat: null,
        atLineStart: false,
        atBlankLine: false,
        inWord: null,
        contextMode: "inline-insert",
        nearSpace: false,
        nearPunctuation: false,
        hasSelection: false,
        selectionFrom: 0,
        selectionTo: 0,
      },
    });

    expect(state.itemStates?.[0].disabled).toBe(false);
  });

  it("returns disabled when view is null", () => {
    const button: ToolbarGroupButton = {
      id: "bold",
      type: "button",
      icon: "",
      label: "bold",
      action: "bold",
      enabledIn: ["textblock"],
    };
    const state = getToolbarButtonState(button, {
      surface: "source",
      view: null,
      context: null,
    });
    expect(state.disabled).toBe(true);
  });

  it("returns disabled when context is null", () => {
    const button: ToolbarGroupButton = {
      id: "bold",
      type: "button",
      icon: "",
      label: "bold",
      action: "bold",
      enabledIn: ["textblock"],
    };
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: null,
    });
    expect(state.disabled).toBe(true);
  });

  it("disables selection-required actions in source mode without selection", () => {
    const selectionActions = ["bold", "italic", "strikethrough", "highlight",
      "superscript", "subscript", "code", "underline", "clearFormatting", "insertFootnote"];

    for (const action of selectionActions) {
      const button: ToolbarGroupButton = {
        id: action,
        type: "button",
        icon: "",
        label: action,
        action,
        enabledIn: ["textblock"],
      };
      const state = getToolbarButtonState(button, {
        surface: "source",
        view,
        context: sourceCtx({ hasSelection: false }),
      });
      expect(state.disabled).toBe(true);
    }
  });

  it("detects source active heading format", () => {
    const button = createGroupButton("heading", [createItem("heading:2", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: sourceCtx({ inHeading: { level: 2, nodePos: 0 } }),
    });
    expect(state.itemStates?.[0].active).toBe(true);
  });

  it("heading:0 is never active (remove heading action)", () => {
    const button = createGroupButton("heading", [createItem("heading:0", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: sourceCtx({ inHeading: { level: 2, nodePos: 0 } }),
    });
    expect(state.itemStates?.[0].active).toBe(false);
  });

  it("heading:NaN is never active", () => {
    const button = createGroupButton("heading", [createItem("heading:abc", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: sourceCtx({ inHeading: { level: 2, nodePos: 0 } }),
    });
    expect(state.itemStates?.[0].active).toBe(false);
  });

  it("heading not active when not in heading", () => {
    const button = createGroupButton("heading", [createItem("heading:2", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: sourceCtx(),
    });
    expect(state.itemStates?.[0].active).toBe(false);
  });

  it("detects source active bold format", () => {
    const button = createGroupButton("inline", [createItem("bold", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: sourceCtx({ activeFormats: ["bold"], hasSelection: true }),
    });
    expect(state.itemStates?.[0].active).toBe(true);
  });

  it("detects source active link", () => {
    const button = createGroupButton("inline", [createItem("link", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: sourceCtx({ inLink: { href: "x", text: "y", from: 0, to: 5, contentFrom: 1, contentTo: 2 } }),
    });
    expect(state.itemStates?.[0].active).toBe(true);
  });

  it("detects source active bullet list", () => {
    const button = createGroupButton("list", [createItem("bulletList", ["always"])]);
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: sourceCtx({ inList: { type: "bullet", depth: 1, nodePos: 0 } }),
    });
    expect(state.itemStates?.[0].active).toBe(true);
  });

  it("detects source active ordered list", () => {
    const button = createGroupButton("list", [createItem("orderedList", ["always"])]);
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: sourceCtx({ inList: { type: "ordered", depth: 1, nodePos: 0 } }),
    });
    expect(state.itemStates?.[0].active).toBe(true);
  });

  it("detects source active task list", () => {
    const button = createGroupButton("list", [createItem("taskList", ["always"])]);
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: sourceCtx({ inList: { type: "task", depth: 1, nodePos: 0 } }),
    });
    expect(state.itemStates?.[0].active).toBe(true);
  });

  it("detects source heading active (general)", () => {
    const button = createGroupButton("heading", [createItem("heading", ["always"])]);
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: sourceCtx({ inHeading: { level: 3, nodePos: 0 } }),
    });
    expect(state.itemStates?.[0].active).toBe(true);
  });

  it("insert actions are never active in source mode", () => {
    const button = createGroupButton("insert", [createItem("insertMath", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: sourceCtx(),
    });
    expect(state.itemStates?.[0].active).toBe(false);
  });

  it("link: prefixed actions are never active in source mode", () => {
    const button = createGroupButton("link", [createItem("link:bookmark", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: sourceCtx(),
    });
    expect(state.itemStates?.[0].active).toBe(false);
  });

  it("unknown action is never active in source mode", () => {
    const button = createGroupButton("misc", [createItem("unknownAction", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: sourceCtx(),
    });
    expect(state.itemStates?.[0].active).toBe(false);
  });

  it("enables actions with enabledIn: selection when hasSelection", () => {
    const button: ToolbarGroupButton = {
      id: "test",
      type: "button",
      icon: "",
      label: "test",
      action: "test",
      enabledIn: ["selection"],
    };
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: sourceCtx({ hasSelection: true }),
    });
    expect(state.disabled).toBe(false);
  });

  it("disables actions with enabledIn: selection when no selection", () => {
    const button: ToolbarGroupButton = {
      id: "test",
      type: "button",
      icon: "",
      label: "test",
      action: "test",
      enabledIn: ["selection"],
    };
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: sourceCtx({ hasSelection: false }),
    });
    expect(state.disabled).toBe(true);
  });

  it("enables actions with enabledIn: heading when in heading", () => {
    const button: ToolbarGroupButton = {
      id: "test",
      type: "button",
      icon: "",
      label: "test",
      action: "test",
      enabledIn: ["heading"],
    };
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: sourceCtx({ inHeading: { level: 1, nodePos: 0 } }),
    });
    expect(state.disabled).toBe(false);
  });

  it("enables actions with enabledIn: blockquote when in blockquote", () => {
    const button: ToolbarGroupButton = {
      id: "test",
      type: "button",
      icon: "",
      label: "test",
      action: "test",
      enabledIn: ["blockquote"],
    };
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: sourceCtx({ inBlockquote: { depth: 1 } }),
    });
    expect(state.disabled).toBe(false);
  });

  it("enables actions with enabledIn: codeblock when in code block", () => {
    const button: ToolbarGroupButton = {
      id: "test",
      type: "button",
      icon: "",
      label: "test",
      action: "test",
      enabledIn: ["codeblock"],
    };
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: sourceCtx({ inCodeBlock: { language: "js", from: 0, to: 10 } }),
    });
    expect(state.disabled).toBe(false);
  });

  it("disables textblock actions when in code block", () => {
    const button: ToolbarGroupButton = {
      id: "test",
      type: "button",
      icon: "",
      label: "test",
      action: "test",
      enabledIn: ["textblock"],
    };
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: sourceCtx({ inCodeBlock: { language: "js", from: 0, to: 10 } }),
    });
    expect(state.disabled).toBe(true);
  });

  it("enables actions with enabledIn: table when in table", () => {
    const button: ToolbarGroupButton = {
      id: "test",
      type: "button",
      icon: "",
      label: "test",
      action: "test",
      enabledIn: ["table"],
    };
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: sourceCtx({ inTable: { nodePos: 0 } }),
    });
    expect(state.disabled).toBe(false);
  });

  it("disables actions with enabledIn: table when NOT in table", () => {
    const button: ToolbarGroupButton = {
      id: "test",
      type: "button",
      icon: "",
      label: "test",
      action: "test",
      enabledIn: ["table"],
    };
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: sourceCtx({ inTable: null }),
    });
    expect(state.disabled).toBe(true);
  });

  it("disables actions with enabledIn: heading when NOT in heading (break path)", () => {
    const button: ToolbarGroupButton = {
      id: "test",
      type: "button",
      icon: "",
      label: "test",
      action: "test",
      enabledIn: ["heading"],
    };
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: sourceCtx({ inHeading: null }),
    });
    expect(state.disabled).toBe(true);
  });

  it("disables actions with enabledIn: list when NOT in list (break path)", () => {
    const button: ToolbarGroupButton = {
      id: "test",
      type: "button",
      icon: "",
      label: "test",
      action: "test",
      enabledIn: ["list"],
    };
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: sourceCtx({ inList: null }),
    });
    expect(state.disabled).toBe(true);
  });

  it("disables actions with enabledIn: never (never case break path)", () => {
    const button: ToolbarGroupButton = {
      id: "test",
      type: "button",
      icon: "",
      label: "test",
      action: "test",
      enabledIn: ["never"],
    };
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: sourceCtx(),
    });
    expect(state.disabled).toBe(true);
    expect(state.notImplemented).toBe(true);
  });

  it("returns false for matchesEnabledContext when no rules match (return false path)", () => {
    // Use enabledIn: ["blockquote"] but not in blockquote → all rules fall through → return false
    const button: ToolbarGroupButton = {
      id: "test",
      type: "button",
      icon: "",
      label: "test",
      action: "test",
      enabledIn: ["blockquote"],
    };
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: sourceCtx({ inBlockquote: null }),
    });
    expect(state.disabled).toBe(true);
  });

  it("disables actions with enabledIn: codeblock when NOT in code block (break path)", () => {
    const button: ToolbarGroupButton = {
      id: "test",
      type: "button",
      icon: "",
      label: "test",
      action: "test",
      enabledIn: ["codeblock"],
    };
    const state = getToolbarButtonState(button, {
      surface: "source",
      view,
      context: sourceCtx({ inCodeBlock: null }),
    });
    expect(state.disabled).toBe(true);
  });
});

describe("getToolbarItemState", () => {
  const view = {} as CodeMirrorView;

  it("returns disabled for separator items", () => {
    const separator: ToolbarMenuItem = { type: "separator" } as ToolbarMenuItem;
    const state = getToolbarItemState(separator, {
      surface: "source",
      view,
      context: sourceCtx(),
    });
    expect(state.disabled).toBe(true);
    expect(state.notImplemented).toBe(false);
    expect(state.active).toBe(false);
  });

  it("returns disabled when view is null", () => {
    const item = createItem("bold", ["textblock"]);
    const state = getToolbarItemState(item, {
      surface: "source",
      view: null,
      context: null,
    });
    expect(state.disabled).toBe(true);
  });

  it("returns disabled when context is null", () => {
    const item = createItem("bold", ["textblock"]);
    const state = getToolbarItemState(item, {
      surface: "source",
      view,
      context: null,
    });
    expect(state.disabled).toBe(true);
  });

  it("returns notImplemented for enabledIn: never items", () => {
    const item = createItem("futureAction", ["never"]);
    const state = getToolbarItemState(item, {
      surface: "source",
      view,
      context: sourceCtx(),
    });
    expect(state.notImplemented).toBe(true);
    expect(state.disabled).toBe(true);
  });

  it("returns enabled for textblock items when not in code block", () => {
    const item = createItem("bold", ["textblock"]);
    const state = getToolbarItemState(item, {
      surface: "source",
      view,
      context: sourceCtx({ hasSelection: true }),
    });
    expect(state.disabled).toBe(false);
  });

  it("returns correct active state for source items", () => {
    const item = createItem("italic", ["textblock"]);
    const state = getToolbarItemState(item, {
      surface: "source",
      view,
      context: sourceCtx({ activeFormats: ["italic"], hasSelection: true }),
    });
    expect(state.active).toBe(true);
  });
});

describe("getToolbarButtonState (wysiwyg)", () => {
  function createWysiwygView(markNames: string[] = []) {
    const marks: Record<string, { isInSet: (m: unknown[]) => boolean }> = {};
    for (const name of ["bold", "italic", "underline", "strike", "highlight", "superscript", "subscript", "code", "link"]) {
      marks[name] = {
        isInSet: (m: unknown[]) => markNames.includes(name) && m.some((mark: { type: { name: string } }) => mark.type.name === name),
      };
    }
    return {
      state: {
        schema: { marks },
        selection: {
          from: 0,
          to: 0,
          empty: true,
          $from: {
            marks: () => markNames.map((n) => ({ type: { name: n } })),
          },
        },
        storedMarks: null,
        doc: {
          rangeHasMark: vi.fn(() => false),
        },
      },
    } as unknown as import("@tiptap/pm/view").EditorView;
  }

  function wysiwygCtx(overrides?: Record<string, unknown>) {
    return {
      inCodeBlock: null,
      inTable: null,
      inList: null,
      inBlockquote: null,
      inHeading: null,
      inLink: null,
      inImage: null,
      inInlineMath: null,
      inFootnote: null,
      hasSelection: false,
      ...overrides,
    };
  }

  it("detects bold active state via stored marks", () => {
    const view = createWysiwygView(["bold"]);
    const button = createGroupButton("inline", [createItem("bold", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "wysiwyg",
      view,
      context: wysiwygCtx(),
    });
    expect(state.itemStates?.[0].active).toBe(true);
  });

  it("detects italic active state", () => {
    const view = createWysiwygView(["italic"]);
    const button = createGroupButton("inline", [createItem("italic", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "wysiwyg",
      view,
      context: wysiwygCtx(),
    });
    expect(state.itemStates?.[0].active).toBe(true);
  });

  it("detects underline active state", () => {
    const view = createWysiwygView(["underline"]);
    const button = createGroupButton("inline", [createItem("underline", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "wysiwyg",
      view,
      context: wysiwygCtx(),
    });
    expect(state.itemStates?.[0].active).toBe(true);
  });

  it("detects strikethrough active via 'strike' mark", () => {
    const view = createWysiwygView(["strike"]);
    const button = createGroupButton("inline", [createItem("strikethrough", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "wysiwyg",
      view,
      context: wysiwygCtx(),
    });
    expect(state.itemStates?.[0].active).toBe(true);
  });

  it("detects highlight active state", () => {
    const view = createWysiwygView(["highlight"]);
    const button = createGroupButton("inline", [createItem("highlight", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "wysiwyg",
      view,
      context: wysiwygCtx(),
    });
    expect(state.itemStates?.[0].active).toBe(true);
  });

  it("detects superscript active state", () => {
    const view = createWysiwygView(["superscript"]);
    const button = createGroupButton("inline", [createItem("superscript", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "wysiwyg",
      view,
      context: wysiwygCtx(),
    });
    expect(state.itemStates?.[0].active).toBe(true);
  });

  it("detects subscript active state", () => {
    const view = createWysiwygView(["subscript"]);
    const button = createGroupButton("inline", [createItem("subscript", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "wysiwyg",
      view,
      context: wysiwygCtx(),
    });
    expect(state.itemStates?.[0].active).toBe(true);
  });

  it("detects code active state", () => {
    const view = createWysiwygView(["code"]);
    const button = createGroupButton("inline", [createItem("code", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "wysiwyg",
      view,
      context: wysiwygCtx(),
    });
    expect(state.itemStates?.[0].active).toBe(true);
  });

  it("detects link active state via context.inLink", () => {
    const view = createWysiwygView([]);
    const button = createGroupButton("link", [createItem("link", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "wysiwyg",
      view,
      context: wysiwygCtx({ inLink: { href: "x" } }),
    });
    expect(state.itemStates?.[0].active).toBe(true);
  });

  it("detects bulletList active state", () => {
    const view = createWysiwygView([]);
    const button = createGroupButton("list", [createItem("bulletList", ["always"])]);
    const state = getToolbarButtonState(button, {
      surface: "wysiwyg",
      view,
      context: wysiwygCtx({ inList: { listType: "bullet" } }),
    });
    expect(state.itemStates?.[0].active).toBe(true);
  });

  it("detects orderedList active state", () => {
    const view = createWysiwygView([]);
    const button = createGroupButton("list", [createItem("orderedList", ["always"])]);
    const state = getToolbarButtonState(button, {
      surface: "wysiwyg",
      view,
      context: wysiwygCtx({ inList: { listType: "ordered" } }),
    });
    expect(state.itemStates?.[0].active).toBe(true);
  });

  it("detects taskList active state", () => {
    const view = createWysiwygView([]);
    const button = createGroupButton("list", [createItem("taskList", ["always"])]);
    const state = getToolbarButtonState(button, {
      surface: "wysiwyg",
      view,
      context: wysiwygCtx({ inList: { listType: "task" } }),
    });
    expect(state.itemStates?.[0].active).toBe(true);
  });

  it("detects heading active via context.inHeading", () => {
    const view = createWysiwygView([]);
    const button = createGroupButton("heading", [createItem("heading", ["always"])]);
    const state = getToolbarButtonState(button, {
      surface: "wysiwyg",
      view,
      context: wysiwygCtx({ inHeading: { level: 2 } }),
    });
    expect(state.itemStates?.[0].active).toBe(true);
  });

  it("detects heading:N active for specific level", () => {
    const view = createWysiwygView([]);
    const button = createGroupButton("heading", [createItem("heading:3", ["always"])]);
    const state = getToolbarButtonState(button, {
      surface: "wysiwyg",
      view,
      context: wysiwygCtx({ inHeading: { level: 3 } }),
    });
    expect(state.itemStates?.[0].active).toBe(true);
  });

  it("heading:3 is not active when heading level is 2", () => {
    const view = createWysiwygView([]);
    const button = createGroupButton("heading", [createItem("heading:3", ["always"])]);
    const state = getToolbarButtonState(button, {
      surface: "wysiwyg",
      view,
      context: wysiwygCtx({ inHeading: { level: 2 } }),
    });
    expect(state.itemStates?.[0].active).toBe(false);
  });

  it("heading:0 is never active", () => {
    const view = createWysiwygView([]);
    const button = createGroupButton("heading", [createItem("heading:0", ["always"])]);
    const state = getToolbarButtonState(button, {
      surface: "wysiwyg",
      view,
      context: wysiwygCtx({ inHeading: { level: 2 } }),
    });
    expect(state.itemStates?.[0].active).toBe(false);
  });

  it("insert actions are never active in wysiwyg", () => {
    const view = createWysiwygView([]);
    const button = createGroupButton("insert", [createItem("insertCodeBlock", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "wysiwyg",
      view,
      context: wysiwygCtx(),
    });
    expect(state.itemStates?.[0].active).toBe(false);
  });

  it("unknown action returns false for active", () => {
    const view = createWysiwygView([]);
    const button = createGroupButton("misc", [createItem("unknown", ["always"])]);
    const state = getToolbarButtonState(button, {
      surface: "wysiwyg",
      view,
      context: wysiwygCtx(),
    });
    expect(state.itemStates?.[0].active).toBe(false);
  });

  it("mark active detection with non-empty selection uses rangeHasMark", () => {
    const view = createWysiwygView([]);
    (view.state.selection as { empty: boolean }).empty = false;
    (view.state.selection as { from: number }).from = 0;
    (view.state.selection as { to: number }).to = 5;
    (view.state.doc.rangeHasMark as ReturnType<typeof vi.fn>).mockReturnValue(true);

    const button = createGroupButton("inline", [createItem("bold", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "wysiwyg",
      view,
      context: wysiwygCtx(),
    });
    expect(state.itemStates?.[0].active).toBe(true);
  });

  it("returns false for mark with missing schema mark type", () => {
    const view = createWysiwygView([]);
    // Remove a mark from schema
    delete (view.state.schema.marks as Record<string, unknown>)["bold"];

    const button = createGroupButton("inline", [createItem("bold", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "wysiwyg",
      view,
      context: wysiwygCtx(),
    });
    expect(state.itemStates?.[0].active).toBe(false);
  });

  it("returns disabled for non-dropdown button when context is null", () => {
    const view = createWysiwygView([]);
    const button: ToolbarGroupButton = {
      id: "bold",
      type: "button",
      icon: "",
      label: "bold",
      action: "bold",
      enabledIn: ["always"],
    };
    const state = getToolbarButtonState(button, {
      surface: "wysiwyg",
      view,
      context: null,
    });
    // context is null → disabled and not active
    expect(state.disabled).toBe(true);
    expect(state.active).toBe(false);
  });

  it("disables link action inside a link in wysiwyg", () => {
    const view = createWysiwygView([]);
    const button = createGroupButton("link", [createItem("link", ["textblock"])]);
    const state = getToolbarButtonState(button, {
      surface: "wysiwyg",
      view,
      context: wysiwygCtx({ inLink: { href: "x" } }),
    });
    expect(state.itemStates?.[0].disabled).toBe(true);
  });

  it("heading:NaN is never active in wysiwyg mode (line 88 guard)", () => {
    const view = createWysiwygView([]);
    const button = createGroupButton("heading", [createItem("heading:abc", ["always"])]);
    const state = getToolbarButtonState(button, {
      surface: "wysiwyg",
      view,
      context: wysiwygCtx({ inHeading: { level: 2 } }),
    });
    expect(state.itemStates?.[0].active).toBe(false);
  });

  it("heading:N is not active when not in a heading in wysiwyg mode (line 92 guard)", () => {
    const view = createWysiwygView([]);
    const button = createGroupButton("heading", [createItem("heading:2", ["always"])]);
    const state = getToolbarButtonState(button, {
      surface: "wysiwyg",
      view,
      context: wysiwygCtx({ inHeading: null }),
    });
    expect(state.itemStates?.[0].active).toBe(false);
  });
});

function sourceCtx(overrides?: Record<string, unknown>) {
  return {
    inCodeBlock: null,
    inBlockMath: null,
    inTable: null,
    inList: null,
    inBlockquote: null,
    inHeading: null,
    inLink: null,
    inImage: null,
    inInlineMath: null,
    inFootnote: null,
    activeFormats: [],
    formatRanges: [],
    innermostFormat: null,
    atLineStart: false,
    atBlankLine: false,
    inWord: null,
    contextMode: "inline-insert",
    nearSpace: false,
    nearPunctuation: false,
    hasSelection: false,
    selectionFrom: 0,
    selectionTo: 0,
    ...overrides,
  };
}
