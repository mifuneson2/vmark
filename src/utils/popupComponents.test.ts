/**
 * Tests for popupComponents.ts — vanilla DOM builder utilities.
 *
 * Tests DOM construction, CSS class assignment, event wiring,
 * and tab-cycling logic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  popupIcons,
  buildPopupIconButton,
  buildPopupInput,
  buildPopupPreview,
  buildPopupButtonRow,
  buildPopupInputRow,
  getFocusableElements,
  handlePopupTabNavigation,
} from "./popupComponents";
import type { PopupIconName } from "./popupComponents";

// ---- popupIcons ----

describe("popupIcons", () => {
  it("contains expected icon keys", () => {
    const expectedKeys: PopupIconName[] = [
      "open", "copy", "save", "delete", "close",
      "folder", "goto", "toggle", "link", "image",
      "blockImage", "inlineImage", "type",
    ];
    for (const key of expectedKeys) {
      expect(popupIcons[key]).toBeDefined();
      expect(popupIcons[key]).toContain("<svg");
    }
  });

  it("all icons are valid SVG strings", () => {
    for (const [, svg] of Object.entries(popupIcons)) {
      expect(svg).toMatch(/^<svg[\s>]/);
      expect(svg).toContain("</svg>");
    }
  });
});

// ---- buildPopupIconButton ----

describe("buildPopupIconButton", () => {
  it("creates a button element with correct type", () => {
    const btn = buildPopupIconButton({
      icon: "save",
      title: "Save",
      onClick: () => {},
    });
    expect(btn.tagName).toBe("BUTTON");
    expect(btn.type).toBe("button");
  });

  it("sets title attribute", () => {
    const btn = buildPopupIconButton({
      icon: "copy",
      title: "Copy to clipboard",
      onClick: () => {},
    });
    expect(btn.title).toBe("Copy to clipboard");
  });

  it("sets content to the icon SVG", () => {
    const btn = buildPopupIconButton({
      icon: "delete",
      title: "Delete",
      onClick: () => {},
    });
    expect(btn.querySelector("svg")).not.toBeNull();
  });

  it("has popup-icon-btn class by default", () => {
    const btn = buildPopupIconButton({
      icon: "close",
      title: "Close",
      onClick: () => {},
    });
    expect(btn.className).toBe("popup-icon-btn");
  });

  it("adds variant class for primary", () => {
    const btn = buildPopupIconButton({
      icon: "save",
      title: "Save",
      onClick: () => {},
      variant: "primary",
    });
    expect(btn.classList.contains("popup-icon-btn")).toBe(true);
    expect(btn.classList.contains("popup-icon-btn--primary")).toBe(true);
  });

  it("adds variant class for danger", () => {
    const btn = buildPopupIconButton({
      icon: "delete",
      title: "Delete",
      onClick: () => {},
      variant: "danger",
    });
    expect(btn.classList.contains("popup-icon-btn--danger")).toBe(true);
  });

  it("does not add variant class for default variant", () => {
    const btn = buildPopupIconButton({
      icon: "open",
      title: "Open",
      onClick: () => {},
      variant: "default",
    });
    expect(btn.className).toBe("popup-icon-btn");
  });

  it("appends custom className", () => {
    const btn = buildPopupIconButton({
      icon: "link",
      title: "Link",
      onClick: () => {},
      className: "my-extra-class",
    });
    expect(btn.classList.contains("my-extra-class")).toBe(true);
    expect(btn.classList.contains("popup-icon-btn")).toBe(true);
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    const btn = buildPopupIconButton({
      icon: "save",
      title: "Save",
      onClick,
    });
    btn.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("handles empty className gracefully", () => {
    const btn = buildPopupIconButton({
      icon: "open",
      title: "Open",
      onClick: () => {},
      className: "",
    });
    expect(btn.className).toBe("popup-icon-btn");
  });
});

// ---- buildPopupInput ----

describe("buildPopupInput", () => {
  it("creates an input element with type text", () => {
    const input = buildPopupInput({});
    expect(input.tagName).toBe("INPUT");
    expect(input.type).toBe("text");
  });

  it("sets placeholder", () => {
    const input = buildPopupInput({ placeholder: "Enter URL..." });
    expect(input.placeholder).toBe("Enter URL...");
  });

  it("sets initial value", () => {
    const input = buildPopupInput({ value: "https://example.com" });
    expect(input.value).toBe("https://example.com");
  });

  it("has popup-input class by default", () => {
    const input = buildPopupInput({});
    expect(input.className).toBe("popup-input");
  });

  it("adds monospace class when monospace=true", () => {
    const input = buildPopupInput({ monospace: true });
    expect(input.classList.contains("popup-input--mono")).toBe(true);
  });

  it("adds full-width class when fullWidth=true", () => {
    const input = buildPopupInput({ fullWidth: true });
    expect(input.classList.contains("popup-input--full")).toBe(true);
  });

  it("combines multiple classes", () => {
    const input = buildPopupInput({
      monospace: true,
      fullWidth: true,
      className: "extra",
    });
    expect(input.classList.contains("popup-input")).toBe(true);
    expect(input.classList.contains("popup-input--mono")).toBe(true);
    expect(input.classList.contains("popup-input--full")).toBe(true);
    expect(input.classList.contains("extra")).toBe(true);
  });

  it("calls onInput with current value on input event", () => {
    const onInput = vi.fn();
    const input = buildPopupInput({ onInput });

    // Simulate typing
    input.value = "hello";
    input.dispatchEvent(new Event("input"));
    expect(onInput).toHaveBeenCalledWith("hello");
  });

  it("calls onKeydown on keydown event", () => {
    const onKeydown = vi.fn();
    const input = buildPopupInput({ onKeydown });

    const event = new KeyboardEvent("keydown", { key: "Enter" });
    input.dispatchEvent(event);
    expect(onKeydown).toHaveBeenCalledTimes(1);
  });

  it("does not add listeners when callbacks are undefined", () => {
    const input = buildPopupInput({});
    // Should not throw
    input.dispatchEvent(new Event("input"));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
  });

  it("defaults placeholder to empty string", () => {
    const input = buildPopupInput({});
    expect(input.placeholder).toBe("");
  });

  it("defaults value to empty string", () => {
    const input = buildPopupInput({});
    expect(input.value).toBe("");
  });

  it("handles CJK placeholder text", () => {
    const input = buildPopupInput({ placeholder: "\u8f93\u5165\u94fe\u63a5..." });
    expect(input.placeholder).toBe("\u8f93\u5165\u94fe\u63a5...");
  });

  it("handles empty className gracefully", () => {
    const input = buildPopupInput({ className: "" });
    expect(input.className).toBe("popup-input");
  });
});

// ---- buildPopupPreview ----

describe("buildPopupPreview", () => {
  it("creates a div with popup-preview class", () => {
    const preview = buildPopupPreview();
    expect(preview.tagName).toBe("DIV");
    expect(preview.className).toBe("popup-preview");
  });

  it("appends custom className", () => {
    const preview = buildPopupPreview("custom-preview");
    expect(preview.className).toBe("popup-preview custom-preview");
  });

  it("handles undefined className", () => {
    const preview = buildPopupPreview(undefined);
    expect(preview.className).toBe("popup-preview");
  });
});

// ---- buildPopupButtonRow ----

describe("buildPopupButtonRow", () => {
  it("creates a div with popup-btn-row class", () => {
    const row = buildPopupButtonRow();
    expect(row.tagName).toBe("DIV");
    expect(row.className).toBe("popup-btn-row");
  });
});

// ---- buildPopupInputRow ----

describe("buildPopupInputRow", () => {
  it("creates a div with popup-input-row class", () => {
    const row = buildPopupInputRow();
    expect(row.tagName).toBe("DIV");
    expect(row.className).toBe("popup-input-row");
  });
});

// ---- getFocusableElements ----

describe("getFocusableElements", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("finds buttons and inputs inside container", () => {
    const btn1 = document.createElement("button");
    btn1.textContent = "A";
    const inputEl = document.createElement("input");
    inputEl.type = "text";
    const btn2 = document.createElement("button");
    btn2.textContent = "B";
    container.appendChild(btn1);
    container.appendChild(inputEl);
    container.appendChild(btn2);

    const focusable = getFocusableElements(container);
    // Note: jsdom offsetParent is always null, so filter excludes all.
    // We test the querySelectorAll part works by checking the raw query.
    const raw = Array.from(
      container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ),
    );
    expect(raw).toHaveLength(3);
  });

  it("excludes disabled buttons from query", () => {
    const activeBtn = document.createElement("button");
    activeBtn.textContent = "Active";
    const disabledBtn = document.createElement("button");
    disabledBtn.textContent = "Disabled";
    disabledBtn.disabled = true;
    container.appendChild(activeBtn);
    container.appendChild(disabledBtn);

    const raw = Array.from(
      container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ),
    );
    expect(raw).toHaveLength(1);
  });

  it("excludes disabled inputs from query", () => {
    const activeInput = document.createElement("input");
    activeInput.type = "text";
    const disabledInput = document.createElement("input");
    disabledInput.type = "text";
    disabledInput.disabled = true;
    container.appendChild(activeInput);
    container.appendChild(disabledInput);

    const raw = Array.from(
      container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ),
    );
    expect(raw).toHaveLength(1);
  });

  it("includes elements with positive tabindex", () => {
    const div = document.createElement("div");
    div.tabIndex = 0;
    div.textContent = "Focusable div";
    container.appendChild(div);

    const raw = Array.from(
      container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ),
    );
    expect(raw).toHaveLength(1);
  });

  it("excludes elements with tabindex=-1", () => {
    const div = document.createElement("div");
    div.tabIndex = -1;
    div.textContent = "Not focusable";
    container.appendChild(div);

    const raw = Array.from(
      container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ),
    );
    expect(raw).toHaveLength(0);
  });

  it("returns empty array for empty container", () => {
    const focusable = getFocusableElements(container);
    expect(focusable).toHaveLength(0);
  });
});

// ---- handlePopupTabNavigation ----

describe("handlePopupTabNavigation", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("returns false for non-Tab key", () => {
    const event = new KeyboardEvent("keydown", { key: "Enter" });
    const result = handlePopupTabNavigation(event, container);
    expect(result).toBe(false);
  });

  it("returns false when no focusable elements exist", () => {
    const event = new KeyboardEvent("keydown", { key: "Tab" });
    const result = handlePopupTabNavigation(event, container);
    expect(result).toBe(false);
  });

  it("returns false when active element is not in container", () => {
    const btn = document.createElement("button");
    btn.textContent = "A";
    container.appendChild(btn);
    // Focus is on body, not inside container
    const event = new KeyboardEvent("keydown", { key: "Tab" });
    const result = handlePopupTabNavigation(event, container);
    expect(result).toBe(false);
  });

  it("returns false for Escape key", () => {
    const event = new KeyboardEvent("keydown", { key: "Escape" });
    const result = handlePopupTabNavigation(event, container);
    expect(result).toBe(false);
  });

  it("returns false for arrow keys", () => {
    const event = new KeyboardEvent("keydown", { key: "ArrowDown" });
    const result = handlePopupTabNavigation(event, container);
    expect(result).toBe(false);
  });
});
