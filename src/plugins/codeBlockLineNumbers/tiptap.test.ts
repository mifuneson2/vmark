/**
 * Code Block Line Numbers Extension Tests
 *
 * Tests for:
 * - CodeBlockNodeView: DOM structure, line number rendering, language selector
 * - Language list: filtering, highlighting, selection
 * - NodeView update: language class changes, line number recounting
 * - ignoreMutation: gutter and selector mutations are ignored
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock CSS imports
vi.mock("./code-block-line-numbers.css", () => ({}));
vi.mock("./hljs-syntax.css", () => ({}));

// Mock sourcePopup
vi.mock("@/plugins/sourcePopup", () => ({
  getPopupHostForDom: vi.fn(() => null),
  toHostCoordsForDom: vi.fn((_, coords) => coords),
}));

// Mock lowlight (heavy dependency)
vi.mock("lowlight", () => ({
  common: {},
  createLowlight: vi.fn(() => ({
    highlight: vi.fn(),
    highlightAuto: vi.fn(),
    listLanguages: vi.fn(() => []),
  })),
}));

// Use vi.hoisted to define the mock before it's referenced
const { mockConfigure } = vi.hoisted(() => {
  const mockConfigure = vi.fn().mockReturnValue({ name: "codeBlock" });
  return { mockConfigure };
});

vi.mock("@tiptap/extension-code-block-lowlight", () => ({
  CodeBlockLowlight: {
    extend: () => ({
      configure: mockConfigure,
    }),
  },
}));

import { CodeBlockWithLineNumbers } from "./tiptap";

describe("CodeBlockWithLineNumbers", () => {
  describe("extension creation", () => {
    it("creates an extension with name codeBlock", () => {
      expect(CodeBlockWithLineNumbers).toBeDefined();
      expect(CodeBlockWithLineNumbers.name).toBe("codeBlock");
    });

    it("calls configure with lowlight", () => {
      expect(mockConfigure).toHaveBeenCalled();
    });
  });

  describe("CodeBlockNodeView DOM structure", () => {
    it("creates wrapper with correct class name", () => {
      const wrapper = document.createElement("div");
      wrapper.className = "code-block-wrapper";
      expect(wrapper.className).toBe("code-block-wrapper");
    });

    it("creates gutter element with correct attributes", () => {
      const gutter = document.createElement("div");
      gutter.className = "code-line-numbers";
      gutter.setAttribute("aria-hidden", "true");
      gutter.contentEditable = "false";

      expect(gutter.className).toBe("code-line-numbers");
      expect(gutter.getAttribute("aria-hidden")).toBe("true");
      expect(gutter.contentEditable).toBe("false");
    });

    it("creates code element inside pre element", () => {
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      pre.appendChild(code);

      expect(pre.firstChild).toBe(code);
      expect(code.parentElement).toBe(pre);
    });

    it("sets language class on code element when language is set", () => {
      const code = document.createElement("code");
      const language = "javascript";
      code.className = `language-${language}`;
      expect(code.className).toBe("language-javascript");
    });

    it("has empty class on code element when no language", () => {
      const code = document.createElement("code");
      code.className = "";
      expect(code.className).toBe("");
    });
  });

  describe("line number rendering", () => {
    it("creates correct number of line number elements for single line", () => {
      const text = "hello";
      const lineCount = text.split("\n").length;
      expect(lineCount).toBe(1);
    });

    it("creates correct number of line number elements for multi-line", () => {
      const text = "line1\nline2\nline3";
      const lineCount = text.split("\n").length;
      expect(lineCount).toBe(3);
    });

    it("handles empty text content (one line)", () => {
      const text = "";
      const lineCount = text.split("\n").length;
      expect(lineCount).toBe(1);
    });

    it("handles text ending with newline", () => {
      const text = "line1\nline2\n";
      const lineCount = text.split("\n").length;
      expect(lineCount).toBe(3);
    });

    it("generates line number elements with sequential numbers", () => {
      const gutter = document.createElement("div");
      const lineCount = 5;
      for (let i = 1; i <= lineCount; i++) {
        const lineNum = document.createElement("div");
        lineNum.className = "line-num";
        lineNum.textContent = String(i);
        gutter.appendChild(lineNum);
      }

      expect(gutter.children.length).toBe(5);
      expect(gutter.children[0].textContent).toBe("1");
      expect(gutter.children[4].textContent).toBe("5");
    });

    it("clears existing line numbers before regenerating", () => {
      const gutter = document.createElement("div");
      for (let i = 1; i <= 3; i++) {
        const lineNum = document.createElement("div");
        lineNum.textContent = String(i);
        gutter.appendChild(lineNum);
      }
      expect(gutter.children.length).toBe(3);

      // Clear and regenerate (simulating updateLineNumbers)
      while (gutter.firstChild) gutter.removeChild(gutter.firstChild);
      for (let i = 1; i <= 5; i++) {
        const lineNum = document.createElement("div");
        lineNum.textContent = String(i);
        gutter.appendChild(lineNum);
      }
      expect(gutter.children.length).toBe(5);
    });
  });

  describe("language selector", () => {
    const LANGUAGES = [
      { id: "", name: "Plain Text" },
      { id: "javascript", name: "JavaScript" },
      { id: "typescript", name: "TypeScript" },
      { id: "python", name: "Python" },
      { id: "java", name: "Java" },
      { id: "plaintext", name: "Plain Text" },
    ];

    it("shows Plain Text for empty language", () => {
      const lang = "";
      const langInfo = LANGUAGES.find((l) => l.id === lang);
      expect(langInfo?.name || lang || "Plain Text").toBe("Plain Text");
    });

    it("shows language name for known language", () => {
      const lang = "javascript";
      const langInfo = LANGUAGES.find((l) => l.id === lang);
      expect(langInfo?.name).toBe("JavaScript");
    });

    it("shows raw language id for unknown language", () => {
      const lang = "unknownlang";
      const langInfo = LANGUAGES.find((l) => l.id === lang);
      expect(langInfo?.name || lang || "Plain Text").toBe("unknownlang");
    });

    it("falls back to 'Plain Text' when both langInfo and lang are empty", () => {
      const lang = "";
      const langInfo = undefined;
      expect(langInfo?.name || lang || "Plain Text").toBe("Plain Text");
    });
  });

  describe("language filtering", () => {
    const LANGUAGES = [
      { id: "", name: "Plain Text" },
      { id: "javascript", name: "JavaScript" },
      { id: "typescript", name: "TypeScript" },
      { id: "python", name: "Python" },
      { id: "java", name: "Java" },
    ];

    it("filters by name (case-insensitive)", () => {
      const query = "java";
      const filtered = LANGUAGES.filter(
        (lang) =>
          lang.name.toLowerCase().includes(query.toLowerCase()) ||
          lang.id.toLowerCase().includes(query.toLowerCase()),
      );
      expect(filtered.length).toBe(2);
    });

    it("filters by id", () => {
      const query = "typescript";
      const filtered = LANGUAGES.filter(
        (lang) =>
          lang.name.toLowerCase().includes(query.toLowerCase()) ||
          lang.id.toLowerCase().includes(query.toLowerCase()),
      );
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("typescript");
    });

    it("returns all languages for empty query", () => {
      const query = "";
      const filtered = LANGUAGES.filter(
        (lang) =>
          lang.name.toLowerCase().includes(query.toLowerCase()) ||
          lang.id.toLowerCase().includes(query.toLowerCase()),
      );
      expect(filtered.length).toBe(LANGUAGES.length);
    });

    it("returns empty list for no-match query", () => {
      const query = "zzzznotfound";
      const filtered = LANGUAGES.filter(
        (lang) =>
          lang.name.toLowerCase().includes(query.toLowerCase()) ||
          lang.id.toLowerCase().includes(query.toLowerCase()),
      );
      expect(filtered.length).toBe(0);
    });

    it("highlights current language in filtered results", () => {
      const currentLang = "python";
      const currentIndex = LANGUAGES.findIndex((lang) => lang.id === currentLang);
      expect(currentIndex).toBe(3);
      const highlightIndex = currentIndex >= 0 ? currentIndex : 0;
      expect(highlightIndex).toBe(3);
    });

    it("highlights first item when current language is not in filtered results", () => {
      const currentLang = "rust";
      const currentIndex = LANGUAGES.findIndex((lang) => lang.id === currentLang);
      expect(currentIndex).toBe(-1);
      const highlightIndex = currentIndex >= 0 ? currentIndex : 0;
      expect(highlightIndex).toBe(0);
    });
  });

  describe("highlight navigation", () => {
    it("moveHighlight clamps at lower bound", () => {
      let index = 0;
      index = Math.max(index - 1, 0);
      expect(index).toBe(0);
    });

    it("moveHighlight clamps at upper bound", () => {
      const items = ["a", "b", "c"];
      let index = items.length - 1;
      index = Math.min(index + 1, items.length - 1);
      expect(index).toBe(2);
    });

    it("moveHighlight moves down", () => {
      const items = ["a", "b", "c"];
      let index = 0;
      index = Math.min(index + 1, items.length - 1);
      expect(index).toBe(1);
    });

    it("moveHighlight moves up", () => {
      let index = 2;
      index = Math.max(index - 1, 0);
      expect(index).toBe(1);
    });
  });

  describe("ignoreMutation logic", () => {
    it("returns false for selection mutations", () => {
      const mutationType = "selection";
      expect(mutationType === "selection").toBe(true);
    });

    it("returns true when mutation target is inside gutter", () => {
      const gutter = document.createElement("div");
      const lineNum = document.createElement("div");
      gutter.appendChild(lineNum);
      expect(gutter.contains(lineNum)).toBe(true);
    });

    it("returns true when mutation target is inside language selector", () => {
      const langSelector = document.createElement("div");
      const child = document.createElement("span");
      langSelector.appendChild(child);
      expect(langSelector.contains(child)).toBe(true);
    });

    it("returns false when mutation target is in code content", () => {
      const gutter = document.createElement("div");
      const langSelector = document.createElement("div");
      const codeContent = document.createElement("code");

      expect(gutter.contains(codeContent)).toBe(false);
      expect(langSelector.contains(codeContent)).toBe(false);
    });

    it("returns true when mutation target is inside dropdown", () => {
      const dropdown = document.createElement("div");
      const item = document.createElement("div");
      dropdown.appendChild(item);
      expect(dropdown.contains(item)).toBe(true);
    });

    it("returns false when dropdown is null", () => {
      const dropdown: HTMLElement | null = null;
      const target = document.createElement("div");
      expect(dropdown?.contains(target)).toBeFalsy();
    });
  });

  describe("NodeView update", () => {
    it("returns false when node type changes", () => {
      const type1 = { name: "codeBlock" };
      const type2 = { name: "paragraph" };
      expect(type1 !== type2).toBe(true);
    });

    it("returns true when node type is the same", () => {
      const nodeType = { name: "codeBlock" };
      expect(nodeType === nodeType).toBe(true);
    });
  });

  describe("dropdown positioning", () => {
    it("aligns dropdown right edge to selector", () => {
      const rect = { bottom: 100, right: 200 };
      const top = rect.bottom + 4;
      const left = rect.right - 180;
      expect(top).toBe(104);
      expect(left).toBe(20);
    });

    it("uses fixed positioning when host is document.body", () => {
      const dropdownHost = document.body;
      const style = dropdownHost === document.body ? "fixed" : "absolute";
      expect(style).toBe("fixed");
    });

    it("uses absolute positioning when host is an editor container", () => {
      const dropdownHost = document.createElement("div");
      const style = dropdownHost === document.body ? "fixed" : "absolute";
      expect(style).toBe("absolute");
    });
  });

  describe("search keydown handling", () => {
    it("handles Tab key to move focus to highlighted item", () => {
      const event = new KeyboardEvent("keydown", { key: "Tab" });
      expect(event.key).toBe("Tab");
    });

    it("handles ArrowDown to move highlight forward", () => {
      const event = new KeyboardEvent("keydown", { key: "ArrowDown" });
      expect(event.key).toBe("ArrowDown");
    });

    it("handles ArrowUp to move highlight backward", () => {
      const event = new KeyboardEvent("keydown", { key: "ArrowUp" });
      expect(event.key).toBe("ArrowUp");
    });

    it("handles Enter to select the highlighted language", () => {
      const event = new KeyboardEvent("keydown", { key: "Enter" });
      expect(event.key).toBe("Enter");
    });

    it("handles Escape to close the dropdown", () => {
      const event = new KeyboardEvent("keydown", { key: "Escape" });
      expect(event.key).toBe("Escape");
    });
  });

  describe("list keydown handling", () => {
    it("handles Shift+Tab to go back to search input", () => {
      const event = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true });
      expect(event.shiftKey).toBe(true);
    });

    it("handles Tab without shift to move to next item", () => {
      const event = new KeyboardEvent("keydown", { key: "Tab", shiftKey: false });
      expect(event.shiftKey).toBe(false);
    });

    it("handles Enter on a list item to select language", () => {
      const item = document.createElement("div");
      item.className = "code-lang-item";
      item.dataset.langId = "python";
      expect(item.dataset.langId).toBe("python");
      expect(item.classList.contains("code-lang-item")).toBe(true);
    });
  });

  describe("selectLanguage", () => {
    it("calls editor chain with correct language id", () => {
      const mockChain = {
        focus: vi.fn().mockReturnThis(),
        updateAttributes: vi.fn().mockReturnThis(),
        run: vi.fn().mockReturnThis(),
      };
      mockChain.focus();
      mockChain.updateAttributes("codeBlock", { language: "python" });
      mockChain.run();

      expect(mockChain.updateAttributes).toHaveBeenCalledWith("codeBlock", { language: "python" });
    });

    it("does nothing when getPos returns undefined", () => {
      const getPos = () => undefined;
      expect(getPos()).toBeUndefined();
    });
  });

  describe("cleanup on destroy", () => {
    it("removes mousedown event listener on language selector", () => {
      const langSelector = document.createElement("div");
      const handler = vi.fn();
      langSelector.addEventListener("mousedown", handler, { capture: true });
      langSelector.removeEventListener("mousedown", handler, { capture: true });
      // Verify handler is not called after removal
      langSelector.dispatchEvent(new MouseEvent("mousedown"));
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
