/**
 * Settings Components Tests
 *
 * Tests for all shared settings UI components: SettingRow, Toggle, SettingsGroup,
 * Select, CollapsibleGroup, TagInput, Button, IconButton, CopyButton, CloseButton.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  SettingRow,
  Toggle,
  SettingsGroup,
  Select,
  CollapsibleGroup,
  TagInput,
  Button,
  IconButton,
  CopyButton,
  CloseButton,
} from "./components";

// ============================================================================
// SettingRow
// ============================================================================

describe("SettingRow", () => {
  it("renders label and children", () => {
    render(
      <SettingRow label="Font Size">
        <span data-testid="child">18px</span>
      </SettingRow>,
    );

    expect(screen.getByText("Font Size")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <SettingRow label="Theme" description="Choose your preferred theme">
        <span>light</span>
      </SettingRow>,
    );

    expect(screen.getByText("Choose your preferred theme")).toBeInTheDocument();
  });

  it("does not render description when omitted", () => {
    render(
      <SettingRow label="Theme">
        <span>light</span>
      </SettingRow>,
    );

    expect(screen.queryByText("Choose your preferred theme")).not.toBeInTheDocument();
  });

  it("applies opacity when disabled", () => {
    const { container } = render(
      <SettingRow label="Disabled" disabled>
        <span>value</span>
      </SettingRow>,
    );

    const row = container.firstChild as HTMLElement;
    expect(row.className).toContain("opacity-50");
  });

  it("does not apply opacity when not disabled", () => {
    const { container } = render(
      <SettingRow label="Enabled">
        <span>value</span>
      </SettingRow>,
    );

    const row = container.firstChild as HTMLElement;
    expect(row.className).not.toContain("opacity-50");
  });
});

// ============================================================================
// Toggle
// ============================================================================

describe("Toggle", () => {
  it("renders as a switch with correct aria-checked", () => {
    render(<Toggle checked={true} onChange={vi.fn()} />);

    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("renders unchecked state", () => {
    render(<Toggle checked={false} onChange={vi.fn()} />);

    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("calls onChange with toggled value on click", async () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} />);

    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("calls onChange with false when unchecking", () => {
    const onChange = vi.fn();
    render(<Toggle checked={true} onChange={onChange} />);

    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("does not call onChange when disabled", () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} disabled />);

    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("is disabled when disabled prop is set", () => {
    render(<Toggle checked={false} onChange={vi.fn()} disabled />);

    expect(screen.getByRole("switch")).toBeDisabled();
  });
});

// ============================================================================
// SettingsGroup
// ============================================================================

describe("SettingsGroup", () => {
  it("renders title and children", () => {
    render(
      <SettingsGroup title="General">
        <div data-testid="group-child">content</div>
      </SettingsGroup>,
    );

    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByTestId("group-child")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <SettingsGroup title="Custom" className="mb-10">
        <div>content</div>
      </SettingsGroup>,
    );

    const group = container.firstChild as HTMLElement;
    expect(group.className).toContain("mb-10");
  });

  it("defaults to mb-6 className", () => {
    const { container } = render(
      <SettingsGroup title="Default">
        <div>content</div>
      </SettingsGroup>,
    );

    const group = container.firstChild as HTMLElement;
    expect(group.className).toContain("mb-6");
  });
});

// ============================================================================
// Select
// ============================================================================

describe("Select", () => {
  const options = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ];

  it("renders all options", () => {
    render(<Select value="light" options={options} onChange={vi.fn()} />);

    expect(screen.getByRole("combobox")).toHaveValue("light");
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("calls onChange with new value on selection", () => {
    const onChange = vi.fn();
    render(<Select value="light" options={options} onChange={onChange} />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "dark" } });
    expect(onChange).toHaveBeenCalledWith("dark");
  });

  it("is disabled when disabled prop is set", () => {
    render(<Select value="light" options={options} onChange={vi.fn()} disabled />);

    expect(screen.getByRole("combobox")).toBeDisabled();
  });
});

// ============================================================================
// CollapsibleGroup
// ============================================================================

describe("CollapsibleGroup", () => {
  it("is collapsed by default", () => {
    render(
      <CollapsibleGroup title="Advanced">
        <div data-testid="content">hidden</div>
      </CollapsibleGroup>,
    );

    expect(screen.getByText("Advanced")).toBeInTheDocument();
    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
  });

  it("expands on click", async () => {
    const user = userEvent.setup();
    render(
      <CollapsibleGroup title="Advanced">
        <div data-testid="content">revealed</div>
      </CollapsibleGroup>,
    );

    await user.click(screen.getByText("Advanced"));
    expect(screen.getByTestId("content")).toBeInTheDocument();
  });

  it("collapses again on second click", async () => {
    const user = userEvent.setup();
    render(
      <CollapsibleGroup title="Advanced">
        <div data-testid="content">revealed</div>
      </CollapsibleGroup>,
    );

    await user.click(screen.getByText("Advanced"));
    expect(screen.getByTestId("content")).toBeInTheDocument();

    await user.click(screen.getByText("Advanced"));
    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
  });

  it("starts open when defaultOpen is true", () => {
    render(
      <CollapsibleGroup title="Open" defaultOpen>
        <div data-testid="content">visible</div>
      </CollapsibleGroup>,
    );

    expect(screen.getByTestId("content")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <CollapsibleGroup title="Advanced" description="Extra settings">
        <div>child</div>
      </CollapsibleGroup>,
    );

    expect(screen.getByText("Extra settings")).toBeInTheDocument();
  });

  it("does not render description when omitted", () => {
    render(
      <CollapsibleGroup title="Advanced">
        <div>child</div>
      </CollapsibleGroup>,
    );

    expect(screen.queryByText("Extra settings")).not.toBeInTheDocument();
  });
});

// ============================================================================
// TagInput
// ============================================================================

describe("TagInput", () => {
  const onChange = vi.fn();

  beforeEach(() => {
    onChange.mockClear();
  });

  describe("basic behavior", () => {
    it("renders existing tags", () => {
      render(<TagInput value={["http", "custom"]} onChange={onChange} />);

      expect(screen.getByText("http://")).toBeInTheDocument();
      expect(screen.getByText("custom://")).toBeInTheDocument();
    });

    it("shows placeholder when empty", () => {
      render(<TagInput value={[]} onChange={onChange} />);
      expect(screen.getByPlaceholderText("Add item...")).toBeInTheDocument();
    });

    it("hides placeholder when tags exist", () => {
      render(<TagInput value={["http"]} onChange={onChange} />);
      expect(screen.queryByPlaceholderText("Add item...")).not.toBeInTheDocument();
    });

    it("uses custom placeholder", () => {
      render(<TagInput value={[]} onChange={onChange} placeholder="Type here" />);
      expect(screen.getByPlaceholderText("Type here")).toBeInTheDocument();
    });

    it("adds tag on Enter", () => {
      render(<TagInput value={[]} onChange={onChange} />);
      const input = screen.getByRole("textbox");

      fireEvent.change(input, { target: { value: "custom" } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(onChange).toHaveBeenCalledWith(["custom"]);
    });

    it("adds tag on comma", () => {
      render(<TagInput value={[]} onChange={onChange} />);
      const input = screen.getByRole("textbox");

      fireEvent.change(input, { target: { value: "proto" } });
      fireEvent.keyDown(input, { key: "," });

      expect(onChange).toHaveBeenCalledWith(["proto"]);
    });

    it("adds tag on blur", () => {
      render(<TagInput value={[]} onChange={onChange} />);
      const input = screen.getByRole("textbox");

      fireEvent.change(input, { target: { value: "blur-tag" } });
      fireEvent.blur(input);

      expect(onChange).toHaveBeenCalledWith(["blur-tag"]);
    });

    it("does not add empty or whitespace-only tags", () => {
      render(<TagInput value={[]} onChange={onChange} />);
      const input = screen.getByRole("textbox");

      fireEvent.change(input, { target: { value: "   " } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(onChange).not.toHaveBeenCalled();
    });

    it("does not add duplicate tags", () => {
      render(<TagInput value={["http"]} onChange={onChange} />);
      const input = screen.getByRole("textbox");

      fireEvent.change(input, { target: { value: "http" } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(onChange).not.toHaveBeenCalled();
    });

    it("normalizes tags to lowercase", () => {
      render(<TagInput value={[]} onChange={onChange} />);
      const input = screen.getByRole("textbox");

      fireEvent.change(input, { target: { value: "HTTP" } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(onChange).toHaveBeenCalledWith(["http"]);
    });

    it("removes tag on remove button click", () => {
      render(<TagInput value={["http", "custom"]} onChange={onChange} />);

      const removeBtn = screen.getByRole("button", { name: "Remove http" });
      fireEvent.click(removeBtn);

      expect(onChange).toHaveBeenCalledWith(["custom"]);
    });

    it("removes last tag on Backspace when input is empty", () => {
      render(<TagInput value={["http", "custom"]} onChange={onChange} />);
      const input = screen.getByRole("textbox");

      fireEvent.keyDown(input, { key: "Backspace" });

      expect(onChange).toHaveBeenCalledWith(["http"]);
    });

    it("does not remove tag on Backspace when input has text", () => {
      render(<TagInput value={["http"]} onChange={onChange} />);
      const input = screen.getByRole("textbox");

      fireEvent.change(input, { target: { value: "abc" } });
      fireEvent.keyDown(input, { key: "Backspace" });

      expect(onChange).not.toHaveBeenCalled();
    });

    it("focuses input when container is clicked", () => {
      render(<TagInput value={[]} onChange={onChange} />);
      const input = screen.getByRole("textbox");
      const container = input.parentElement!;

      fireEvent.click(container);
      expect(document.activeElement).toBe(input);
    });
  });

  describe("IME composition guard", () => {
    it("Enter with isComposing does not add a tag", () => {
      render(<TagInput value={[]} onChange={onChange} />);
      const input = screen.getByPlaceholderText("Add item...");

      fireEvent.change(input, { target: { value: "custom" } });
      fireEvent.keyDown(input, { key: "Enter", isComposing: true });

      expect(onChange).not.toHaveBeenCalled();
    });

    it("comma with isComposing does not add a tag", () => {
      render(<TagInput value={[]} onChange={onChange} />);
      const input = screen.getByPlaceholderText("Add item...");

      fireEvent.change(input, { target: { value: "test" } });
      fireEvent.keyDown(input, { key: ",", isComposing: true });

      expect(onChange).not.toHaveBeenCalled();
    });

    it("keyCode 229 (IME marker) is blocked", () => {
      render(<TagInput value={[]} onChange={onChange} />);
      const input = screen.getByPlaceholderText("Add item...");

      fireEvent.change(input, { target: { value: "proto" } });
      fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });

      expect(onChange).not.toHaveBeenCalled();
    });

    it("Enter within grace period after compositionEnd is blocked", () => {
      render(<TagInput value={[]} onChange={onChange} />);
      const input = screen.getByPlaceholderText("Add item...");

      fireEvent.change(input, { target: { value: "custom" } });
      fireEvent.compositionStart(input);
      fireEvent.compositionEnd(input);
      fireEvent.keyDown(input, { key: "Enter" });

      expect(onChange).not.toHaveBeenCalled();
    });

    it("normal Enter still adds a tag", () => {
      render(<TagInput value={[]} onChange={onChange} />);
      const input = screen.getByPlaceholderText("Add item...");

      fireEvent.change(input, { target: { value: "custom" } });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(onChange).toHaveBeenCalledWith(["custom"]);
    });
  });
});

// ============================================================================
// Button
// ============================================================================

describe("Button", () => {
  it("renders children text", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Click me</Button>);

    await user.click(screen.getByRole("button", { name: "Click me" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick} disabled>Disabled</Button>);

    await user.click(screen.getByRole("button", { name: "Disabled" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies disabled styling", () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("opacity-50");
    expect(btn.className).toContain("cursor-not-allowed");
  });

  it("renders icon on the left by default", () => {
    const icon = <span data-testid="icon">*</span>;
    render(<Button icon={icon}>Text</Button>);

    const btn = screen.getByRole("button");
    const iconEl = screen.getByTestId("icon");
    // Icon should appear before text
    expect(btn).toContainElement(iconEl);
    expect(btn.textContent).toContain("Text");
  });

  it("renders icon on the right when specified", () => {
    const icon = <span data-testid="icon">*</span>;
    render(<Button icon={icon} iconPosition="right">Text</Button>);

    const btn = screen.getByRole("button");
    expect(btn).toContainElement(screen.getByTestId("icon"));
  });

  it("applies custom className", () => {
    render(<Button className="ml-4">Styled</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("ml-4");
  });
});

// ============================================================================
// IconButton
// ============================================================================

describe("IconButton", () => {
  it("renders with title", () => {
    render(<IconButton title="Delete">X</IconButton>);
    expect(screen.getByTitle("Delete")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<IconButton onClick={onClick}>X</IconButton>);

    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is set", () => {
    render(<IconButton disabled>X</IconButton>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("applies custom className", () => {
    render(<IconButton className="extra-class">X</IconButton>);
    expect(screen.getByRole("button").className).toContain("extra-class");
  });
});

// ============================================================================
// CopyButton
// ============================================================================

describe("CopyButton", () => {
  const mockWriteText = vi.fn(() => Promise.resolve());

  beforeEach(() => {
    mockWriteText.mockClear();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });
  });

  it("copies text to clipboard on click", async () => {
    render(<CopyButton text="hello" />);

    fireEvent.click(screen.getByTitle("Copy"));

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith("hello");
    });
  });

  it("shows Copied! title after click", async () => {
    render(<CopyButton text="hello" />);

    fireEvent.click(screen.getByTitle("Copy"));

    await waitFor(() => {
      expect(screen.getByTitle("Copied!")).toBeInTheDocument();
    });
  });

  it("reverts title back to Copy after timeout", async () => {
    vi.useFakeTimers();
    render(<CopyButton text="hello" />);

    fireEvent.click(screen.getByTitle("Copy"));

    // Advance past the 1500ms timeout
    await vi.advanceTimersByTimeAsync(1600);

    expect(screen.getByTitle("Copy")).toBeInTheDocument();
    vi.useRealTimers();
  });
});

// ============================================================================
// CloseButton
// ============================================================================

describe("CloseButton", () => {
  it("renders with Close title", () => {
    render(<CloseButton onClick={vi.fn()} />);
    expect(screen.getByTitle("Close")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<CloseButton onClick={onClick} />);

    await user.click(screen.getByTitle("Close"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies custom className", () => {
    render(<CloseButton onClick={vi.fn()} className="extra" />);
    expect(screen.getByTitle("Close").className).toContain("extra");
  });
});
